import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { 
  FormBuilder, 
  FormGroup, 
  Validators, 
  ReactiveFormsModule,
  AbstractControl,
  ValidatorFn 
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { RegisterRequest } from '../../../models/user.model';
import { CustomValidators } from '../../../validators/custom-validators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject, takeUntil, finalize, take } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

// Interfaces for better type safety
interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface RegisterError {
  message: string;
  field?: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: 'primary' | 'accent' | 'warn';
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
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
    MatCheckboxModule,
    RouterLink
  ]
})
export class RegisterComponent implements OnInit, OnDestroy {
  // Form and state management
  registerForm!: FormGroup;
  private destroy$ = new Subject<void>();
  private snackBar = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);

  // UI state
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;
  error: RegisterError | null = null;
  registrationAttempts = 0;
  maxRegistrationAttempts = 3;
  passwordStrength: PasswordStrength = { score: 0, feedback: [], color: 'warn' };

  // Form field references for accessibility
  usernameErrorId = 'username-error';
  emailErrorId = 'email-error';
  passwordErrorId = 'password-error';
  confirmPasswordErrorId = 'confirm-password-error';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
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

    // Focus username field on component load (only in browser)
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const usernameInput = document.querySelector('input[formControlName="username"]') as HTMLInputElement;
        if (usernameInput) {
          usernameInput.focus();
        }
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  private initializeForm(): void {
    this.registerForm = this.fb.group({
      username: [
        '', 
        [
          Validators.required, 
          Validators.minLength(3),
          Validators.maxLength(30),
          CustomValidators.username,
          CustomValidators.notOnlyWhitespace
        ]
      ],
      email: [
        '', 
        [
          Validators.required, 
          Validators.email,
          CustomValidators.email
        ]
      ],
      password: [
        '', 
        [
          Validators.required, 
          Validators.minLength(8),
          Validators.maxLength(128),
          CustomValidators.passwordStrength
        ]
      ],
      confirmPassword: [
        '', 
        [
          Validators.required,
          CustomValidators.passwordMatch('password')
        ]
      ],
      acceptTerms: [
        false,
        [Validators.requiredTrue]
      ]
    });

    // Real-time validation feedback
    this.registerForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.error?.field) {
          this.clearFieldError();
        }
      });

    // Password strength monitoring
    this.registerForm.get('password')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(password => {
        this.passwordStrength = this.calculatePasswordStrength(password || '');
        
        // Trigger validation on confirm password when password changes
        const confirmPasswordControl = this.registerForm.get('confirmPassword');
        if (confirmPasswordControl?.value) {
          confirmPasswordControl.updateValueAndValidity();
        }
      });

    // Trigger validation on confirm password when it changes
    this.registerForm.get('confirmPassword')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const confirmPasswordControl = this.registerForm.get('confirmPassword');
        if (confirmPasswordControl) {
          confirmPasswordControl.updateValueAndValidity();
        }
      });
  }

  // Custom validators
  private customUsernameValidator(control: AbstractControl): { [key: string]: any } | null {
    const username = control.value;
    if (!username) return null;

    // Check for invalid characters and reserved words
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    const hasValidFormat = usernameRegex.test(username);
    const hasNoReservedWords = !['admin', 'root', 'user', 'test'].includes(username.toLowerCase());
    const hasNoScripts = !username.includes('<script>') && !username.includes('javascript:');

    return hasValidFormat && hasNoReservedWords && hasNoScripts ? null : { invalidUsername: true };
  }

  private customEmailValidator(control: AbstractControl): { [key: string]: any } | null {
    const email = control.value;
    if (!email) return null;

    // Additional email security checks
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const hasValidFormat = emailRegex.test(email);
    const hasNoScripts = !email.includes('<script>') && !email.includes('javascript:');

    return hasValidFormat && hasNoScripts ? null : { invalidEmail: true };
  }

  private passwordStrengthValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = control.value;
    if (!password) return null;

    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const minLength = password.length >= 6;

    const strongPassword = hasLowerCase && hasUpperCase && hasNumbers && hasSpecialChar && minLength;
    
    return strongPassword ? null : { weakPassword: true };
  }

  private passwordMatchValidator: ValidatorFn = (group: AbstractControl) => {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  };

  private calculatePasswordStrength(password: string): PasswordStrength {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) score++;
    else feedback.push('Use at least 8 characters');

    if (/[a-z]/.test(password)) score++;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Add uppercase letters');

    if (/\d/.test(password)) score++;
    else feedback.push('Add numbers');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else feedback.push('Add special characters');

    let color: 'primary' | 'accent' | 'warn' = 'warn';
    if (score >= 4) color = 'primary';
    else if (score >= 2) color = 'accent';

    return { score, feedback, color };
  }

  // Getters for form controls
  get usernameControl(): AbstractControl {
    return this.registerForm.get('username')!;
  }

  get emailControl(): AbstractControl {
    return this.registerForm.get('email')!;
  }

  get passwordControl(): AbstractControl {
    return this.registerForm.get('password')!;
  }

  get confirmPasswordControl(): AbstractControl {
    return this.registerForm.get('confirmPassword')!;
  }

  get acceptTermsControl(): AbstractControl {
    return this.registerForm.get('acceptTerms')!;
  }

  // UI helper methods
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }
  // Error message getters
  getUsernameErrorMessage(): string {
    const control = this.usernameControl;
    if (control.hasError('required')) {
      return 'Username is required';
    }
    if (control.hasError('minlength')) {
      return 'Username must be at least 3 characters long';
    }
    if (control.hasError('maxlength')) {
      return 'Username cannot exceed 30 characters';
    }
    if (control.hasError('invalidFormat')) {
      return control.getError('invalidFormat').message;
    }
    if (control.hasError('reservedWord')) {
      return control.getError('reservedWord').message;
    }
    if (control.hasError('maliciousContent')) {
      return control.getError('maliciousContent').message;
    }
    if (control.hasError('invalidStartEnd')) {
      return control.getError('invalidStartEnd').message;
    }
    if (control.hasError('onlyWhitespace')) {
      return control.getError('onlyWhitespace').message;
    }
    return '';
  }

  getEmailErrorMessage(): string {
    const control = this.emailControl;
    if (control.hasError('required')) {
      return 'Email address is required';
    }
    if (control.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control.hasError('invalidFormat')) {
      return control.getError('invalidFormat').message;
    }
    if (control.hasError('maliciousContent')) {
      return control.getError('maliciousContent').message;
    }
    if (control.hasError('suspiciousPattern')) {
      return control.getError('suspiciousPattern').message;
    }
    if (control.hasError('domainTooLong')) {
      return control.getError('domainTooLong').message;
    }
    return '';
  }

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
    if (control.hasError('tooShort')) {
      return control.getError('tooShort').message;
    }
    if (control.hasError('tooLong')) {
      return control.getError('tooLong').message;
    }
    if (control.hasError('weakPassword')) {
      return control.getError('weakPassword').message;
    }
    if (control.hasError('commonPassword')) {
      return control.getError('commonPassword').message;
    }
    if (control.hasError('repeatedCharacters')) {
      return control.getError('repeatedCharacters').message;
    }
    return '';
  }

  getConfirmPasswordErrorMessage(): string {
    const control = this.confirmPasswordControl;
    if (control.hasError('required')) {
      return 'Password confirmation is required';
    }
    if (control.hasError('passwordMismatch')) {
      return control.getError('passwordMismatch').message;
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

  private handleRegistrationError(error: any): void {
    console.error('Registration error:', error);
    
    let errorMessage = 'Registration failed. Please try again.';
    let field: string | undefined;

    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 400:
          if (error.error?.error?.message) {
            errorMessage = error.error.error.message;
          } else if (error.error?.error?.details?.errors) {
            const validationErrors = error.error.error.details.errors;
            errorMessage = validationErrors.map((e: any) => e.message).join(', ');
          } else {
            errorMessage = 'Invalid registration data. Please check your information.';
          }
          break;
        case 409:
          errorMessage = 'An account with this email or username already exists.';
          field = 'email';
          break;
        case 429:
          errorMessage = 'Too many registration attempts. Please try again later.';
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
    this.registrationAttempts++;

    // Show snack bar for better UX
    this.snackBar.open(errorMessage, 'Dismiss', {
      duration: 8000,
      panelClass: ['error-snackbar']
    });

    // Lock form temporarily after max attempts
    if (this.registrationAttempts >= this.maxRegistrationAttempts) {
      this.registerForm.disable();
      this.snackBar.open(
        'Too many failed attempts. Form will be unlocked in 60 seconds.',
        'OK',
        { duration: 60000 }
      );

      setTimeout(() => {
        this.registerForm.enable();
        this.registrationAttempts = 0;
      }, 60000);
    }
  }

  onSubmit(): void {
    // Clear previous errors
    this.error = null;

    // Validate form
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    // Prevent multiple submissions
    if (this.isLoading) {
      return;
    }

    // Extract and sanitize form data
    const formData: RegisterFormData = {
      username: this.sanitizeInput(this.registerForm.get('username')?.value || ''),
      email: this.sanitizeInput(this.registerForm.get('email')?.value || ''),
      password: this.registerForm.get('password')?.value || '',
      confirmPassword: this.registerForm.get('confirmPassword')?.value || '',
      acceptTerms: this.registerForm.get('acceptTerms')?.value || false
    };

    // Additional validation
    if (!formData.username || !formData.email || !formData.password || !formData.acceptTerms) {
      this.error = { message: 'Please fill in all required fields and accept the terms.' };
      return;
    }

    console.log('Registration attempt with:', { 
      username: formData.username, 
      email: formData.email, 
      password: '***',
      acceptTerms: formData.acceptTerms 
    });

    // Start loading state
    this.isLoading = true;
    this.registerForm.disable();

    // Attempt registration
    this.authService.register(formData.username, formData.email, formData.password)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.registerForm.enable();
        })
      )
      .subscribe({
        next: () => {
          console.log('Registration successful');
          
          this.snackBar.open('Registration successful! Welcome aboard!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Reset registration attempts on success
          this.registrationAttempts = 0;
          
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
          this.handleRegistrationError(error);
        }
      });
  }

  // Accessibility helper for screen readers
  getAriaDescribedBy(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (control?.invalid && control?.touched) {
      switch (fieldName) {
        case 'username': return this.usernameErrorId;
        case 'email': return this.emailErrorId;
        case 'password': return this.passwordErrorId;
        case 'confirmPassword': return this.confirmPasswordErrorId;
        default: return '';
      }
    }
    return '';
  }
}