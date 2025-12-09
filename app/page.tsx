'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { ThemeProvider, useTheme } from 'next-themes';
import Image from 'next/image';
import { supabaseProxy } from '@/lib/supabaseProxy';
import { useRouter } from 'next/navigation';
import UniversityDataGrid from '@/components/DataGrid';
import ProgrammeHero3D from '@/components/Hero';
import SplitText from '@/components/SplitText';
import { Globe, GraduationCap, Building2, Users, TrendingUp, BookOpen } from 'lucide-react';
import CountUp from 'react-countup';
import { Button } from '@/components/ui/button';
import ScrollVelocity from '@/components/ScrollVelocity';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Area, AreaChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { UniversityChartsBento } from '@/components/ChartsSection';
import FlowingMenu from '@/components/FlowingMenu';
import IntroSection from '@/components/IntroSection';

const PRIMARY = '#e29d1cff';

// --- DATA STRUCTURE TYPES (unchanged from user's original code) ---
type UniversityStat = {
	id: string;
	university: string;
	category: string;
	male_students: number;
	female_students: number;
	total_students: number;
	international_students: number;
	year: number;
};
type EnrolmentCategory = {
	id: string;
	university_category: string;
	male_2023: number | null;
	female_2023: number | null;
	total_2023: number | null;
	male_2024: number | null;
	female_2024: number | null;
	total_2024: number | null;
};
type StaffingStat = {
	id: string;
	university_category: string;
	teaching_staff_2023: number | null;
	teaching_staff_2024: number | null;
	non_teaching_staff_2023: number | null;
	non_teaching_staff_2024: number | null;
	teacher_student_ratio_2023: number | null;
	teacher_student_ratio_2024: number | null;
};
type GraduationStat = {
	id: string;
	institution_category: string;
	graduates_2023: number | null;
	graduates_2024: number | null;
};
type ResearchStat = {
	id: string;
	university_category: string;
	staff_publications_2023: number | null;
	staff_publications_2024: number | null;
	student_publications_2023: number | null;
	student_publications_2024: number | null;
	staff_innovations_2023: number | null;
	staff_innovations_2024: number | null;
	student_innovations_2023: number | null;
	student_innovations_2024: number | null;
};
type DisciplineCase = {
	id: string;
	case_type: string;
	number_of_cases: number;
	percentage: number;
};
type ResourceStat = {
	id: string;
	university_category: string;
	total_resources: number;
	percentage: number;
};
type GraduationTrend = {
	id: string;
	category: string;
	graduates_count: number;
	year: number;
};
interface ProgrammeItem {
	id: string;
	name: string;
	university_id: string;
	field_id?: string;
	level?: string;
	year_of_approval?: number;
	imageUrl?: string[];
	created_at: string;
}
interface UniversityItem {
	id: string;
	name: string;
	logoUrl: string;
	type: string;
	charter_year?: number;
	domain?: string;
	is_active: boolean;
	created_at: string;
}

// --- REUSABLE STATCARD COMPONENT ---
function StatCard({ icon: Icon, count, label, darkMode }: {
	icon: React.FC<React.SVGProps<SVGSVGElement>>;
	count: number | string;
	label: string;
	darkMode: boolean;
}) {

	return (
		<div className={`border-b border-primary p-6 md:p-8 relative overflow-hidden group transition-all duration-500`}>
			<div className="relative">
				<div className={`text-4xl md:text-6xl font-bold mb-3 tracking-tight text-chart-3`}>
					<CountUp end={+count} />
				</div>
				<p className={`text-sm md:text-base font-bold uppercase tracking-wide text-primary`}>{label}</p>
			</div>
		</div>
	);
}

