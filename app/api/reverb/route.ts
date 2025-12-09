// app/api/reverb/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sql } from '@vercel/postgres';
import { createClient } from '@/utils/supabase/server';
import { AdaptiveDataCollector } from '@/lib/reverb/dataCollector';
import { buildReverbSystemPrompt } from '@/lib/reverb/systemPrompt';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
const dataCollector = new AdaptiveDataCollector();

interface ReverbRequest {
    message: string;
    sessionId: string;
    userId: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: ReverbRequest = await request.json();
        const { message, sessionId, userId } = body;

        if (!message?.trim()) {
            return NextResponse.json(
                { error: 'Message required' },
                { status: 400 }
            );
        }

        // 1. GET CONVERSATION HISTORY
        const history = await getConversationHistory(sessionId, 10);

        // 2. GET SUPABASE REFERENCE DATA
        const referenceData = await buildReferenceContext(message);

        // 3. GET BUFFER STATUS
        const bufferStatus = dataCollector.getBufferStatus();

        // 4. BUILD STRUCTURED DATA CONTEXT for the model
        const structuredContext = prepareStructuredContext(referenceData);

        // 5. BUILD SYSTEM PROMPT with markdown formatting instructions
        const systemPrompt = buildReverbSystemPrompt({
            referenceData: structuredContext,
            bufferStatus,
            userProfile: { id: userId },
            conversationHistory: history
        });

