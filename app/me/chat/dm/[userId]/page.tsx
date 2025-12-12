// app/chat/dm/[userId]/page.tsx
import { ChatRoom } from '@/components/chat/chat-room';

export default async function DMChatPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    return <ChatRoom recipientId={userId} type="dm" />;
}