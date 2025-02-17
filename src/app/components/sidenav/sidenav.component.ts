import {Component} from '@angular/core';
import {MatSidenavModule} from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DashboardComponent } from "../dashboard/dashboard.component";
@Component({
  selector: 'app-sidenav',
  imports: [
    CommonModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    DashboardComponent
],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css'
})
export class SidenavComponent {

  selectedComponent = 'dashboard';
  isExpanded = true;

  selectComponent(component: string) {
    this.selectedComponent = component;
  }

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
    console.log('isExpanded', this.isExpanded);
  }

}
