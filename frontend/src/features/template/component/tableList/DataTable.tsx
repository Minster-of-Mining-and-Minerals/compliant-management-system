"use client";

import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";

// Update these import paths to match your project structure
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"; // Update path
import { Button } from "@/components/ui/button"; // Update path
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"; // Update path
import {
	DoubleArrowLeftIcon,
	DoubleArrowRightIcon,
} from "@radix-ui/react-icons";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	totalPageCount?: number;
	handlePagination: (index: number, pageSize: number) => void;
	tablePageSize: number;
	currentIndex: number;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	totalPageCount = 5,
	handlePagination,
	tablePageSize,
	currentIndex,
}: DataTableProps<TData, TValue>) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		manualPagination: true,
		pageCount: totalPageCount,
		state: {
			pagination: {
				pageIndex: currentIndex,
				pageSize: tablePageSize,
			},
		},
		onPaginationChange: (updater) => {
			if (typeof updater === "function") {
				const newState = updater({
					pageIndex: currentIndex,
					pageSize: tablePageSize,
				});
				handlePagination(newState.pageIndex, newState.pageSize);
			} else {
				handlePagination(updater.pageIndex, updater.pageSize);
			}
		},
	});

	return (
		<div className="w-full space-y-3">
			{/* System table style: white card, navy header, plain rows with light dividers */}
			<div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
			<Table className="min-w-full">
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow
							key={headerGroup.id}
							className="border-0 bg-primary hover:bg-primary"
						>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead
										key={header.id}
										className="h-11 px-4 text-xs font-semibold text-white"
									>
										{header.isPlaceholder
											? null
											: flexRender(
												header.column.columnDef.header,
												header.getContext()
											)}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() ? "selected" : undefined}
								className="border-b border-slate-100 bg-white transition-colors even:bg-slate-50/70 hover:bg-slate-100/70 data-[state=selected]:bg-primary/5"
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id} className="px-4 py-3">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow className="hover:bg-transparent">
							<TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
			</div>
			<div className="flex flex-wrap pb-1 justify-end items-center gap-2">
				<div>
					<Select
						value={`${table.getState().pagination.pageSize}`}
						onValueChange={(value) => {
							table.setPageSize(Number(value));
						}}
					>
						<SelectTrigger className="h-8 w-[70px]">
							<SelectValue placeholder={table.getState().pagination.pageSize} />
						</SelectTrigger>
						<SelectContent side="top">
							{[10, 20, 30, 40, 50, 100, 1000, 2000].map((pageSize) => (
								<SelectItem key={pageSize} value={`${pageSize}`}>
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex w-[100px] items-center justify-center text-sm font-medium">
					Page {table.getState().pagination.pageIndex + 1} of{" "}
					{table.getPageCount()}
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						className="hidden h-8 w-8 p-0 lg:flex"
						onClick={() => table.setPageIndex(0)}
						disabled={!table.getCanPreviousPage()}
					>
						<span className="sr-only">Go to first page</span>
						<DoubleArrowLeftIcon className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						<span className="sr-only">Go to previous page</span>
						<ChevronLeftIcon className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						onClick={() => {
							table.nextPage();
						}}
						disabled={!table.getCanNextPage()}
					>
						<span className="sr-only">Go to next page</span>
						<ChevronRightIcon className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className="hidden h-8 w-8 p-0 lg:flex"
						onClick={() => table.setPageIndex(table.getPageCount() - 1)}
						disabled={!table.getCanNextPage()}
					>
						<span className="sr-only">Go to last page</span>
						<DoubleArrowRightIcon className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

