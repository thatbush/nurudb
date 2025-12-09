// lib/reverb/dataCollector.ts

import { sql } from '@vercel/postgres';

export interface DataPoint {
    field: string;
    value: any;
    confidence: number;  // 0.0-1.0
    source: 'supabase_ref' | 'ai_inference' | 'user_input';
    timestamp: Date;
}

export interface BufferedDataBatch {
    institution: string;
    programme?: string;
    dataPoints: DataPoint[];
    completeness: number;  // % of required fields filled
    readyForStorage: boolean;
}

export class AdaptiveDataCollector {
    private buffer: Map<string, BufferedDataBatch> = new Map();
    private requiredFields = {
        ai_institutions: [
            'name', 'type', 'category', 'location', 'county',
            'website_url', 'email', 'phone'
        ],
        ai_programmes: [
            'name', 'institution_id', 'field', 'level', 'duration_years',
            'minimum_grade', 'kcse_cluster_points', 'fees_min', 'fees_max'
        ]
    };

    /**
     * Queue data point - DON'T store immediately
     * Wait until batch is substantial enough
     */
    async queueDataPoint(
        tableName: keyof typeof this.requiredFields,
        key: string,
        point: DataPoint
    ) {
        if (!this.buffer.has(key)) {
            this.buffer.set(key, {
                institution: key,
                dataPoints: [],
                completeness: 0,
                readyForStorage: false
            });
        }

        const batch = this.buffer.get(key)!;

        // Avoid duplicates - update if field exists
        const existingIndex = batch.dataPoints.findIndex(p => p.field === point.field);
        if (existingIndex >= 0) {
            const existing = batch.dataPoints[existingIndex];
            // Keep higher confidence version
            if (point.confidence > existing.confidence) {
                batch.dataPoints[existingIndex] = point;
            }
        } else {
            batch.dataPoints.push(point);
        }

        // Calculate completeness
        const filledFields = batch.dataPoints.length;
        const requiredCount = this.requiredFields[tableName].length;
        batch.completeness = (filledFields / requiredCount) * 100;

        // Ready if 70%+ complete AND avg confidence 0.6+
        const avgConfidence = batch.dataPoints.reduce((sum, p) => sum + p.confidence, 0) / batch.dataPoints.length;
        batch.readyForStorage = batch.completeness >= 70 && avgConfidence >= 0.6;

        return batch.readyForStorage;
    }

    /**
     * Store batch to Neon
     */
    private async storeBatch(batch: BufferedDataBatch, sessionId: string, userId: string) {
        try {
            // Transform data points into a record
            const data: Record<string, any> = {};
            batch.dataPoints.forEach(p => {
                data[p.field] = p.value;
            });

            // Metadata
            const timestamp = new Date().toISOString();
            const confidenceScore = batch.dataPoints.reduce((sum, p) => sum + p.confidence, 0) / batch.dataPoints.length;

            // Determine table
            let tableName = 'ai_institutions'; // Default
            const fields = new Set(batch.dataPoints.map(p => p.field));

            // Heuristic for table selection based on fields
            if (fields.has('institution_id') || fields.has('minimum_grade') || fields.has('fees_amount')) {
                tableName = 'ai_programmes';
            }

            if (tableName === 'ai_institutions') {
                // Ensure name exists
                if (!data.name && batch.institution) data.name = batch.institution;
                if (!data.name) return { success: false, error: 'Missing name for institution' };

                await sql`
                    INSERT INTO ai_institutions (
                        name, type, category, location, county, 
                        website_url, email, phone, 
                        last_updated_at, confidence_score, processing_session_id, source_type
                    ) VALUES (
                        ${data.name}, ${data.type || null}, ${data.category || null}, 
                        ${data.location || null}, ${data.county || null},
                        ${data.website_url || null}, ${data.email || null}, ${data.phone || null},
                        ${timestamp}, ${confidenceScore}, ${sessionId}, 'ai_inference'
                    )
                    ON CONFLICT (name, type) DO UPDATE SET
                        last_updated_at = EXCLUDED.last_updated_at,
                        confidence_score = GREATEST(ai_institutions.confidence_score, EXCLUDED.confidence_score);
                `;
            } else if (tableName === 'ai_programmes') {
                // For programmes, we need an institution_id
                if (!data.institution_id) {
                    // Try to find institution by name if available (not implemented here due to complexity)
                    // If missing, we can't insert successfully without violating FK if strict, but let's try
                    // or skip.
                    // For now, logging warning and skipping if no ID.
                    console.warn('Skipping programme insert due to missing institution_id');
                    return { success: false, error: 'Missing institution_id' };
                }

                await sql`
                    INSERT INTO ai_programmes (
                        name, institution_id, field, level, 
                        duration_years, minimum_grade, kcse_cluster_points, 
                        fees_min, fees_max, 
                        updated_at, confidence_score, ai_model_used, source_type
                    ) VALUES (
                        ${data.name || 'Unknown Programme'}, ${data.institution_id}, ${data.field || null}, ${data.level || null},
                        ${data.duration_years || null}, ${data.minimum_grade || null}, ${data.kcse_cluster_points || null},
                        ${data.fees_min || null}, ${data.fees_max || null},
                        ${timestamp}, ${confidenceScore}, 'gemini-2.5-flash', 'ai_inference'
                    );
                `;
            }

            return { success: true, table: tableName };

        } catch (error) {
            console.error('Store batch error:', error);
            return { success: false, error };
        }
    }





    /**
     * Flush ready batches to Neon
     */
    async flushReadyBatches(sessionId: string, userId: string) {
        const stored: any[] = [];

        for (const [key, batch] of this.buffer.entries()) {
            if (batch.readyForStorage) {
                // Store the batch
                const result = await this.storeBatch(batch, sessionId, userId);
                stored.push(result);

                // Clear from buffer
                this.buffer.delete(key);
            }
        }

        return stored;
    }

    /**
     * Get buffer status - for transparency in UI
     */
    getBufferStatus() {
        const status = Array.from(this.buffer.entries()).map(([key, batch]) => ({
            key,
            completeness: Math.round(batch.completeness),
            readyForStorage: batch.readyForStorage,
            missingFields: this.getMissingFields(batch)
        }));
        return status;
    }

    private getMissingFields(batch: BufferedDataBatch) {
        const filledFields = new Set(batch.dataPoints.map(p => p.field));
        const required = this.requiredFields.ai_institutions;
        return required.filter(f => !filledFields.has(f));
    }
}
