export interface HomeOfficeRequestEntry {
    startDate: Date;
    endDate: Date;
    address: string;
    status: 'Pending' | 'Approved' | 'Rejected';
  }
  