'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { db } from '@/lib/supabaseProxy';
import {
    LayoutDashboard,
    User,
    Settings,
    LogOut,
    ChevronDown,
    BookOpen,
    FileText,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
} from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SplashCursor from '@/components/SplashCursor';
import FuzzyText from '@/components/FuzzyText';
import { Spinner } from '@/components/ui/spinner';
import DashboardAnalytics from '@/components/DashboardAnalytics';
import { Moon, Sun } from 'lucide-react';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
);

interface LayoutUser {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
}

const navigationItems = [
    {
        title: 'Overview',
        href: '/me',
        icon: LayoutDashboard,
    },
    {
        title: 'Discovery',
        icon: BookOpen,
        items: [
            { title: 'Degrees', href: '/me/degree' },
            { title: 'Diplomas', href: '/me/diploma' },
            { title: 'Certificates', href: '/me/certificate' },
        ],
    },
    {
        title: 'Account',
        icon: User,
        items: [
            { title: 'Profile', href: '/me/profile' },
            { title: 'Settings', href: '/me/settings' },
        ],
    },
];

function AppSidebar({ user, onLogout }: { user: LayoutUser; onLogout: () => void }) {
    const router = useRouter();

    const initials = user?.full_name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'U';

    return (
        <Sidebar className="">
            <SidebarHeader className="border-b border-primary/10">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton className="transition-colors h-16 cursor-pointer">
                                    <div className="relative">
                                        <img src="/nuru-l-tp.png" alt="Nuru" className="absolute top-0 left-0 w-14 h-14 object-cover animate-spin [animation-duration:20s]" />
                                        <Avatar className="h-14 w-14 p-3">
                                            <AvatarImage src={user.avatar_url || undefined} />
                                            <AvatarFallback className="bg-gradient-to-br from-[#e29d1cff] to-[#d4891a] text-white text-xs font-bold">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="flex flex-col gap-0.5 leading-none">
                                        <span className="font-semibold text-sm">{user.full_name}</span>
                                        <span className="text-xs text-gray-500">@{user.username}</span>
                                    </div>
                                    <ChevronDown className="ml-auto h-4 w-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                align="end"
                                className="w-56"
                            >
                                <DropdownMenuItem onClick={() => router.push('/me/profile')}>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>View Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/me/settings')}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onLogout} className="text-red-400 focus:text-red-300">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Exit</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>

            </SidebarHeader>

            <SidebarContent className="space-y-2 p-4">
                <SidebarMenu>
                    {navigationItems.map((item) =>
                        item.items ? (
                            <Collapsible key={item.title} defaultOpen className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton className="hover:bg-gray-800 hover:text-[#e29d1cff] transition-colors">
                                            <item.icon className="w-5 h-5" />
                                            <span>{item.title}</span>
                                            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {item.items.map((subItem) => (
                                                <SidebarMenuSubItem key={subItem.href}>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        className="hover:bg-gray-800 hover:text-[#e29d1cff] transition-colors"
                                                    >
                                                        <a href={subItem.href}>
                                                            <span>{subItem.title}</span>
                                                        </a>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        ) : (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    className="hover:bg-gray-800 hover:text-[#e29d1cff] transition-colors"
                                >
                                    <a href={item.href}>
                                        <item.icon className="w-5 h-5" />
                                        <span>{item.title}</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    )}
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="border-t border-gray-800">

            </SidebarFooter>
        </Sidebar>
    );
}

function MeLayoutInner({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<LayoutUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const isDark = localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setDarkMode(isDark);
        applyTheme(isDark);
    }, []);

    const applyTheme = (isDark: boolean) => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        applyTheme(newDarkMode);
    };


    const intent = searchParams.get('intent') || null;

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

                if (authError) {
                    console.error('Auth error:', authError);
                    if (intent) {
                        sessionStorage.setItem('postAuthIntent', intent);
                    }
                    router.push('/auth/login');
                    return;
                }

                if (!authUser?.id) {
                    if (intent) {
                        sessionStorage.setItem('postAuthIntent', intent);
                    }
                    router.push('/auth/login');
                    return;
                }

                setAuthLoading(false);

                const userData = await db.users.select({
                    filter: { auth_id: authUser.id },
                });

                if (userData.error) {
                    console.error('Fetch error:', userData.error);
                    if (intent) {
                        sessionStorage.setItem('postAuthIntent', intent);
                    }
                    router.push('/me/set-up');
                    return;
                }

                if (userData) {
                    const userProfile = (userData as any)?.data?.[0] || null;

                    setUser(userProfile);
                } else {
                    if (intent) {
                        sessionStorage.setItem('postAuthIntent', intent);
                    }
                    router.push('/me/set-up');
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                if (intent) {
                    sessionStorage.setItem('postAuthIntent', intent);
                }
                router.push('/auth/login');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router, intent]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth/login');
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
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
        <SidebarProvider>
            <AppSidebar user={user} onLogout={handleLogout} />
            <SidebarInset>
                <div className="flex flex-col">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between px-4 md:px-8 py-5.5 w-full border-b border-border sticky top-0 z-50 bg-background">
                        <SidebarTrigger className="hover:bg-secondary transition-colors cursor-pointer" />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleDarkMode}
                            aria-label="Toggle theme"
                            className="hidden lg:flex cursor-pointer"
                        >
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </Button>
                    </div>
                    <main className="flex-1 overflow-auto">
                        <DashboardAnalytics />
                        {children}
                    </main>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

// Suspense boundary
export default function MeLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<Spinner className="text-chart-3" />}>
            <MeLayoutInner children={children} />
        </Suspense>
    );
}