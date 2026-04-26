/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { TutorView } from './components/TutorView';
import { CalendarView } from './components/CalendarView';
import { FlashcardView } from './components/FlashcardView';
import { LearningModule, ViewType, Subject, StudyLog, Flashcard, DailySummary, ChatSession, ChatMessage } from './types';
import { Sparkles, BrainCircuit, LayoutGrid, Info } from 'lucide-react';
import { generateStudyArtifact } from './services/gemini';

const DEFAULT_SUBJECTS: Subject[] = [
  { id: '1', name: 'Anatomy', color: '#14b8a6', createdAt: Date.now() },
  { id: '2', name: 'Physiology', color: '#6366f1', createdAt: Date.now() },
  { id: '3', name: 'Biochemistry', color: '#f59e0b', createdAt: Date.now() },
];

export default function App() {
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [activeSubjectId, setActiveSubjectId] = useState<string>(DEFAULT_SUBJECTS[0].id);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [activeView, setActiveView] = useState<ViewType>('chat');
  
  // Chat States
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // New States
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Persistence: Load from localStorage
  useEffect(() => {
    const savedSubjects = localStorage.getItem('study_subjects');
    const savedModules = localStorage.getItem('study_modules');
    const savedLogs = localStorage.getItem('study_logs');
    const savedCards = localStorage.getItem('study_cards');
    const savedSummaries = localStorage.getItem('study_summaries');
    const savedChats = localStorage.getItem('study_chats');

    if (savedSubjects) setSubjects(JSON.parse(savedSubjects));
    if (savedModules) setModules(JSON.parse(savedModules));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedCards) setFlashcards(JSON.parse(savedCards));
    if (savedSummaries) setSummaries(JSON.parse(savedSummaries));
    if (savedChats) setChatSessions(JSON.parse(savedChats));
  }, []);

  // Persistence: Save to localStorage
  useEffect(() => { localStorage.setItem('study_subjects', JSON.stringify(subjects)); }, [subjects]);
  useEffect(() => { localStorage.setItem('study_modules', JSON.stringify(modules)); }, [modules]);
  useEffect(() => { localStorage.setItem('study_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('study_cards', JSON.stringify(flashcards)); }, [flashcards]);
  useEffect(() => { localStorage.setItem('study_summaries', JSON.stringify(summaries)); }, [summaries]);
  useEffect(() => { localStorage.setItem('study_chats', JSON.stringify(chatSessions)); }, [chatSessions]);

  // Initialize a chat session if none exists for the subject
  useEffect(() => {
    const subjectChats = chatSessions.filter(c => c.subjectId === activeSubjectId);
    if (subjectChats.length === 0) {
      const newChat: ChatSession = {
        id: Math.random().toString(36).substr(2, 9),
        subjectId: activeSubjectId,
        name: 'New Chat Session',
        messages: [],
        createdAt: Date.now()
      };
      setChatSessions(prev => [...prev, newChat]);
      setActiveChatId(newChat.id);
    } else if (!activeChatId || !chatSessions.find(c => c.id === activeChatId && c.subjectId === activeSubjectId)) {
      if (subjectChats.length > 0) {
        setActiveChatId(subjectChats[0].id);
      }
    }
  }, [activeSubjectId]);

  const activeChat = useMemo(() => 
    chatSessions.find(c => c.id === activeChatId),
  [chatSessions, activeChatId]);

  const updateChatMessages = (chatId: string, messages: ChatMessage[]) => {
    setChatSessions(prev => prev.map(session => 
      session.id === chatId ? { ...session, messages } : session
    ));
  };

  const createNewChat = () => {
    const newChat: ChatSession = {
      id: Math.random().toString(36).substr(2, 9),
      subjectId: activeSubjectId,
      name: `Chat Session ${chatSessions.filter(c => c.subjectId === activeSubjectId).length + 1}`,
      messages: [],
      createdAt: Date.now()
    };
    setChatSessions(prev => [...prev, newChat]);
    setActiveChatId(newChat.id);
    setActiveView('chat');
  };

  const deleteChat = (id: string) => {
    setChatSessions(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) {
      const remaining = chatSessions.filter(c => c.id !== id && c.subjectId === activeSubjectId);
      setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const activeSubject = useMemo(() => 
    subjects.find(s => s.id === activeSubjectId) || subjects[0],
  [subjects, activeSubjectId]);

  const activeModules = useMemo(() => 
    modules.filter(m => m.subjectId === activeSubjectId),
  [modules, activeSubjectId]);

  const addLog = (action: StudyLog['action'], details: string) => {
    const newLog: StudyLog = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      action,
      details
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const addModule = (module: LearningModule) => {
    setModules(prev => [module, ...prev]);
    addLog('upload', `Uploaded ${module.name}`);
  };

  const removeModule = (id: string) => {
    const mod = modules.find(m => m.id === id);
    setModules(prev => prev.filter(m => m.id !== id));
    if (mod) addLog('upload', `Removed ${mod.name}`);
  };

  const generateFlashcards = async () => {
    if (activeModules.length === 0) return;
    setIsGenerating(true);
    try {
      const result = await generateStudyArtifact('flashcards', activeModules);
      const lines = result.split('\n').filter(l => l.includes('Q:') && l.includes('A:'));
      const newCards: Flashcard[] = lines.map(line => {
        const [qPart, aPart] = line.split('|');
        return {
          id: Math.random().toString(36).substr(2, 9),
          subjectId: activeSubjectId,
          question: qPart.replace('Q:', '').trim(),
          answer: aPart.replace('A:', '').trim(),
          difficulty: 'medium'
        };
      });
      setFlashcards(prev => [...newCards, ...prev]);
      addLog('test', `Generated ${newCards.length} flashcards`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSummary = async (date: string) => {
    const dayLogs = logs.filter(l => l.date === date).map(l => `${l.action}: ${l.details}`).join(', ');
    if (!dayLogs) return;
    setIsGenerating(true);
    
    // Gather all messages from all chat sessions for this subject to provide context
    const subjectMessages = chatSessions
      .filter(s => s.subjectId === activeSubjectId)
      .flatMap(s => s.messages)
      .slice(-15) // last 15 messages for context
      .map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }]
      }));

    try {
      const content = await generateStudyArtifact('summary', activeModules, dayLogs, subjectMessages);
      setSummaries(prev => [{ id: Math.random().toString(36).substr(2, 9), date, content }, ...prev]);
      addLog('summary', `Created daily wrap-up`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const addSubject = (name: string) => {
    const newSubject: Subject = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
      createdAt: Date.now()
    };
    setSubjects(prev => [...prev, newSubject]);
    setActiveSubjectId(newSubject.id);
  };

  return (
    <div className="flex h-screen w-screen bg-bg-main text-slate-200 overflow-hidden font-sans">
      <Sidebar 
        subjects={subjects}
        activeSubjectId={activeSubjectId}
        onSubjectSelect={setActiveSubjectId}
        onAddSubject={addSubject}
        modules={activeModules} 
        onUpload={addModule} 
        onRemove={removeModule} 
        activeView={activeView}
        onViewChange={setActiveView}
        chatSessions={chatSessions.filter(c => c.subjectId === activeSubjectId)}
        activeChatId={activeChatId}
        onChatSelect={setActiveChatId}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden bg-bg-main">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-bg-main/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-medium tracking-tight uppercase">{activeSubject.name}</h2>
            <span className="px-2 py-0.5 bg-brand-teal/10 text-brand-teal text-[10px] rounded-full uppercase tracking-wider font-bold">
              {activeView === 'chat' ? 'Study Assistant' : 'Academic Analysis'}
            </span>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest hidden sm:block">
              {activeModules.length} Modules in Context
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold" style={{ borderColor: activeSubject.color }}>
              {activeSubject.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 bg-transparent">
          {activeView === 'chat' && activeChat && (
            <ChatView 
               modules={activeModules} 
               messages={activeChat.messages}
               onUpdateMessages={(msgs) => updateChatMessages(activeChat.id, msgs)}
               key={`chat-${activeChat.id}`} 
               onMessage={() => addLog('chat', 'Asked a question')}
            />
          )}
          {['roadmap', 'tests', 'schedule'].includes(activeView) && (
            <TutorView 
              modules={activeModules} 
              activeView={activeView} 
              key={`tutor-${activeSubjectId}`} 
            />
          )}
          {activeView === 'calendar' && (
            <CalendarView 
              logs={logs} 
              summaries={summaries} 
              onGenerateSummary={generateSummary} 
            />
          )}
          {activeView === 'flashcards' && (
            <FlashcardView 
              flashcards={flashcards} 
              activeSubjectId={activeSubjectId} 
              onGenerate={generateFlashcards} 
              isLoading={isGenerating}
            />
          )}
        </div>
      </main>
    </div>
  );
}

