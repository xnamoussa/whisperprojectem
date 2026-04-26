import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from '../services/chatbot.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chatbot-container" [class.open]="bot.isOpen()">
      <!-- Toggle Button -->
      <button class="chat-toggle glass" (click)="bot.toggle()">
        <svg *ngIf="!bot.isOpen()" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        <svg *ngIf="bot.isOpen()" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>

      <!-- Chat Window -->
      <div class="chat-window glass" *ngIf="bot.isOpen()">
        <div class="chat-header">
          <div class="bot-info">
            <div class="bot-avatar">AI</div>
            <span>Assistant virox-ML</span>
          </div>
        </div>

        <div class="chat-history" #scrollMe>
          <div *ngFor="let msg of bot.messages()" class="message-wrapper" [class.user]="msg.sender === 'user'">
            <div class="message-bubble">
              {{ msg.text }}
              <span class="msg-time">{{ msg.time | date:'HH:mm' }}</span>
            </div>
          </div>
          <div *ngIf="bot.loading()" class="message-wrapper">
             <div class="message-bubble bot-typing">
                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
             </div>
          </div>
        </div>

        <div class="chat-input">
          <input 
            type="text" 
            [(ngModel)]="userInput" 
            (keyup.enter)="send()" 
            placeholder="Posez votre question..."
          />
          <button (click)="send()" [disabled]="!userInput.trim() || bot.loading()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .chatbot-container { position: fixed; bottom: 30px; right: 30px; z-index: 1000; }
    
    .chat-toggle {
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--accent); color: white; border: none;
      box-shadow: var(--shadow-lg); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all .3s cubic-bezier(.4, 0, .2, 1);
    }
    .chat-toggle:hover { transform: scale(1.1) rotate(5deg); box-shadow: var(--shadow-glow); }

    .chat-window {
      position: absolute; bottom: 70px; right: 0; width: 350px; height: 500px;
      border-radius: var(--r-lg); display: flex; flex-direction: column;
      overflow: hidden; animation: slideIn .3s ease-out;
    }
    @keyframes slideIn { from { opacity: 0; transform: translateY(20px) scale(.95); } }

    .chat-header {
      padding: 16px; background: rgba(99, 102, 241, .15);
      border-bottom: 1px solid var(--border);
    }
    .bot-info { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: .9rem; }
    .bot-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--accent); color: white;
      display: flex; align-items: center; justify-content: center; font-size: .7rem;
    }

    .chat-history {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 12px;
    }
    .message-wrapper { display: flex; width: 100%; }
    .message-wrapper.user { justify-content: flex-end; }
    .message-bubble {
      max-width: 80%; padding: 10px 14px; border-radius: var(--r-md);
      font-size: .88rem; position: relative;
    }
    .message-wrapper:not(.user) .message-bubble { background: var(--surface); color: var(--text-primary); border-bottom-left-radius: 0; }
    .message-wrapper.user .message-bubble { background: var(--accent); color: white; border-bottom-right-radius: 0; }
    .msg-time { display: block; font-size: .65rem; opacity: .7; margin-top: 4px; text-align: right; }

    .chat-input {
      padding: 12px; border-top: 1px solid var(--border);
      display: flex; gap: 8px; background: var(--bg-card);
    }
    .chat-input input {
      flex: 1; background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--r-md); padding: 8px 12px; color: white; font-size: .85rem;
    }
    .chat-input button {
      background: var(--accent); border: none; color: white;
      padding: 8px; border-radius: 8px; cursor: pointer;
    }

    .bot-typing { display: flex; gap: 4px; padding: 14px !important; }
    .dot { width: 6px; height: 6px; background: var(--text-muted); border-radius: 50%; opacity: .6; animation: typing 1s infinite; }
    .dot:nth-child(2) { animation-delay: .2s; }
    .dot:nth-child(3) { animation-delay: .4s; }
    @keyframes typing { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  `,
})
export class ChatbotComponent implements AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  userInput = '';

  constructor(protected bot: ChatbotService) {}

  ngAfterViewChecked() { this.scrollToBottom(); }

  scrollToBottom(): void {
    try { this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight; } 
    catch(err) { }
  }

  send() {
    if (!this.userInput.trim()) return;
    this.bot.sendMessage(this.userInput);
    this.userInput = '';
  }
}
