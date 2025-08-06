import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { 
  FormBuilder, 
  FormGroup, 
  Validators, 
  ReactiveFormsModule,
  AbstractControl 
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
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
interface ResetPasswordFormData {
  password: string;
  passwordConfirmation: string;
}

interface ResetPasswordError {
  message: string;
  field?: string;
}

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
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
export class ResetPasswordComponent implements OnInit, OnDestroy {
  // Form and state management
  resetPasswordForm!: FormGroup;
  private destroy$ = new Subject<void>();
  private snackBar = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);

  // UI state
  isLoading = false;
  hidePassword = true;
  hidePasswordConfirmation = true;
  error: ResetPasswordError | null = null;
  resetCode: string | null = null;
  passwordResetSuccess = false;

  // Form field references for accessibility
  passwordErrorId = 'password-error';
  passwordConfirmationErrorId = 'password-confirmation-error';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Get the reset code from URL
    this.route.queryParams.subscribe(params => {
      this.resetCode = params['code'];
      if (!this.resetCode) {
        this.error = { message: 'Invalid or missing reset code. Please request a new password reset.' };
      }
    });

    // Focus password field on component load (only in browser)
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const passwordInput = document.querySelector('input[formControlName="password"]') as HTMLInputElement;
        if (passwordInput) {
          passwordInput.focus();
        }
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.resetPasswordForm = this.fb.group({
      password: [
        '', 
        [
          Validators.required, 
          Validators.minLength(8),
          Validators.maxLength(128),
          this.passwordStrengthValidator
        ]
      ],
      passwordConfirmation: [
        '', 
        [
          Validators.required
        ]
      ]
    }, { validators: this.passwordMatchValidator });

    // Real-time validation feedback
    this.resetPasswordForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.error?.field) {
          this.clearFieldError();
        }
      });
  }

  // Custom password strength validator
  private passwordStrengthValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = control.value;
    if (!password) return null;

    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const minLength = password.length >= 8;

    const strongPassword = hasLowerCase && hasUpperCase && hasNumbers && hasSpecialChar && minLength;
    
    return strongPassword ? null : { weakPassword: true };
  }

  // Custom validator to check if passwords match
  private passwordMatchValidator(group: AbstractControl): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const passwordConfirmation = group.get('passwordConfirmation')?.value;
    
    return password === passwordConfirmation ? null : { passwordMismatch: true };
  }

  // Getters for form controls
  get passwordControl(): AbstractControl {
    return this.resetPasswordForm.get('password')!;
  }

  get passwordConfirmationControl(): AbstractControl {
    return this.resetPasswordForm.get('passwordConfirmation')!;
  }

  // UI helper methods
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  togglePasswordConfirmationVisibility(): void {
    this.hidePasswordConfirmation = !this.hidePasswordConfirmation;
  }

  // Error message getters
  getPasswordErrorMessage(): string {
    const control = this.passwordControl;
    if (control.hasError('required')) {
      return 'Password is required';
    }
    if (control.hasError('minlength')) {
      return 'Password must be at least 8 characters long';
    }
    if (control.hasError('maxlength')) {
      return 'Password cannot exceed 128 characters';
    }
    if (control.hasError('weakPassword')) {
      return 'Password must contain uppercase, lowercase, numbers, and special characters';
    }
    return '';
  }

  getPasswordConfirmationErrorMessage(): string {
    const control = this.passwordConfirmationControl;
    if (control.hasError('required')) {
      return 'Password confirmation is required';
    }
    if (this.resetPasswordForm.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }

  private clearFieldError(): void {
    if (this.error?.field) {
      this.error = null;
    }
  }

  private handleResetPasswordError(error: any): void {
    console.error('Reset password error:', error);
    
    let errorMessage = 'Failed to reset password. Please try again.';
    let field: string | undefined;

    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 400:
          if (error.error?.message?.includes('code')) {
            errorMessage = 'Invalid or expired reset code. Please request a new password reset.';
          } else {
            errorMessage = 'Invalid password. Please check the requirements and try again.';
            field = 'password';
          }
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

    // Check for reset code
    if (!this.resetCode) {
      this.error = { message: 'Invalid or missing reset code. Please request a new password reset.' };
      return;
    }

    // Validate form
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    // Prevent multiple submissions
    if (this.isLoading) {
      return;
    }

    // Extract form data
    const formData: ResetPasswordFormData = {
      password: this.resetPasswordForm.get('password')?.value || '',
      passwordConfirmation: this.resetPasswordForm.get('passwordConfirmation')?.value || ''
    };

    // Additional validation
    if (!formData.password || !formData.passwordConfirmation) {
      this.error = { message: 'Please fill in all required fields.' };
      return;
    }

    if (formData.password !== formData.passwordConfirmation) {
      this.error = { message: 'Passwords do not match.' };
      return;
    }

    console.log('Reset password request with code:', this.resetCode);

    // Start loading state
    this.isLoading = true;
    this.resetPasswordForm.disable();

    // Attempt password reset
    this.authService.resetPassword(this.resetCode, formData.password, formData.passwordConfirmation)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.resetPasswordForm.enable();
        })
      )
      .subscribe({
        next: () => {
          console.log('Password reset successful');
          
          this.passwordResetSuccess = true;
          this.snackBar.open('Password reset successful! You can now log in with your new password.', 'Close', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });

          // Redirect to login after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error) => {
          this.handleResetPasswordError(error);
        }
      });
  }

  // Password requirement checkers for template
  hasMinLength(): boolean {
    return this.passwordControl.value && this.passwordControl.value.length >= 8;
  }

  hasLowerCase(): boolean {
    return this.passwordControl.value && /[a-z]/.test(this.passwordControl.value);
  }

  hasUpperCase(): boolean {
    return this.passwordControl.value && /[A-Z]/.test(this.passwordControl.value);
  }

  hasNumbers(): boolean {
    return this.passwordControl.value && /\d/.test(this.passwordControl.value);
  }

  hasSpecialChar(): boolean {
    return this.passwordControl.value && /[!@#$%^&*(),.?":{}|<>]/.test(this.passwordControl.value);
  }

  // Accessibility helper for screen readers
  getAriaDescribedBy(fieldName: string): string {
    const control = this.resetPasswordForm.get(fieldName);
    if (control?.invalid && control?.touched) {
      switch (fieldName) {
        case 'password': return this.passwordErrorId;
        case 'passwordConfirmation': return this.passwordConfirmationErrorId;
        default: return '';
      }
    }
    return '';
  }
}
