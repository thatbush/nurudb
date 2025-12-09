// lib/reverb/verificationQueue.ts
import { sql } from "@vercel/postgres";

export async function addToVerificationQueue(
    institutions: any[],
    programmes: any[],
    reason: 'low_confidence' | 'user_correction' | 'significant_change'
) {
    const items = [];

    for (const inst of institutions) {
        if (inst.confidence_score < 0.7) {
            items.push({
                target_table: 'ai_institutions',
                target_id: inst.id,
                target_field: 'general',
                verification_reason: reason,
                confidence_score: inst.confidence_score,
                priority: 10 - Math.floor(inst.confidence_score * 10)
            });
        }
    }

    for (const prog of programmes) {
        if (prog.confidence_score < 0.7) {
            items.push({
                target_table: 'ai_programmes',
                target_id: prog.id,
                target_field: 'general',
                verification_reason: reason,
                confidence_score: prog.confidence_score,
                priority: 10 - Math.floor(prog.confidence_score * 10)
            });
        }
    }

    // Insert to queue
    for (const item of items) {
        await sql`
      INSERT INTO ai_verification_queue (
        target_table, target_id, target_field,
        verification_reason, confidence_score,
        priority, status, queued_at
      ) VALUES (
        ${item.target_table},
        ${item.target_id},
        ${item.target_field},
        ${item.verification_reason},
        ${item.confidence_score},
        ${item.priority},
        'pending',
        NOW()
      )
    `;
    }

    return items.length;
}
