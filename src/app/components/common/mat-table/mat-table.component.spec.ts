import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableComponent } from './mat-table.component'; // Adjust the import based on your setup
import { MatTableDataSource } from '@angular/material/table';
import { PermissionService } from '../../../services/permission.service'; // Adjust the import based on your setup

// Define the interface for the generic type
interface PermissionEntry {
  status: string;
  date: string;
  hoursWorked: number;
}

describe('MatTableComponent', () => {
  let component: MatTableComponent<PermissionEntry>; // Specify the type argument
  let fixture: ComponentFixture<MatTableComponent<PermissionEntry>>; // Specify the type argument

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MatTableComponent],
      providers: [
        { provide: PermissionService, useValue: {} }, // Mock the service if needed
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MatTableComponent<PermissionEntry>); // Specify the type argument here
    component = fixture.componentInstance;

    // Initialize the component with some test data
    component.entries = [
      { status: 'Approved', date: '2023-01-01', hoursWorked: 8 },
      { status: 'Pending', date: '2023-01-02', hoursWorked: 4 },
    ];
    component.displayedColumns = ['date', 'hoursWorked', 'status'];
    component.filteredData = new MatTableDataSource<PermissionEntry>(component.entries);
    fixture.detectChanges(); // Trigger initial data binding
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

  // Add more tests as needed
});