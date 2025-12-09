'use client';

import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid, DataGridContainer } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    ColumnDef,
    ExpandedState,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    PaginationState,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import type { VariantProps } from 'class-variance-authority';
import { SquareMinus, SquarePlus } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Types aligned with your database schema
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
    type: string; // Changed from 'category' to 'type'
    charter_year?: number;
    domain?: string;
    is_active: boolean;
    created_at: string;
}

interface UniversityData {
    id: string;
    name: string;
    type: string; // Changed from 'category' to 'type'
    domain?: string;
    charter_year?: number;
    is_active: boolean;
    imageUrl?: string;
    status: {
        label: string;
        variant: VariantProps<typeof Badge>['variant'];
    };
    programmes: ProgrammeItem[];
}

// Helper function to get status based on university data
const getUniversityStatus = (university: UniversityItem, programmes: ProgrammeItem[]): { label: string; variant: VariantProps<typeof Badge>['variant'] } => {
    const programmeCount = programmes.length;
    if (!university.is_active) return { label: 'Inactive', variant: 'destructive' as const };
    if (programmeCount === 0) return { label: 'No Programmes', variant: 'destructive' as const };
    if (programmeCount <= 5) return { label: 'Limited', variant: 'warning' as const };
    if (programmeCount <= 15) return { label: 'Moderate', variant: 'info' as const };
    return { label: 'Comprehensive', variant: 'success' as const };
};

// Sub-table component for programmes
function ProgrammesSubTable({ programmes }: { programmes: ProgrammeItem[] }) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 5,
    });

    const columns = useMemo<ColumnDef<ProgrammeItem>[]>(
        () => [
            {
                accessorKey: 'name',
                header: ({ column }) => <DataGridColumnHeader title="Programme Name" column={column} />,
                cell: (info) => info.getValue() as string,
                enableSorting: true,
                size: 250,
            },
            {
                accessorKey: 'level',
                header: ({ column }) => <DataGridColumnHeader title="Level" column={column} />,
                cell: (info) => info.getValue() as string || 'N/A',
                enableSorting: true,
                size: 120,
            },
            {
                accessorKey: 'year_of_approval',
                header: ({ column }) => <DataGridColumnHeader title="Year Approved" column={column} />,
                cell: (info) => info.getValue() as number || 'N/A',
                enableSorting: true,
                size: 120,
            },
        ],
        [],
    );

    const table = useReactTable({
        data: programmes,
        columns,
        pageCount: Math.ceil(programmes.length / pagination.pageSize),
        state: {
            sorting,
            pagination,
        },
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getRowId: (row: ProgrammeItem) => row.id,
    });

    return (
        <div className="bg-muted/30 p-4">
            <DataGrid
                table={table}
                recordCount={programmes.length}
                tableLayout={{
                    cellBorder: true,
                    rowBorder: true,
                    headerBackground: true,
                    headerBorder: true,
                }}
            >
                <div className="w-full space-y-2.5">
                    <div className="bg-card border border-chart-3">
                        <DataGridContainer>
                            <ScrollArea>
                                <DataGridTable />
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </DataGridContainer>
                    </div>
                    <DataGridPagination className="pb-1.5" />
                </div>
            </DataGrid>
        </div>
    );
}

interface UniversityDataGridProps {
    universities: UniversityItem[];
    programmes: ProgrammeItem[];
    loading?: boolean;
}

