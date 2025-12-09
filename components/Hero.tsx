'use client';

import { FC, useRef, useState, useEffect, MutableRefObject } from 'react';
import { supabaseProxy } from '@/lib/supabaseProxy';
import InfiniteGridMenu from '@/components/InfiniteGridMenu';

interface ProgrammeItem {
    id: string;
    name: string;
    university_id: string;
    imageUrl?: string[];
    description?: string;
}

interface MenuItem {
    image: string;
    link: string;
    title: string;
    description: string;
}

interface UniversityItem {
    id: string;
    name: string;
    logoUrl: string;
    imagesUrl?: string[];
    type: string;
    charter_year?: number;
    domain?: string;
    is_active: boolean;
    created_at: string;
}

const defaultItems: MenuItem[] = [
    {
        image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="512" height="512"%3E%3Crect fill="%23333" width="512" height="512"/%3E%3C/svg%3E',
        link: '#',
        title: 'Featured Programme',
        description: 'Explore exceptional programmes'
    }
];

interface ProgrammeHero3DProps {
    programmes: ProgrammeItem[];
    universities: UniversityItem[];
    maxItems?: number;
}

const ProgrammeHero3D: FC<ProgrammeHero3DProps> = ({ programmes, universities, maxItems = 20 }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const sketchRef = useRef<InfiniteGridMenu | null>(null);
    const [activeItem, setActiveItem] = useState<UniversityItem | null>(null);
    const [isMoving, setIsMoving] = useState<boolean>(false);
    const shuffleArray = (array: any[]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    // Randomize then limit maxItems
    const shuffledUniversities = shuffleArray(universities);
    const limitedUniversities = shuffledUniversities.slice(0, maxItems);

    const useDarkMode = () => {
        const [darkMode, setDarkMode] = useState(false);

        useEffect(() => {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            const handleChange = () => {
                if (!('theme' in localStorage)) {
                    const isDark = mediaQuery.matches;
                    setDarkMode(isDark);
                    applyTheme(isDark);
                }
            };

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }, []);

        useEffect(() => {
            const isDark = localStorage.theme === 'dark' ||
                (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
            setDarkMode(isDark);
            applyTheme(isDark);
        }, []);

        const applyTheme = (isDark: boolean) => {
            if (isDark) {
                document.documentElement.classList.add('dark');
                localStorage.theme = 'dark';
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.theme = 'light';
            }
        };

        return { darkMode };
    };

    const { darkMode } = useDarkMode();

    // Convert universities to menu items
    const convertToMenuItems = async (universities: UniversityItem[]): Promise<MenuItem[]> => {
        try {
            const uniqueIds = [...new Set(universities.map(p => p.id))];
            const { data: unis } = await supabaseProxy.select('universities', uniqueIds);

            // Check if unis data exists
            if (!unis || !Array.isArray(unis)) {
                console.warn('No university data returned from Supabase');
                return universities.map(uni => ({
                    link: `/tracker/universities/programmes/${uni.id}`,
                    title: uni.name,
                    description: 'University',
                    image: defaultItems[0].image,
                }));
            }

            const uniMap = unis.reduce((acc: any, uni: any) => {
                acc[uni.id] = uni;
                return acc;
            }, {} as Record<string, any>);

            // Build menu items with stable randomized image selection
            const items: MenuItem[] = unis.map((uni: UniversityItem, idx: number) => {
                let imageUrl = defaultItems[0].image;

                if (uni?.imagesUrl && Array.isArray(uni?.imagesUrl) && uni?.imagesUrl.length > 0) {
                    const randomIndex = idx % uni?.imagesUrl.length;
                    imageUrl = uni?.imagesUrl[randomIndex];
                }

                return {
                    link: `/tracker/universities/programmes/${uni.id}`,
                    title: uni.name,
                    description: uniMap[uni.id]?.name || 'University',
                    image: imageUrl,
                };
            });

            return items;
        } catch (error: any) {
            console.error('Error loading menu items:', error);
            return universities.map(uni => ({
                link: `/tracker/universities/programmes/${uni.id}`,
                title: uni.name,
                description: 'University',
                image: defaultItems[0].image,
            }));
        }
    };

    // Initialize the 3D scene when data is available
    useEffect(() => {
        const canvas = canvasRef.current;

        // Wait for data to be available
        if (!canvas || limitedUniversities.length === 0) return;

        // Don't reinitialize if sketch is already running
        if (sketchRef.current) return;

        let mounted = true;

        const initializeScene = async () => {
            try {
                const items = await convertToMenuItems(limitedUniversities);

                // Double-check mounted and sketch not created during async operation
                if (!mounted || sketchRef.current) return;

                const handleActiveItem = (index: number) => {
                    if (!limitedUniversities.length) return;
                    const itemIndex = index % limitedUniversities.length;
                    setActiveItem(limitedUniversities[itemIndex]);
                };

                sketchRef.current = new InfiniteGridMenu(
                    canvas,
                    items.length ? items : defaultItems,
                    handleActiveItem,
                    setIsMoving,
                    (sk) => sk.run()
                );
            } catch (error) {
                console.error('Failed to initialize scene:', error);
            }
        };

        initializeScene();

        const handleResize = () => {
            if (sketchRef.current) {
                sketchRef.current.resize();
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            mounted = false;
            window.removeEventListener('resize', handleResize);
        };
    }, [limitedUniversities]); // Re-run when programmes data changes, but guard prevents re-init

    const university = activeItem ? universities.find((uni: UniversityItem) => uni.id === activeItem.id) : null;

    return (
        <div className="relative w-full md:h-[100vh] h-[60vh] overflow-hidden">
            {/* 3D Canvas */}
            <canvas
                id="programme-hero-3d-canvas"
                ref={canvasRef}
                className="cursor-grab w-full h-full overflow-hidden relative outline-none active:cursor-grabbing"
            />

            {/* Content Overlay */}
            {activeItem && (
                <div
                    className={`
                        select-none
                        absolute
                        text-4xl md:text-6xl lg:text-7xl
                        left-2 md:left-16
                        bottom-0
                        transform
                        -translate-y-1/2
                        transition-all
                        ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
                        text-white
                        max-w-screen
                        z-10
                        ${isMoving
                            ? 'opacity-0 pointer-events-none duration-[100ms] translate-x-[-20px]'
                            : 'opacity-100 pointer-events-auto duration-[500ms] translate-x-0'
                        }
                    `}
                >
                    {/* Uni logo */}
                    <div className="flex items-center bg-gradient-to-r from-chart-3 to-transparent rounded-full">
                        <div className="w-20 h-auto bg-white border border-white/20 rounded-full">
                            <img src={university?.logoUrl || ''} alt={university?.name || ''} className="w-20 h-auto object-cover rounded-full" />
                        </div>
                        <p className="px-4 py-3 text-lg md:text-2xl text-sm text-white mb-2 inline-block">
                            {university?.name || ''}
                        </p>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {!activeItem && (
                <div className="absolute inset-0 flex items-center justify-center text-white z-20">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-xl">Loading winners globe...</p>
                    </div>
                </div>
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className={`absolute inset-0 ${darkMode ? '' : 'bg-[#104e64]/10'}`}></div>
            </div>
        </div>
    );
};

export default ProgrammeHero3D;
