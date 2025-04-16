import { Component, OnInit } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HomeOfficeEntry } from '../../models/home-office-entry.model';
import { HomeOfficeService } from '../../services/home-office.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home-office-location',
  templateUrl: './home-office-location.component.html',
  styleUrls: ['./home-office-location.component.css'],
  standalone: true,
  imports: [GoogleMapsModule, FormsModule, CommonModule, MatButtonModule],
})
export class HomeOfficeLocationComponent implements OnInit {
  address: string = '';
  searchedAddress: string = '';
  addedLocations: HomeOfficeEntry[] = [];
  center: google.maps.LatLngLiteral = { lat: 46, lng: 24};
  zoom = 6;
  markerPosition: google.maps.LatLngLiteral | null = null;
  geocoder = new google.maps.Geocoder();

  constructor(private homeOfficeService: HomeOfficeService) {}

  ngOnInit() {
    this.loadSavedLocations();
  }

  private loadSavedLocations() {
    this.addedLocations = this.homeOfficeService.getEntries();
  }

  searchAddress() {
    if (this.address) {
      this.geocodeAddress(this.address);
    }
  }

  addLocation() {
    if (this.searchedAddress) {
      const newEntry: HomeOfficeEntry = {
        address: this.searchedAddress,
      };
      this.homeOfficeService.saveEntry(newEntry);
      this.loadSavedLocations();
      this.clearInputs();
    }
  }

  deleteLocation(index: number) {
    this.homeOfficeService.deleteEntry(index);
    this.loadSavedLocations();
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