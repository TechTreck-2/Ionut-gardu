import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { of } from 'rxjs';

import { VacationService } from './vacation.service';
import { AuthService } from './auth.service';
import { VacationEntry } from '../models/vacation-entry.model';
import { environment } from '../../environments/environment';

describe('VacationService - End-to-End Tests', () => {
  let service: VacationService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockUserId = 123;
  const apiUrl = `${environment.apiUrl}/api/vacation-entries`;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUserId']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        VacationService,
        { provide: AuthService, useValue: authSpy }
      ]
    });

    service = TestBed.inject(VacationService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Setup default auth service behavior
    authServiceSpy.getCurrentUserId.and.returnValue(of(mockUserId));
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Form Data to Backend JSON - Complete Flow', () => {
    it('should convert vacation form data to Strapi-compatible JSON and save successfully', async () => {
      // GIVEN: Mock form data from vacation entry dialog
      const formData = {
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-20'),
        reason: 'Family vacation to mountains'
      };

      // Create vacation entry from form data (as would happen in component)
      const calculatedDuration = 4; // Business days between dates
      const vacationEntry: VacationEntry = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        duration: calculatedDuration,
        reason: formData.reason,
        status: 'Pending'
      };

      // Expected Strapi request payload
      const expectedPayload = {
        data: {
          startDate: '2024-03-15',
          endDate: '2024-03-20',
          duration: 4,
          reason: 'Family vacation to mountains',
          approvalState: 'Pending',
          documentId: jasmine.any(String),
          users_permissions_user: mockUserId
        }
      };

      // Mock Strapi response
      const mockStrapiResponse = {
        data: {
          id: 456,
          documentId: 'vac_1710500000000_abc123',
          attributes: {
            startDate: '2024-03-15',
            endDate: '2024-03-20',
            duration: 4,
            reason: 'Family vacation to mountains',
            approvalState: 'Pending',
            createdAt: '2024-03-15T10:00:00.000Z',
            updatedAt: '2024-03-15T10:00:00.000Z',
            publishedAt: '2024-03-15T10:00:00.000Z',
            users_permissions_user: {
              data: {
                id: mockUserId,
                attributes: {
                  username: 'testuser',
                  email: 'test@example.com'
                }
              }
            }
          }
        },
        meta: {}
      };

      // WHEN: Saving vacation entry
      const savePromise = service.saveVacationEntry(vacationEntry);

      // THEN: Verify correct HTTP request is made
      const req = httpMock.expectOne(`${apiUrl}?populate=users_permissions_user`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(jasmine.objectContaining({
        data: jasmine.objectContaining({
          startDate: '2024-03-15',
          endDate: '2024-03-20',
          duration: 4,
          reason: 'Family vacation to mountains',
          approvalState: 'Pending',
          users_permissions_user: mockUserId
        })
      }));
      expect(req.request.body.data.documentId).toBeDefined();

      // Complete the request
      req.flush(mockStrapiResponse);

      // Service will call GET to refresh entries, so mock that too:
      const getReq = httpMock.expectOne(`${apiUrl}?filters[users_permissions_user][id][$eq]=${mockUserId}&populate=users_permissions_user`);
      getReq.flush({ data: [], meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 0 } } });

      // Verify no errors thrown
      await expectAsync(savePromise).toBeResolved();
    });

    it('should retrieve and transform Strapi vacation data to frontend format', async () => {
      // GIVEN: Mock Strapi API response
      const mockStrapiGetResponse = {
        data: [
          {
            id: 456,
            documentId: 'vac_1710500000000_abc123',
            attributes: {
              startDate: '2024-03-15',
              endDate: '2024-03-20',
              duration: 4,
              reason: 'Family vacation to mountains',
              approvalState: 'Pending',
              createdAt: '2024-03-15T10:00:00.000Z',
              updatedAt: '2024-03-15T10:00:00.000Z',
              publishedAt: '2024-03-15T10:00:00.000Z',
              users_permissions_user: {
                data: {
                  id: mockUserId,
                  attributes: {
                    username: 'testuser',
                    email: 'test@example.com'
                  }
                }
              }
            }
          }
        ],
        meta: {
          pagination: {
            page: 1,
            pageSize: 25,
            pageCount: 1,
            total: 1
          }
        }
      };

      // Expected transformed data for frontend
      const expectedVacationEntry: VacationEntry = {
        id: 456,
        documentId: 'vac_1710500000000_abc123',
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-20'),
        duration: 4,
        reason: 'Family vacation to mountains',
        status: 'Pending'
      };

      // WHEN: Getting vacation entries
      const entriesPromise = firstValueFrom(service.getVacationEntries());

      // THEN: Verify correct HTTP request
      const req = httpMock.expectOne(`${apiUrl}?filters[users_permissions_user][id][$eq]=${mockUserId}&populate=users_permissions_user`);
      expect(req.request.method).toBe('GET');

      // Complete the request
      req.flush(mockStrapiGetResponse);

      // Verify transformed data
      const entries = await entriesPromise;
      expect(entries).toHaveSize(1);
      expect(entries[0]).toEqual(expectedVacationEntry);
    });

    it('should handle vacation entry update flow correctly', async () => {
      // GIVEN: Vacation entry to update (as would come from table component)
      const vacationToUpdate: VacationEntry = {
        id: 456,
        documentId: 'vac_1710500000000_abc123',
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-20'),
        duration: 4,
        reason: 'Family vacation to mountains',
        status: 'Approved' // Status changed from Pending to Approved
      };

      // Expected Strapi update payload
      const expectedUpdatePayload = {
        data: {
          startDate: '2024-03-15',
          endDate: '2024-03-20',
          duration: 4,
          reason: 'Family vacation to mountains',
          approvalState: 'Approved'
        }
      };

      // Mock Strapi update response
      const mockUpdateResponse = {
        data: {
          id: 456,
          documentId: 'vac_1710500000000_abc123',
          attributes: {
            startDate: '2024-03-15',
            endDate: '2024-03-20',
            duration: 4,
            reason: 'Family vacation to mountains',
            approvalState: 'Approved',
            updatedAt: '2024-03-15T11:00:00.000Z'
          }
        }
      };      // WHEN: Updating vacation entry
      const updatePromise = service.updateVacationEntry(vacationToUpdate);      // THEN: Verify correct HTTP request
      const req = httpMock.expectOne(`${apiUrl}/vac_1710500000000_abc123?populate=users_permissions_user`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(expectedUpdatePayload);

      // Complete the request
      req.flush(mockUpdateResponse);

      // Service will call GET to refresh entries, so mock that too:
      const getReq = httpMock.expectOne(`${apiUrl}?filters[users_permissions_user][id][$eq]=${mockUserId}&populate=users_permissions_user`);
      getReq.flush({ data: [], meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 0 } } });

      // Verify no errors thrown
      await expectAsync(updatePromise).toBeResolved();
    });

    it('should handle vacation entry deletion correctly', async () => {
      // GIVEN: DocumentId to delete
      const documentIdToDelete = 'vac_1710500000000_abc123';

      // WHEN: Deleting vacation entry
      const deletePromise = service.deleteVacationEntry(documentIdToDelete);

      // THEN: Verify correct HTTP request - Note: looking at service.ts, the actual DELETE doesn't include query params
      const req = httpMock.expectOne(`${apiUrl}/${documentIdToDelete}`);
      expect(req.request.method).toBe('DELETE');

      // Complete the request
      req.flush({});

      // Service will call GET to refresh entries, so mock that too:
      const getReq = httpMock.expectOne(`${apiUrl}?filters[users_permissions_user][id][$eq]=${mockUserId}&populate=users_permissions_user`);
      getReq.flush({ data: [], meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 0 } } });

      // Verify no errors thrown
      await expectAsync(deletePromise).toBeResolved();
    });
  });

  describe('Error Handling', () => {
    it('should handle Strapi validation errors gracefully', async () => {
      // GIVEN: Invalid vacation entry
      const invalidEntry: VacationEntry = {
        startDate: new Date('2024-03-20'),
        endDate: new Date('2024-03-15'), // End date before start date
        duration: 0,
        reason: '',
        status: 'Pending'
      };

      // Mock Strapi validation error response
      const errorResponse = {
        error: {
          status: 400,
          name: 'ValidationError',
          message: 'End date must be after start date',
          details: {
            errors: [
              {
                path: ['endDate'],
                message: 'End date must be after start date'
              }
            ]
          }
        }
      };

      // WHEN: Attempting to save invalid entry
      const savePromise = service.saveVacationEntry(invalidEntry);

      // THEN: HTTP request should be made and error should be handled
      const req = httpMock.expectOne(`${apiUrl}?populate=users_permissions_user`);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });

      // Service will call GET to refresh entries, so mock that too:
      const getReq = httpMock.expectOne(`${apiUrl}?filters[users_permissions_user][id][$eq]=${mockUserId}&populate=users_permissions_user`);
      getReq.flush({ data: [], meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 0 } } });

      // Verify error is thrown with appropriate message
      await expectAsync(savePromise).toBeRejectedWithError('End date must be after start date');
    });
  });
  describe('Business Logic Integration', () => {
    it('should calculate and update vacation days left after operations', async () => {
      // GIVEN: Initial vacation days and existing entries
      const initialVacationDays = 21;
      
      // Mock existing entries response with "Approved" status entries
      const mockExistingEntries = {
        data: [
          {
            id: 1,
            documentId: 'vac_existing_1',
            attributes: {
              startDate: '2024-01-15',
              endDate: '2024-01-19',
              duration: 5,
              reason: 'Previous vacation',
              approvalState: 'Approved',
              users_permissions_user: {
                data: {
                  id: mockUserId,
                  attributes: {
                    username: 'testuser',
                    email: 'test@example.com'
                  }
                }
              }
            }
          }
        ],
        meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 } }
      };

      // Explicitly set the max vacation days in the service
      service['maxVacationDays'] = initialVacationDays;

      // WHEN: Getting vacation days left
      const getEntriesPromise = firstValueFrom(service.getVacationEntries());
      
      // Mock the GET request for entries
      const req = httpMock.expectOne(`${apiUrl}?filters[users_permissions_user][id][$eq]=${mockUserId}&populate=users_permissions_user`);
      req.flush(mockExistingEntries);
      
      // Wait for entries to be fetched
      await getEntriesPromise;
      
      // Explicitly call updateVacationDaysLeft
      await service.updateVacationDaysLeft();
      
      // Get the calculated value
      const daysLeft = service.getVacationDaysLeft();
      
      // THEN: Should calculate remaining vacation days correctly
      expect(daysLeft).toBe(16); // 21 - 5 = 16 remaining days
    });
  });
});
