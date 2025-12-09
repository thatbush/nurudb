// app/me/reverb/settings/page.tsx
'use client';

import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Check, Loader2, ArrowUpLeftFromSquare, ArrowUpRightFromSquare } from 'lucide-react';
import Link from 'next/link';

export default function ReverbSettingsPage() {
    const [email, setEmail] = useState('');
    const [schoolEmail, setSchoolEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleJoinWaitlist = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    school_email: schoolEmail || null,
                    full_name: fullName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to join waitlist');
            }

            setSubmitted(true);
            setEmail('');
            setSchoolEmail('');
            setFullName('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Disclaimer - Reverb learns from your chats, there's no way to change this */}
            <div className="text-center text-sm text-muted-foreground py-8">
                <span className="font-semibold text-destructive">IMPORTANT:</span> Reverb learns from your chats by default, there's no way to change this. <a href="/privacy" target="_blank" rel="noopener noreferrer" className='text-primary hover:underline'>What does this mean?<ArrowUpRightFromSquare className="inline-block w-4 h-4 ml-2" /></a>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Current Plan */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Current Plan</h2>
                    <div className="p-6 rounded-2xl border border-border bg-card">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-foreground">Free Tier</h3>
                                    <span className="px-2 py-1 rounded-full bg-muted text-xs font-medium">
                                        Current
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Limited access to Reverb AI
                                </p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2 text-muted-foreground">
                                        <Check className="w-4 h-4 text-green-500" />
                                        10 messages per day
                                    </li>
                                    <li className="flex items-center gap-2 text-muted-foreground">
                                        <Check className="w-4 h-4 text-green-500" />
                                        Basic education data
                                    </li>
                                    <li className="flex items-center gap-2 text-muted-foreground">
                                        <Check className="w-4 h-4 text-green-500" />
                                        Standard response time
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Plans */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Coming Soon</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Pro Plan */}
                        <div className="p-6 rounded-2xl border border-border bg-card opacity-75">
                            <div className="mb-4">
                                <h3 className="font-semibold text-foreground mb-1">Pro</h3>
                                <p className="text-2xl font-bold text-foreground mb-1">
                                    KES 500<span className="text-sm font-normal text-muted-foreground">/month</span>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    For serious students
                                </p>
                            </div>
                            <ul className="space-y-2 text-sm mb-4">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-primary" />
                                    Unlimited messages
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-primary" />
                                    Advanced analytics
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-primary" />
                                    Priority support
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-primary" />
                                    Export conversations
                                </li>
                            </ul>
                            <button
                                disabled
                                className="w-full py-2 px-4 rounded-xl bg-muted text-muted-foreground cursor-not-allowed"
                            >
                                Coming Soon
                            </button>
                        </div>

                        {/* Institution Plan */}
                        <div className="p-6 rounded-2xl border-2 border-primary bg-card relative overflow-hidden">
                            <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-bl-xl">
                                BEST VALUE
                            </div>
                            <div className="mb-4 mt-2">
                                <h3 className="font-semibold text-foreground mb-1">Institution</h3>
                                <p className="text-2xl font-bold text-foreground mb-1">
                                    Custom
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    For schools & universities
                                </p>
                            </div>
                            <ul className="space-y-2 text-sm mb-4">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-primary" />
                                    Everything in Pro
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-primary" />
                                    Multi-user access
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-primary" />
                                    Custom branding
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-primary" />
                                    API access
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-primary" />
                                    Dedicated support
                                </li>
                            </ul>
                            <button
                                disabled
                                className="w-full py-2 px-4 rounded-xl bg-muted text-muted-foreground cursor-not-allowed"
                            >
                                Coming Soon
                            </button>
                        </div>
                    </div>
                </div>

                {/* Waitlist */}
                <div className="p-8 rounded-2xl bg-secondary border border-primary/20">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                            <img src="/nuru-d-tp.png" alt="" className="animate-spin [animation-duration:20s]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-2">
                                Join the Waitlist
                            </h2>
                            <p className="text-muted-foreground">
                                Be the first to know when paid plans launch. Verified profiles get priority access! 🚀
                            </p>
                        </div>
                    </div>

                    {submitted ? (
                        <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20">
                            <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                                <Check className="w-6 h-6" />
                                <div>
                                    <p className="font-semibold">You're on the list!</p>
                                    <p className="text-sm">We'll notify you when we launch. Check your email soon! 📧</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleJoinWaitlist} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Email Address <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="your@email.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    School Email <span className="text-muted-foreground">(Optional)</span>
                                </label>
                                <input
                                    type="email"
                                    value={schoolEmail}
                                    onChange={(e) => setSchoolEmail(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="you@university.ac.ke"
                                />
                                <p className="mt-2 text-xs text-muted-foreground">
                                    We will use this to verify your profile when we launch. Don't have one? You will still be able to verify your profile later. (Only verified profiles are eligible for paid plans)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Full Name <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="John Doe"
                                />
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Joining...
                                    </>
                                ) : (
                                    'Join Waitlist'
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Info */}
                <div className="mt-8 p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
                    <p className="mb-2">
                        <strong className="text-foreground">About Reverb:</strong>
                    </p>
                    <p>
                        Reverb is an LLM in training created by Spiritbulb for the NuruDB project.
                        We're building comprehensive education data for Kenya. Questions? Visit{' '}
                        <a href="https://spiritbulb.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            spiritbulb.org
                        </a>
                        {' '}and tell them Reverb sent you! 🚀
                    </p>
                </div>
            </div>
        </div>
    );
}