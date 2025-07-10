export interface TimeEntry {
    id?: number;
    documentId?: string;
    date: string;
    clockInTime?: string;
    clockOutTime?: string;
    user?: {
      id: number;
    };
}