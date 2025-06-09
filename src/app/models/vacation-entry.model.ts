export interface VacationEntry {
    startDate: Date;
    endDate: Date;
    duration: number;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  }