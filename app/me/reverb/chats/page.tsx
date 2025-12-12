// app/me/reverb/chats/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Clock, Trash2, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/client';

interface ChatSession {
    id: string;
    title: string;
    lastMessage: string;
    timestamp: Date;
    messageCount: number;
}

export default function ChatsListPage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        initializeUser();
    }, []);

    const initializeUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserId(user.id);
            loadSessions(user.id);
        } else {
            setIsLoading(false);
            router.push('/auth/login'); // Redirect to login if not authenticated
        }
    };

    const loadSessions = async (uid: string) => {
        try {
            const response = await fetch(`/api/reverb/sessions?userId=${uid}`);
            if (response.ok) {
                const data = await response.json();
                setSessions(data.sessions || []);
            }
        } catch (error) {
            console.error('Failed to load sessions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const createNewChat = async () => {
        if (!userId) return;
        try {
            const sessionId = `session_${Date.now()}`;
            router.push(`/me/reverb/${sessionId}`);
        } catch (error) {
            console.error('Failed to create chat:', error);
        }
    };

    const deleteSession = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Delete this conversation?') || !userId) return;

        try {
            await fetch(`/api/reverb/sessions/${id}?userId=${userId}`, {
                method: 'DELETE'
            });
            setSessions(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 60) return `${minutes} minutes ago`;
        if (hours < 24) return `${hours} hours ago`;
        if (days === 0) return 'Today';
        if (days === 1) return `${days} day ago`;
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        return `${Math.floor(days / 30)} months ago`;
    };

    const filteredSessions = sessions.filter(session =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!userId && !isLoading) {
        return null; // Will redirect to login
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-semibold">Chats</h1>
                    <button
                        onClick={createNewChat}
                        className="px-6 py-2.5 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                        <Plus className="w-5 h-5" />
                        New chat
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary cursor-pointer" />
                        <input
                            type="text"
                            placeholder="Search your chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-secondary border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-primary placeholder-gray-500 focus:outline-none focus:border-primary focus:bg-secondary transition-colors"
                        />
                    </div>
                </div>

                {/* Sessions Count */}
                {!isLoading && (
                    <div className="mb-6 flex items-center gap-3">
                        <p className="text-primary">
                            {filteredSessions.length} {filteredSessions.length === 1 ? 'chat' : 'chats'} with Reverb
                        </p>
                        {filteredSessions.length > 0 && (
                            <button className="text-primary hover:text-primary/80 font-medium text-sm transition-colors">
                                Select
                            </button>
                        )}
                    </div>
                )}

                {/* Sessions List */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div
                                key={i}
                                className="h-24 bg-secondary rounded-xl animate-pulse"
                            />
                        ))}
                    </div>
                ) : filteredSessions.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-200 mb-2">
                            {searchQuery ? 'No chats found' : 'No conversations yet'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {searchQuery
                                ? 'Try a different search term'
                                : 'Start your first chat with Reverb to get help with education info'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={createNewChat}
                                className="px-6 py-2.5 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center gap-2 cursor-pointer"
                            >
                                <Plus className="w-5 h-5" />
                                Start New Chat
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-0 border-t border-gray-800">
                        {filteredSessions.map((session, index) => (
                            <Link key={session.id} href={`/me/reverb/${session.id}`}>
                                <div className={`group px-4 py-5 hover:bg-secondary transition-colors cursor-pointer border-b border-gray-800 ${index === 0 ? 'rounded-t-xl' : ''
                                    } ${index === filteredSessions.length - 1 ? 'rounded-b-xl border-b-0' : ''
                                    }`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-100 mb-1 line-clamp-1">
                                                {session.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                                                Last message {formatTimestamp(session.timestamp)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => deleteSession(session.id, e)}
                                            className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-gray-500 hover:text-red-500 transition-all flex-shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}