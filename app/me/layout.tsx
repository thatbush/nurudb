'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    User,
    Settings,
    LogOut,
    ChevronDown,
    Sparkles,
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
import { Spinner } from '@/components/ui/spinner';
import DashboardAnalytics from '@/components/DashboardAnalytics';
import { Moon, Sun } from 'lucide-react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

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
        title: 'Reverb',
        href: '/me/reverb',
        icon: Sparkles,
        items: [
            { title: 'My Chats', href: '/me/reverb/chats' },
            { title: 'Settings', href: '/me/reverb/settings' },
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

function AppSidebar({ user, onLogout, isLoading }: { user: LayoutUser | null; onLogout: () => void; isLoading: boolean }) {
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
                            <DropdownMenuTrigger asChild disabled={isLoading}>
                                <SidebarMenuButton className="transition-colors h-16 cursor-pointer disabled:opacity-50">
                                    <div className="relative">
                                        <img
                                            src="/nuru-l-tp.png"
                                            alt="Nuru"
                                            className="absolute top-0 left-0 w-14 h-14 object-cover animate-spin [animation-duration:20s]"
                                        />
                                        <Avatar className="h-14 w-14 p-3">
                                            {isLoading ? (
                                                <AvatarFallback className="bg-gradient-to-br from-[#e29d1cff] to-[#d4891a]">
                                                    <Spinner className="w-5 h-5 text-white" />
                                                </AvatarFallback>
                                            ) : (
                                                <>
                                                    <AvatarImage src={user?.avatar_url || undefined} />
                                                    <AvatarFallback className="bg-gradient-to-br from-[#e29d1cff] to-[#d4891a] text-white text-xs font-bold">
                                                        {initials}
                                                    </AvatarFallback>
                                                </>
                                            )}
                                        </Avatar>
                                    </div>
                                    <div className="flex flex-col gap-0.5 leading-none">
                                        {isLoading ? (
                                            <>
                                                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                                <div className="h-3 w-16 bg-muted animate-pulse rounded mt-1" />
                                            </>
                                        ) : (
                                            <>
                                                <span className="font-semibold text-sm">{user?.full_name}</span>
                                                <span className="text-xs text-gray-500">@{user?.username}</span>
                                            </>
                                        )}
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
    const { user, isLoading, logout } = useAuth();
    const [darkMode, setDarkMode] = useState(false);

    // Initialize theme immediately
    useEffect(() => {
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

    return (
        <SidebarProvider>
            <AppSidebar user={user} onLogout={logout} isLoading={isLoading} />
            <SidebarInset>
                <div className="flex flex-col">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between px-4 md:px-8 py-5.5 w-full border-b border-border sticky top-0 z-50 bg-background">
                        {/* Left side - visible on all screens */}
                        <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
                            <SidebarTrigger className="hover:bg-secondary transition-colors cursor-pointer" />
                            <img
                                src='/merry_icon.webp'
                                alt='Merry Christmas'
                                className="w-28 h-auto lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2"
                            />

                            {/* Theme toggle - mobile version */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleDarkMode}
                                aria-label="Toggle theme"
                                className="lg:hidden cursor-pointer flex-shrink-0"
                            >
                                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </Button>
                        </div>

                        {/* Right side - desktop only */}
                        <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleDarkMode}
                                aria-label="Toggle theme"
                                className="cursor-pointer"
                            >
                                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>
                    <main className="flex-1 overflow-auto">
                        <DashboardAnalytics />
                        {isLoading ? (
                            <div className="flex items-center justify-center min-h-[400px]">
                                <Spinner className="text-chart-3" />
                            </div>
                        ) : (
                            children
                        )}
                    </main>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

// Main layout component wrapped with AuthProvider
function MeLayoutContent({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Spinner className="text-chart-3" />
            </div>
        }>
            <MeLayoutInner children={children} />
        </Suspense>
    );
}

export default function MeLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <MeLayoutContent children={children} />
        </AuthProvider>
    );
}