export default function UniversityDataGrid({
    universities,
    programmes,
    loading = false
}: UniversityDataGridProps) {
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [expandedRows, setExpandedRows] = useState<ExpandedState>({});
    const [columnOrder, setColumnOrder] = useState<string[]>(['expand', 'name', 'type', 'domain', 'programmes', 'status']);
    const router = useRouter();



    // Transform data for the table - aligned with database schema
    const tableData = useMemo<UniversityData[]>(() => {
        return universities.map(uni => ({
            id: uni.id,
            name: uni.name,
            type: uni.type, // Changed from category to type
            domain: uni.domain,
            charter_year: uni.charter_year,
            is_active: uni.is_active,
            // Use the first programme's imageUrl or fallback
            imageUrl: programmes.find(p => p.university_id === uni.id)?.imageUrl?.[0],
            status: getUniversityStatus(uni, programmes.filter(p => p.university_id === uni.id)),
            programmes: programmes.filter(p => p.university_id === uni.id),
        }));
    }, [universities, programmes]);

    const handleDomainClick = (domain: string) => {
        if (domain === '' || domain === null || domain === undefined) {
            toast.warning('We don\'t have that yet');
            return;
        }
        if (domain.startsWith('http://') || domain.startsWith('https://')) {
            window.open(domain, '_blank');
        } else {
            window.open(`https://${domain}`, '_blank');
        }
    }

    const columns = useMemo<ColumnDef<UniversityData>[]>(
        () => [
            {
                id: 'expand',
                header: () => null,
                cell: ({ row }) => {
                    return row.getCanExpand() ? (
                        <Button onClick={row.getToggleExpandedHandler()} size="sm" variant="ghost">
                            {row.getIsExpanded() ? <SquareMinus /> : <SquarePlus />}
                        </Button>
                    ) : null;
                },
                size: 25,
                enableResizing: false,
                meta: {
                    expandedContent: (row) => <ProgrammesSubTable programmes={row.programmes} />,
                },
            },
            {
                accessorKey: 'name',
                id: 'name',
                header: ({ column }) => <DataGridColumnHeader title="University" visibility={true} column={column} />,
                cell: ({ row }) => {
                    const university = row.original;
                    return (
                        <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                                {university.imageUrl ? (
                                    <AvatarImage src={university.imageUrl} alt={university.name} />
                                ) : (
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {university.name.charAt(0)}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <div className="space-y-px">
                                <div className="font-medium text-foreground">{university.name}</div>
                                <div className="text-muted-foreground text-sm">{university.type}</div>
                            </div>
                        </div>
                    );
                },
                enableSorting: true,
                enableHiding: true,
                enableResizing: true,
                size: 250,
            },
            {
                accessorKey: 'type',
                id: 'type', // Changed from 'category' to 'type'
                header: ({ column }) => <DataGridColumnHeader title="Type" visibility={true} column={column} />,
                cell: (info) => info.getValue() as string,
                enableSorting: true,
                enableHiding: true,
                enableResizing: true,
                size: 150,
            },
            {
                accessorKey: 'domain',
                id: 'domain',
                header: ({ column }) => <DataGridColumnHeader title="Domain" visibility={true} column={column} />,
                // Cell as button
                cell: (info) => {
                    const domain = info.getValue() as string;
                    return <Button onClick={() => handleDomainClick(domain)} variant="ghost">{domain}</Button>;
                },
                enableSorting: true,
                enableHiding: true,
                enableResizing: true,
                size: 150,
            },
            {
                accessorKey: 'programmes',
                id: 'programmes',
                header: ({ column }) => <DataGridColumnHeader title="Programmes" visibility={true} column={column} />,
                cell: (info) => {
                    const programmes = info.getValue() as ProgrammeItem[];
                    const programmeCount = programmes.length;
                    return (
                        <div
                            className="text-sm font-medium text-foreground hover:text-primary cursor-pointer"
                            onClick={() => info.row.getToggleExpandedHandler()()}
                        >
                            {programmeCount} {programmeCount === 1 ? 'programme' : 'programmes'}
                        </div>
                    );
                },
                sortDescFirst: true,
                enableSorting: true,
                enableHiding: true,
                enableResizing: true,
                size: 120,
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
                size: 120,
            },
        ],
        [],
    );

    const table = useReactTable({
        columns,
        data: tableData,
        pageCount: Math.ceil((tableData?.length || 0) / pagination.pageSize),
        getRowId: (row: UniversityData) => row.id,
        getRowCanExpand: (row) => Boolean(row.original.programmes && row.original.programmes.length > 0),
        state: {
            pagination,
            sorting,
            expanded: expandedRows,
            columnOrder,
        },
        columnResizeMode: 'onChange',
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        onExpandedChange: setExpandedRows,
        onColumnOrderChange: setColumnOrder,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    if (loading) {
        return (
            <Skeleton className="h-[60vh]" />
        );
    }

    return (
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
    );
}