        // 6. BUILD CONVERSATION
        const conversationMessages = history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));
        conversationMessages.push({ role: 'user', parts: [{ text: message }] });

        // 7. GENERATE AI RESPONSE
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const response = await model.generateContent({
            systemInstruction: systemPrompt,
            contents: conversationMessages
        });
        const aiResponse = response.response.text();

        // 8. EXTRACT DATA POINTS
        const extractedData = await extractDataFromConversation(
            message,
            aiResponse,
            referenceData
        );

        // 9. QUEUE EXTRACTED DATA
        const batchesReady: any[] = [];
        for (const point of extractedData) {
            const isReady = await dataCollector.queueDataPoint(
                point.tableName,
                point.key,
                {
                    field: point.field,
                    value: point.value,
                    confidence: point.confidence,
                    source: point.source,
                    timestamp: new Date()
                }
            );
            if (isReady) {
                batchesReady.push(point.key);
            }
        }

        // 10. FLUSH READY BATCHES
        const stored = await dataCollector.flushReadyBatches(sessionId, userId);

        // 11. STORE MESSAGES
        await storeMessage(sessionId, 'user', message);
        await storeMessage(sessionId, 'assistant', aiResponse);

        // 12. LOG DATA COLLECTION
        await logDataCollection({
            sessionId,
            userId,
            userQuery: message,
            extractedPoints: extractedData.length,
            storedBatches: stored.length,
            bufferStatus: dataCollector.getBufferStatus()
        });

        return NextResponse.json({
            success: true,
            message: aiResponse, // Model formats this with markdown
            sessionId,
            dataPoints: {
                extracted: extractedData.length,
                queued: extractedData.filter(p => !batchesReady.includes(p.key)).length,
                stored: stored.length,
                bufferStatus: dataCollector.getBufferStatus()
            },
            dataSources: {
                supabase: {
                    universities: referenceData.universities?.length || 0,
                    programmes: referenceData.programmes?.length || 0,
                    enrollment_stats: referenceData.enrollment_stats?.length || 0,
                    tvet_courses: referenceData.tvet_courses?.length || 0
                },
                neon: {
                    extracted: extractedData.length,
                    stored: stored.length
                }
            }
        });

    } catch (error) {
        console.error('Reverb error:', error);
        return NextResponse.json(
            { error: 'Failed to process', details: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}

/**
 * Prepare structured context for the model with clear JSON formatting
 */
function prepareStructuredContext(referenceData: Record<string, any>): string {
    const context: any = {
        available_data: {}
    };

    if (referenceData.universities?.length > 0) {
        context.available_data.universities = referenceData.universities.map((u: any) => ({
            name: u.name,
            type: u.type,
            category: u.category,
            charter_year: u.charter_year,
            location: [u.county, u.location].filter(Boolean).join(', '),
            website: u.domain ? `https://${u.domain}` : null
        }));
    }

    if (referenceData.programmes?.length > 0) {
        context.available_data.programmes = referenceData.programmes.map((p: any) => ({
            name: p.name,
            level: p.level,
            duration_years: p.duration_years,
            minimum_grade: p.minimum_grade,
            fees_range: {
                min: p.fees_ksh_min || p.fees_min,
                max: p.fees_ksh_max || p.fees_max
            }
        }));
    }

    if (referenceData.enrollment_stats?.length > 0) {
        context.available_data.enrollment_trends = referenceData.enrollment_stats.map((s: any) => ({
            year: s.year,
            total: s.total_students,
            male: s.male_students,
            female: s.female_students
        }));
    }

    if (referenceData.tvet_courses?.length > 0) {
        context.available_data.tvet_courses = referenceData.tvet_courses.map((t: any) => ({
            name: t.name,
            level: t.level,
            exam_body: t.exam_body,
            duration_months: t.duration_months
        }));
    }

    return JSON.stringify(context, null, 2);
}

/**
 * Enhanced reference context builder
 */
async function buildReferenceContext(userQuery: string) {
    const supabase = await createClient();
    const context: Record<string, any> = {};
    const queryLower = userQuery.toLowerCase();

    try {
        // UNIVERSITIES
        const institutionKeywords = ['university', 'college', 'institute', 'school', 'kmtc', 'tvet'];
        const hasInstitutionQuery = institutionKeywords.some(kw => queryLower.includes(kw));

        if (hasInstitutionQuery) {
            const { data: universities } = await supabase
                .from('universities')
                .select(`
                    id, name, type, category, domain, charter_year,
                    county, location, email, phone, accreditation_status
                `)
                .or(`name.ilike.%${userQuery}%,type.ilike.%${userQuery}%`)
                .limit(5);

            context.universities = universities || [];

            if (universities && universities.length > 0) {
                const uniId = universities[0].id;

                const { data: programmes } = await supabase
                    .from('programmes')
                    .select(`
                        id, name, level, duration_years, minimum_grade,
                        fees_ksh_min, fees_ksh_max, field_id, intake_capacity
                    `)
                    .eq('university_id', uniId)
                    .limit(20);

                context.programmes = programmes || [];

                const { data: enrollmentStats } = await supabase
                    .from('enrollment_timeseries')
                    .select(`
                        year, total_students, male_students, 
                        female_students, undergraduate, postgraduate
                    `)
                    .eq('university_id', uniId)
                    .order('year', { ascending: false })
                    .limit(5);

                context.enrollment_stats = enrollmentStats || [];
            }
        }

        // TVET
        const tvetKeywords = ['tvet', 'vocational', 'technical', 'artisan', 'craft', 'diploma'];
        if (tvetKeywords.some(kw => queryLower.includes(kw))) {
            const { data: tvetCourses } = await supabase
                .from('tvet_courses')
                .select(`id, name, level, exam_body, duration_months, entry_requirements`)
                .or(`name.ilike.%${userQuery}%,level.ilike.%${userQuery}%`)
                .limit(10);

            context.tvet_courses = tvetCourses || [];
        }

        // PROGRAMMES SEARCH
        const programmeKeywords = ['programme', 'course', 'degree', 'bachelor', 'master', 'diploma'];
        if (programmeKeywords.some(kw => queryLower.includes(kw))) {
            const { data: programmes } = await supabase
                .from('programmes')
                .select(`
                    id, name, level, university_id, duration_years,
                    minimum_grade, fees_ksh_min, fees_ksh_max, field_id
                `)
                .ilike('name', `%${userQuery}%`)
                .limit(15);

            if (programmes && programmes.length > 0) {
                context.programmes = [
                    ...(context.programmes || []),
                    ...programmes
                ].filter((prog, idx, arr) =>
                    arr.findIndex(p => p.id === prog.id) === idx
                );
            }
        }

    } catch (error) {
        console.error('Reference context error:', error);
    }

    return context;
}

/**
 * Extract data points from conversation
 */
async function extractDataFromConversation(
    userQuery: string,
    aiResponse: string,
    referenceData: Record<string, any>
) {
    const extracted: any[] = [];
    const combinedText = `${userQuery} ${aiResponse}`;

    // Institution names
    const institutionPatterns = [
        /(?:at|from|in|study(?:ing)?)\s+([A-Z][a-zA-Z\s]+(?:University|College|Institute|School))/gi,
        /KMTC\s+([A-Z][a-zA-Z\s]+)/gi,
    ];

    institutionPatterns.forEach(pattern => {
        const matches = [...combinedText.matchAll(pattern)];
        matches.forEach(match => {
            const name = match[1]?.trim();
            if (name && name.length > 3) {
                extracted.push({
                    tableName: 'ai_institutions',
                    key: name.toLowerCase().replace(/\s+/g, '_'),
                    field: 'name',
                    value: name,
                    confidence: referenceData.universities?.some((u: any) =>
                        u.name.toLowerCase() === name.toLowerCase()
                    ) ? 0.95 : 0.65,
                    source: 'user_mention'
                });
            }
        });
    });

    // Years
    const yearMatches = [...combinedText.matchAll(/\b(19|20)\d{2}\b/g)];
    yearMatches.forEach(match => {
        extracted.push({
            tableName: 'ai_institutions',
            key: 'chartered_year',
            field: 'charter_year',
            value: parseInt(match[0]),
            confidence: 0.8,
            source: 'pattern_extraction'
        });
    });

    // Fees
    const feePatterns = /(?:KES|Ksh)\s*([\d,]+)/gi;
    const feeMatches = [...combinedText.matchAll(feePatterns)];
    feeMatches.forEach(match => {
        const amount = parseInt(match[1].replace(/,/g, ''));
        extracted.push({
            tableName: 'ai_programmes',
            key: 'fees',
            field: 'fees_amount',
            value: amount,
            confidence: 0.7,
            source: 'pattern_extraction'
        });
    });

    // Deduplicate
    const seen = new Set();
    return extracted.filter(item => {
        const key = `${item.key}_${item.field}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function storeMessage(sessionId: string, role: 'user' | 'assistant', content: string) {
    try {
        await sql`
            INSERT INTO conversation_messages (session_id, role, content, timestamp)
            VALUES (${sessionId}, ${role}, ${content}, NOW())
        `;
    } catch (error) {
        console.error('Message storage error:', error);
    }
}

async function getConversationHistory(sessionId: string, limit: number = 10) {
    try {
        const result = await sql`
            SELECT role, content, timestamp 
            FROM conversation_messages 
            WHERE session_id = ${sessionId}
            ORDER BY timestamp DESC
            LIMIT ${limit}
        `;
        return result.rows.reverse();
    } catch (error) {
        console.error('History fetch error:', error);
        return [];
    }
}

async function logDataCollection(metrics: Record<string, any>) {
    try {
        await sql`
            INSERT INTO ai_data_collection_log (
                session_id, user_id, user_query, 
                extracted_value, ai_confidence, collected_at
            ) VALUES (
                ${metrics.sessionId}, ${metrics.userId}, ${metrics.userQuery},
                ${JSON.stringify(metrics)}, 0.7, NOW()
            )
        `;
    } catch (error) {
        console.error('Log error:', error);
    }
}