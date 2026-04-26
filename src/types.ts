/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Subject {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface LearningModule {
  id: string;
  subjectId: string;
  name: string;
  type: 'pdf' | 'image' | 'text';
  content: string; // Base64 for images/pdfs, plain text for text
  mimeType: string;
  thumbnail?: string;
  createdAt: number;
}

export type ViewType = 'chat' | 'roadmap' | 'tests' | 'schedule' | 'calendar' | 'flashcards';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  subjectId: string;
  name: string;
  messages: ChatMessage[];
  createdAt: number;
}

export interface StudyLog {
  id: string;
  date: string; // YYYY-MM-DD
  action: 'chat' | 'upload' | 'test' | 'summary';
  details: string;
}

export interface Flashcard {
  id: string;
  subjectId: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: number;
}

export interface DailySummary {
  id: string;
  date: string;
  content: string;
}
