import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ChatMessage {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
  type?: 'text' | 'quick-reply' | 'help';
}

export interface QuickReply {
  label: string;
  value: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  private isTypingSubject = new BehaviorSubject<boolean>(false);
  public isTyping$ = this.isTypingSubject.asObservable();

  private qaDatabase = {
    // Authentication & Getting Started
    'how to login': 'To login, enter your email and password on the login page. If you don\'t have an account, click "Register" to create one.',
    'register': 'Click on "Register" from the login page, fill in your details including email, password, and confirm your password. After registration, you can login with your credentials.',
    'forgot password': 'Click "Forgot Password" on the login page, enter your email address, and follow the instructions sent to your email to reset your password.',
    'getting started': 'Welcome! After logging in, you can start tracking time using the timer, manage vacation requests, track home office days, and view your timetable.',
    
    // Time Tracking
    'start timer': 'Click the play button on the timer component to start tracking time. You can add a description for what you\'re working on.',
    'stop timer': 'Click the stop button to pause your current time entry. The time will be saved automatically.',
    'edit time': 'You can edit time entries by clicking on them in your timetable. Modify the start time, end time, or description as needed.',
    'time tracking': 'Use the timer component to track your work hours. You can start/stop the timer and add descriptions for different tasks.',
    'view time entries': 'Navigate to the timetable section to view all your recorded time entries for different dates.',
    
    // Vacation Management
    'request vacation': 'Click on "Vacation Planning" to submit vacation requests. Select your start and end dates, and add any notes.',
    'vacation status': 'You can view the status of your vacation requests in the vacation planning section. Statuses include pending, approved, or rejected.',
    'vacation balance': 'Your vacation balance and remaining days are displayed in the vacation planning component.',
    
    // Home Office
    'home office': 'Use the home office section to log when you\'re working from home and set your home office location.',
    'home office request': 'Submit home office requests by selecting dates and providing your home office location details.',
    
    // Permissions & Leave
    'permission request': 'For short-term leave or permissions, use the permission entry dialog to specify the time and reason.',
    'sick leave': 'Submit sick leave requests through the permission entry system with appropriate documentation.',
    
    // Navigation & Features
    'navigation': 'Use the side navigation menu to access different features: Timer, Timetable, Vacation Planning, Home Office, and Permissions.',
    'profile': 'Access your profile settings through the side navigation to update your personal information.',
    'logout': 'Click the logout button in the side navigation to safely sign out of the application.',
    
    // Troubleshooting
    'app not working': 'Try refreshing the page. If issues persist, clear your browser cache and cookies, then login again.',
    'timer issues': 'If the timer isn\'t working properly, try stopping and starting it again. Make sure you\'re connected to the internet.',
    'data not saving': 'Ensure you have a stable internet connection. The app automatically saves your data when connected.',
    
    // General Help
    'help': 'I can help you with: login/registration, time tracking, vacation requests, home office management, permissions, and general app navigation. What would you like to know?',
    'features': 'TechTreck includes: Time Tracking with timer, Vacation Planning, Home Office Management, Permission Requests, and Detailed Timetables.',
    'support': 'For technical support beyond this guide, please contact your system administrator or IT support team.'
  };

  private quickReplies: QuickReply[] = [
    { label: '🕐 How to track time?', value: 'start timer' },
    { label: '🏖️ Request vacation', value: 'request vacation' },
    { label: '🏠 Home office setup', value: 'home office' },
    { label: '📊 View time entries', value: 'view time entries' },
    { label: '🔐 Login help', value: 'how to login' },
    { label: '⚙️ App features', value: 'features' }
  ];

  constructor() {
    // Welcome message
    this.addBotMessage(
      'Hi! 👋 I\'m your TechTreck assistant. I can help you navigate the app and answer questions about time tracking, vacation requests, and more. How can I help you today?',
      'help'
    );
  }

  public sendMessage(content: string): void {
    // Add user message
    this.addUserMessage(content);
    
    // Show typing indicator
    this.isTypingSubject.next(true);
    
    // Simulate bot response delay
    setTimeout(() => {
      const response = this.getBotResponse(content);
      this.addBotMessage(response.content, response.type);
      this.isTypingSubject.next(false);
    }, 1500);
  }

  public sendQuickReply(value: string): void {
    this.sendMessage(value);
  }

  public getQuickReplies(): QuickReply[] {
    return this.quickReplies;
  }

  public clearChat(): void {
    this.messagesSubject.next([]);
    // Re-add welcome message
    setTimeout(() => {
      this.addBotMessage(
        'Chat cleared! How can I help you with TechTreck today?',
        'help'
      );
    }, 300);
  }

  private addUserMessage(content: string): void {
    const message: ChatMessage = {
      id: this.generateId(),
      content,
      isBot: false,
      timestamp: new Date()
    };
    
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);
  }

  private addBotMessage(content: string, type: 'text' | 'quick-reply' | 'help' = 'text'): void {
    const message: ChatMessage = {
      id: this.generateId(),
      content,
      isBot: true,
      timestamp: new Date(),
      type
    };
    
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);
  }

  private getBotResponse(userMessage: string): { content: string; type: 'text' | 'quick-reply' | 'help' } {
    const normalizedMessage = userMessage.toLowerCase().trim();
    
    // Check for exact matches first
    for (const [key, response] of Object.entries(this.qaDatabase)) {
      if (normalizedMessage === key) {
        return { content: response, type: 'text' };
      }
    }
    
    // Check for partial matches
    for (const [key, response] of Object.entries(this.qaDatabase)) {
      if (normalizedMessage.includes(key) || key.includes(normalizedMessage)) {
        return { content: response, type: 'text' };
      }
    }
    
    // Keyword-based matching
    if (normalizedMessage.includes('time') || normalizedMessage.includes('timer') || normalizedMessage.includes('track')) {
      return { 
        content: this.qaDatabase['time tracking'], 
        type: 'text' 
      };
    }
    
    if (normalizedMessage.includes('vacation') || normalizedMessage.includes('holiday') || normalizedMessage.includes('leave')) {
      return { 
        content: this.qaDatabase['request vacation'], 
        type: 'text' 
      };
    }
    
    if (normalizedMessage.includes('home') || normalizedMessage.includes('remote')) {
      return { 
        content: this.qaDatabase['home office'], 
        type: 'text' 
      };
    }
    
    if (normalizedMessage.includes('login') || normalizedMessage.includes('sign in') || normalizedMessage.includes('authentication')) {
      return { 
        content: this.qaDatabase['how to login'], 
        type: 'text' 
      };
    }
    
    if (normalizedMessage.includes('help') || normalizedMessage.includes('what') || normalizedMessage.includes('how')) {
      return { 
        content: this.qaDatabase['help'], 
        type: 'help' 
      };
    }
    
    // Default response with suggestions
    return {
      content: 'I\'m not sure about that specific question. Try asking about: time tracking, vacation requests, home office, login help, or app features. You can also use the quick reply buttons below!',
      type: 'quick-reply'
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
