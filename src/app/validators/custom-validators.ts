import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom validators for enhanced form validation
 */
export class CustomValidators {

  /**
   * Validates that username contains only allowed characters and is not a reserved word
   */
  static username(control: AbstractControl): ValidationErrors | null {
    const username = control.value;
    if (!username) return null;

    const errors: ValidationErrors = {};

    // Check for valid format (alphanumeric, underscore, dot, hyphen)
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!usernameRegex.test(username)) {
      errors['invalidFormat'] = { message: 'Username can only contain letters, numbers, underscores, dots, and hyphens' };
    }

    // Check for reserved words
    const reservedWords = ['admin', 'administrator', 'root', 'user', 'test', 'demo', 'api', 'www', 'ftp', 'mail', 'email'];
    if (reservedWords.includes(username.toLowerCase())) {
      errors['reservedWord'] = { message: 'This username is reserved and cannot be used' };
    }

    // Check for potentially harmful content
    const dangerousPatterns = [/<script/i, /javascript:/i, /vbscript:/i, /onload=/i, /onerror=/i];
    if (dangerousPatterns.some(pattern => pattern.test(username))) {
      errors['maliciousContent'] = { message: 'Username contains invalid content' };
    }

    // Check that it doesn't start or end with special characters
    if (/^[._-]|[._-]$/.test(username)) {
      errors['invalidStartEnd'] = { message: 'Username cannot start or end with special characters' };
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  /**
   * Enhanced email validator with additional security checks
   */
  static email(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    if (!email) return null;

    const errors: ValidationErrors = {};

    // Basic email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      errors['invalidFormat'] = { message: 'Please enter a valid email address' };
    }

    // Check for dangerous content
    const dangerousPatterns = [/<script/i, /javascript:/i, /vbscript:/i];
    if (dangerousPatterns.some(pattern => pattern.test(email))) {
      errors['maliciousContent'] = { message: 'Email contains invalid content' };
    }

    // Check for suspicious patterns
    if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
      errors['suspiciousPattern'] = { message: 'Email format appears to be invalid' };
    }

    // Validate domain part length
    const domain = email.split('@')[1];
    if (domain && domain.length > 253) {
      errors['domainTooLong'] = { message: 'Email domain is too long' };
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  /**
   * Password strength validator
   */
  static passwordStrength(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    if (!password) return null;

    const errors: ValidationErrors = {};

    // Minimum length
    if (password.length < 8) {
      errors['tooShort'] = { message: 'Password must be at least 8 characters long' };
    }

    // Maximum length for security
    if (password.length > 128) {
      errors['tooLong'] = { message: 'Password cannot exceed 128 characters' };
    }

    // Check for character variety
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const characterTypes = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

    if (characterTypes < 3) {
      errors['weakPassword'] = { 
        message: 'Password must contain at least 3 of the following: lowercase letters, uppercase letters, numbers, special characters' 
      };
    }

    // Check for common weak passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123', '12345678'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors['commonPassword'] = { message: 'This password is too common. Please choose a more secure password' };
    }

    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
      errors['repeatedCharacters'] = { message: 'Password cannot contain more than 2 consecutive identical characters' };
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  /**
   * Password confirmation validator factory
   */
  static passwordMatch(passwordField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.parent?.get(passwordField)?.value;
      const confirmPassword = control.value;

      if (!password || !confirmPassword) return null;

      return password === confirmPassword ? null : { 
        passwordMismatch: { message: 'Passwords do not match' } 
      };
    };
  }

  /**
   * No whitespace validator
   */
  static noWhitespace(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasWhitespace = /\s/.test(value);
    return hasWhitespace ? { whitespace: { message: 'Field cannot contain whitespace' } } : null;
  }

  /**
   * Validate that field doesn't contain only whitespace
   */
  static notOnlyWhitespace(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const trimmedValue = value.trim();
    return trimmedValue.length === 0 ? { onlyWhitespace: { message: 'Field cannot be empty or contain only whitespace' } } : null;
  }

  /**
   * Age validation (for date of birth fields)
   */
  static minimumAge(minAge: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const birthDate = control.value;
      if (!birthDate) return null;

      const today = new Date();
      const birth = new Date(birthDate);
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        return age - 1 < minAge ? { minimumAge: { message: `Must be at least ${minAge} years old` } } : null;
      }

      return age < minAge ? { minimumAge: { message: `Must be at least ${minAge} years old` } } : null;
    };
  }

  /**
   * Phone number validator (international format)
   */
  static phoneNumber(control: AbstractControl): ValidationErrors | null {
    const phoneNumber = control.value;
    if (!phoneNumber) return null;

    // Basic international phone number pattern
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    
    return phoneRegex.test(phoneNumber.replace(/[\s()-]/g, '')) ? null : { 
      invalidPhoneNumber: { message: 'Please enter a valid phone number' } 
    };
  }

  /**
   * URL validator
   */
  static url(control: AbstractControl): ValidationErrors | null {
    const url = control.value;
    if (!url) return null;

    try {
      new URL(url);
      return null;
    } catch {
      return { invalidUrl: { message: 'Please enter a valid URL' } };
    }
  }

  /**
   * File size validator for file uploads
   */
  static fileSize(maxSizeInMB: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value;
      if (!file) return null;

      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      
      return file.size > maxSizeInBytes ? { 
        fileSize: { message: `File size must not exceed ${maxSizeInMB}MB` } 
      } : null;
    };
  }

  /**
   * File type validator for file uploads
   */
  static fileType(allowedTypes: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value;
      if (!file) return null;

      const fileType = file.type;
      
      return allowedTypes.includes(fileType) ? null : { 
        fileType: { message: `File type must be one of: ${allowedTypes.join(', ')}` } 
      };
    };
  }
}
