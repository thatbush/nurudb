// app/me/reverb/[id]/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Paperclip, Globe, BookOpen, ImageIcon, Mic, ArrowUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageType {
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
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [sessionTitle, setSessionTitle] = useState('New Chat');
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const markdownComponents = {
        h3: ({ children, ...props }: any) => (
            <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground" {...props}>
                {children}
            </h3>
        ),
        p: ({ children, ...props }: any) => (
            <p className="my-2 text-foreground/90 leading-relaxed" {...props}>
                {children}
            </p>
        ),
        ul: ({ children, ...props }: any) => (
            <ul className="my-3 list-disc list-inside space-y-1.5" {...props}>
                {children}
            </ul>
        ),
        ol: ({ children, ...props }: any) => (
            <ol className="my-3 list-decimal list-inside space-y-1.5" {...props}>
                {children}
            </ol>
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
        code: ({ children, ...props }: any) => (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm text-foreground" {...props}>
                {children}
            </code>
        ),
        pre: ({ children, ...props }: any) => (
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-3" {...props}>
                {children}
            </pre>
        ),
    };

    // Load session on mount
    useEffect(() => {
        const initSession = async () => {
            const resolvedParams = await params;
            const id = resolvedParams.id;
            console.log('Loading session:', id);
            setSessionId(id);

            // Load previous messages
            try {
                const response = await fetch(`/api/reverb/sessions/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Loaded messages:', data.messages?.length || 0);
                    setMessages(data.messages || []);
                    setSessionTitle(data.title || 'New Chat');
                }
            } catch (error) {
                console.error('Failed to load session:', error);
            } finally {
                setIsLoadingSession(false);
            }
        };

        initSession();
    }, [params]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        if (!input.trim() || isLoading || !sessionId) return;

        const userMessage: MessageType = {
            id: Date.now(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/reverb', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: currentInput,
                    sessionId: sessionId,
                    model: 'gemini-2.5-flash'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();

            const aiMessage: MessageType = {
                id: Date.now() + 1,
                role: 'assistant',
                content: data.message,
                timestamp: new Date(),
                dataSources: data.dataSources
            };

            setMessages(prev => [...prev, aiMessage]);

            // Update session title if it's the first message
            if (messages.length === 0) {
                const title = currentInput.length > 50 ? currentInput.substring(0, 47) + '...' : currentInput;
                setSessionTitle(title);
                await updateSessionTitle(title);
            }

        } catch (error) {
            const errorMessage: MessageType = {
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

    if (isLoadingSession) {
        return (
            <div className="flex flex-col h-screen bg-background">
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[85vh] bg-background">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-screen text-center py-20">
                            <div className="mb-8">
                                <img src="/nuru-d-tp.png" alt="Reverb" className="w-16 h-16 mx-auto" />
                            </div>
                            <p className="text-muted-foreground">Start a conversation with Reverb</p>
                        </div>
                    ) : (
                        <div className="py-8 space-y-8">
                            {messages.map((message) => (
                                <div key={message.id} className="flex gap-4 items-start">
                                    {message.role === 'assistant' && (
                                        <div className="w-8 h-8 flex-shrink-0">
                                            <img
                                                src="/nuru-d-tp.png"
                                                alt="AI"
                                                className="w-8 h-8"
                                            />
                                        </div>
                                    )}
                                    <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                                        <div className={`max-w-full ${message.role === 'user' ? 'max-w-[85%]' : ''}`}>
                                            {message.role === 'user' ? (
                                                <div className="bg-muted rounded-3xl px-5 py-3 text-foreground whitespace-pre-wrap">
                                                    {message.content}
                                                </div>
                                            ) : (
                                                <div className="prose prose-sm max-w-none text-foreground">
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
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground font-semibold text-sm">
                                            Y
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-4 items-start">
                                    <div className="w-8 h-8 flex-shrink-0">
                                        <img
                                            src="/nuru-d-tp.png"
                                            alt="AI"
                                            className="w-8 h-8 animate-spin [animation-duration:20s]"
                                        />
                                    </div>

                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="flex-none">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative bg-muted rounded-3xl">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything"
                            disabled={isLoading}
                            className="w-full resize-none bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground px-5 py-4 pr-14 min-h-[56px] max-h-[200px] disabled:opacity-50"
                            rows={1}
                        />
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-3 bottom-3 w-10 h-10 rounded-xl bg-foreground hover:bg-foreground/90 disabled:bg-muted-foreground/20 disabled:cursor-not-allowed flex items-center justify-center text-background transition-colors"
                        >
                            <ArrowUp className="w-5 h-5 text-secondary" />
                        </button>
                    </div>
                    <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-accent text-foreground transition-colors text-sm">
                            <Paperclip className="w-4 h-4" />
                            <span className="hidden sm:inline">Attach</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-accent text-foreground transition-colors text-sm">
                            <Globe className="w-4 h-4" />
                            <span className="hidden sm:inline">Search</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-accent text-foreground transition-colors text-sm">
                            <BookOpen className="w-4 h-4" />
                            <span className="hidden sm:inline">Study</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-accent text-foreground transition-colors text-sm">
                            <ImageIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Create image</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-accent text-foreground transition-colors text-sm">
                            <Mic className="w-4 h-4" />
                            <span className="hidden sm:inline">Voice</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}