import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from "@/components/ui/chart";
import SplitText from '@/components/SplitText';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

const DEFAULT_GLOW_COLOR = '';

interface ChartCardProps {
    children: React.ReactNode;
    title: string;
    description: string;
    index: number;
    enableTilt?: boolean;
    enableMagnetism?: boolean;
    glowColor?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({
    children,
    title,
    description,
    index,
    enableTilt = true,
    enableMagnetism = true,
    glowColor = DEFAULT_GLOW_COLOR
}) => {
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = cardRef.current;
        if (!element) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const relativeX = ((x) / rect.width) * 100;
            const relativeY = ((y) / rect.height) * 100;

            element.style.setProperty('--glow-x', `${relativeX}%`);
            element.style.setProperty('--glow-y', `${relativeY}%`);
            element.style.setProperty('--glow-intensity', '1');

            if (enableTilt) {
                const rotateX = ((y - centerY) / centerY) * -5;
                const rotateY = ((x - centerX) / centerX) * 5;

                gsap.to(element, {
                    rotateX,
                    rotateY,
                    duration: 0.2,
                    ease: 'power2.out',
                    transformPerspective: 1000
                });
            }

            if (enableMagnetism) {
                const magnetX = (x - centerX) * 0.03;
                const magnetY = (y - centerY) * 0.03;

                gsap.to(element, {
                    x: magnetX,
                    y: magnetY,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }
        };

        const handleMouseLeave = () => {
            element.style.setProperty('--glow-intensity', '0');

            if (enableTilt) {
                gsap.to(element, {
                    rotateX: 0,
                    rotateY: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }

            if (enableMagnetism) {
                gsap.to(element, {
                    x: 0,
                    y: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }
        };

        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            element.removeEventListener('mousemove', handleMouseMove);
            element.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [enableTilt, enableMagnetism]);

    const handleAnimationComplete = () => {
        console.log('All letters have animated!');
    };

    const router = useRouter();

    return (
        <div
            ref={cardRef}
            className="chart-card relative overflow-hidden transition-all duration-300 max-w-screen p-4"
            style={{
                '--glow-x': '50%',
                '--glow-y': '50%',
                '--glow-intensity': '0',
                '--glow-radius': '200px',
                '--glow-color': glowColor
            } as React.CSSProperties}
        >
            {index === 0 && (
                <div className="relative z-10 flex flex-col lg:flex-row gap-4">
                    <div className="w-full lg:w-1/3 mb-10">
                        <p className='text-6xl lg:text-7xl text-primary font-bold mb-4'>
                            {title}
                        </p>
                        <p className="text-sm md:text-lg text-primary">
                            {description}
                        </p>
                        <Button
                            variant="outline"
                            size='default'
                            onClick={() => router.push('/insights/enrollment')}
                            className="mt-8 cursor-pointer"
                        >See more →</Button>
                    </div>
                    <div className="w-full lg:w-2/3">
                        {children}
                    </div>
                </div>
            )}
            {index === 1 && (
                <div className="relative z-10 flex flex-col lg:flex-row gap-4">
                    <div className="w-full lg:w-1/3">
                        <p className='text-6xl lg:text-7xl text-primary font-bold mb-4'>
                            {title}
                        </p>
                        <p className="text-sm md:text-lg text-primary">
                            {description}
                        </p>
                        <Button
                            variant="outline"
                            size='default'
                            onClick={() => router.push('/insights/universities')}
                            className="mt-8 cursor-pointer"
                        >See more →</Button>
                    </div>
                    <div className="w-full lg:w-2/3">
                        {children}
                    </div>
                </div>
            )}
            {index === 2 && (
                <div className="relative z-10 flex flex-col lg:flex-row gap-4">
                    <div className="w-full lg:w-1/3 mb-12">
                        <p className='text-6xl lg:text-7xl text-primary font-bold mb-4'>
                            {title}
                        </p>
                        <p className="text-sm md:text-lg text-primary">
                            {description}
                        </p>
                        <Button
                            variant="outline"
                            size='default'
                            onClick={() => router.push('/insights/universities')}
                            className="mt-8 cursor-pointer"
                        >See more →</Button>
                    </div>
                    <div className="w-full lg:w-2/3">
                        {children}
                    </div>
                </div>
            )}
            {index === 3 && (
                <div className="relative z-10 flex flex-col lg:flex-row gap-4">

                    <div className="w-full lg:w-1/3">
                        <p className='text-6xl lg:text-7xl font-bold text-primary mb-4'>
                            {title}
                        </p>
                        <p className="text-sm md:text-lg text-primary">
                            {description}
                        </p>
                        <Button
                            variant="outline"
                            size='default'
                            onClick={() => router.push('/insights/publications')}
                            className="mt-8 cursor-pointer"
                        >See more →</Button>
                    </div>
                    <div className="w-full lg:w-2/3">
                        {children}
                    </div>
                </div>
            )}
            {index === 4 && (
                <div className="relative z-10 flex flex-col lg:flex-row gap-4">
                    <div className="w-full lg:w-1/3 mb-12">
                        <p className='text-6xl lg:text-7xl font-bold text-primary mb-4'>
                            {title}
                        </p>
                        <p className="text-sm md:text-lg text-primary">
                            {description}
                        </p>
                    </div>
                    <div className="w-full lg:w-2/3">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

interface UniversityChartsBentoProps {
    decadeEnrolmentSeries: any[];
    enrollmentChartData: any[];
    researchChartData: any[];
    graduationComparisonData: any[];
    trendChartConfig: ChartConfig;
    enrollmentChartConfig: ChartConfig;
    researchChartConfig: ChartConfig;
    graduationChartConfig: ChartConfig;
    title?: string;
    subtitle?: string;
    enableTilt?: boolean;
    enableMagnetism?: boolean;
    glowColor?: string;
    className?: string;
}

export const UniversityChartsBento: React.FC<UniversityChartsBentoProps> = ({
    decadeEnrolmentSeries,
    enrollmentChartData,
    researchChartData,
    graduationComparisonData,
    trendChartConfig,
    enrollmentChartConfig,
    researchChartConfig,
    graduationChartConfig,
    enableTilt = false,
    enableMagnetism = false,
    glowColor = DEFAULT_GLOW_COLOR,
    className = ""
}) => {
    const gridRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <div className={`bento-section min-h-screen`}>

                <div className="chart-grid" ref={gridRef}>
                    <ChartCard
                        title="Enrollment trends"
                        description="About 600K+ students enrolled in universities, and so many more in other institutions. This chart shows the trend of enrollment over the past decade."
                        index={0}
                        enableTilt={enableTilt}
                        enableMagnetism={enableMagnetism}
                        glowColor={glowColor}
                    >
                        <div className="md:h-[480px] h-[280px]">
                            <ChartContainer config={trendChartConfig} className="w-full h-full">
                                <AreaChart
                                    accessibilityLayer
                                    data={decadeEnrolmentSeries}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid vertical={false} stroke="#334155" />
                                    <XAxis
                                        dataKey="year"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        stroke="#94a3b8"
                                    />
                                    <YAxis tickLine={false} axisLine={false} tickMargin={10} stroke="#94a3b8" />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Area
                                        dataKey="total"
                                        type="monotone"
                                        fill="var(--chart-3)"
                                        fillOpacity={0.4}
                                        stroke="var(--chart-3)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ChartContainer>
                        </div>
                    </ChartCard>

                    <Separator />

                    <ChartCard
                        title="Where people go"
                        description="The choice is yours, but the people know. Compare between where students chose to go over the past decade."
                        index={1}
                        enableTilt={enableTilt}
                        enableMagnetism={enableMagnetism}
                        glowColor={glowColor}
                    >
                        <div className="md:h-[640px] h-[480px]">
                            <ChartContainer config={enrollmentChartConfig} className="w-full h-full">
                                <BarChart
                                    accessibilityLayer
                                    data={enrollmentChartData}
                                    margin={{ top: 10, right: 0, left: 10, bottom: 100 }}
                                >
                                    <CartesianGrid vertical={false} stroke="#334155" />
                                    <XAxis
                                        dataKey="category"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        stroke="#94a3b8"
                                    />
                                    <YAxis tickLine={false} axisLine={false} tickMargin={10} stroke="#94a3b8" />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Bar dataKey="year2023" fill="var(--chart-3)" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="year2024" fill="var(--chart-2)" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ChartContainer>
                        </div>
                    </ChartCard>

                    <Separator />

                    <ChartCard
                        title="Who Graduated?"
                        description="The end that justifies the means. See how many people made it over the past decade."
                        index={2}
                        enableTilt={enableTilt}
                        enableMagnetism={enableMagnetism}
                        glowColor={glowColor}
                    >
                        <div className="md:h-[640px] h-[380px]">
                            <ChartContainer config={graduationChartConfig} className="w-full h-full">
                                <LineChart
                                    accessibilityLayer
                                    data={graduationComparisonData}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 100 }}
                                >
                                    <CartesianGrid vertical={false} stroke="#334155" />
                                    <XAxis
                                        dataKey="category"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        stroke="#94a3b8"
                                    />
                                    <YAxis tickLine={false} axisLine={false} tickMargin={10} stroke="#94a3b8" />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Line
                                        dataKey="year2023"
                                        type="monotone"
                                        stroke="var(--chart-3)"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                    <Line
                                        dataKey="year2024"
                                        type="monotone"
                                        stroke="var(--chart-2)"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </div>
                    </ChartCard>

                    <Separator />

                    <ChartCard
                        title="Publications"
                        description="We love research! See how many documents institutions have published over the past decade."
                        index={3}
                        enableTilt={enableTilt}
                        enableMagnetism={enableMagnetism}
                        glowColor={glowColor}
                    >
                        <div className="md:h-[640px] h-[480px]">
                            <ChartContainer config={researchChartConfig} className="w-full h-full">
                                <BarChart
                                    accessibilityLayer
                                    data={researchChartData}
                                    layout="vertical"
                                    margin={{ top: 10, right: 0, left: 0, bottom: 90 }}
                                >
                                    <CartesianGrid horizontal={false} stroke="#334155" />
                                    <YAxis
                                        dataKey="category"
                                        type="category"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        width={130}
                                        stroke="#94a3b8"
                                    />
                                    <XAxis type="number" tickLine={false} axisLine={false} tickMargin={10} stroke="#94a3b8" />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Bar dataKey="publications" fill="var(--chart-3)" radius={[0, 8, 8, 0]} />
                                    <Bar dataKey="innovations" fill="var(--chart-2)" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ChartContainer>
                        </div>
                    </ChartCard>
                </div>
            </div>
        </>
    );
};
