export interface HomeOfficeRequestEntry {
    id?: number;
    documentId?: string; // Added for Strapi integration
    startDate: Date;
    endDate: Date;
    address: string;
    status: 'Pending' | 'Approved' | 'Rejected';
  }
