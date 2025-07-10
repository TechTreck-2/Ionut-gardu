import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableComponent } from './mat-table.component';
import { MatTableDataSource } from '@angular/material/table';
import { PermissionService } from '../../../services/permission.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Define the interface for the generic type
interface PermissionEntry {
  status: string;
  date: string;
  startTime: string;
  endTime: string;
}

describe('MatTableComponent', () => {
  let component: MatTableComponent<PermissionEntry>;
  let fixture: ComponentFixture<MatTableComponent<PermissionEntry>>;
  let mockPermissionService: jasmine.SpyObj<PermissionService>;

  beforeEach(async () => {
    const permissionSpy = jasmine.createSpyObj('PermissionService', ['calculateDuration']);

    await TestBed.configureTestingModule({
      imports: [MatTableComponent, BrowserAnimationsModule],
      providers: [
        { provide: PermissionService, useValue: permissionSpy },
      ],
    }).compileComponents();    mockPermissionService = TestBed.inject(PermissionService) as jasmine.SpyObj<PermissionService>;

    fixture = TestBed.createComponent(MatTableComponent<PermissionEntry>);
    component = fixture.componentInstance;    // Initialize the component with some test data
    component.entries = [
      { status: 'Approved', date: '2023-01-01', startTime: '09:00', endTime: '17:00' },
      { status: 'Pending', date: '2023-01-02', startTime: '10:00', endTime: '14:00' },
    ];
    component.displayedColumns = ['date', 'startTime', 'endTime', 'status'];
    component.filteredData = new MatTableDataSource<PermissionEntry>(component.entries);
    
    mockPermissionService.calculateDuration.and.returnValue('8 hours');
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the correct number of entries', () => {
    expect(component.filteredData.data.length).toBe(2);
  });
  it('should display the correct status for the first entry', () => {
    expect(component.filteredData.data[0].status).toBe('Approved');
  });

  it('should display the correct start time for the first entry', () => {
    expect(component.filteredData.data[0].startTime).toBe('09:00');
  });

  it('should display the correct end time for the first entry', () => {
    expect(component.filteredData.data[0].endTime).toBe('17:00');
  });

  // Add more tests as needed
});