import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { 
  FormBuilder, 
  FormGroup, 
  Validators, 
  ReactiveFormsModule,
  AbstractControl 
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject, takeUntil, finalize, take } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

// Interfaces for better type safety
interface LoginFormData {
  email: string;
  password: string;
}

interface LoginError {
  message: string;
  field?: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterLink
  ]
})
export class LoginComponent implements OnInit, OnDestroy {
  // Form and state management
  loginForm!: FormGroup;
  private destroy$ = new Subject<void>();
  private snackBar = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);

  // UI state
  isLoading = false;
  hidePassword = true;
  error: LoginError | null = null;
  loginAttempts = 0;
  maxLoginAttempts = 3;

  // Form field references for accessibility
  emailErrorId = 'email-error';
  passwordErrorId = 'password-error';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeForm();
  }  ngOnInit(): void {
    // Clear any existing authentication state and redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      // Check if user data is available
      this.authService.currentUser$.pipe(take(1)).subscribe(user => {
        if (user) {
          this.router.navigate(['/']);
        } else {
          // If token exists but no user data, fetch it
          this.authService.getCurrentUser().subscribe({
            next: (fetchedUser) => {
              if (fetchedUser) {
                this.router.navigate(['/']);
              }
            },
            error: () => {
              // If fetching user fails, clear auth state
              this.authService.logout();
            }
          });
        }
      });
      return;
    }

    // Focus email field on component load (only in browser)
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const emailInput = document.querySelector('input[formControlName="email"]') as HTMLInputElement;
        if (emailInput) {
          emailInput.focus();
        }
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      email: [
        '', 
        [
          Validators.required, 
          Validators.email,
          this.customEmailValidator
        ]
      ],
      password: [
        '', 
        [
          Validators.required, 
          Validators.minLength(6),
          Validators.maxLength(128)
        ]
      ]
    });

    // Real-time validation feedback
    this.loginForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.error?.field) {
          this.clearFieldError();
        }
      });
  }

  // Custom email validator for additional security
  private customEmailValidator(control: AbstractControl): { [key: string]: any } | null {
    const email = control.value;
    if (!email) return null;

    // Additional email security checks
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const hasValidFormat = emailRegex.test(email);
    const hasNoScripts = !email.includes('<script>') && !email.includes('javascript:');
    
    return hasValidFormat && hasNoScripts ? null : { invalidEmail: true };
  }

  // Getters for form controls
  get emailControl(): AbstractControl {
    return this.loginForm.get('email')!;
  }

  get passwordControl(): AbstractControl {
    return this.loginForm.get('password')!;
  }

  // UI helper methods
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  getEmailErrorMessage(): string {
    const control = this.emailControl;
    if (control.hasError('required')) {
      return 'Email address is required';
    }
    if (control.hasError('email') || control.hasError('invalidEmail')) {
      return 'Please enter a valid email address';
    }
    return '';
  }

  getPasswordErrorMessage(): string {
    const control = this.passwordControl;
    if (control.hasError('required')) {
      return 'Password is required';
    }
    if (control.hasError('minlength')) {
      return 'Password must be at least 6 characters long';
    }
    if (control.hasError('maxlength')) {
      return 'Password cannot exceed 128 characters';
    }
    return '';
  }

  private clearFieldError(): void {
    if (this.error?.field) {
      this.error = null;
    }
  }

  private sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  private handleLoginError(error: any): void {
    console.error('Login error:', error);
    
    let errorMessage = 'Login failed. Please try again.';
    let field: string | undefined;

    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 401:
          errorMessage = 'Invalid email or password. Please check your credentials.';
          break;
        case 403:
          errorMessage = 'Account access is restricted. Please contact support.';
          break;
        case 429:
          errorMessage = 'Too many login attempts. Please try again later.';
          break;
        case 0:
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
      }
    }

    this.error = { message: errorMessage, field };
    this.loginAttempts++;

    // Show snack bar for better UX
    this.snackBar.open(errorMessage, 'Dismiss', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });

    // Lock form temporarily after max attempts
    if (this.loginAttempts >= this.maxLoginAttempts) {
      this.loginForm.disable();
      this.snackBar.open(
        'Too many failed attempts. Form will be unlocked in 30 seconds.',
        'OK',
        { duration: 30000 }
      );

      setTimeout(() => {
        this.loginForm.enable();
        this.loginAttempts = 0;
      }, 30000);
    }
  }

  onSubmit(): void {
    // Clear previous errors
    this.error = null;

    // Validate form
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // Prevent multiple submissions
    if (this.isLoading) {
      return;
    }

    // Extract and sanitize form data
    const formData: LoginFormData = {
      email: this.sanitizeInput(this.loginForm.get('email')?.value || ''),
      password: this.loginForm.get('password')?.value || ''
    };

    // Additional validation
    if (!formData.email || !formData.password) {
      this.error = { message: 'Please fill in all required fields.' };
      return;
    }    // Start loading state
    this.isLoading = true;
    this.loginForm.disable();

    // Attempt login
    this.authService.login(formData.email, formData.password)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.loginForm.enable();
        })
      )
      .subscribe({        next: () => {
          this.snackBar.open('Login successful!', 'Close', {
            duration: 2000,
            panelClass: ['success-snackbar']
          });
          
          // Reset login attempts on success
          this.loginAttempts = 0;
          
          // Use setTimeout to ensure authentication state is properly set before navigation
          setTimeout(() => {
            this.router.navigate(['/']).then(success => {
              if (!success) {
                console.error('Navigation failed, trying alternative route');
                // Fallback navigation
                window.location.href = '/';
              }
            });
          }, 100);
        },
        error: (error) => {
          this.handleLoginError(error);
        }
      });
  }

  // Accessibility helper for screen readers
  getAriaDescribedBy(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (control?.invalid && control?.touched) {
      return fieldName === 'email' ? this.emailErrorId : this.passwordErrorId;
    }
    return '';
  }
}