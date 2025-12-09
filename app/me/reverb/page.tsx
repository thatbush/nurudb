'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Sparkles, Clock, Settings2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';

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

const ReverbChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [selectedModel, setSelectedModel] = useState('Claude Sonnet 4.5');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileModelOpen, setIsMobileModelOpen] = useState(false);
    const [dataBuffer, setDataBuffer] = useState<any[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const models = [
        'Claude Sonnet 4.5',
        'Gemini 2.0 Flash',
        'Perplexity Sonar'
    ];

    // Custom components for ReactMarkdown
    const markdownComponents = {
        // Custom DataCard component
        datacard: ({ institution, programmes, statistics, enrollmentTrend }: any) => {
            const data = { institution, programmes, statistics, enrollmentTrend };
            return <DataCard data={data} />;
        },
        // Styled headers
        h3: ({ children, ...props }: any) => (
            <h3 className="text-lg font-semibold mt-6 mb-3 text-foreground" {...props}>
                {children}
            </h3>
        ),
        // Styled paragraphs
        p: ({ children, ...props }: any) => (
            <p className="my-2 text-foreground/90" {...props}>
                {children}
            </p>
        ),
        // Styled lists
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
        // Styled horizontal rule
        hr: ({ ...props }: any) => (
            <hr className="my-6 border-border" {...props} />
        ),
        // Strong text
        strong: ({ children, ...props }: any) => (
            <strong className="font-semibold text-foreground" {...props}>
                {children}
            </strong>
        ),
        // Links
        a: ({ children, ...props }: any) => (
            <a className="text-primary hover:underline" {...props}>
                {children}
            </a>
        ),
        // Tables
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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');

        try {
            const sessionId = localStorage.getItem('reverb_session_id') || `session_${Date.now()}`;
            localStorage.setItem('reverb_session_id', sessionId);

            const response = await fetch('/api/reverb', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: input,
                    sessionId: sessionId,
                    model: selectedModel === 'Gemini 2.0 Flash' ? 'gemini-2.5-flash' : 'gemini-2.5-flash'
                })
            });

            if (!response.ok) {
                if (response.status === 402) {
                    throw new Error('Insufficient credits. Please purchase more credits.');
                }
                throw new Error('Failed to get response');
            }

            const data = await response.json();

            if (data.dataPoints?.bufferStatus) {
                setDataBuffer(data.dataPoints.bufferStatus);
                if (data.dataPoints.stored > 0) {
                    setMessages(prev => [
                        ...prev,
                        {
                            id: Date.now(),
                            role: 'assistant',
                            content: `✅ Stored ${data.dataPoints.stored} data batch(es) about institutions/programmes`,
                            timestamp: new Date()
                        }
                    ]);
                }
            }

            const aiMessage: Message = {
                id: Date.now() + 1,
                role: 'assistant',
                content: data.message,
                timestamp: new Date(),
                dataSources: data.dataSources
            };

            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            const errorMessage: Message = {
                id: Date.now() + 1,
                role: 'assistant',
                content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
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
        <div className="flex flex-col h-[85vh] bg-background">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center mb-6">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-semibold text-foreground mb-2">
                                Talk to Reverb
                            </h2>
                            <p className="text-muted-foreground max-w-md">
                                Tired of scrolling through pages of data? Ask Reverb "Can I go to KMTC with a C-?"
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
                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                            <img src="/nuru-d-tp.png" alt="" />
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2 max-w-2xl">
                                        {/* Data Source Badge */}
                                        {message.role === 'assistant' && message.dataSources && (
                                            <div className="flex gap-2 text-xs">
                                                {message.dataSources.supabase &&
                                                    (message.dataSources.supabase.universities > 0 ||
                                                        message.dataSources.supabase.programmes > 0) && (
                                                        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                            Verified Data
                                                        </span>
                                                    )}
                                                {message.dataSources.neon && message.dataSources.neon.extracted > 0 && (
                                                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                                        </svg>
                                                        +{message.dataSources.neon.extracted} learned
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Message Content */}
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

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area - Same as before */}
            <div className="flex-none">
                <div className="max-w-4xl mx-auto px-4 pb-4">
                    <div className="relative bg-card border border-input rounded-3xl shadow-lg transition-shadow focus-within:shadow-xl focus-within:border-ring">
                        <div className="flex items-end gap-2 p-3">
                            <div className="flex items-center gap-1 pb-2 flex-shrink-0">
                                <button type="button" className="w-9 h-9 rounded-xl hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title="New chat">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 min-w-0">
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Message Reverb..."
                                    className="w-full resize-none bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground px-2 py-2 min-h-[44px] max-h-[200px]"
                                    rows={1}
                                />
                            </div>
                            <div className="flex items-center gap-2 pb-2 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={!input.trim()}
                                    className="w-10 h-10 rounded-xl bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed flex items-center justify-center text-primary-foreground transition-colors flex-shrink-0"
                                    title="Send message"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// DataCard component for structured data rendering
const DataCard = ({ data }: { data: any }) => {
    const { institution, programmes, statistics, enrollmentTrend } = data;

    return (
        <div className="space-y-4 my-4">
            {/* Institution Card */}
            {institution && (
                <Card>
                    <CardHeader>
                        <CardTitle>{institution.name || 'Unknown Institution'}</CardTitle>
                        <CardDescription>
                            {institution.type} {institution.category && `| ${institution.category}`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {institution.charter_year && (
                            <p><strong>Chartered:</strong> {institution.charter_year}</p>
                        )}
                        {institution.website_url && (
                            <p><strong>Website:</strong> <a href={institution.website_url} className="text-primary hover:underline">{institution.website_url}</a></p>
                        )}
                        {(institution.county || institution.location) && (
                            <p><strong>Location:</strong> {[institution.county, institution.location].filter(Boolean).join(', ')}</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Programmes Table */}
            {programmes && programmes.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3">Available Programmes</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Programme</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Fees (KES)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {programmes.map((p: any, idx: number) => (
                                <TableRow key={idx}>
                                    <TableCell>{p.name || 'N/A'}</TableCell>
                                    <TableCell>{p.level || 'N/A'}</TableCell>
                                    <TableCell>{p.duration_years ? `${p.duration_years} years` : 'N/A'}</TableCell>
                                    <TableCell>
                                        {p.fees_min && p.fees_max
                                            ? `${p.fees_min.toLocaleString()} - ${p.fees_max.toLocaleString()}`
                                            : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Statistics Chart */}
            {statistics && statistics.data && statistics.data.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3">Key Statistics</h3>
                    <ChartContainer config={statistics.config || {}} className="h-64">
                        <BarChart data={statistics.data}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="label" />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </div>
            )}

            {/* Enrollment Trend */}
            {enrollmentTrend && enrollmentTrend.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3">Enrollment Trend</h3>
                    <ChartContainer config={{ enrollment: { label: "Enrollment" } }} className="h-64">
                        <LineChart data={enrollmentTrend}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="year" />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line type="monotone" dataKey="total_students" stroke="hsl(var(--primary))" strokeWidth={2} />
                        </LineChart>
                    </ChartContainer>
                </div>
            )}
        </div>
    );
};

export default ReverbChat;