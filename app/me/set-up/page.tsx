'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    FileText,
    Building2,
    BookOpen,
    GraduationCap,
    CheckCircle2,
    AlertCircle,
    User,
    Loader2,
    ArrowRight,
    ArrowLeft,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createBrowserClient } from '@supabase/ssr';
import { Spinner } from '@/components/ui/spinner';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
);

interface UserProfile {
    id: string;
    auth_id: string;
    email: string;
    full_name: string;
    username: string;
    bio: string | null;
    school_email: string | null;
    school_name: string | null;
    year_of_study: string | null;
    major: string | null;
    credits: number;
}

interface University {
    id: string;
    name: string;
    type: string;
}

const years = ['Pre-Campus', 'Freshman', 'Sophomore', 'Junior', 'Senior', 'Super Senior', 'Alumni'];

export default function SetupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [authUser, setAuthUser] = useState<any | null>(null);
    const [formData, setFormData] = useState<Partial<UserProfile>>({});
    const [currentStep, setCurrentStep] = useState(0);
    const [showWelcome, setShowWelcome] = useState(true);
    const [completed, setCompleted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [usernameError, setUsernameError] = useState<string | null>(null);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

            if (authError || !authUser) {
                console.error('Auth error:', authError);
                router.push('/auth/login');
                return;
            }

            console.log('Auth user:', { id: authUser.id, email: authUser.email });
            setAuthUser(authUser);

            // Ensure email is available
            if (!authUser.email) {
                setError('Email not found. Please log in again.');
                setLoading(false);
                return;
            }

            // Pass email as query parameter for user creation if needed
            const url = `/api/users/profile/${authUser.id}?email=${encodeURIComponent(authUser.email)}`;
            console.log('Fetching profile from:', url);

            const response = await fetch(url);
            const result = await response.json();

            console.log('Profile fetch result:', result);

            if (!result.success || !result.data) {
                console.error('User profile error:', result.error);
                setError(result.error || 'Failed to load profile');
                setLoading(false);
                setUser(null);
                return;
            }

            console.log('User profile loaded:', result.data);
            setUser(result.data as UserProfile);
            setFormData(result.data as UserProfile);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching user:', error);
            setError('Failed to load your profile. Please try again.');
            setLoading(false);
        }
    };

    const checkUsernameAvailability = async (username: string) => {
        if (!username || username.length < 3) {
            setUsernameError('Username must be at least 3 characters');
            return false;
        }

        // Skip check if username hasn't changed
        if (username === user?.username) {
            setUsernameError(null);
            return true;
        }

        // Check username in database
        const response = await fetch(`/api/users/check-username`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username }),
        });

        const data = await response.json();

        if (data.error) {
            setUsernameError('Error checking username availability');
            return false;
        }

        if (!data.available) {
            setUsernameError('Username is already taken');
            return false;
        }

        setUsernameError(null);
        return true;
    };

    const handleInputChange = (field: keyof UserProfile, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleUsernameBlur = () => {
        if (formData.username) {
            checkUsernameAvailability(formData.username);
        }
    };

    const canProceedToNextStep = () => {
        switch (currentStep) {
            case 0: // Name
                return formData.full_name && formData.full_name.trim().length > 0;
            case 1: // Username
                return formData.username && formData.username.trim().length >= 3 && !usernameError;
            case 2: // Bio
                return true; // Bio is optional
            case 3: // Major
                return true; // Major is optional
            case 4: // Year & University
                return true; // Both optional
            default:
                return true;
        }
    };

    const handleNext = async () => {
        if (currentStep === 1) {
            // Validate username before proceeding
            const isValid = await checkUsernameAvailability(formData.username || '');
            if (!isValid) return;
        }

        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            await handleSave();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkipAll = () => {
        router.push('/me');
    };

    const handleSave = async () => {
        if (!authUser?.id) {
            setError('Authentication required. Please refresh the page.');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            // Prepare update data
            const updateData: any = {};

            if (formData.full_name?.trim()) updateData.full_name = formData.full_name.trim();
            if (formData.username?.trim()) updateData.username = formData.username.trim();
            updateData.credits = 50;

            console.log('Saving profile with authId:', authUser.id);
            console.log('Update data:', updateData);

            // Update user profile using auth_id
            const url = `/api/users/profile/${authUser.id}`;
            console.log('PUT request to:', url);

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            const result = await response.json();
            console.log('Update result:', result);

            if (!result.success) {
                console.error('Failed to update user profile:', result.error);
                setError(result.error);
                setSaving(false);
                return;
            }

            console.log('Profile updated successfully:', result.data);

            // Create credit transaction using the returned user data
            const userId = result.data.id;
            console.log('Creating credit transaction for user:', userId);

            const transactionResponse = await fetch(`/api/users/credits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    amount: 50,
                    transaction_type: 'credit',
                    description: 'Initial credit',
                    category: 'Initial credit'
                }),
            });

            const transactionResult = await transactionResponse.json();
            console.log('Transaction result:', transactionResult);

            if (!transactionResult.success) {
                console.error('Failed to create credit transaction:', transactionResult.error);
                // Don't fail the whole process if just the transaction fails
                console.warn('Continuing despite transaction error');
            }

            setCompleted(true);
            setTimeout(() => {
                router.push('/me');
            }, 2000);
        } catch (error) {
            console.error('Error saving profile:', error);
            setError(`Failed to save your profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setSaving(false);
        }
    };

    const steps = [
        {
            title: "What's your name?",
            description: "Let's start with the basics",
            icon: <User className="w-8 h-8" />,
            content: (
                <div className="space-y-4">
                    <Input
                        type="text"
                        placeholder="John Doe"
                        value={formData.full_name || ''}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        className="bg-secondary border-primary/40 text-primary placeholder:text-primary/60 focus:ring-2 focus:ring-[#104e64] focus:border-transparent text-lg h-14"
                        autoFocus
                    />
                </div>
            ),
        },
        {
            title: "Pick a username",
            description: "This is how others will find you",
            icon: <User className="w-8 h-8" />,
            content: (
                <div className="space-y-4">
                    <Input
                        type="text"
                        placeholder="johndoe"
                        value={formData.username || ''}
                        onChange={(e) => handleInputChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        onBlur={handleUsernameBlur}
                        className="bg-secondary border-primary/40 text-primary placeholder:text-primary/60 focus:ring-2 focus:ring-[#104e64] focus:border-transparent text-lg h-14"
                        minLength={3}
                    />
                    {usernameError && (
                        <p className="text-sm text-red-500 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {usernameError}
                        </p>
                    )}
                    {formData.username && !usernameError && formData.username.length >= 3 && (
                        <p className="text-sm text-green-500 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Username is available!
                        </p>
                    )}
                </div>
            ),
        },
    ];

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Spinner className="text-chart-3" />
            </div>
        );
    }

    // Error state
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <Card className="bg-background border-destructive/50 max-w-md w-full">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-primary mb-2">Profile Not Found</h2>
                            <p className="text-secondary mb-4">
                                {error || `We couldn't load your profile. Please make sure your email address is verified and try logging in again.`}
                            </p>
                            <Button
                                variant='default'
                                onClick={() => router.push('/auth/login')}
                                className="cursor-pointer text-white"
                            >
                                Back to login
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Welcome screen
    if (showWelcome) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <Card className="max-w-2xl w-full border-primary/40">
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-[#104e64] to-[#0a3a4d] rounded-full flex items-center justify-center">
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <CardTitle className="text-3xl md:text-4xl font-bold text-primary mb-2">
                            Welcome to the community! 🎉
                        </CardTitle>
                        <CardDescription className="text-lg text-primary/70">
                            Let's personalize your experience
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-primary">Get personalized recommendations</p>
                                    <p className="text-sm text-primary/60">Connect with people in your field</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-primary">Join relevant communities</p>
                                    <p className="text-sm text-primary/60">Discover spaces that match your interests</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-primary">Earn 50 bonus credits</p>
                                    <p className="text-sm text-primary/60">Complete your profile setup</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                variant="outline"
                                onClick={handleSkipAll}
                                className="flex-1 border-primary/60 text-primary hover:bg-primary/10 hover:text-primary h-12"
                            >
                                Skip for now
                            </Button>
                            <Button
                                variant="default"
                                onClick={() => setShowWelcome(false)}
                                className="flex-1 cursor-pointer text-white h-12"
                            >
                                Let's get started
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Completion screen
    if (completed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <Card className="bg-background border-primary/40 max-w-md w-full">
                    <CardContent className="pt-8 pb-8">
                        <div className="text-center">
                            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4 animate-bounce" />
                            <h2 className="text-3xl font-bold text-primary mb-2">
                                All Set! ✨
                            </h2>
                            <p className="text-secondary text-lg mb-2">
                                You've earned 50 bonus credits!
                            </p>
                            <p className="text-primary/60">
                                Redirecting to your dashboard...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Main step-by-step form
    const currentStepData = steps[currentStep];

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
            <div className="max-w-2xl w-full">
                {/* Progress indicator */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-primary/60">
                            Step {currentStep + 1} of {steps.length}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSkipAll}
                            className="text-primary/60 hover:text-primary"
                        >
                            Skip all
                        </Button>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-[#104e64] to-[#0a3a4d] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <Card className="mb-6 border-destructive/50 bg-destructive/20">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3 text-destructive">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step content */}
                <Card className="border-primary/40">
                    <CardHeader>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#104e64] to-[#0a3a4d] rounded-full flex items-center justify-center text-white flex-shrink-0">
                                {currentStepData.icon}
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-2xl md:text-3xl text-primary">
                                    {currentStepData.title}
                                </CardTitle>
                                <CardDescription className="text-base text-primary/70">
                                    {currentStepData.description}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {currentStepData.content}

                        {/* Navigation buttons */}
                        <div className="flex gap-3 pt-4">
                            {currentStep > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    disabled={saving}
                                    className="flex-1 border-primary/60 text-primary hover:bg-primary/10 hover:text-primary h-12"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                            )}
                            <Button
                                variant="default"
                                onClick={handleNext}
                                disabled={saving || !canProceedToNextStep()}
                                className="flex-1 cursor-pointer text-white h-12"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : currentStep === steps.length - 1 ? (
                                    'Complete Setup'
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}