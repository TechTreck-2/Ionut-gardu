import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';

import { ChatbotService, ChatMessage, QuickReply } from '../../services/chatbot.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
  animations: [
    trigger('slideInOut', [
      state('in', style({transform: 'translateX(0)'})),
      transition('void => *', [
        style({transform: 'translateX(100%)'}),
        animate(300)
      ]),
      transition('* => void', [
        animate(300, style({transform: 'translateX(100%)'}))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'translateY(0px)' }))
      ])
    ])
  ]
})
export class ChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  isOpen = false;
  messages: ChatMessage[] = [];
  currentMessage = '';
  isTyping = false;
  quickReplies: QuickReply[] = [];
  isMobile = false;
  isTablet = false;
  
  // Touch gesture handling
  private touchStartY = 0;
  private touchStartX = 0;
  
  private subscriptions: Subscription[] = [];

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit(): void {
    // Subscribe to messages
    this.subscriptions.push(
      this.chatbotService.messages$.subscribe(messages => {
        this.messages = messages;
      })
    );

    // Subscribe to typing indicator
    this.subscriptions.push(
      this.chatbotService.isTyping$.subscribe(isTyping => {
        this.isTyping = isTyping;
      })
    );

    // Get quick replies
    this.quickReplies = this.chatbotService.getQuickReplies();
    
    // Check initial screen size
    this.checkScreenSize();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => {
        this.focusMessageInput();
      }, 300);
    }
  }

  sendMessage(): void {
    if (this.currentMessage.trim()) {
      this.chatbotService.sendMessage(this.currentMessage);
      this.currentMessage = '';
      this.focusMessageInput();
    }
  }

  sendQuickReply(quickReply: QuickReply): void {
    this.chatbotService.sendQuickReply(quickReply.value);
  }

  clearChat(): void {
    this.chatbotService.clearChat();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      try {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.error('Error scrolling to bottom:', err);
      }
    }
  }

  private focusMessageInput(): void {
    if (this.messageInput) {
      this.messageInput.nativeElement.focus();
    }
  }

  formatTimestamp(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    const width = window.innerWidth;
    this.isMobile = width <= 768;
    this.isTablet = width > 768 && width <= 1024;
    
    // Auto-close on very small screens when opened
    if (this.isOpen && width <= 480) {
      // Optional: Auto-close on very small screens
      // this.isOpen = false;
    }
  }

  // Touch gesture handlers for mobile swipe-to-close
  onTouchStart(event: TouchEvent): void {
    if (this.isMobile) {
      this.touchStartY = event.touches[0].clientY;
      this.touchStartX = event.touches[0].clientX;
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.isMobile) return;
    
    const touchEndY = event.changedTouches[0].clientY;
    const touchEndX = event.changedTouches[0].clientX;
    const deltaY = touchEndY - this.touchStartY;
    const deltaX = touchEndX - this.touchStartX;
    
    // Swipe down to close (with minimum distance and velocity)
    if (deltaY > 100 && Math.abs(deltaX) < 100) {
      this.toggleChat();
    }
  }
}
