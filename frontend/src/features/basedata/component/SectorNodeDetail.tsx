"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetSectorNodeByIdQuery } from "@/redux/api/sectorNodeApi";
import { useGetSectorRepresentativesQuery } from "@/redux/api/sectorRepresentativeApi";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/features/template/component/tableList/DataTable";
import { TableLayout } from "@/features/template/component/tableList/TableLayout";
import { ColumnDef } from "@tanstack/react-table";
import { SectorNode } from "@/redux/types/sectorNode";
import { SectorRepresentative } from "@/redux/types/representative";
import Loading01 from "@/features/template/component/Loading/Loading01";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash, ArrowLeft, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssignRepresentativeModal } from "./AssignRepresentativeModal";

export default function SectorNodeDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.sectorId as string;

  const { data: sector, isLoading, isError } = useGetSectorNodeByIdQuery(id, {
    skip: !id,
  });

  const { data: representatives = [], isLoading: repsLoading } = useGetSectorRepresentativesQuery(
    { sector_id: id, include_inactive: false },
    { skip: !id }
  );

  const head = representatives.find(r => r.can_manage);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assigningHead, setAssigningHead] = useState(false);

  const openAssignModal = (isHead: boolean) => {
    setAssigningHead(isHead);
    setIsModalOpen(true);
  };

  // Pagination for children table
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Pagination for reps table
  const [repPageIndex, setRepPageIndex] = useState(0);
  const [repPageSize, setRepPageSize] = useState(10);

  if (isLoading || repsLoading) return <Loading01 />;
  if (isError || !sector) return <div className="p-8 text-center text-red-500">Error loading sector details or sector not found.</div>;

  const childrenData = sector.children || [];
  const paginatedChildren = childrenData.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize
  );

  const paginatedReps = representatives.slice(
    repPageIndex * repPageSize,
    repPageIndex * repPageSize + repPageSize
  );

  const handlePagination = (index: number, size: number) => {
    setPageIndex(index);
    setPageSize(size);
  };

  const handleRepPagination = (index: number, size: number) => {
    setRepPageIndex(index);
    setRepPageSize(size);
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

  const repColumns: ColumnDef<SectorRepresentative>[] = [
    {
      id: "full_name",
      accessorFn: (row) => row.representative?.full_name,
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium text-primary">
          {row.original.representative?.full_name || "Unknown"}
        </span>
      ),
    },
    {
      id: "email",
      accessorFn: (row) => row.representative?.email,
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.representative?.email || "—"}
        </span>
      ),
    },
    {
      accessorKey: "can_manage",
      header: "Role",
      cell: ({ row }) => {
        const canManage = row.original.can_manage;
        return (
          <Badge status={canManage ? "active" : "inactive"}>
            {canManage ? "Head" : "Representative"}
          </Badge>
        );
      },
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

        {/* Head Section */}
        <div className="bg-slate-50 border border-[#DCE7F1] rounded-lg p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-golden-dark mb-1">Sector Head</p>
            {head ? (
              <div className="flex flex-col">
                <span className="font-medium text-lg text-primary">{head.representative?.full_name || "Unknown User"}</span>
                <span className="text-sm text-gray-500">{head.representative?.email || "No email available"}</span>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No head assigned for this sector.</p>
            )}
          </div>
          {!head ? (
            <Button variant="default" className="shrink-0 bg-[#D4AF37] hover:bg-[#B3932F] text-white" onClick={() => openAssignModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Assign Head
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => openAssignModal(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Change Head
            </Button>
          )}
        </div>

        {/* Description */}
        <div className="bg-slate-50 border border-[#DCE7F1] rounded-lg p-5 mb-10">
          <p className="font-semibold text-golden-dark mb-2">Sector Description</p>
          <p className="text-gray-600 whitespace-pre-line leading-relaxed">
            {sector.description || "No description provided for this sector."}
          </p>
        </div>

        {/* Children and Representatives Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="children" className="w-full">
            <TabsList className="mb-6 flex space-x-2 bg-slate-100 p-1 rounded-lg w-fit">
              <TabsTrigger value="children" className="text-base px-6 py-2">
                Child Sectors ({childrenData.length})
              </TabsTrigger>
              <TabsTrigger value="representatives" className="text-base px-6 py-2">
                Representatives ({representatives.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="children" className="mt-0 outline-none">
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
            </TabsContent>

            <TabsContent value="representatives" className="mt-0 outline-none">
              <div className="border border-[#BFD7EA] rounded-xl overflow-hidden bg-white">
                {representatives.length > 0 ? (
                  <TableLayout
                    actions={[
                      <Button className="ml-auto" size="sm" onClick={() => openAssignModal(false)}>
                        <UserPlus className="w-4 h-4 mr-2" /> Add Representative
                      </Button>]
                    }
                    filters={[]}
                    filterColumnsPerRow={1}
                  >
                    <DataTable
                      columns={repColumns}
                      data={paginatedReps}
                      totalPageCount={Math.ceil(representatives.length / repPageSize) || 1}
                      handlePagination={handleRepPagination}
                      tablePageSize={repPageSize}
                      currentIndex={repPageIndex}
                    />
                  </TableLayout>
                ) : (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <p className="text-gray-500 mb-2">This sector currently has no representatives.</p>
                    <Button variant="outline" className="mt-4" onClick={() => openAssignModal(false)}>
                      <UserPlus className="w-4 h-4 mr-2" /> Add First Representative
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Modals */}
        <AssignRepresentativeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          sectorNodeId={id}
          isHead={assigningHead}
        />

      </div>
    </div>
  );
}
