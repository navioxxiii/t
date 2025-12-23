/**
 * Enhanced Data Table with TanStack Table & TanStack Query
 * Features:
 * - Server-side pagination
 * - Column sorting (single and multi-column)
 * - Multiple filter types (search, dropdown, date range)
 * - Row selection for bulk actions
 * - CSV export
 * - Auto-refresh with TanStack Query
 * - Skeleton loading states
 * - Responsive design with mobile support
 * - Dark mode support
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  RowSelectionState,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useCallback, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  X,
  Calendar as CalendarIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn, pluralize } from "@/lib/utils";

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  fetchUrl: string;
  queryKey: string[];
  header?: string;
  pageSize?: number;
  searchPlaceholder?: string;
  exportFilename?: string;
  filters?: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
  }[];
  showExport?: boolean;
  showFilters?: boolean;
  showDateFilter?: boolean;
  showSelection?: boolean;
  dateFilterLabel?: string;
  dateFilterKey?: string;
  refetchInterval?: number | false; // Auto-refresh interval in ms (false to disable)
  onSelectionChange?: (selectedRows: TData[]) => void;
}

// Skeleton loader component
const TableSkeleton = ({ columns }: { columns: any[] }) => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <TableRow
        key={i}
        className="border-b border-bg-tertiary"
      >
        {columns.map((_, j) => (
          <TableCell key={j} className="px-6 py-4">
            <div className="h-4 bg-bg-tertiary rounded animate-pulse" />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

// Date Range Picker Component
function DateRangePicker({
  dateRange,
  setDateRange,
  label = "Date Range",
}: {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  label?: string;
}) {
  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "MMM dd, y")} -{" "}
                  {format(dateRange.to, "MMM dd, y")}
                </>
              ) : (
                format(dateRange.from, "MMM dd, y")
              )
            ) : (
              <span>{label}</span>
            )}
            {dateRange?.from && (
              <X
                className="ml-auto h-4 w-4 hover:text-action-red"
                onClick={(e) => {
                  e.stopPropagation();
                  setDateRange(undefined);
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Constants for select values
const ALL_ITEMS_VALUE = "__all__";
const EMPTY_FILTER_VALUE = "";

export function DataTable<TData>({
  columns,
  fetchUrl,
  queryKey,
  header,
  pageSize: initialPageSize = 10,
  searchPlaceholder = "Search...",
  exportFilename = "data",
  filters = [],
  showExport = true,
  showFilters = true,
  showDateFilter = true,
  showSelection = false,
  dateFilterLabel = "Date Range",
  dateFilterKey = "created_at",
  refetchInterval = false,
  onSelectionChange,
}: DataTableProps<TData>) {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [globalFilter, setGlobalFilter] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    {}
  );
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Check if enhanced features should be shown
  const hasFilters = filters.length > 0 || showDateFilter;
  const shouldShowFiltersButton = showFilters && hasFilters;
  const shouldShowExportButton = showExport;

  // Helper function to get display value for selects (never empty string)
  const getSelectDisplayValue = (filterKey: string): string => {
    const value = activeFilters[filterKey];
    return value && value !== EMPTY_FILTER_VALUE ? value : ALL_ITEMS_VALUE;
  };

  // Helper function to handle select changes
  const handleSelectChange = (filterKey: string, displayValue: string) => {
    const actualValue =
      displayValue === ALL_ITEMS_VALUE ? EMPTY_FILTER_VALUE : displayValue;
    setActiveFilters((prev) => ({ ...prev, [filterKey]: actualValue }));
  };

  // Build query string with all filters
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams({
      pageIndex: pageIndex.toString(),
      pageSize: pageSize.toString(),
      globalFilter: globalFilter,
    });

    // Add active filters (skip empty values)
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== EMPTY_FILTER_VALUE) {
        params.set(key, value);
      }
    });

    // Add sorting
    if (sorting.length > 0) {
      params.set(
        "sortBy",
        sorting.map((s: { id: string }) => s.id).join(",")
      );
      params.set(
        "sortOrder",
        sorting.map((s: { desc: boolean }) => (s.desc ? "desc" : "asc")).join(",")
      );
    }

    // Add date range filters
    if (dateRange?.from) {
      params.set("dateFrom", dateRange.from.toISOString());
    }
    if (dateRange?.to) {
      // Add end of day to include the entire "to" date
      const endOfDay = new Date(dateRange.to);
      endOfDay.setHours(23, 59, 59, 999);
      params.set("dateTo", endOfDay.toISOString());
    }

    // Add date filter key if different from default
    if (dateFilterKey !== "created_at") {
      params.set("dateField", dateFilterKey);
    }

    return params.toString();
  }, [
    pageIndex,
    pageSize,
    globalFilter,
    activeFilters,
    dateRange,
    dateFilterKey,
    sorting,
  ]);

  // Fetch data using TanStack Query
  const {
    data: queryData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [...queryKey, buildQueryString()],
    queryFn: async () => {
      const response = await fetch(`${fetchUrl}?${buildQueryString()}`);
      if (!response.ok) throw new Error("Failed to fetch data");
      return response.json() as Promise<{ data: TData[]; total: number }>;
    },
    refetchInterval: refetchInterval,
    staleTime: refetchInterval ? 0 : 5 * 60 * 1000, // 5 minutes if no auto-refresh
  });

  const data = queryData?.data || [];
  const totalRows = queryData?.total || 0;

  // Export data function
  const exportData = async () => {
    try {
      const exportUrl = `${fetchUrl}/export`;
      const response = await fetch(`${exportUrl}?${buildQueryString()}`);
      if (!response.ok) throw new Error("Failed to export data");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportFilename}_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  // Add selection column if enabled
  const tableColumns = useMemo(() => {
    if (!showSelection) return columns;

    const selectionColumn: ColumnDef<TData> = {
      id: "select",
      header: ({ table }: { table: any }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value: any) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: { row: any }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value: any) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    };

    return [selectionColumn, ...columns];
  }, [columns, showSelection]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalRows / pageSize),
    state: {
      pagination: { pageIndex, pageSize },
      globalFilter,
      sorting,
      rowSelection,
    },
    onPaginationChange: (updater: any) => {
      const newPagination =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize })
          : updater;
      setPageIndex(newPagination.pageIndex);
      setPageSize(newPagination.pageSize);
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: showSelection,
  });

  // Notify parent of selection changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    if (onSelectionChange && showSelection) {
      const selectedRows = table
        .getFilteredSelectedRowModel()
        .rows.map((row: any) => row.original);
      onSelectionChange(selectedRows);
    }
  }, [table, onSelectionChange, showSelection]);

  const paginationInfo = useMemo(() => {
    const start = pageIndex * pageSize + 1;
    const end = Math.min((pageIndex + 1) * pageSize, totalRows);
    return { start, end, total: totalRows };
  }, [pageIndex, pageSize, totalRows]);

  const clearAllFilters = () => {
    setGlobalFilter("");
    setActiveFilters({});
    setDateRange(undefined);
    setSorting([]);
  };

  const hasActiveFilters =
    globalFilter ||
    Object.values(activeFilters).some(
      (value) => value && value !== EMPTY_FILTER_VALUE
    ) ||
    dateRange?.from ||
    sorting.length > 0;

  const activeFilterCount = [
    globalFilter ? 1 : 0,
    Object.values(activeFilters).filter((v) => v && v !== EMPTY_FILTER_VALUE)
      .length,
    dateRange?.from ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="w-full space-y-6">
      {/* Header and controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {header && (
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">
              {header}
            </h2>
            {selectedCount > 0 && (
              <p className="text-sm text-text-secondary mt-1">
                {selectedCount} row{selectedCount !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        )}

        {/* Simple search - always visible when no filters */}
        {!hasFilters && (
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 h-10 border-bg-tertiary bg-bg-secondary shadow-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        )}

        {/* Enhanced controls */}
        {(shouldShowFiltersButton || shouldShowExportButton || refetchInterval) && (
          <div className="flex items-center gap-3">
            {refetchInterval && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="relative"
              >
                <RefreshCw
                  className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")}
                />
                Refresh
              </Button>
            )}

            {shouldShowFiltersButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={
                  showFiltersPanel
                    ? "bg-brand-primary/10 border-brand-primary"
                    : ""
                }
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-bg-primary bg-brand-primary rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            )}

            {shouldShowExportButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportData}
                disabled={isLoading || isFetching}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Enhanced filters panel */}
      {showFiltersPanel && hasFilters && (
        <div className="bg-bg-secondary rounded-xl border border-bg-tertiary p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">
              Filters
            </h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-action-red hover:text-action-red bg-action-red/10"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Search in filters panel */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Date Range Filter */}
            {showDateFilter && (
              <div className="lg:col-span-2">
                <DateRangePicker
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  label={dateFilterLabel}
                />
              </div>
            )}

            {/* Dynamic filters */}
            {filters.map((filter) => (
              <Select
                key={filter.key}
                value={getSelectDisplayValue(filter.key)}
                onValueChange={(value) => handleSelectChange(filter.key, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${filter.label}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_ITEMS_VALUE}>
                    All {pluralize(filter.label)}
                  </SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>

          {/* Active filters summary */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-bg-tertiary">
              <span className="text-sm text-text-secondary">
                Active filters:
              </span>
              {globalFilter && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary">
                  Search: &quot;{globalFilter}&quot;
                </span>
              )}
              {Object.entries(activeFilters).map(([key, value]) =>
                value && value !== EMPTY_FILTER_VALUE ? (
                  <span
                    key={key}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-action-green/10 text-action-green"
                  >
                    {filters.find((f) => f.key === key)?.label}:{" "}
                    {filters
                      .find((f) => f.key === key)
                      ?.options.find((o) => o.value === value)?.label || value}
                  </span>
                ) : null
              )}
              {dateRange?.from && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-primary/20 text-brand-primary">
                  Date: {format(dateRange.from, "MMM dd")}{" "}
                  {dateRange.to && `- ${format(dateRange.to, "MMM dd")}`}
                </span>
              )}
              {sorting.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary">
                  Sorted by: {sorting.map((s: any) => s.id).join(", ")}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-bg-tertiary bg-bg-secondary shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup: any) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b border-bg-tertiary bg-bg-tertiary/50 hover:bg-bg-tertiary/50"
                >
                  {headerGroup.headers.map((header: any) => (
                    <TableHead
                      key={header.id}
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-text-secondary"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            header.column.getCanSort()
                              ? "flex items-center gap-2 cursor-pointer select-none hover:text-text-primary"
                              : ""
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <span className="ml-auto">
                              {header.column.getIsSorted() === "asc" ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ArrowDown className="h-4 w-4" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4 opacity-50" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={tableColumns} />
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row: any) => (
                  <TableRow
                    key={row.id}
                    className="border-b border-bg-tertiary transition-colors hover:bg-bg-tertiary/50"
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell: any) => (
                      <TableCell
                        key={cell.id}
                        className="px-6 py-4 text-sm text-text-primary"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={tableColumns.length}
                    className="h-32 text-center text-text-secondary"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="text-lg">No results found</div>
                      {hasActiveFilters && (
                        <div className="text-sm">
                          Try adjusting your filters or search terms
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-text-primary">
          Showing <span className="font-medium">{paginationInfo.start}</span> to{" "}
          <span className="font-medium">{paginationInfo.end}</span> of{" "}
          <span className="font-medium">{paginationInfo.total}</span> results
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || isLoading}
            className="h-9 px-3 flex items-center space-x-1 border-bg-tertiary bg-bg-secondary hover:bg-bg-tertiary disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <div className="flex items-center space-x-1 text-sm font-medium text-text-primary">
            <span>Page</span>
            <span className="px-2 py-1 bg-brand-primary text-bg-primary rounded text-xs font-semibold">
              {table.getState().pagination.pageIndex + 1}
            </span>
            <span>of {table.getPageCount()}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isLoading}
            className="h-9 px-3 flex items-center space-x-1 border-bg-tertiary bg-bg-secondary hover:bg-bg-tertiary disabled:opacity-50"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
