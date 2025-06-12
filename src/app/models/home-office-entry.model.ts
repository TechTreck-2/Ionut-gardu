export interface HomeOfficeEntry {
    id?: number;
    documentId?: string; // Document ID needed for Strapi operations
    address: string; // The address of the home office location
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
    users_permissions_user?: {
        id: number;
        username: string;
    };
}

export interface HomeOfficeResponse {
    data: {
        id: number;
        attributes: {
            address: string;
            createdAt: string;
            updatedAt: string;
            publishedAt: string;
            users_permissions_user: {
                data: {
                    id: number;
                    attributes: {
                        username: string;
                    }
                }
            }
        }
    }[];
    meta: {
        pagination: {
            page: number;
            pageSize: number;
            pageCount: number;
            total: number;
        }
    }
}