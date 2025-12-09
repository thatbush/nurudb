'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
    BookOpen,
    TrendingUp,
    Award,
    Share2,
    Copy,
    Check,
    User,
    Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import CountUp from 'react-countup';
import { db } from '@/lib/supabaseProxy';
import { Spinner } from '@/components/ui/spinner';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
);

interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    level_name: string;
    level_points: number;
    credits: number;
    referral_code: string;
    created_at: string;
    year_of_study: string | null;
    major: string | null;
    school_email: string | null;
    school_name: string | null;
    checkmark: boolean;
    is_pro: boolean;
}

interface UserStats {
    totalPosts: number;
    totalComments: number;
    totalFollowers: number;
    totalFollowing: number;
    archiveCount: number;
    creditsEarned: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<UserStats>({
        totalPosts: 0,
        totalComments: 0,
        totalFollowers: 0,
        totalFollowing: 0,
        archiveCount: 0,
        creditsEarned: 0,
    });
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

                if (userError || !authUser?.id) {
                    router.push('/auth/login');
                    return;
                }

                const authUserId = authUser.id;

                const userData = await db.users.select({
                    filter: { auth_id: authUser.id },
                });

                if (userData.error) {
                    console.error('Fetch error:', userData.error);
                    router.push('/me/set-up');
                    return;
                }

                const userProfile = (userData as any)?.data?.[0] || null;

                setUser(userProfile);

                // Fetch stats in parallel
                const [postsRes, commentsRes, followersRes, followingRes, archiveRes, creditsRes] = await Promise.all([
                    supabase
                        .from('posts')
                        .select('id', { count: 'exact', head: true })
                        .eq('author_id', authUserId),
                    supabase
                        .from('comments')
                        .select('id', { count: 'exact', head: true })
                        .eq('author_id', authUserId),
                    supabase
                        .from('followers')
                        .select('id', { count: 'exact', head: true })
                        .eq('followed_id', authUserId),
                    supabase
                        .from('followers')
                        .select('id', { count: 'exact', head: true })
                        .eq('follower_id', authUserId),
                    supabase
                        .from('user_archive')
                        .select('id', { count: 'exact', head: true })
                        .eq('user_id', authUserId),
                    supabase
                        .from('credit_transactions')
                        .select('amount')
                        .eq('user_id', authUserId)
                        .gt('amount', 0),
                ]);

                const creditsEarned = (creditsRes.data || []).reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

                setStats({
                    totalPosts: postsRes.count || 0,
                    totalComments: commentsRes.count || 0,
                    totalFollowers: followersRes.count || 0,
                    totalFollowing: followingRes.count || 0,
                    archiveCount: archiveRes.count || 0,
                    creditsEarned,
                });
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [router]);

    useEffect(() => {
        // After fetching user data, check if profile needs setup
        if (user && !user.bio && !user.school_name) {
            // Redirect to setup
            router.push('/me/set-up');
        }
    }, [user]);

    const handleCopyReferralCode = () => {
        if (user?.referral_code) {
            navigator.clipboard.writeText(user.referral_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const initials = user?.full_name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'U';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Spinner
                    className="text-chart-3"
                />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Main Content */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                Credits
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                <CountUp end={user.credits} />
                            </div>
                            <p className="text-xs text-primary mt-1">
                                +<CountUp end={stats.creditsEarned} /> earned
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary" />
                                Posts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                <CountUp end={stats.totalPosts} />
                            </div>
                            <p className="text-xs text-primary mt-1">
                                <CountUp end={stats.totalComments} /> comments
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" />
                                Followers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                <CountUp end={stats.totalFollowers} />
                            </div>
                            <p className="text-xs text-primary mt-1">
                                Following <CountUp end={stats.totalFollowing} />
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Award className="w-4 h-4 text-primary" />
                                Level
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold truncate">{user.level_name}</div>
                            <p className="text-xs text-primary mt-1">
                                <CountUp end={user.level_points} /> pts
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs Section */}
                <Tabs defaultValue="overview" className="mb-8">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="referral">Referral</TabsTrigger>
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Information</CardTitle>
                                <CardDescription>Your profile details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-primary">Email</p>
                                        <p className="font-mono text-sm">{user.email}</p>
                                    </div>
                                    {user.school_email && (
                                        <div>
                                            <p className="text-sm font-medium text-primary">School Email</p>
                                            <p className="font-mono text-sm">{user.school_email}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-primary">Member Since</p>
                                        <p className="text-sm">
                                            {new Date(user.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    {user.major && (
                                        <div>
                                            <p className="text-sm font-medium text-primary">Major</p>
                                            <p className="text-sm">{user.major}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="referral" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Your Referral Code</CardTitle>
                                <CardDescription>Invite friends and earn rewards</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-gray-900 text-white px-4 py-2 rounded font-mono font-bold text-lg">
                                        {user.referral_code}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopyReferralCode}
                                        className="gap-2"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copy
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
                                    <p className="text-sm mb-2">
                                        Share this code with friends. When they sign up using your code, you both get rewards!
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const text = `Join me on Nuru! Use my referral code: ${user.referral_code}`;
                                            if (navigator.share) {
                                                navigator.share({
                                                    title: 'Nuru Referral',
                                                    text,
                                                });
                                            }
                                        }}
                                    >
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Share
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="activity" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>Your contribution summary</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary bg-opacity-10">
                                        <span className="font-medium">Total Posts Created</span>
                                        <span className="font-bold text-xl">
                                            <CountUp end={stats.totalPosts} />
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500 bg-opacity-10">
                                        <span className="font-medium">Total Comments</span>
                                        <span className="font-bold text-xl">
                                            <CountUp end={stats.totalComments} />
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500 bg-opacity-10">
                                        <span className="font-medium">Resources Archived</span>
                                        <span className="font-bold text-xl">
                                            <CountUp end={stats.archiveCount} />
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500 bg-opacity-10">
                                        <span className="font-medium">Community Following</span>
                                        <span className="font-bold text-xl">
                                            <CountUp end={stats.totalFollowing} />
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </section>
        </div>
    );
}