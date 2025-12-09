// app/me/reverb/chats/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Settings, Clock, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const response = await fetch('/api/reverb/sessions');
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

        if (!confirm('Delete this conversation?')) return;

        try {
            await fetch(`/api/reverb/sessions/${id}`, {
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
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        return `${Math.floor(days / 30)} months ago`;
    };

    return (
        <div className="min-h-screen bg-background">

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* New Chat Button */}
                <button
                    onClick={createNewChat}
                    className="w-full mb-6 p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-accent/50 transition-all group"
                >
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                            <Plus className="w-6 h-6 text-primary" />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-foreground">Start New Chat</p>
                            <p className="text-sm text-muted-foreground">Ask Reverb anything about Kenyan education</p>
                        </div>
                    </div>
                </button>

                {/* Sessions List */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse">
                                <div className="h-24 bg-muted rounded-2xl" />
                            </div>
                        ))}
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">No conversations yet</h3>
                        <p className="text-muted-foreground mb-6">
                            Start your first chat with Reverb to get help with education info
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sessions.map(session => (
                            <Link key={session.id} href={`/me/reverb/${session.id}`}>
                                <div className="group p-4 rounded-2xl border border-border hover:border-primary hover:bg-accent/30 transition-all cursor-pointer">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center flex-shrink-0 mt-1">
                                                <img src="/nuru-d-tp.png" alt="R" className="w-7 h-7" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-foreground truncate mb-1">
                                                    {session.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {session.lastMessage}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatTimestamp(session.timestamp)}
                                                    </span>
                                                    <span>
                                                        {session.messageCount} messages
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => deleteSession(session.id, e)}
                                            className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Quick Actions */}
                <div className="mt-8 p-6 rounded-2xl bg-muted/50">
                    <h3 className="font-semibold text-foreground mb-3">Quick Tips</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Ask about universities: "Tell me about Strathmore"</li>
                        <li>• Compare programmes: "Engineering at UoN vs JKUAT"</li>
                        <li>• Check requirements: "Can I join KMTC with C-?"</li>
                        <li>• Get fee estimates: "How much is Bachelor of Commerce?"</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}