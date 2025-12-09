'use client';
import FuzzyText from '@/components/FuzzyText';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NotFound() {
    const [darkMode, setDarkMode] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const isDark = localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setDarkMode(isDark);
    }, []);

    const router = useRouter();
    return (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
            <div className="mb-8 text-center">
                <FuzzyText
                    baseIntensity={0.2}
                    hoverIntensity={0.5}
                    enableHover={true}
                    color={darkMode ? '#ffffff' : '#000000'}
                    fontSize={404}
                >
                    404
                </FuzzyText>
            </div>
            <div className="flex flex-col items-center">
                <p className="text-primary text-6xl text-center">Wait... you might be lost <br /> Don't worry, we're here to help.</p>
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="default" className="mt-8 p-6 text-lg cursor-pointer text-white" onClick={() => router.back()}>Take me back</Button>
                    <Button variant="outline" className="mt-8 p-6 text-lg cursor-pointer text-white" onClick={() => router.push('/support')}>Report a problem</Button>
                </div>
            </div>
        </div>
    );
}