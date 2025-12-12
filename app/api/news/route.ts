// app/api/news/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const response = await fetch('https://educationnews.co.ke/feed/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
            },
            // Add cache control for better performance
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) {
            throw new Error('Failed to fetch news feed');
        }

        const text = await response.text();

        return NextResponse.json({
            success: true,
            data: text
        });
    } catch (error) {
        console.error('Error fetching news:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch news feed'
            },
            { status: 500 }
        );
    }
}