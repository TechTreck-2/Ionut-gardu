import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { SidenavComponent } from './sidenav.component';
import { StyleManagerService } from '../../services/style-manager.service';

describe('SidenavComponent', () => {
  let component: SidenavComponent;
  let fixture: ComponentFixture<SidenavComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockStyleManagerService: jasmine.SpyObj<StyleManagerService>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const styleManagerSpy = jasmine.createSpyObj('StyleManagerService', ['setStyle', 'removeStyle']);

    await TestBed.configureTestingModule({
      imports: [SidenavComponent, BrowserAnimationsModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: StyleManagerService, useValue: styleManagerSpy },
      ],
    })
    .compileComponents();

    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockStyleManagerService = TestBed.inject(StyleManagerService) as jasmine.SpyObj<StyleManagerService>;

    fixture = TestBed.createComponent(SidenavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
