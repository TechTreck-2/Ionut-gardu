import { Injectable } from '@angular/core';
import { VacationEntry } from '../models/vacation-entry.model';

@Injectable({
  providedIn: 'root'
})
export class VacationService {
  private storageKey = 'vacationEntries';
  vacationDaysLeft: number = 21;
  entries: VacationEntry[] = [];  

  getVacationEntries(): VacationEntry[] {
    if (this.isLocalStorageAvailable()) {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    }
    return [];
  }
  
  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  saveVacationEntry(entry: VacationEntry): void {
    const entries = this.getVacationEntries();
    entries.push(entry);
    localStorage.setItem(this.storageKey, JSON.stringify(entries));
  }

  deleteVacationEntry(entry: VacationEntry): void {
    const entries = this.getVacationEntries();
    const index = entries.findIndex(e => 
      e.startDate === entry.startDate && 
      e.endDate === entry.endDate
    );
    if (index > -1) {
      entries.splice(index, 1);
      localStorage.setItem(this.storageKey, JSON.stringify(entries));
    }
  }

  approveEntry(entries: VacationEntry[], entryToApprove: VacationEntry): VacationEntry[] {
    const index = entries.findIndex(e => e === entryToApprove);
    if (index > -1) {
      entries[index].status = 'Approved';
    }
    return entries;
  }

  updateVacationDaysLeft() {
    this.entries = this.getVacationEntries();
    const usedDays = this.entries.reduce(
      (total, entry) => total + entry.duration,
      0
    );
    this.vacationDaysLeft = 21 - usedDays;
    
  }

  getVacationDaysLeft(): number {
    return this.vacationDaysLeft;
  }

  isVacationDay(date: Date): boolean {
    const vacationEntries = this.getVacationEntries();
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    return vacationEntries.some((vacation) => {
      const vacationStart = new Date(vacation.startDate);
      const vacationEnd = new Date(vacation.endDate);
      vacationStart.setHours(0, 0, 0, 0);
      vacationEnd.setHours(0, 0, 0, 0);

      return (
        vacation.status === 'Approved' &&
        targetDate >= vacationStart &&
        targetDate <= vacationEnd
      );
    });
  }
}