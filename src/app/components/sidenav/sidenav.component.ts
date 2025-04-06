import {Component, inject} from '@angular/core';
import {MatSidenavModule} from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TimerComponent } from '../timer/timer.component';
import { TimeTrackingComponent } from '../timetable/timetable.component';
import { VacationPlanningComponent } from '../vacation-planning/vacation-planning.component';
import { PermissionLeaveComponent } from '../permission-leave/permission-leave.component';
import { StyleManagerService } from '../../services/style-manager.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
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
    TimeTrackingComponent,
    VacationPlanningComponent,
    PermissionLeaveComponent,
    MatSlideToggleModule,
    FormsModule
],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css'
})
export class SidenavComponent {
  styleManager = inject(StyleManagerService);
  selectedComponent = 'dashboard';
  isExpanded = true;
  isChecked = false;

  selectComponent(component: string) {
    this.selectedComponent = component;
  }

  toggleTheme() {
    this.isChecked = !this.isChecked;
    const theme = this.isChecked ? 'assets/cyan-orange.css' : 'assets/azure-blue.css';
    this.styleManager.setStyle(theme);
  }
  

}