// --- MAIN COMPONENT ---
export default function UniversityStatsDashboard() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const [universityStats, setUniversityStats] = useState<UniversityStat[]>([]);
	const [enrolmentByCategory, setEnrolmentByCategory] = useState<EnrolmentCategory[]>([]);
	const [staffingStats, setStaffingStats] = useState<StaffingStat[]>([]);
	const [graduationStats, setGraduationStats] = useState<GraduationStat[]>([]);
	const [researchStats, setResearchStats] = useState<ResearchStat[]>([]);
	const [disciplineCases, setDisciplineCases] = useState<DisciplineCase[]>([]);
	const [resourceStats, setResourceStats] = useState<ResourceStat[]>([]);
	const [enrollmentTrends, setEnrollmentTrends] = useState<any[]>([]);
	const [growthRates, setGrowthRates] = useState<any[]>([]);
	const [graduationTrends, setGraduationTrends] = useState<any[]>([]);
	const [programmes, setProgrammes] = useState<ProgrammeItem[]>([]);
	const [universities, setUniversities] = useState<UniversityItem[]>([]);
	const [ribbonUrl, setRibbonUrl] = useState<string | Blob | undefined>();

	const useDarkMode = () => {
		const [darkMode, setDarkMode] = useState(false);
		const [mounted, setMounted] = useState(false);

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
			setMounted(true);
			const isDark = localStorage.theme === 'dark' ||
				(!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
			if (isDark) {
				setRibbonUrl('/ribbon-light-tp.png');
			} else {
				setRibbonUrl('/ribbon-light-tp.png');
			}
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

		const toggleDarkMode = () => {
			const newDarkMode = !darkMode;
			setDarkMode(newDarkMode);
			applyTheme(newDarkMode);
		};

		return { darkMode, toggleDarkMode, mounted };
	};

	const { darkMode } = useDarkMode();

	const choices = [
		{ link: '/degree', text: 'Degree', image: darkMode ? '/doctors.png' : '/doctors.png' },
		{ link: '/diploma', text: 'Diploma', image: darkMode ? '/cert.png' : '/cert.png' },
		{ link: '/certificate', text: 'Certificate', image: darkMode ? '/cert.png' : '/cert.png' },
	];

	// --- DATA FETCHER ---
	useEffect(() => {
		const fetchAll = async () => {
			try {
				setLoading(true);
				setError(null);

				const [
					uniRes,
					enrolRes,
					staffRes,
					gradRes,
					researchRes,
					discRes,
					resRes,
					enrolTrendsRes,
					growthRatesRes,
					gradTrendsRes,
					programmesRes,
					universityRes,
				] = await Promise.all([
					supabaseProxy.select('university_statistics', { order: 'university' }),
					supabaseProxy.select('enrolment_by_category'),
					supabaseProxy.select('staffing_statistics'),
					supabaseProxy.select('graduation_statistics'),
					supabaseProxy.select('research_output_statistics'),
					supabaseProxy.select('student_discipline_cases'),
					supabaseProxy.select('academic_resources'),
					supabaseProxy.select('enrollment_timeseries', { order: 'year' }),
					supabaseProxy.select('enrollment_growth_analysis'),
					supabaseProxy.select('graduation_timeseries', { order: 'year' }),
					supabaseProxy.select('programmes'),
					supabaseProxy.select('universities'),
				]);

				const normalize = (res: any) =>
					Array.isArray(res) ? res : res?.data || [];

				setUniversityStats(normalize(uniRes));
				setEnrolmentByCategory(normalize(enrolRes));
				setStaffingStats(normalize(staffRes));
				setGraduationStats(normalize(gradRes));
				setResearchStats(normalize(researchRes));
				setDisciplineCases(normalize(discRes));
				setResourceStats(normalize(resRes));
				setEnrollmentTrends(normalize(enrolTrendsRes));
				setGrowthRates(normalize(growthRatesRes));
				setGraduationTrends(normalize(gradTrendsRes));
				setProgrammes(normalize(programmesRes));
				setUniversities(normalize(universityRes));
			} catch (err: any) {
				console.error(err);
				setError(err?.message || 'Failed to load statistics');
			} finally {
				setLoading(false);
			}
		};

		fetchAll();
	}, []);

	// --- MEMOIZED DERIVED VALUES ---
	const gradCategories = useMemo(() => {
		const trends: GraduationTrend[] = Array.isArray(graduationTrends) ? graduationTrends : [];
		return Array.from(new Set(trends.map(row => row.category)));
	}, [graduationTrends]);

	const decadeGradSeries = useMemo(() => {
		const byYear: Record<number, { year: number;[category: string]: number }> = {};
		graduationTrends.forEach(row => {
			if (!byYear[row.year]) byYear[row.year] = { year: row.year };
			byYear[row.year][row.category] = row.graduates_count;
		});
		return Object.values(byYear).sort((a, b) => a.year - b.year);
	}, [graduationTrends]);

	const gradMaxValue = useMemo(() =>
		Math.max(
			...decadeGradSeries.flatMap(point => gradCategories.map(cat => point[cat] || 0))
		),
		[decadeGradSeries, gradCategories]
	);
	const decadeEnrolmentSeries = useMemo(() =>
		enrollmentTrends.map(row => ({
			year: row.year,
			total: row.total_students,
		}))
		, [enrollmentTrends]);
	const decadeGrowthRates = useMemo(() =>
		growthRates.map(row => ({
			from: row.from_year,
			to: row.to_year,
			growth: row.total_growth_pct,
		}))
		, [growthRates]);
	const latestYear = useMemo(() =>
		(universityStats.length ? Math.max(...universityStats.map(u => u.year)) : 2024),
		[universityStats]);
	const uniForYear = useMemo(
		() => universityStats.filter(u => u.year === latestYear),
		[universityStats, latestYear]
	);
	const totalUniversities = useMemo(
		() => new Set(uniForYear.map(u => u.university)).size,
		[uniForYear]
	);
	const totalStudents = useMemo(
		() => uniForYear.reduce((sum, u) => sum + (u.total_students || 0), 0),
		[uniForYear]
	);
	const totalInternational = useMemo(
		() => uniForYear.reduce((sum, u) => sum + (u.international_students || 0), 0),
		[uniForYear]
	);
	const totalTeachingStaff = useMemo(
		() =>
			staffingStats.reduce(
				(sum, s) => sum + (s.teaching_staff_2024 || 0),
				0,
			),
		[staffingStats]
	);
	const totalGraduates2024 = useMemo(
		() =>
			graduationStats.reduce(
				(sum, g) => sum + (g.graduates_2024 || 0),
				0,
			),
		[graduationStats]
	);
	const totalGraduates2023 = useMemo(
		() =>
			graduationStats.reduce(
				(sum, g) => sum + (g.graduates_2023 || 0),
				0,
			),
		[graduationStats]
	);
	const institutionTypeCounts = useMemo(() => {
		const counts: Record<string, number> = {};
		uniForYear.forEach(u => {
			counts[u.category] = (counts[u.category] || 0) + 1;
		});
		return counts;
	}, [uniForYear]);
	const totalDisciplineCases = useMemo(
		() =>
			disciplineCases.reduce(
				(sum, d) => sum + (d.number_of_cases || 0),
				0,
			),
		[disciplineCases]
	);
	const totalResources = useMemo(
		() =>
			resourceStats.reduce(
				(sum, r) => sum + (r.total_resources || 0),
				0,
			),
		[resourceStats]
	);
	const enrolmentSeries = useMemo(() => {
		if (!enrolmentByCategory.length) {
			return [{ year: 2023, total: 0 }, { year: 2024, total: 0 }];
		}
		const total2023 = enrolmentByCategory.reduce(
			(sum, e) => sum + (e.total_2023 || 0),
			0,
		);
		const total2024 = enrolmentByCategory.reduce(
			(sum, e) => sum + (e.total_2024 || 0),
			0,
		);
		return [
			{ year: 2023, total: total2023 },
			{ year: 2024, total: total2024 },
		];
	}, [enrolmentByCategory]);
	const totalEnrolMax = Math.max(
		...enrolmentSeries.map(p => p.total || 0),
		1,
	);
	const growthRate = useMemo(() => {
		const current = enrolmentSeries.find(e => e.year === 2024)?.total || 0;
		const previous = enrolmentSeries.find(e => e.year === 2023)?.total || 1;
		return (((current - previous) / previous) * 100).toFixed(1);
	}, [enrolmentSeries]);
	const avgStudentTeacherRatio = useMemo(() => {
		if (totalStudents === 0 || totalTeachingStaff === 0) return 0;
		return Math.round(totalStudents / totalTeachingStaff);
	}, [totalStudents, totalTeachingStaff]);
	const totalPublications = useMemo(() => {
		return researchStats.reduce(
			(sum, r) =>
				sum +
				(r.staff_publications_2024 || 0) +
				(r.student_publications_2024 || 0),
			0,
		);
	}, [researchStats]);

	// Chart data preparation
	const enrollmentChartData = useMemo(() =>
		enrolmentByCategory.map(cat => ({
			category: cat.university_category,
			year2023: cat.total_2023 || 0,
			year2024: cat.total_2024 || 0,
		})),
		[enrolmentByCategory]
	);

	const researchChartData = useMemo(() =>
		researchStats.map(stat => ({
			category: stat.university_category,
			publications: (stat.staff_publications_2024 || 0) + (stat.student_publications_2024 || 0),
			innovations: (stat.staff_innovations_2024 || 0) + (stat.student_innovations_2024 || 0),
		})),
		[researchStats]
	);

	const graduationComparisonData = useMemo(() =>
		graduationStats.map(stat => ({
			category: stat.institution_category,
			year2023: stat.graduates_2023 || 0,
			year2024: stat.graduates_2024 || 0,
		})),
		[graduationStats]
	);

	// Chart configs
	const enrollmentChartConfig = {
		year2023: {
			label: "2023",
			color: "hsl(var(--chart-1))",
		},
		year2024: {
			label: "2024",
			color: "hsl(var(--chart-2))",
		},
	} satisfies ChartConfig;

	const researchChartConfig = {
		publications: {
			label: "Publications",
			color: "hsl(var(--chart-3))",
		},
		innovations: {
			label: "Innovations",
			color: "hsl(var(--chart-4))",
		},
	} satisfies ChartConfig;

	const graduationChartConfig = {
		year2023: {
			label: "2023",
			color: "hsl(var(--chart-1))",
		},
		year2024: {
			label: "2024",
			color: "hsl(var(--chart-5))",
		},
	} satisfies ChartConfig;

	const trendChartConfig = {
		total: {
			label: "Total Students",
			color: "hsl(var(--chart-2))",
		},
	} satisfies ChartConfig;

	const bgClass = darkMode ? 'bg-[#050709]' : 'bg-[#f9f9f9]';
	const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
	const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
	const cardBg = darkMode ? 'bg-[#0b0f13]' : 'bg-[#f9f9f9]';
	const borderColor = darkMode ? 'border-gray-800' : 'border-gray-200';

	const handleAnimationComplete = () => {
		console.log('All letters have animated!');
	};
	const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

	return (
		<div className="min-h-screen">
			{/* Hero/3D Section */}
			<section className="w-full">
				<div className="mx-auto max-w-screen">
					<ProgrammeHero3D programmes={programmes} universities={universities} maxItems={20} />
				</div>
			</section>

			{/* Intro Section */}
			<section className="w-full">
				<div className="mx-auto max-w-screen">
					<IntroSection darkMode={darkMode} />
				</div>
			</section>

			{/* Stats Section */}
			<section className='w-full'>
				<div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 text-chart-3`}>
					<StatCard icon={Building2} count={totalUniversities} label="Institutions" darkMode={darkMode} />
					<StatCard icon={Users} count={totalStudents} label="Students" darkMode={darkMode} />
					<StatCard icon={GraduationCap} count={totalGraduates2024} label="Graduates" darkMode={darkMode} />
					<StatCard icon={Globe} count={totalInternational} label="International" darkMode={darkMode} />
				</div>

				<div className={`border-l mb-12 ${borderColor} p-8 md:p-10 relative overflow-hidden`}>
					<div className="absolute inset-0 opacity-5" style={{
						background: `linear-gradient(120deg, #104e64 0%, transparent 100%)`,
					}} />
					<div className="relative grid md:grid-cols-4 gap-24">
						<div className="flex items-start gap-4">
							<div>
								<h3 className="text-3xl md:text-4xl font-bold mb-2">+{growthRate}%</h3>
								<p className={`text-sm font-medium`}>Enrollment Growth</p>
							</div>
						</div>
						<div className="flex items-start gap-4">
							<div>
								<h3 className="text-3xl md:text-4xl font-bold mb-2">1:{avgStudentTeacherRatio}</h3>
								<p className={`text-sm font-medium`}>Student Teacher Ratio</p>
							</div>
						</div>
						<div className="flex items-start gap-4">
							<div>
								<h3 className="text-3xl md:text-4xl font-bold mb-2">{(totalPublications / 1000).toFixed(1)}K+</h3>
								<p className={`text-sm font-medium`}>Research Publications</p>
							</div>
						</div>
						<div className="flex items-start gap-4">
							<div>
								<h3 className="text-3xl md:text-4xl font-bold mb-2">{(totalGraduates2023 / 1000).toFixed(1)}K+</h3>
								<p className={`text-sm font-medium`}>Class of 2023</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Data Grid Section */}
			<section className="w-full py-12 relative">
				<div className="absolute bottom-0 left-0 z-0">
					{ribbonUrl && (
						<img
							src={ribbonUrl}
							alt='Ribbon'
							className='w-64 h-auto'
						/>
					)}
				</div>
				<div className="relative z-10">
					<div className="flex flex-col lg:flex-row gap-8">
						<div className="w-full lg:w-1/3 px-4 md:pl-8">
							<div className="text-center lg:text-left mb-8">
								<SplitText
									text="See what's possible"
									className="text-7xl lg:text-8xl font-bold text-primary"
									delay={90}
									duration={0.7}
									ease="power3.out"
									splitType="chars"
									from={{ opacity: 0, y: 40 }}
									to={{ opacity: 1, y: 0 }}
									threshold={0.4}
									rootMargin="-100px"
									textAlign="left"
									onLetterAnimationComplete={handleAnimationComplete}
								/>
							</div>
							<div className="mt-6">
								<p className="text-lg text-primary leading-relaxed">
									Explore Nuru's diverse, maintained and verified knowledge of universities and courses. Compare institutions and pick your own path, chase the dream with data.
								</p>
							</div>
							<div className="mt-6 flex flex-col lg:flex-row gap-4">
								<Button
									variant="default"
									size="lg"
									className="w-full lg:w-auto cursor-pointer text-white"
									onClick={() => router.push('/institutions')}
								>
									Look around
								</Button>
								<Button
									variant="outline"
									size="lg"
									className="w-full lg:w-auto cursor-pointer"
									onClick={() => router.push('/me')}
								>
									Contribute →
								</Button>
							</div>
						</div>
						<div className="w-full lg:w-2/3 mb-32">
							<div className="mx-auto px-4 sm:px-6 lg:px-8">
								<UniversityDataGrid
									universities={universities}
									programmes={programmes}
									loading={loading}
								/>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className='py-12 bg-primary text-secondary'>
				<ScrollVelocity
					texts={['NUMBERS THAT ', 'MATTER MOST ']}
					velocity={20}
					className="custom-scroll-text"
				/>
			</section>

			{/* Charts Section */}
			<section className='pt-28 max-w-screen'>
				<UniversityChartsBento
					decadeEnrolmentSeries={decadeEnrolmentSeries}
					enrollmentChartData={enrollmentChartData}
					researchChartData={researchChartData}
					graduationComparisonData={graduationComparisonData}
					trendChartConfig={trendChartConfig}
					enrollmentChartConfig={enrollmentChartConfig}
					researchChartConfig={researchChartConfig}
					graduationChartConfig={graduationChartConfig}
				/>
			</section>

			<section className='px-6'>
				<div className="w-full py-12 relative">
					<div className="text-center mb-8">
						<SplitText
							text="What do you want to do?"
							className="text-3xl lg:text-6xl font-bold text-primary"
							delay={40}
							duration={0.3}
							ease="power3.out"
							splitType="chars"
							from={{ opacity: 0, y: 40 }}
							to={{ opacity: 1, y: 0 }}
							threshold={0.3}
							rootMargin="-100px"
							textAlign="left"
							onLetterAnimationComplete={handleAnimationComplete}
						/>
					</div>
					<div style={{ height: '600px', position: 'relative' }}>
						<FlowingMenu items={choices} />
					</div>
				</div>
			</section>
		</div>
	);
}