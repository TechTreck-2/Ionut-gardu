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
import { Subject, takeUntil, finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

// Interface for form data
interface ForgotPasswordFormData {
  email: string;
}

interface ForgotPasswordError {
  message: string;
  field?: string;
}

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
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
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  // Form and state management
  forgotPasswordForm!: FormGroup;
  private destroy$ = new Subject<void>();
  private snackBar = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);

  // UI state
  isLoading = false;
  error: ForgotPasswordError | null = null;
  emailSent = false;

  // Form field references for accessibility
  emailErrorId = 'email-error';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
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
    this.forgotPasswordForm = this.fb.group({
      email: [
        '', 
        [
          Validators.required, 
          Validators.email,
          this.customEmailValidator
        ]
      ]
    });

    // Real-time validation feedback
    this.forgotPasswordForm.valueChanges
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
    return this.forgotPasswordForm.get('email')!;
  }

  // Error message getters
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

  private clearFieldError(): void {
    if (this.error?.field) {
      this.error = null;
    }
  }

  private sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  private handleForgotPasswordError(error: any): void {
    console.error('Forgot password error:', error);
    
    let errorMessage = 'Failed to send reset email. Please try again.';
    let field: string | undefined;

    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 400:
          errorMessage = 'Invalid email address. Please check and try again.';
          field = 'email';
          break;
        case 404:
          errorMessage = 'No account found with this email address.';
          field = 'email';
          break;
        case 429:
          errorMessage = 'Too many requests. Please wait before trying again.';
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

    // Show snack bar for better UX
    this.snackBar.open(errorMessage, 'Dismiss', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  onSubmit(): void {
    // Clear previous errors
    this.error = null;

    // Validate form
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    // Prevent multiple submissions
    if (this.isLoading) {
      return;
    }

    // Extract and sanitize form data
    const formData: ForgotPasswordFormData = {
      email: this.sanitizeInput(this.forgotPasswordForm.get('email')?.value || '')
    };

    // Additional validation
    if (!formData.email) {
      this.error = { message: 'Please enter your email address.' };
      return;
    }

    console.log('Forgot password request for:', formData.email);

    // Start loading state
    this.isLoading = true;
    this.forgotPasswordForm.disable();

    // Attempt forgot password
    this.authService.forgotPassword(formData.email)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.forgotPasswordForm.enable();
        })
      )
      .subscribe({
        next: () => {
          console.log('Forgot password email sent successfully');
          
          this.emailSent = true;
          this.snackBar.open('Password reset email sent! Please check your inbox.', 'Close', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          this.handleForgotPasswordError(error);
        }
      });
  }

  // Accessibility helper for screen readers
  getAriaDescribedBy(fieldName: string): string {
    const control = this.forgotPasswordForm.get(fieldName);
    if (control?.invalid && control?.touched) {
      return fieldName === 'email' ? this.emailErrorId : '';
    }
    return '';
  }
}
