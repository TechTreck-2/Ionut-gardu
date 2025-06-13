export interface PermissionEntry {
    id?: number;        // Strapi will generate this
    documentId?: string; // Added for Strapi integration
    date: string;       // "YYYY-MM-DD" format
    startTime: string;  // "HH:mm" format
    endTime: string;    // "HH:mm" format
    status: string;     // For frontend compatibility with approvalStatus
    user?: number;      // Reference to the user ID
}

// Interface to handle Strapi's response structure
export interface StrapiPermissionEntry {
    id: number;
    attributes: {
        date: string;
        startTime: string;
        endTime: string;
        approvalStatus: string;
        createdAt: string;
        updatedAt: string;
        publishedAt: string;
        users_permissions_user?: {
            data?: {
                id: number;
            }
        }
    }
}

// For handling multiple entries from Strapi
export interface StrapiPermissionEntryResponse {
    data: StrapiPermissionEntry[];
    meta: {
        pagination: {
            page: number;
            pageSize: number;
            pageCount: number;
            total: number;
        }
    }
}