// app/chat/space/[spaceId]/page.tsx
import { ChatRoom } from '@/components/chat/chat-room';

export default async function SpaceChatPage({ params }: { params: Promise<{ spaceId: string }> }) {
    const { spaceId } = await params;
    return <ChatRoom spaceId={spaceId} type="space" />;
}