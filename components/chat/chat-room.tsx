// components/chat/chat-room.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChatMessageItem, type ChatMessage } from '@/components/chat/chat-message-item';
import { useChatScroll } from '@/hooks/use-chat-scroll';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, MoreVertical, Users, ArrowUp, Paperclip, Globe, BookOpen, ImageIcon, Mic } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/AuthContext';

interface ChatRoomProps {
    spaceId?: string;
    recipientId?: string;
    type: 'space' | 'dm';
}

export function ChatRoom({ spaceId, recipientId, type }: ChatRoomProps) {
    const router = useRouter();
    const { user } = useAuth();
    const { containerRef, scrollToBottom } = useChatScroll();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [chatInfo, setChatInfo] = useState<any>(null);

    useEffect(() => {
        if (user) {
            fetchMessages();
            fetchChatInfo();

            // Poll for new messages every 3 seconds
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [spaceId, recipientId, user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Auto-resize textarea based on content
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [newMessage]);

    const fetchChatInfo = async () => {
        try {
            if (type === 'space' && spaceId) {
                const response = await fetch(`/api/spaces?id=${spaceId}`);
                const result = await response.json();
                if (result.success && result.data.length > 0) {
                    setChatInfo(result.data[0]);
                }
            } else if (type === 'dm' && recipientId) {
                const response = await fetch(`/api/users/${recipientId}`);
                const result = await response.json();
                if (result.success) {
                    setChatInfo(result.data);
                }
            }
        } catch (error) {
            console.error('Error fetching chat info:', error);
        }
    };

    const fetchMessages = async () => {
        if (!user) return;

        try {
            let endpoint = '';
            if (type === 'space') {
                endpoint = `/api/spaces/${spaceId}/messages`;
            } else {
                endpoint = `/api/messages/dm?userId=${user.id}&recipientId=${recipientId}`;
            }

            const response = await fetch(endpoint);
            const result = await response.json();

            if (result.success) {
                setMessages(result.data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = useCallback(
        async (e?: React.FormEvent) => {
            e?.preventDefault();
            if (!newMessage.trim() || !user || sending) return;

            setSending(true);
            try {
                let endpoint = '';
                let body = {};

                if (type === 'space') {
                    endpoint = `/api/spaces/${spaceId}/messages`;
                    body = { content: newMessage, userId: user.id };
                } else {
                    endpoint = `/api/messages/dm`;
                    body = { content: newMessage, senderId: user.id, recipientId };
                }

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                const result = await response.json();
                if (result.success) {
                    setNewMessage('');
                    // Reset textarea height
                    if (textareaRef.current) {
                        textareaRef.current.style.height = 'auto';
                    }
                    await fetchMessages();
                }
            } catch (error) {
                console.error('Error sending message:', error);
            } finally {
                setSending(false);
            }
        },
        [newMessage, user, sending, type, spaceId, recipientId]
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner className="text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[87vh] bg-background text-foreground antialiased">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b bg-background">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-10 h-10">
                    {chatInfo?.avatar_url || chatInfo?.logo_url ? (
                        <AvatarImage
                            src={chatInfo.avatar_url || chatInfo.logo_url}
                            alt={chatInfo.display_name || chatInfo.full_name}
                        />
                    ) : (
                        <AvatarFallback>
                            {type === 'space' ? (
                                <Users className="w-5 h-5" />
                            ) : (
                                (chatInfo?.full_name || '?').substring(0, 2).toUpperCase()
                            )}
                        </AvatarFallback>
                    )}
                </Avatar>
                <div className="flex-1 min-w-0">
                    <h2 className="font-semibold truncate">
                        {chatInfo?.display_name || chatInfo?.full_name}
                    </h2>
                    {type === 'space' && (
                        <p className="text-xs text-muted-foreground">
                            {chatInfo?.members_count || 0} members
                        </p>
                    )}
                </div>
                <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                </Button>
            </div>

            {/* Messages */}
            <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-12">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    <div className="space-y-1">
                        {messages.map((message, index) => {
                            const prevMessage = index > 0 ? messages[index - 1] : null;
                            const showHeader = !prevMessage || prevMessage.sender_id !== message.sender_id;

                            return (
                                <div
                                    key={message.id}
                                    className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                                >
                                    <ChatMessageItem
                                        message={message}
                                        isOwnMessage={message.sender_id === user?.id}
                                        showHeader={showHeader}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Enhanced Input Area */}
            <div className="flex-none pt-4 pb-6">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <form onSubmit={handleSendMessage} className="relative bg-muted rounded-3xl">
                        <textarea
                            ref={textareaRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            disabled={sending}
                            className="w-full resize-none bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground px-5 py-4 pr-14 min-h-[56px] max-h-[200px] disabled:opacity-50"
                            rows={1}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="absolute right-3 bottom-3 w-10 h-10 rounded-xl bg-foreground hover:bg-foreground/90 disabled:bg-muted-foreground/20 disabled:cursor-not-allowed flex items-center justify-center text-background transition-colors"
                        >
                            {sending ? (
                                <Spinner className="w-5 h-5 text-secondary" />
                            ) : (
                                <ArrowUp className="w-5 h-5 text-secondary" />
                            )}
                        </button>
                    </form>
                    <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                        <button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-accent text-foreground transition-colors text-sm"
                        >
                            <Paperclip className="w-4 h-4" />
                            <span className="hidden sm:inline">Attach</span>
                        </button>
                        <button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-accent text-foreground transition-colors text-sm"
                        >
                            <Globe className="w-4 h-4" />
                            <span className="hidden sm:inline">Search</span>
                        </button>
                        <button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-accent text-foreground transition-colors text-sm"
                        >
                            <BookOpen className="w-4 h-4" />
                            <span className="hidden sm:inline">Study</span>
                        </button>
                        <button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-accent text-foreground transition-colors text-sm"
                        >
                            <ImageIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Create image</span>
                        </button>
                        <button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-accent text-foreground transition-colors text-sm"
                        >
                            <Mic className="w-4 h-4" />
                            <span className="hidden sm:inline">Voice</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}