// app/api/users/profile/[authId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ authId: string }> }
) {
    try {
        const { authId } = await params;

        // Try to find existing user
        const result = await sql`
            SELECT 
                id,
                email,
                full_name,
                username,
                avatar_url,
                credits,
                auth_id
            FROM users
            WHERE auth_id = ${authId}
            LIMIT 1
        `;

        // If user exists, return it
        if (result.rows.length > 0) {
            return NextResponse.json({
                success: true,
                data: result.rows[0]
            });
        }

        // User doesn't exist - get email from query params
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email is required to create new user' },
                { status: 400 }
            );
        }

        // Generate a temporary username from email
        const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
        const randomSuffix = Math.random().toString(36).substring(2, 7);
        const tempUsername = `${emailPrefix}_${randomSuffix}`;

        // Create new user with default values
        const createResult = await sql`
            INSERT INTO users (
                auth_id,
                email,
                username,
                full_name,
                credits,
                created_at,
                updated_at
            )
            VALUES (
                ${authId},
                ${email},
                ${tempUsername},
                '',
                0,
                NOW(),
                NOW()
            )
            RETURNING id, email, full_name, username, avatar_url, credits, auth_id
        `;

        console.log('Created new user:', createResult.rows[0]);

        return NextResponse.json({
            success: true,
            data: createResult.rows[0],
            created: true
        });

    } catch (error) {
        console.error('User fetch/create error:', error);
        return NextResponse.json(
            { success: false, error: `Failed to fetch or create user: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ authId: string }> }
) {
    try {
        const { authId } = await params;
        const body = await request.json();

        console.log('PUT /api/users/profile/[authId] - Start');
        console.log('authId:', authId);
        console.log('body:', body);

        // First, check if user exists
        const checkResult = await sql`
            SELECT id, auth_id, email, username 
            FROM users 
            WHERE auth_id = ${authId}
        `;

        console.log('User check result:', checkResult.rows);

        if (checkResult.rows.length === 0) {
            console.error('User not found with auth_id:', authId);
            return NextResponse.json(
                { success: false, error: `User not found with auth_id: ${authId}` },
                { status: 404 }
            );
        }

        // Use the @vercel/postgres tagged template syntax for updates
        // Build the update dynamically but safely
        let result;

        // Handle all possible field combinations
        if (body.full_name !== undefined && body.username !== undefined && body.credits !== undefined) {
            result = await sql`
                UPDATE users
                SET 
                    full_name = ${body.full_name},
                    username = ${body.username},
                    credits = ${body.credits},
                    updated_at = NOW()
                WHERE auth_id = ${authId}
                RETURNING id, email, full_name, username, avatar_url, credits, auth_id
            `;
        } else if (body.full_name !== undefined && body.username !== undefined) {
            result = await sql`
                UPDATE users
                SET 
                    full_name = ${body.full_name},
                    username = ${body.username},
                    updated_at = NOW()
                WHERE auth_id = ${authId}
                RETURNING id, email, full_name, username, avatar_url, credits, auth_id
            `;
        } else if (body.full_name !== undefined && body.credits !== undefined) {
            result = await sql`
                UPDATE users
                SET 
                    full_name = ${body.full_name},
                    credits = ${body.credits},
                    updated_at = NOW()
                WHERE auth_id = ${authId}
                RETURNING id, email, full_name, username, avatar_url, credits, auth_id
            `;
        } else if (body.username !== undefined && body.credits !== undefined) {
            result = await sql`
                UPDATE users
                SET 
                    username = ${body.username},
                    credits = ${body.credits},
                    updated_at = NOW()
                WHERE auth_id = ${authId}
                RETURNING id, email, full_name, username, avatar_url, credits, auth_id
            `;
        } else if (body.full_name !== undefined) {
            result = await sql`
                UPDATE users
                SET 
                    full_name = ${body.full_name},
                    updated_at = NOW()
                WHERE auth_id = ${authId}
                RETURNING id, email, full_name, username, avatar_url, credits, auth_id
            `;
        } else if (body.username !== undefined) {
            result = await sql`
                UPDATE users
                SET 
                    username = ${body.username},
                    updated_at = NOW()
                WHERE auth_id = ${authId}
                RETURNING id, email, full_name, username, avatar_url, credits, auth_id
            `;
        } else if (body.credits !== undefined) {
            result = await sql`
                UPDATE users
                SET 
                    credits = ${body.credits},
                    updated_at = NOW()
                WHERE auth_id = ${authId}
                RETURNING id, email, full_name, username, avatar_url, credits, auth_id
            `;
        } else if (body.bio !== undefined) {
            result = await sql`
                UPDATE users
                SET 
                    bio = ${body.bio},
                    updated_at = NOW()
                WHERE auth_id = ${authId}
                RETURNING id, email, full_name, username, avatar_url, credits, auth_id
            `;
        } else if (body.avatar_url !== undefined) {
            result = await sql`
                UPDATE users
                SET 
                    avatar_url = ${body.avatar_url},
                    updated_at = NOW()
                WHERE auth_id = ${authId}
                RETURNING id, email, full_name, username, avatar_url, credits, auth_id
            `;
        } else {
            return NextResponse.json(
                { success: false, error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        console.log('Updated user:', result.rows[0]);

        return NextResponse.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('User update error:', error);
        return NextResponse.json(
            { success: false, error: `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        );
    }
}