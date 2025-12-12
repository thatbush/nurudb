// components/chat/chat-message-item.tsx
'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export interface ChatMessage {
    id: string;
    content: string;
    sender_id: string;
    sender_name: string;
    sender_username: string;
    sender_avatar: string | null;
    created_at: string;
    message_type: string;
    metadata?: any;
}

interface ChatMessageItemProps {
    message: ChatMessage;
    isOwnMessage: boolean;
    showHeader: boolean;
}

export const ChatMessageItem = ({ message, isOwnMessage, showHeader }: ChatMessageItemProps) => {
    return (
        <div className={`flex mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <div
                className={cn('max-w-[75%] w-fit flex flex-col gap-1', {
                    'items-end': isOwnMessage,
                })}
            >
                {showHeader && (
                    <div
                        className={cn('flex items-center gap-2 text-xs px-3', {
                            'justify-end flex-row-reverse': isOwnMessage,
                        })}
                    >
                        {!isOwnMessage && (
                            <Avatar className="w-5 h-5">
                                {message.sender_avatar ? (
                                    <AvatarImage src={message.sender_avatar} />
                                ) : (
                                    <AvatarFallback className="text-xs">
                                        {message.sender_name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                        )}
                        <span className="font-medium">{message.sender_name}</span>
                        <span className="text-foreground/50 text-xs">
                            {new Date(message.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                            })}
                        </span>
                    </div>
                )}
                <div
                    className={cn(
                        'py-2 px-3 rounded-xl text-sm w-fit',
                        isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                    )}
                >
                    {message.content}
                </div>
            </div>
        </div>
    );
};
