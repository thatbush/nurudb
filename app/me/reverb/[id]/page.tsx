// app/me/reverb/[id]/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, ArrowLeft, MoreVertical, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    dataSources?: {
        supabase?: {
            universities: number;
            programmes: number;
            enrollment_stats: number;
            tvet_courses: number;
        };
        neon?: {
            extracted: number;
            stored: number;
        };
    };
}

export default function ChatSessionPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [sessionTitle, setSessionTitle] = useState('New Chat');
    const [showMenu, setShowMenu] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const markdownComponents = {
        h3: ({ children, ...props }: any) => (
            <h3 className="text-lg font-semibold mt-6 mb-3 text-foreground" {...props}>
                {children}
            </h3>
        ),
        p: ({ children, ...props }: any) => (
            <p className="my-2 text-foreground/90" {...props}>
                {children}
            </p>
        ),
        ul: ({ children, ...props }: any) => (
            <ul className="my-3 list-disc list-inside space-y-1" {...props}>
                {children}
            </ul>
        ),
        li: ({ children, ...props }: any) => (
            <li className="my-1 text-foreground/90" {...props}>
                {children}
            </li>
        ),
        strong: ({ children, ...props }: any) => (
            <strong className="font-semibold text-foreground" {...props}>
                {children}
            </strong>
        ),
        a: ({ children, ...props }: any) => (
            <a className="text-primary hover:underline" {...props}>
                {children}
            </a>
        ),
        table: ({ children, ...props }: any) => (
            <div className="my-4 overflow-x-auto">
                <table className="w-full border-collapse" {...props}>
                    {children}
                </table>
            </div>
        ),
        thead: ({ children, ...props }: any) => (
            <thead className="bg-muted" {...props}>
                {children}
            </thead>
        ),
        th: ({ children, ...props }: any) => (
            <th className="border border-border px-4 py-2 text-left font-semibold" {...props}>
                {children}
            </th>
        ),
        td: ({ children, ...props }: any) => (
            <td className="border border-border px-4 py-2" {...props}>
                {children}
            </td>
        ),
    };

    const getSessionId = async () => {
        const session = (await params).id;
        setSessionId(session);
    }

    useEffect(() => {
        getSessionId();
        loadSession();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadSession = async () => {
        try {
            const response = await fetch(`/api/reverb/sessions/${sessionId}`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages || []);
                setSessionTitle(data.title || 'New Chat');
            }
        } catch (error) {
            console.error('Failed to load session:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/reverb', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: input,
                    sessionId: sessionId,
                    model: 'gemini-2.5-flash'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();

            const aiMessage: Message = {
                id: Date.now() + 1,
                role: 'assistant',
                content: data.message,
                timestamp: new Date(),
                dataSources: data.dataSources
            };

            setMessages(prev => [...prev, aiMessage]);

            // Update session title if it's the first message
            if (messages.length === 0) {
                const title = input.length > 50 ? input.substring(0, 47) + '...' : input;
                setSessionTitle(title);
                await updateSessionTitle(title);
            }

        } catch (error) {
            const errorMessage: Message = {
                id: Date.now() + 1,
                role: 'assistant',
                content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const updateSessionTitle = async (title: string) => {
        try {
            await fetch(`/api/reverb/sessions/${sessionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });
        } catch (error) {
            console.error('Failed to update title:', error);
        }
    };

    const deleteSession = async () => {
        if (!confirm('Delete this conversation?')) return;

        try {
            await fetch(`/api/reverb/sessions/${sessionId}`, {
                method: 'DELETE'
            });
            router.push('/me/reverb/chats');
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [input]);

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <div className="flex-none border-b border-border bg-card">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/me/reverb/chats">
                            <button className="w-9 h-9 rounded-xl hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="font-semibold text-foreground">{sessionTitle}</h1>
                            <p className="text-xs text-muted-foreground">Reverb AI</p>
                        </div>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="w-9 h-9 rounded-xl hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50">
                                <button
                                    onClick={deleteSession}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2 text-destructive"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Chat
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6">
                                <img src="/nuru-d-tp.png" alt="Reverb" className="w-12 h-12" />
                            </div>
                            <h2 className="text-2xl font-semibold text-foreground mb-2">
                                Talk to Reverb
                            </h2>
                            <p className="text-muted-foreground max-w-md">
                                Ask about universities, programmes, KMTC, TVET - I'm here to help! 🎓
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            <img src="/nuru-d-tp.png" alt="R" className="w-6 h-6" />
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2 max-w-2xl">
                                        {message.role === 'assistant' && message.dataSources && (
                                            <div className="flex gap-2 text-xs">
                                                {message.dataSources.supabase &&
                                                    (message.dataSources.supabase.universities > 0 ||
                                                        message.dataSources.supabase.programmes > 0) && (
                                                        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                            Verified
                                                        </span>
                                                    )}
                                                {message.dataSources.neon && message.dataSources.neon.extracted > 0 && (
                                                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center gap-1">
                                                        +{message.dataSources.neon.extracted} learned
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <div
                                            className={`rounded-2xl px-4 py-3 ${message.role === 'user'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-foreground'
                                                }`}
                                        >
                                            {message.role === 'user' ? (
                                                <div className="whitespace-pre-wrap">
                                                    {message.content}
                                                </div>
                                            ) : (
                                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={markdownComponents}
                                                    >
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {message.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground font-semibold">
                                            Y
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-4 justify-start">
                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Input */}
            <div className="flex-none border-t border-border bg-card">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="relative bg-background border border-input rounded-3xl shadow-sm focus-within:border-ring">
                        <div className="flex items-end gap-2 p-3">
                            <div className="flex-1 min-w-0">
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Message Reverb..."
                                    disabled={isLoading}
                                    className="w-full resize-none bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground px-2 py-2 min-h-[44px] max-h-[200px] disabled:opacity-50"
                                    rows={1}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!input.trim() || isLoading}
                                className="w-10 h-10 rounded-xl bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed flex items-center justify-center text-primary-foreground transition-colors flex-shrink-0"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}