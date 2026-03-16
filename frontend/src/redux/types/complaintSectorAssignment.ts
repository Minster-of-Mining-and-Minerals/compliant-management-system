export interface SectorNode {
    sector_node_id: string;
    name: string;
}

export interface Complaint {
    complaint_id: string;
    title?: string;
    status?: string;
}

export interface User {
    user_id: string;
    full_name: string;
}

export interface ComplaintSectorAssignment {
    assignment_id: string;
    complaint_id: string;
    department_id: string;
    assigned_at: string;

    complaint?: Complaint;
    sectorNode?: SectorNode;
    assigner?: User;
}