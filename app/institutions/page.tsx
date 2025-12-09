'use client';

import { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid, DataGridContainer } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import SplitText from '@/components/SplitText';
import {
    ColumnDef,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    PaginationState,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import type { VariantProps } from 'class-variance-authority';
import { Building2, GraduationCap, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabaseProxy } from '@/lib/supabaseProxy';
import Silk from '@/components/Silk';

interface UniversityItem {
    id: string;
    name: string;
    type: string;
    charter_year?: number;
    domain?: string;
    is_active: boolean;
    created_at: string;
}

interface ProgrammeItem {
    id: string;
    name: string;
    university_id?: string;
    institution_id?: string;
    field_id?: string;
    level?: string;
    year_of_approval?: number;
    imageUrl?: string[];
    created_at: string;
}

interface InstitutionTableData {
    id: string;
    name: string;
    type: string;
    domain?: string;
    charter_year?: number;
    is_active: boolean;
    imageUrl?: string;
    programmeCount: number;
    status: {
        label: string;
        variant: VariantProps<typeof Badge>['variant'];
    };
}

const getInstitutionStatus = (
    isActive: boolean,
    programmeCount: number
): { label: string; variant: VariantProps<typeof Badge>['variant'] } => {
    if (!isActive) return { label: 'Inactive', variant: 'destructive' as const };
    if (programmeCount === 0) return { label: 'No Programmes', variant: 'destructive' as const };
    if (programmeCount <= 5) return { label: 'Limited', variant: 'warning' as const };
    if (programmeCount <= 15) return { label: 'Moderate', variant: 'info' as const };
    return { label: 'Comprehensive', variant: 'success' as const };
};

function InstitutionDataGrid({
    institutions,
    programmes,
    title,
    loading = false
}: {
    institutions: UniversityItem[];
    programmes: ProgrammeItem[];
    title: string;
    loading?: boolean;
}) {
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnOrder, setColumnOrder] = useState<string[]>(['name', 'type', 'domain', 'charter_year', 'programmes', 'status']);

    const tableData = useMemo<InstitutionTableData[]>(() => {
        return institutions.map(inst => {
            // Filter programmes by either university_id or institution_id
            const instProgrammes = programmes.filter(p =>
                p.university_id === inst.id || p.institution_id === inst.id
            );
            return {
                id: inst.id,
                name: inst.name,
                type: inst.type,
                domain: inst.domain,
                charter_year: inst.charter_year,
                is_active: inst.is_active,
                imageUrl: instProgrammes[0]?.imageUrl?.[0],
                programmeCount: instProgrammes.length,
                status: getInstitutionStatus(inst.is_active, instProgrammes.length),
            };
        });
    }, [institutions, programmes]);

    const handleDomainClick = (domain: string) => {
        if (!domain) {
            toast.warning("We don't have that yet");
            return;
        }
        if (domain.startsWith('http://') || domain.startsWith('https://')) {
            window.open(domain, '_blank');
        } else {
            window.open(`https://${domain}`, '_blank');
        }
    };

    const columns = useMemo<ColumnDef<InstitutionTableData>[]>(
        () => [
            {
                accessorKey: 'name',
                id: 'name',
                header: ({ column }) => <DataGridColumnHeader title="Institution" visibility={true} column={column} />,
                cell: ({ row }) => {
                    const institution = row.original;
                    return (
                        <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                                {institution.imageUrl ? (
                                    <AvatarImage src={institution.imageUrl} alt={institution.name} />
                                ) : (
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {institution.name.charAt(0)}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <div className="space-y-px">
                                <div className="font-medium text-foreground">{institution.name}</div>
                                <div className="text-muted-foreground text-sm">{institution.type}</div>
                            </div>
                        </div>
                    );
                },
                enableSorting: true,
                enableHiding: true,
                enableResizing: true,
                size: 300,
            },
            {
                accessorKey: 'domain',
                id: 'domain',
                header: ({ column }) => <DataGridColumnHeader title="Website" visibility={true} column={column} />,
                cell: (info) => {
                    const domain = info.getValue() as string;
                    return domain ? (
                        <Button onClick={() => handleDomainClick(domain)} variant="ghost" className="text-primary hover:text-primary/80">
                            {domain}
                        </Button>
                    ) : (
                        <span className="text-muted-foreground">N/A</span>
                    );
                },
                enableSorting: true,
                enableHiding: true,
                enableResizing: true,
                size: 200,
            },
            {
                accessorKey: 'charter_year',
                id: 'charter_year',
                header: ({ column }) => <DataGridColumnHeader title="Charter Year" visibility={true} column={column} />,
                cell: (info) => {
                    const year = info.getValue() as number;
                    return year || 'N/A';
                },
                enableSorting: true,
                enableHiding: true,
                enableResizing: true,
                size: 130,
            },
            {
                accessorKey: 'programmeCount',
                id: 'programmes',
                header: ({ column }) => <DataGridColumnHeader title="Programmes" visibility={true} column={column} />,
                cell: (info) => {
                    const count = info.getValue() as number;
                    return (
                        <div className="text-sm font-medium text-foreground">
                            {count} {count === 1 ? 'programme' : 'programmes'}
                        </div>
                    );
                },
                sortDescFirst: true,
                enableSorting: true,
                enableHiding: true,
                enableResizing: true,
                size: 130,
            },
            {
                accessorKey: 'status',
                id: 'status',
                header: ({ column }) => <DataGridColumnHeader title="Status" visibility={true} column={column} />,
                cell: ({ row }) => {
                    const status = row.original.status;
                    return (
                        <Badge variant={status.variant} appearance="light">
                            {status.label}
                        </Badge>
                    );
                },
                enableSorting: true,
                enableHiding: true,
                enableResizing: true,
                size: 130,
            },
        ],
        [],
    );

    const table = useReactTable({
        columns,
        data: tableData,
        pageCount: Math.ceil((tableData?.length || 0) / pagination.pageSize),
        getRowId: (row: InstitutionTableData) => row.id,
        state: {
            pagination,
            sorting,
            columnOrder,
        },
        columnResizeMode: 'onChange',
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        onColumnOrderChange: setColumnOrder,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    if (loading) {
        return <Skeleton className="h-[400px]" />;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                {title === "Universities" ? (
                    <GraduationCap className="size-6 text-primary" />
                ) : (
                    <Building2 className="size-6 text-primary" />
                )}
                <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                <Badge variant="secondary" className="ml-auto">
                    {institutions.length} institutions
                </Badge>
            </div>
            <DataGrid
                table={table}
                recordCount={tableData?.length || 0}
                tableLayout={{
                    columnsPinnable: true,
                    columnsResizable: true,
                    columnsMovable: true,
                    columnsVisibility: true,
                }}
            >
                <div className="w-full space-y-2.5">
                    <DataGridContainer>
                        <ScrollArea>
                            <DataGridTable />
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </DataGridContainer>
                    <DataGridPagination />
                </div>
            </DataGrid>
        </div>
    );
}

export default function InstitutionsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [universities, setUniversities] = useState<UniversityItem[]>([]);
    const [colleges, setColleges] = useState<UniversityItem[]>([]);
    const [programmes, setProgrammes] = useState<ProgrammeItem[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch all data in parallel
                const [universitiesRes, collegesRes, universityProgrammesRes, kmtcProgrammesRes] = await Promise.all([
                    supabaseProxy.select('universities'),
                    supabaseProxy.select('colleges'),
                    supabaseProxy.select('programmes'),
                    supabaseProxy.select('kmtc_programmes'),
                ]);

                const normalize = (res: any) => Array.isArray(res) ? res : res?.data || [];

                const allUniversities = normalize(universitiesRes);
                const allColleges = normalize(collegesRes);
                const universityProgrammes = normalize(universityProgrammesRes);
                const kmtcProgrammes = normalize(kmtcProgrammesRes);

                // Combine all programmes
                const allProgrammes = [...universityProgrammes, ...kmtcProgrammes];

                // Filter universities and colleges
                const universitiesList = allUniversities.filter((inst: UniversityItem) =>
                    inst.type && inst.type.toLowerCase().includes('university')
                );

                const collegesList = allColleges;

                setUniversities(universitiesList);
                setColleges(collegesList);
                setProgrammes(allProgrammes);
            } catch (err: any) {
                console.error(err);
                setError(err?.message || 'Failed to load institutions');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleAnimationComplete = () => {
        console.log('Animation complete');
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-destructive">Error</h2>
                    <p className="text-muted-foreground">{error}</p>
                    <Button onClick={() => router.push('/')}>Go Home</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="w-full py-12 px-4 md:px-8 border-b border-primary/20">
                {/* Silk background */}
                <div className="absolute inset-0 z-[-1]">
                    <Silk
                        speed={5}
                        scale={1}
                        color="#104e64"
                        noiseIntensity={1.5}
                        rotation={0}
                    />
                </div>
                <div className="max-w-7xl mx-auto space-y-6">
                    <SplitText
                        text="Here's what we know"
                        className="text-5xl lg:text-7xl font-bold text-primary"
                        delay={60}
                        duration={0.5}
                        ease="power3.out"
                        splitType="chars"
                        from={{ opacity: 0, y: 40 }}
                        to={{ opacity: 1, y: 0 }}
                        threshold={0.3}
                        rootMargin="-50px"
                        textAlign="center"
                        onLetterAnimationComplete={handleAnimationComplete}
                    />
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        We try as much as possible to keep this updated with the latest data. Help us by reporting any errors or missing information. <br /> <br />
                    </p>
                    <div className="mt-6 flex flex-col lg:flex-row gap-4">
                        <Button
                            variant="default"
                            size="lg"
                            className="w-full lg:w-auto cursor-pointer text-white"
                            onClick={() => router.push('/support')}
                        >
                            Report an issue
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

                    {!loading && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                            <div className="border border-primary/20 p-4 rounded-lg">
                                <div className="text-3xl font-bold text-primary">{universities.length}</div>
                                <div className="text-sm text-muted-foreground">Universities</div>
                            </div>
                            <div className="border border-primary/20 p-4 rounded-lg">
                                <div className="text-3xl font-bold text-primary">{colleges.length}</div>
                                <div className="text-sm text-muted-foreground">Colleges</div>
                            </div>
                            <div className="border border-primary/20 p-4 rounded-lg">
                                <div className="text-3xl font-bold text-primary">{universities.length + colleges.length}</div>
                                <div className="text-sm text-muted-foreground">Total Institutions</div>
                            </div>
                            <div className="border border-primary/20 p-4 rounded-lg">
                                <div className="text-3xl font-bold text-primary">{programmes.length}</div>
                                <div className="text-sm text-muted-foreground">Total Programmes</div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Data Grids Section */}
            <section className="w-full py-12 px-4 md:px-8 bg-background">
                <div className="max-w-7xl mx-auto space-y-12">
                    {/* Universities Table */}
                    <InstitutionDataGrid
                        institutions={universities}
                        programmes={programmes}
                        title="Universities"
                        loading={loading}
                    />

                    {/* Colleges Table */}
                    <InstitutionDataGrid
                        institutions={colleges}
                        programmes={programmes}
                        title="Colleges & Technical Institutions"
                        loading={loading}
                    />
                </div>
            </section>
        </div>
    );
}