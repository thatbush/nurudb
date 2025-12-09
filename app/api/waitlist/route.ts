// app/api/waitlist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, school_email, full_name } = body;

        if (!email || !full_name) {
            return NextResponse.json(
                { error: 'Email and full name are required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Get current user for additional context
        const { data: { user } } = await supabase.auth.getUser();

        // Check if already on waitlist
        const { data: existing } = await supabase
            .from('waitlist')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'This email is already on the waitlist' },
                { status: 409 }
            );
        }

        // Get current position (last position + 1)
        const { count } = await supabase
            .from('waitlist')
            .select('*', { count: 'exact', head: true });

        const position = (count || 0) + 1;

        // Insert into waitlist
        const { data, error } = await supabase
            .from('waitlist')
            .insert({
                email,
                school_email: school_email || null,
                full_name,
                position,
                status: 'waiting',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Waitlist insert error:', error);
            return NextResponse.json(
                { error: 'Failed to join waitlist' },
                { status: 500 }
            );
        }

        // TODO: Send confirmation email here
        // await sendWaitlistConfirmationEmail(email, full_name, position);

        return NextResponse.json({
            success: true,
            position,
            message: 'Successfully joined the waitlist'
        });

    } catch (error) {
        console.error('Waitlist error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}