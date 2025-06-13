export interface HomeOfficeRequestEntry {
    id?: number;
    startDate: Date;
    endDate: Date;
    address: string;
    status: 'Pending' | 'Approved' | 'Rejected';
  }
