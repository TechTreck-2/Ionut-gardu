import {Component} from '@angular/core';
import {MatSidenavModule} from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TimerComponent } from '../timer/timer.component';
import { TimeTrackingComponent } from '../timetable/timetable.component';
@Component({
  selector: 'app-sidenav',
  imports: [
    CommonModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    TimerComponent,
    TimeTrackingComponent
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
