import React, { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Map, GraduationCap, Calendar, Sparkles, Loader2, Download, Copy, Check, BrainCircuit, Filter, FileText } from 'lucide-react';
import { LearningModule, ViewType } from '../types';
import { generateStudyArtifact } from '../services/gemini';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Mermaid } from './Mermaid';

interface TutorViewProps {
  modules: LearningModule[];
  activeView: ViewType;
}

export function TutorView({ modules, activeView }: TutorViewProps) {
  const initialTab = (['roadmap', 'tests', 'schedule'].includes(activeView) ? activeView : 'roadmap') as Exclude<ViewType, 'chat' | 'calendar' | 'flashcards'>;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>(modules.map(m => m.id));

  React.useEffect(() => {
    if (['roadmap', 'tests', 'schedule'].includes(activeView)) {
      setActiveTab(activeView as any);
    }
  }, [activeView]);

  // Sync selected modules when new ones are added
  React.useEffect(() => {
    const existingIds = modules.map(m => m.id);
    setSelectedModuleIds(prev => {
      const stillValid = prev.filter(id => existingIds.includes(id));
      const newlyAdded = existingIds.filter(id => !prev.includes(id));
      return [...stillValid, ...newlyAdded];
    });
  }, [modules]);

  const [results, setResults] = useState<Partial<Record<Exclude<ViewType, 'chat'>, string>>>({});
  const [loading, setLoading] = useState<Partial<Record<Exclude<ViewType, 'chat'>, boolean>>>({});
  const [copied, setCopied] = useState(false);

  const tabs = [
    { id: 'roadmap' as const, label: 'Roadmap', icon: Map, color: 'text-brand-teal' },
    { id: 'tests' as const, label: 'Practice Exam', icon: GraduationCap, color: 'text-indigo-400' },
    { id: 'schedule' as const, label: 'Schedule', icon: Calendar, color: 'text-purple-400' },
  ];

  const toggleModule = (id: string) => {
    setSelectedModuleIds(prev => 
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  const handleGenerate = async (type: Exclude<ViewType, 'chat'>) => {
    const activeModules = modules.filter(m => selectedModuleIds.includes(m.id));
    if (activeModules.length === 0) return;
    
    setLoading(prev => ({ ...prev, [type]: true }));
    try {
      const artifactType = type === 'roadmap' ? 'roadmap' : type === 'tests' ? 'test' : 'schedule';
      const response = await generateStudyArtifact(artifactType, activeModules);
      setResults(prev => ({ ...prev, [type]: response }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleCopy = () => {
    const text = results[activeTab];
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex gap-8 h-full p-8 max-w-7xl mx-auto overflow-hidden">
      {/* Left Column: Artifact Controls */}
      <div className="w-72 shrink-0 space-y-8 flex flex-col h-full">
        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Tutor Controls</h3>
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm",
                  activeTab === tab.id 
                    ? "bg-white/5 border border-white/10 text-white shadow-xl" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                )}
              >
                <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? tab.color : "text-current")} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Context Filter</h3>
            <span className="text-[9px] text-brand-teal px-1.5 py-0.5 bg-brand-teal/10 rounded-md font-mono">
              {selectedModuleIds.length}/{modules.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
            {modules.map(mod => (
              <button
                key={mod.id}
                onClick={() => toggleModule(mod.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] transition-all group border",
                  selectedModuleIds.includes(mod.id)
                    ? "bg-white/5 border-white/10 text-slate-200"
                    : "border-transparent text-slate-600 hover:text-slate-400"
                )}
              >
                <div className={cn(
                  "w-3 h-3 rounded flex items-center justify-center transition-colors",
                  selectedModuleIds.includes(mod.id) ? "bg-brand-teal" : "border border-slate-700"
                )}>
                  {selectedModuleIds.includes(mod.id) && <Check size={8} className="text-black font-bold" />}
                </div>
                <span className="truncate flex-1 text-left">{mod.name}</span>
              </button>
            ))}
            {modules.length === 0 && (
              <div className="text-[11px] text-slate-600 italic px-2">No modules uploaded yet.</div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Progress Monitor</h3>
          <div className="bg-white/10 rounded-2xl p-5 border border-white/10 space-y-4 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-end">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">Neural Mastery</span>
              <span className="text-sm font-mono text-brand-teal">65%</span>
            </div>
            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
              <div className="h-full bg-brand-teal w-[65%] shadow-[0_0_15px_rgba(20,184,166,0.5)] transition-all duration-1000" />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed italic">
              Knowledge base contains {modules.length} active sources. Analysis depth matches academic rigor.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Display Area */}
      <div className="flex-1 bg-bg-card/40 rounded-3xl border border-white/10 overflow-hidden flex flex-col shadow-2xl backdrop-blur-md">
        <header className="px-8 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-teal/10 flex items-center justify-center border border-brand-teal/20">
              <Sparkles size={16} className="text-brand-teal" />
            </div>
            <div>
              <h3 className="text-sm font-bold capitalize tracking-tight text-white">{activeTab} Output</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Lumina Intelligence Engine</p>
            </div>
          </div>
          <div className="flex gap-3">
            {results[activeTab] && !loading[activeTab] && (
              <button 
                onClick={handleCopy}
                className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white border border-transparent hover:border-white/10"
                title="Copy to clipboard"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            )}
            <button 
              onClick={() => handleGenerate(activeTab)}
              disabled={selectedModuleIds.length === 0 || loading[activeTab]}
              className="px-5 py-2.5 bg-brand-teal border border-brand-teal/50 text-black rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-brand-teal/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(20,184,166,0.2)]"
            >
              {loading[activeTab] ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin" />
                  Synthesizing...
                </span>
              ) : results[activeTab] ? "Regenerate Analysis" : "Generate Analysis"}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
          <AnimatePresence mode="wait">
            {!results[activeTab] && !loading[activeTab] ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="h-full flex flex-col items-center justify-center text-center p-12"
              >
                <div className="w-20 h-20 bg-brand-teal/5 rounded-3xl flex items-center justify-center mb-8 border border-brand-teal/10 relative">
                  <div className="absolute inset-0 bg-brand-teal/20 blur-2xl rounded-full" />
                  <BrainCircuit className="w-10 h-10 text-brand-teal relative z-10 animate-pulse" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Neural Core Idle</h4>
                <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-8">
                  Select your learning modules from the context filter and initialize the assessment engine.
                </p>
                <div className="flex gap-4">
                   <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                     <Check size={12} className="text-brand-teal" /> MCQ Generation
                   </div>
                   <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                     <Check size={12} className="text-brand-teal" /> Clinical Analysis
                   </div>
                </div>
              </motion.div>
            ) : loading[activeTab] ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center"
              >
                <div className="relative w-32 h-32 mb-8">
                   <div className="absolute inset-0 border-4 border-brand-teal/10 rounded-full" />
                   <div className="absolute inset-0 border-4 border-t-brand-teal rounded-full animate-spin" />
                   <div className="absolute inset-4 border-2 border-brand-teal/20 rounded-full animate-reverse-spin" />
                   <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-brand-teal animate-pulse" />
                </div>
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-[0.3em] mb-2">Analyzing Context</h4>
                <p className="text-xs text-brand-teal/60 font-mono animate-pulse">Running advanced medical heuristics...</p>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="markdown-body academic-view">
                  <Markdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        if (!inline && match && match[1] === 'mermaid') {
                          return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                        }
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {results[activeTab]}
                  </Markdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
