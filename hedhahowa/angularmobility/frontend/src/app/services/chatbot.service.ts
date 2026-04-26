import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';

export interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  time: Date;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private apiUrl = 'http://localhost:8000/api/dashboard/chatbot/';
  readonly messages = signal<ChatMessage[]>([
    { text: 'Bonjour ! Je suis l\'assistant virox. Comment puis-je vous aider ?', sender: 'bot', time: new Date() }
  ]);
  readonly isOpen = signal(false);
  readonly loading = signal(false);

  constructor(private http: HttpClient) {}

  toggle() {
    this.isOpen.set(!this.isOpen());
  }

  sendMessage(text: string) {
    if (!text.trim()) return;

    const userMsg: ChatMessage = { text, sender: 'user', time: new Date() };
    this.messages.update(m => [...m, userMsg]);
    this.loading.set(true);

    this.http.post<{response: string}>(this.apiUrl, { message: text }).subscribe({
      next: (res) => {
        const botMsg: ChatMessage = { text: res.response, sender: 'bot', time: new Date() };
        this.messages.update(m => [...m, botMsg]);
        this.loading.set(false);
      },
      error: () => {
        const botMsg: ChatMessage = { text: "Désolé, je rencontre des difficultés techniques.", sender: 'bot', time: new Date() };
        this.messages.update(m => [...m, botMsg]);
        this.loading.set(false);
      }
    });
  }
}
