"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetSectorNodeByIdQuery } from "@/redux/api/sectorNodeApi";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/features/template/component/tableList/DataTable";
import { TableLayout } from "@/features/template/component/tableList/TableLayout";
import { ColumnDef } from "@tanstack/react-table";
import { SectorNode } from "@/redux/types/sectorNode";
import Loading01 from "@/features/template/component/Loading/Loading01";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash, ArrowLeft } from "lucide-react";

export default function SectorNodeDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.sectorId as string;

  const { data: sector, isLoading, isError } = useGetSectorNodeByIdQuery(id, {
    skip: !id,
  });

  // Pagination for children table
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  if (isLoading) return <Loading01 />;
  if (isError || !sector) return <div className="p-8 text-center text-red-500">Error loading sector details or sector not found.</div>;

  const childrenData = sector.children || [];
  const paginatedChildren = childrenData.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize
  );

  const handlePagination = (index: number, size: number) => {
    setPageIndex(index);
    setPageSize(size);
  };

  const columns: ColumnDef<SectorNode>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium text-primary">
          {row.getValue("name")}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate text-muted-foreground">
          {row.getValue("description") || "—"}
        </div>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean;
        return (
          <Badge status={isActive ? "active" : "inactive"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            onClick={() => router.push(`/basedata/sectors/${row.original.sector_node_id}`)}
            variant="ghost"
            size="icon"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden font-sans py-6 pb-24 flex flex-col items-start min-h-screen p-4 md:p-8 hover:bg-transparent">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full mx-auto shadow-sm rounded-xl border border-[#BFD7EA] p-6 lg:p-8 relative overflow-hidden bg-white/80 backdrop-blur-sm z-10">

        {/* Header Navigation */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[#DCE7F1]">
          <Button variant="outline" size="icon" onClick={() => router.push("/basedata/sectors")} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-golden-dark">Sector Detail: {sector.name}</h2>
            <p className="text-gray-500 text-sm">Review sector properties and manage child compartments</p>
          </div>
        </div>

        {/* Sector Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-50 border border-[#DCE7F1] rounded-lg p-4">
            <p className="font-semibold text-golden-dark text-sm mb-1">Status</p>
            <Badge status={sector.is_active ? "active" : "inactive"}>
              {sector.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="bg-slate-50 border border-[#DCE7F1] rounded-lg p-4">
            <p className="font-semibold text-golden-dark text-sm mb-1">Hierarchy Level</p>
            <p className="text-gray-700 font-medium">Level {sector.level}</p>
          </div>

          <div className="bg-slate-50 border border-[#DCE7F1] rounded-lg p-4">
            <p className="font-semibold text-golden-dark text-sm mb-1">Created At</p>
            <p className="text-gray-700 font-medium">
              {new Date(sector.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-slate-50 border border-[#DCE7F1] rounded-lg p-4">
            <p className="font-semibold text-golden-dark text-sm mb-1">Parent Node</p>
            {sector.parent_id ? (
              <Button
                variant="link"
                className="p-0 h-auto font-medium text-blue-600 truncate max-w-full block"
                onClick={() => router.push(`/basedata/sectors/${sector.parent_id}`)}
              >
                View Parent Sector
              </Button>
            ) : (
              <p className="text-gray-500 font-medium">Root Node (No Parent)</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-slate-50 border border-[#DCE7F1] rounded-lg p-5 mb-10">
          <p className="font-semibold text-golden-dark mb-2">Sector Description</p>
          <p className="text-gray-600 whitespace-pre-line leading-relaxed">
            {sector.description || "No description provided for this sector."}
          </p>
        </div>

        {/* Children Table */}
        <div className="mt-8">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-[#1E516A]">Child Sectors ({childrenData.length})</h3>
            <p className="text-gray-500 text-sm">Sectors and departments directly under {sector.name}</p>
          </div>

          <div className="border border-[#BFD7EA] rounded-xl overflow-hidden bg-white">
            {childrenData.length > 0 ? (
              <TableLayout
                actions={[]}
                filters={[]}
                filterColumnsPerRow={1}
              >
                <DataTable
                  columns={columns}
                  data={paginatedChildren}
                  totalPageCount={Math.ceil(childrenData.length / pageSize)}
                  handlePagination={handlePagination}
                  tablePageSize={pageSize}
                  currentIndex={pageIndex}
                />
              </TableLayout>
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <p className="text-gray-500 mb-2">This sector currently has no child departments.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
