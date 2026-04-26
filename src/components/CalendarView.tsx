import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, BookOpen, Clock, CheckCircle2, Eye } from 'lucide-react';
import { cn } from '../lib/utils';
import { StudyLog, DailySummary } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Modal } from './Modal';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CalendarViewProps {
  logs: StudyLog[];
  summaries: DailySummary[];
  onGenerateSummary: (date: string) => void;
}

export function CalendarView({ logs, summaries, onGenerateSummary }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSummary, setSelectedSummary] = useState<DailySummary | null>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayStr = new Date().toISOString().split('T')[0];

  const days = [];
  for (let i = 0; i < firstDayOfMonth(year, month); i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth(year, month); i++) {
    days.push(i);
  }

  const getLogsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return logs.filter(l => l.date === dateStr);
  };

  const getSummaryForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return summaries.find(s => s.date === dateStr);
  };

  return (
    <div className="flex h-full gap-8 p-8 max-w-6xl mx-auto overflow-hidden">
      <div className="flex-1 flex flex-col bg-bg-card/50 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <header className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="text-brand-teal" size={20} />
            <h2 className="text-lg font-bold text-white">
              {currentDate.toLocaleString('default', { month: 'long' })} {year}
            </h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentDate(new Date(year, month - 1))}
              className="p-2 hover:bg-white/5 rounded-lg text-slate-400"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date(year, month + 1))}
              className="p-2 hover:bg-white/5 rounded-lg text-slate-400"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-7 border-b border-white/5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {d}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
          {days.map((day, idx) => {
            const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
            const isToday = dateStr === todayStr;
            const dayLogs = day ? getLogsForDay(day) : [];
            const summary = day ? getSummaryForDay(day) : null;

            return (
              <div 
                key={idx} 
                className={cn(
                  "min-h-[120px] p-2 border-r border-b border-white/5 transition-colors",
                  day ? "hover:bg-white/[0.02]" : "bg-black/10",
                  isToday && "bg-brand-teal/[0.03]"
                )}
              >
                {day && (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "text-xs font-mono px-1.5 py-0.5 rounded",
                        isToday ? "bg-brand-teal text-white" : "text-slate-500"
                      )}>
                        {day}
                      </span>
                      {summary && <CheckCircle2 size={12} className="text-brand-teal" />}
                    </div>
                    <div className="space-y-1">
                      {dayLogs.slice(0, 3).map((log, lidx) => (
                        <div key={lidx} className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                          <div className={cn(
                            "w-1 h-1 rounded-full",
                            log.action === 'chat' ? "bg-blue-400" : log.action === 'upload' ? "bg-teal-400" : "bg-purple-400"
                          )} />
                          {log.details}
                        </div>
                      ))}
                      {dayLogs.length > 3 && (
                        <div className="text-[9px] text-slate-600 font-bold">
                          +{dayLogs.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-80 shrink-0 space-y-8">
        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Daily Wrap-up</h3>
          <div className="bg-bg-card/80 border border-white/10 rounded-2xl p-6 shadow-xl">
             <div className="flex items-center gap-3 mb-4">
                <Clock className="text-brand-teal" size={18} />
                <h4 className="text-sm font-bold text-white">Focus Session</h4>
             </div>
             <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Generate a summary of your study sessions to track progress and identify weak areas.
             </p>
             <button
                onClick={() => onGenerateSummary(todayStr)}
                className="w-full py-3 bg-brand-teal text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-teal-dark shadow-lg shadow-brand-teal/20 transition-all active:scale-95"
             >
                Summarize Today
             </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Recent Summaries</h3>
          <AnimatePresence>
            {summaries.slice(0, 3).map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-white/5 border border-white/5 rounded-xl group relative"
              >
                <p className="text-[10px] font-mono text-brand-teal mb-2">{s.date}</p>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-3">{s.content}</p>
                <button
                  onClick={() => setSelectedSummary(s)}
                  className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-brand-teal uppercase tracking-widest transition-colors"
                >
                  <Eye size={12} /> Read Full Summary
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <Modal 
        isOpen={!!selectedSummary} 
        onClose={() => setSelectedSummary(null)}
        title={`Daily Summary - ${selectedSummary?.date}`}
      >
        <div className="markdown-body">
          <Markdown remarkPlugins={[remarkGfm]}>
            {selectedSummary?.content || ''}
          </Markdown>
        </div>
      </Modal>
    </div>
  );
}
