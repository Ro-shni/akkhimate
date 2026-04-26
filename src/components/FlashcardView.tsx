import React, { useState } from 'react';
import { Sparkles, RefreshCcw, BookOpen, Clock, FlaskConical, BrainCircuit, Heart, ChevronRight } from 'lucide-react';
import { Flashcard, Subject } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FlashcardViewProps {
  flashcards: Flashcard[];
  activeSubjectId: string;
  onGenerate: () => void;
  isLoading: boolean;
}

export function FlashcardView({ flashcards, activeSubjectId, onGenerate, isLoading }: FlashcardViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const filteredCards = flashcards.filter(c => c.subjectId === activeSubjectId);
  const currentCard = filteredCards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
    }, 150);
  };

  return (
    <div className="flex flex-col h-full p-8 max-w-4xl mx-auto overflow-hidden">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <BrainCircuit className="text-brand-teal" /> Active Flashcards
          </h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">{filteredCards.length} Cards in current subject</p>
        </div>
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-brand-teal/10 border border-brand-teal/20 text-brand-teal rounded-xl text-xs font-bold hover:bg-brand-teal/20 transition-all disabled:opacity-50"
        >
          {isLoading ? <RefreshCcw size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {flashcards.length > 0 ? "Add New Cards" : "Generate Cards"}
        </button>
      </header>

      {filteredCards.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-bg-card/50 rounded-3xl border border-white/10 shadow-2xl">
          <div className="w-20 h-20 bg-brand-teal/5 rounded-full flex items-center justify-center mb-6 border border-brand-teal/10">
            <FlaskConical className="w-10 h-10 text-brand-teal" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Flashcards Yet</h3>
          <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-8">
            Let Lumina AI synthesize key findings from your learning modules into high-yield medical flashcards.
          </p>
          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="px-8 py-3 bg-brand-teal text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-brand-teal-dark shadow-xl shadow-brand-teal/20 transition-all active:scale-95"
          >
            Synthesize Knowledge
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-2xl perspective-1000 h-[350px]">
             <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
                className="relative w-full h-full cursor-pointer"
                style={{ transformStyle: 'preserve-3d' }}
                onClick={() => setIsFlipped(!isFlipped)}
             >
                {/* Front */}
                <div 
                  className="absolute inset-0 bg-bg-card border border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-2xl"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                   <span className="absolute top-6 left-6 text-[10px] font-mono text-brand-teal uppercase tracking-widest">Question</span>
                   <p className="text-xl font-medium text-white leading-relaxed">
                      {currentCard.question}
                   </p>
                   <span className="absolute bottom-6 text-[10px] text-slate-500 flex items-center gap-2">
                      Click to flip <RefreshCcw size={10} />
                   </span>
                </div>
                
                {/* Back */}
                <div 
                  className="absolute inset-0 bg-brand-teal/[0.03] border-2 border-brand-teal/30 rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-2xl"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                   <span className="absolute top-6 left-6 text-[10px] font-mono text-brand-teal uppercase tracking-widest">Answer</span>
                   <p className="text-xl font-medium text-slate-200 leading-relaxed">
                      {currentCard.answer}
                   </p>
                   <div className="absolute bottom-6 flex gap-4">
                      <button className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-[10px] font-bold border border-red-500/20 hover:bg-red-500 hover:text-white transition-all uppercase">Difficult</button>
                      <button className="px-4 py-2 bg-brand-teal/10 text-brand-teal rounded-lg text-[10px] font-bold border border-brand-teal/20 hover:bg-brand-teal hover:text-white transition-all uppercase">Mastered</button>
                   </div>
                </div>
             </motion.div>
          </div>

          <div className="mt-12 flex items-center gap-8">
             <div className="text-sm font-mono text-slate-500">
                <span className="text-white">{currentIndex + 1}</span> / {filteredCards.length}
             </div>
             <button 
                onClick={handleNext}
                className="group flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-sm font-bold hover:bg-white/10 transition-all active:scale-95"
             >
                Next Concept <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>
      )}

      <footer className="mt-8 grid grid-cols-3 gap-4">
         <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
               <Clock size={20} />
            </div>
            <div>
               <p className="text-xs text-slate-500">Study Streak</p>
               <p className="text-sm font-bold text-white">4 Days</p>
            </div>
         </div>
         <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center text-brand-teal">
               <Heart size={20} />
            </div>
            <div>
               <p className="text-xs text-slate-500">Mastered</p>
               <p className="text-sm font-bold text-white">128 Cards</p>
            </div>
         </div>
         <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
               <BookOpen size={20} />
            </div>
            <div>
               <p className="text-xs text-slate-500">Retention</p>
               <p className="text-sm font-bold text-white">92%</p>
            </div>
         </div>
      </footer>
    </div>
  );
}
