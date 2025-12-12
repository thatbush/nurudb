// components/chat/chat-list.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Users } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/AuthContext';

interface ChatItem {
    id: string;
    name: string;
    displayName: string;
    avatar: string | null;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    type: 'space' | 'dm';
    members_count?: number;
}

export function ChatList() {
    const router = useRouter();
    const { user } = useAuth();
    const [chats, setChats] = useState<ChatItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user) {
            fetchChats();
            // Poll for updates every 5 seconds
            const interval = setInterval(fetchChats, 5000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchChats = async () => {
        if (!user) return;

        try {
            const response = await fetch(`/api/chats?userId=${user.id}`);
            const result = await response.json();
            if (result.success) {
                setChats(result.data);
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredChats = chats.filter(chat =>
        chat.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleChatClick = (chat: ChatItem) => {
        if (chat.type === 'space') {
            router.push(`/me/chat/space/${chat.id}`);
        } else {
            router.push(`/me/chat/dm/${chat.id}`);
        }
    };

    const formatTime = (date: string): string => {
        if (!date) return '';
        const now = new Date();
        const messageDate = new Date(date);
        const diff = now.getTime() - messageDate.getTime();
        const hours = diff / (1000 * 60 * 60);

        if (hours < 24) {
            return messageDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            });
        } else if (hours < 48) {
            return 'Yesterday';
        } else {
            return messageDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
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
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">Chats</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
                {filteredChats.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No chats yet</h3>
                        <p className="text-sm text-muted-foreground">
                            Join a space or start a conversation
                        </p>
                    </div>
                ) : (
                    filteredChats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => handleChatClick(chat)}
                            className="flex items-center gap-3 p-4 hover:bg-muted cursor-pointer transition-colors"
                        >
                            <div className="relative">
                                <Avatar className="w-12 h-12">
                                    {chat.avatar ? (
                                        <AvatarImage src={chat.avatar} alt={chat.displayName} />
                                    ) : (
                                        <AvatarFallback>
                                            {chat.type === 'space' ? (
                                                <Users className="w-6 h-6" />
                                            ) : (
                                                chat.displayName.substring(0, 2).toUpperCase()
                                            )}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold truncate">{chat.displayName}</h3>
                                    <span className="text-xs text-muted-foreground">
                                        {formatTime(chat.lastMessageTime)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm truncate flex-1">
                                        {chat.lastMessage || 'No messages yet'}
                                    </p>
                                    {chat.unreadCount > 0 && (
                                        <Badge className="ml-2 bg-background text-primary">
                                            {chat.unreadCount}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
