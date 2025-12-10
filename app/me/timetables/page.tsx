'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Calendar, Clock, MapPin, BookOpen, Bell, Check, Loader2, Filter, X, AlertCircle, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Papa from 'papaparse';

interface TimetableEntry {
    date: string;
    time: string;
    code: string;
    name: string;
    venue: string;
    lecturer: string;
    registeredStudents: number;
}

interface StorageData {
    usefulCount: number;
    lastSync: number;
}

export default function TimetablesPage() {
    const [isMKUStudent, setIsMKUStudent] = useState<boolean | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [schoolEmail, setSchoolEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [csvError, setCsvError] = useState('');
    const [usefulCount, setUsefulCount] = useState(0);
    const [hasVoted, setHasVoted] = useState(false);
    const [loadingVote, setLoadingVote] = useState(false);

    // Load saved preference and vote status from localStorage
    useEffect(() => {
        // Check if we're in the browser
        if (typeof window === 'undefined') return;

        try {
            // Load MKU student preference
            const savedMKU = localStorage.getItem('isMKUStudent');
            if (savedMKU !== null) {
                setIsMKUStudent(savedMKU === 'true');
            }

            // Load personal vote status
            const savedVote = localStorage.getItem('hasVotedUseful');
            if (savedVote !== null) {
                setHasVoted(savedVote === 'true');
            }

            // Load useful count from localStorage (shared simulation)
            const savedData = localStorage.getItem('timetableData');
            if (savedData) {
                const data: StorageData = JSON.parse(savedData);
                setUsefulCount(data.usefulCount || 0);
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
        }
    }, []);

    // Parse CSV on component mount
    useEffect(() => {
        const loadTimetable = async () => {
            try {
                setLoading(true);
                setCsvError('');

                const response = await fetch('/preview.csv');
                if (!response.ok) {
                    throw new Error('Failed to load timetable');
                }

                const csvText = await response.text();

                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    dynamicTyping: true,
                    complete: (results) => {
                        const parsed = results.data.map((row: any) => ({
                            date: row.DATE?.toString().trim() || '',
                            time: row.TIME?.toString().trim() || '',
                            code: row.UNIT_CODE?.toString().trim() || '',
                            name: row.UNIT_NAME?.toString().trim() || '',
                            venue: row.VENUE?.toString().trim() || '',
                            lecturer: row.LECTURER?.toString().trim() || '',
                            registeredStudents: row.REGISTERED_STUDENTS || 0,
                        })).filter(entry => entry.code && entry.name);

                        setTimetableData(parsed);
                        setLoading(false);
                    },
                    error: (error: any) => {
                        setCsvError('Failed to parse timetable data');
                        setLoading(false);
                    }
                });
            } catch (err) {
                setCsvError('Failed to load timetable');
                setLoading(false);
            }
        };

        loadTimetable();
    }, []);

    const filteredTimetable = useMemo(() => {
        let filtered = timetableData;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(
                (entry) =>
                    entry.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    entry.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Selected courses filter
        if (selectedCourses.length > 0) {
            filtered = filtered.filter((entry) =>
                selectedCourses.includes(entry.code)
            );
        }

        return filtered;
    }, [timetableData, searchTerm, selectedCourses]);

    const uniqueCourses = useMemo(() => {
        const courses = new Map();
        timetableData.forEach((entry) => {
            if (!courses.has(entry.code)) {
                courses.set(entry.code, entry.name);
            }
        });
        return Array.from(courses, ([code, name]) => ({ code, name }));
    }, [timetableData]);

    const toggleCourseSelection = (code: string) => {
        setSelectedCourses((prev) =>
            prev.includes(code)
                ? prev.filter((c) => c !== code)
                : [...prev, code]
        );
    };

    const handleMKUStudent = () => {
        setIsMKUStudent(true);
        try {
            localStorage.setItem('isMKUStudent', 'true');
        } catch (error) {
            console.error('Failed to save preference:', error);
        }
    };

    const handleNotMKUStudent = () => {
        setIsMKUStudent(false);
        try {
            localStorage.setItem('isMKUStudent', 'false');
        } catch (error) {
            console.error('Failed to save preference:', error);
        }
    };

    const handleUsefulVote = () => {
        if (hasVoted || loadingVote) return;

        setLoadingVote(true);
        try {
            // Increment the counter
            const newCount = usefulCount + 1;

            // Save to localStorage
            const data: StorageData = {
                usefulCount: newCount,
                lastSync: Date.now()
            };
            localStorage.setItem('timetableData', JSON.stringify(data));
            setUsefulCount(newCount);

            // Mark that this user has voted
            localStorage.setItem('hasVotedUseful', 'true');
            setHasVoted(true);
        } catch (error) {
            console.error('Failed to save vote:', error);
        } finally {
            setLoadingVote(false);
        }
    };

    const handleWaitlistSubmit = async (e: React.FormEvent) => {
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
                    full_name: fullName,
                    feature: 'timetables'
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

    // Initial choice screen
    if (isMKUStudent === null) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="max-w-2xl w-full space-y-8">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                            <Calendar className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-4xl font-bold text-foreground">
                            All your timetables in one place
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            Always up-to-date. Never miss an exam or class again.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <button
                            onClick={handleMKUStudent}
                            className="p-6 rounded-2xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all text-left group cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-6 h-6 text-primary" />
                                </div>
                                <Badge variant="outline">Preview Available</Badge>
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                I'm in MKU
                            </h3>
                            <p className="text-muted-foreground">
                                Access the current exam timetable with search and filtering
                            </p>
                        </button>

                        <button
                            onClick={handleNotMKUStudent}
                            className="p-6 rounded-2xl border-2 border-border hover:border-primary/50 transition-all text-left group cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Bell className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <Badge variant="outline">Coming Soon</Badge>
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                I'm in another institution
                            </h3>
                            <p className="text-muted-foreground">
                                Join the waitlist to get notified when we add your school!
                            </p>
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            Say goodbye to outdated PDFs and missed updates 📚
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Waitlist page for non-MKU students
    if (!isMKUStudent) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <button
                        onClick={() => setIsMKUStudent(null)}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Back to selection
                    </button>

                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-foreground mb-4">
                            Your school is coming soon! 🎓
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            We're working hard to bring timetables to all Kenyan universities
                        </p>
                    </div>

                    <div className="p-8 rounded-2xl bg-card border border-border">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
                                <Bell className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground mb-2">
                                    Join the Waitlist
                                </h2>
                                <p className="text-muted-foreground">
                                    Be the first to know when we launch timetables for your institution. We'll send you an email as soon as it's ready!
                                </p>
                            </div>
                        </div>

                        {submitted ? (
                            <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20">
                                <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                                    <Check className="w-6 h-6" />
                                    <div>
                                        <p className="font-semibold">You're on the list!</p>
                                        <p className="text-sm">We'll notify you when timetables launch for your school 📧</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Email Address <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="your@email.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        School Email <span className="text-muted-foreground">(Optional)</span>
                                    </label>
                                    <Input
                                        type="email"
                                        value={schoolEmail}
                                        onChange={(e) => setSchoolEmail(e.target.value)}
                                        placeholder="you@university.ac.ke"
                                    />
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Help us prioritize your school by providing your institutional email
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Full Name <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        placeholder="John Doe"
                                    />
                                </div>

                                {error && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full"
                                    size="lg"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            Joining...
                                        </>
                                    ) : (
                                        'Join Waitlist'
                                    )}
                                </Button>
                            </form>
                        )}
                    </div>

                    <div className="mt-8 p-6 rounded-xl bg-muted/50">
                        <h3 className="font-semibold text-foreground mb-3">What you'll get:</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-primary" />
                                Searchable timetables for all your courses
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-primary" />
                                Instant notifications for schedule changes
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-primary" />
                                Personal course filters and reminders
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-primary" />
                                Always up-to-date from official sources
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // MKU Timetable view
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <button
                    onClick={() => setIsMKUStudent(null)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors cursor-pointer"
                >
                    <X className="w-4 h-4" />
                    Back to selection
                </button>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">MKU Exam Timetable</h1>
                            <p className="text-muted-foreground">December 2025 Examination Period</p>
                        </div>
                    </div>

                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            This is a preview of what timetables will look like on Nuru. Select your courses below to filter the schedule and get personalized views.
                        </AlertDescription>
                    </Alert>
                </div>

                {/* Search and Filters */}
                <div className="space-y-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input
                            type="text"
                            placeholder="Search by course code or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {selectedCourses.length > 0 && (
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-sm text-muted-foreground">Selected courses:</span>
                            {selectedCourses.map((code) => (
                                <Badge
                                    key={code}
                                    variant="outline"
                                    className="cursor-pointer"
                                    onClick={() => toggleCourseSelection(code)}
                                >
                                    {code}
                                    <X className="w-3 h-3 ml-1" />
                                </Badge>
                            ))}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedCourses([])}
                            >
                                Clear all
                            </Button>
                        </div>
                    )}
                </div>

                {/* Course Selection */}
                <div className="mb-6">
                    <details className="group">
                        <summary className="flex items-center justify-between cursor-pointer p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-primary" />
                                <span className="font-medium">
                                    Select Your Courses ({selectedCourses.length} selected)
                                </span>
                            </div>
                            <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                                ▼
                            </span>
                        </summary>
                        <div className="mt-4 p-4 rounded-xl border border-border bg-card">
                            <ScrollArea className="h-64">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pr-4">
                                    {uniqueCourses.map((course) => (
                                        <button
                                            key={course.code}
                                            onClick={() => toggleCourseSelection(course.code)}
                                            className={`p-3 rounded-lg border text-left transition-all ${selectedCourses.includes(course.code)
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/50'
                                                }`}
                                        >
                                            <div className="font-semibold text-sm">{course.code}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {course.name}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </details>
                </div>

                {/* Timetable Display */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : csvError ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{csvError}</AlertDescription>
                    </Alert>
                ) : (
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <ScrollArea className="w-full">
                            <div className="min-w-full">
                                <table className="w-full">
                                    <thead className="bg-muted border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                                Date
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                                Time
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                                Unit Code
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                                Unit Name
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                                Lecturer
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                                Students
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                                Venue
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTimetable.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                                    No exams found matching your criteria
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTimetable.map((entry, index) => (
                                                <tr
                                                    key={index}
                                                    className={`border-b border-border hover:bg-muted/50 transition-colors ${selectedCourses.includes(entry.code) ? 'bg-primary/5' : ''
                                                        }`}
                                                >
                                                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                                            {entry.date}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                                            {entry.time}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline">{entry.code}</Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium max-w-xs">
                                                        {entry.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                                        {entry.lecturer || 'TBA'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-center">
                                                        <Badge variant="secondary">
                                                            {entry.registeredStudents}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <MapPin className="w-4 h-4" />
                                                            {entry.venue}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>
                )}

                {/* Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-card border border-border">
                        <div className="text-2xl font-bold text-foreground">{timetableData.length}</div>
                        <div className="text-sm text-muted-foreground">Total Exams</div>
                    </div>
                    <div className="p-4 rounded-xl bg-card border border-border">
                        <div className="text-2xl font-bold text-foreground">{uniqueCourses.length}</div>
                        <div className="text-sm text-muted-foreground">Unique Courses</div>
                    </div>
                    <div className="p-4 rounded-xl bg-card border border-border">
                        <div className="text-2xl font-bold text-foreground">{selectedCourses.length}</div>
                        <div className="text-sm text-muted-foreground">Your Selected Courses</div>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/20">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Bell className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                Want notifications for your courses?
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Get instant alerts when your exam schedules change or reminders for upcoming exams.
                            </p>
                            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Email Address <span className="text-destructive">*</span>
                                        </label>
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Full Name <span className="text-destructive">*</span>
                                        </label>
                                        <Input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full md:w-auto"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            Joining...
                                        </>
                                    ) : (
                                        'Get Notifications'
                                    )}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
