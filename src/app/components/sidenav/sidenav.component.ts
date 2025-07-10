import { Component, inject } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TimerComponent } from '../timer/timer.component';
import { TimeTrackingComponent } from '../timetable/timetable.component';
import { VacationPlanningComponent } from '../vacation-planning/vacation-planning.component';
import { PermissionLeaveComponent } from '../permission-leave/permission-leave.component';
import { StyleManagerService } from '../../services/style-manager.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { HomeOfficeLocationComponent } from '../home-office-location/home-office-location.component';
import { HomeOfficeRequestComponent } from '../home-office-request/home-office-request.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    TimerComponent,
    TimeTrackingComponent,
    VacationPlanningComponent,
    PermissionLeaveComponent,
    MatSlideToggleModule,
    FormsModule,
    HomeOfficeLocationComponent,
    HomeOfficeRequestComponent
  ],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent {
  styleManager = inject(StyleManagerService);
  authService = inject(AuthService);
  router = inject(Router);
  selectedComponent = 'dashboard';
  isExpanded = false;
  isChecked = false;
  


  constructor(private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) {
    // Set the default font set class to Material Symbols
    this.matIconRegistry.setDefaultFontSetClass('material-symbols-outlined');
    
  }

  selectComponent(component: string) {
    this.selectedComponent = component;
  }

  toggleTheme() {
    this.isChecked = !this.isChecked;
    const theme = this.isChecked ? 'assets/cyan-orange.css' : 'assets/azure-blue.css';
    this.styleManager.setStyle(theme);
  }

  toggleSidenav() {
    this.isExpanded = !this.isExpanded;
  }

  onSidenavOpened() {
    this.isExpanded = true;
    const sidenav = document.querySelector('.your-sidenav-class') as HTMLElement;
    if (sidenav) {
      sidenav.style.width = '250px'; // Set to your desired width
    }
  }
  

  onSidenavClosed() {
    this.isExpanded = true;
    const sidenav = document.querySelector('.your-sidenav-class') as HTMLElement;
    if (sidenav) {
      sidenav.style.width = '60px'; // Set to your desired width
    }
  }
  
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}