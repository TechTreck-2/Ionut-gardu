import { Component, OnInit } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HomeOfficeEntry } from '../../models/home-office-entry.model';
import { HomeOfficeService } from '../../services/home-office.service';
import { MatButtonModule } from '@angular/material/button';
import { HttpClientModule } from '@angular/common/http';
import { finalize } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-home-office-location',
  templateUrl: './home-office-location.component.html',
  styleUrls: ['./home-office-location.component.css'],
  standalone: true,
  imports: [
    GoogleMapsModule, 
    FormsModule, 
    CommonModule, 
    MatButtonModule, 
    HttpClientModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
})
export class HomeOfficeLocationComponent implements OnInit {
  address: string = '';
  searchedAddress: string = '';
  addedLocations: HomeOfficeEntry[] = [];
  center: google.maps.LatLngLiteral = { lat: 46, lng: 24};
  zoom = 6;
  markerPosition: google.maps.LatLngLiteral | null = null;
  geocoder = new google.maps.Geocoder();
  isLoading = false;

  constructor(
    private homeOfficeService: HomeOfficeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadSavedLocations();
  }

  private loadSavedLocations() {
    this.isLoading = true;
    this.homeOfficeService.getEntries()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (locations) => {
          this.addedLocations = locations;
        },
        error: (error) => {
          console.error('Error loading locations:', error);
          this.showError('Failed to load locations');
        }
      });
  }

  searchAddress() {
    if (this.address) {
      this.geocodeAddress(this.address);
    }
  }

  addLocation() {
    if (this.searchedAddress) {
      this.isLoading = true;
      console.log(`Adding location with address: ${this.searchedAddress}`);
      
      const newEntry: HomeOfficeEntry = {
        address: this.searchedAddress,
      };
      
      console.log('Created entry object:', newEntry);
      
      this.homeOfficeService.saveEntry(newEntry)
        .pipe(finalize(() => {
          console.log('Request completed, loading state set to false');
          this.isLoading = false;
        }))
        .subscribe({
          next: (savedLocation) => {
            console.log('Location added successfully:', savedLocation);
            this.loadSavedLocations();
            this.clearInputs();
            this.showSuccess('Location added successfully');
          },
          error: (error) => {
            console.error('Error adding location:', error);
            // Add more detailed error information
            if (error.message) {
              console.error('Error message:', error.message);
            }
            if (error.status) {
              console.error('Error status:', error.status);
            }
            this.showError(`Failed to add location: ${error.message || 'Unknown error'}`);
          }
        });
    } else {
      console.warn('Attempted to add location with empty address');
    }
  }
  
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }  deleteLocation(index: number) {
    const locationToDelete = this.addedLocations[index];
    if (locationToDelete && locationToDelete.documentId) {
      this.isLoading = true;
      this.homeOfficeService.deleteEntry(locationToDelete.documentId)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.loadSavedLocations();
            this.showSuccess('Location deleted successfully');
          },
          error: (error) => {
            console.error('Error deleting location:', error);
            this.showError('Failed to delete location');
          }
        });
    }
  }

  private geocodeAddress(address: string) {
    this.geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const location = results[0].geometry.location;
        this.updateMapPosition(location);
        this.searchedAddress = this.getFullAddress(results[0]);
      } else {
        alert('Geocode error: ' + status);
      }
    });
  }

  mapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.reverseGeocode(event.latLng);
    }
  }

  private reverseGeocode(latLng: google.maps.LatLng) {
    this.geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        this.updateMapPosition(latLng);
        this.searchedAddress = this.getFullAddress(results[0]);
        this.address = this.searchedAddress;
      } else {
        alert('Reverse geocode error: ' + status);
      }
    });
  }

  private updateMapPosition(location: google.maps.LatLng) {
    this.center = { lat: location.lat(), lng: location.lng() };
    this.markerPosition = { lat: location.lat(), lng: location.lng() };
    this.zoom = 15;
  }

  private getFullAddress(result: google.maps.GeocoderResult): string {
    return result.formatted_address;
  }

  private clearInputs() {
    this.address = '';
    this.searchedAddress = '';
  }
}