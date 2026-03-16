export interface User {
    user_id: string;
    full_name?: string;
    email?: string;
    phone_number?: string;
}

export interface SectorNode {
    sector_node_id: string;
    name: string;
    description?: string;
    parent_id?: string | null;
}

/** =========================
 * MAIN REPRESENTATIVE MODEL
 * ========================= */
export interface SectorRepresentative {
    representative_id: string;

    sector_node_id: string;
    user_id: string;
    appointed_by: string;

    can_manage: boolean;

    valid_from: string;
    valid_until?: string | null;

    notes?: string | null;

    is_active: boolean;

    created_at: string;
    updated_at: string;

    // Relations
    representative?: User;
    appointer?: User;
    sector?: SectorNode;
}

/** =========================
 * REQUEST PAYLOADS
 * ========================= */
export interface AssignRepresentativePayload {
    sector_node_id: string;
    user_id: string;
    can_manage?: boolean;
    valid_from?: string;
    valid_until?: string | null;
    notes?: string;
}

export interface UpdateRepresentativePayload {
    can_manage?: boolean;
    valid_from?: string;
    valid_until?: string | null;
    is_active?: boolean;
    notes?: string;
}

/** =========================
 * AUTHORITY RESPONSE
 * ========================= */
export interface AuthorityDetails {
    isHead: boolean;
    isRepresentative: boolean;
    canManage: boolean;
    validFrom?: string;
    validUntil?: string | null;
}

export interface CheckAuthorityResponse {
    hasAuthority: boolean;
    authorityType: "head" | "representative" | null;
    details: AuthorityDetails;
}

/** =========================
 * GENERIC API WRAPPER
 * ========================= */
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

/** =========================
 * LIST RESPONSE
 * ========================= */
export interface RepresentativeListResponse {
    success: boolean;
    message: string;
    data: SectorRepresentative[];
}

/** =========================
 * OPTIONAL PARAMS HELPER
 * ========================= */
export type OptionalParams<T> = {
    [K in keyof T]?: T[K];
};