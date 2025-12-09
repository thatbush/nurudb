'use client';
import { Sun, Moon, ArrowUpRightFromSquare, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";

const INSTITUTION_LINKS = [
    { href: "/cue/institutions", title: "Universities", description: "Explore public and private universities" },
    { href: "/tveta/institutions", title: "Technical Colleges", description: "Browse technical and vocational institutions" },
    { href: "/kmtc/institutions", title: "KMTC", description: "Kenya Medical Training Colleges" },
];

const COMPARE_LINKS = [
    { href: "/vs/uni-uni", title: "UNI VS UNI", description: "Compare universities side by side" },
    { href: "/vs/public-private", title: "PUBLIC VS PRIVATE", description: "Understand the differences" },
    { href: "/programmes", title: "PROGRAMMES", description: "Browse all available programs" },
];

const PROGRAMME_LINKS = [
    { href: "/cue/courses", title: "Degree Programmes", description: "Undergraduate and postgraduate degrees" },
    { href: "/tveta/courses", title: "Technical Programmes", description: "Technical and vocational courses" },
    { href: "/kmtc/courses", title: "KMTC Programmes", description: "Medical training programs" },
];

const EXTERNAL_LINKS = [
    { href: "https://cue.or.ke/", label: "CUE" },
    { href: "https://kmtc.ac.ke/", label: "KMTC" },
    { href: "https://tveta.go.ke/", label: "TVET" },
];

function ListItem({ title, children, href }: { title: string; children: string; href: string }) {
    return (
        <li>
            <NavigationMenuLink asChild>
                <Link href={href} className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                    <div className="text-sm font-medium leading-none">{title}</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
                </Link>
            </NavigationMenuLink>
        </li>
    );
}

export default function Header() {
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

    const router = useRouter();

    if (!mounted) return null;

    return (
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between px-4 md:px-8 py-4 w-full border-b border-border sticky top-0 z-50 bg-background">
            {/* Brand Section */}
            <div className="flex items-start gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-64">
                    {/* Logo */}
                    <Link href="/" className="flex items-center pl-2">
                        <img
                            src={darkMode ? '/nuru-l-tp.png' : '/nuru-l-tp.png'}
                            className='w-12 h-12 animate-spin [animation-duration:20s]'
                            alt="Nuru Logo"
                        />
                    </Link>

                    {/* Mobile Menu */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden"
                                aria-label="Toggle mobile menu"
                            >
                                <Menu className="w-24 h-24" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="top" className="h-screen">
                            <MobileMenuContent darkMode={darkMode} onThemeToggle={toggleDarkMode} />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Desktop Navigation 
            <nav className="hidden lg:block">
                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger>Institutions</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                    {INSTITUTION_LINKS.map((link) => (
                                        <ListItem key={link.href} href={link.href} title={link.title}>
                                            {link.description}
                                        </ListItem>
                                    ))}
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuTrigger>Compare</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                    {COMPARE_LINKS.map((link) => (
                                        <ListItem key={link.href} href={link.href} title={link.title}>
                                            {link.description}
                                        </ListItem>
                                    ))}
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuTrigger>Programmes</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                    {PROGRAMME_LINKS.map((link) => (
                                        <ListItem key={link.href} href={link.href} title={link.title}>
                                            {link.description}
                                        </ListItem>
                                    ))}
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                <Link href="/about">About</Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </nav>*/}


            {/* Theme Toggle */}
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => router.push('/wg/upload')}
                    className="hidden lg:flex cursor-pointer"
                >
                    Join Winners Globe
                </Button>
                <Button
                    variant="default"
                    size="lg"
                    onClick={() => router.push('/me')}
                    className="hidden lg:flex cursor-pointer text-white"
                >
                    Contribute →
                </Button>
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
        </header>
    );
}

function MobileMenuContent({ darkMode, onThemeToggle }: { darkMode: boolean; onThemeToggle: () => void }) {
    return (
        <div className="h-full flex flex-col p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <h2 className="text-lg font-semibold">Nuru</h2>
            </div>

            <nav className="flex-1 space-y-4 overflow-y-auto">
                {/*<div>
                    <h3 className="text-sm font-semibold px-2 mb-2">Institutions</h3>
                    <ul className="space-y-1">
                        {INSTITUTION_LINKS.map((link) => (
                            <SheetClose asChild key={link.href}>
                                <Link href={link.href} className="block px-3 py-2 rounded hover:bg-accent text-sm">
                                    {link.title}
                                </Link>
                            </SheetClose>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="text-sm font-semibold px-2 mb-2">Compare</h3>
                    <ul className="space-y-1">
                        {COMPARE_LINKS.map((link) => (
                            <SheetClose asChild key={link.href}>
                                <Link href={link.href} className="block px-3 py-2 rounded hover:bg-accent text-sm">
                                    {link.title}
                                </Link>
                            </SheetClose>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="text-sm font-semibold px-2 mb-2">Programmes</h3>
                    <ul className="space-y-1">
                        {PROGRAMME_LINKS.map((link) => (
                            <SheetClose asChild key={link.href}>
                                <Link href={link.href} className="block px-3 py-2 rounded hover:bg-accent text-sm">
                                    {link.title}
                                </Link>
                            </SheetClose>
                        ))}
                    </ul>
                </div>*/}

                <SheetClose asChild>
                    <Link href="/wg/upload" className="block px-3 py-2 rounded hover:bg-accent text-sm font-semibold">
                        Join Winners Globe
                    </Link>
                </SheetClose>

                <SheetClose asChild>
                    <Link href="/me" className="block px-3 py-2 rounded hover:bg-accent text-sm font-semibold">
                        Contribute
                    </Link>
                </SheetClose>

                <SheetClose asChild>
                    <Link href="/about" className="block px-3 py-2 rounded hover:bg-accent text-sm font-semibold">
                        About
                    </Link>
                </SheetClose>
            </nav>

            <div className="border-t border-border pt-4">
                <Button
                    variant="ghost"
                    onClick={onThemeToggle}
                    className="w-full justify-between px-3"
                >
                    <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>
            </div>
        </div>
    );
}

function ExternalLinkBadge({ href, label }: { href: string; label: string }) {
    return (
        <Badge variant="secondary" className="hover:bg-accent transition-colors cursor-pointer">
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-semibold tracking-widest uppercase group"
            >
                {label}
                <ArrowUpRightFromSquare className="w-3 h-3 ml-1.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
        </Badge>
    );
}