import React, { useState } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  ChevronRight, 
  Library, 
  MessageSquare, 
  Trophy,
  History,
  LayoutDashboard,
  GraduationCap,
  Plus,
  CalendarDays,
  Layers,
  Map,
  Calendar
} from 'lucide-react';
import { LearningModule, ViewType, Subject, ChatSession } from '../types';
import { cn, formatDate } from '../lib/utils';
import { FileUploader } from './FileUploader';

interface SidebarProps {
  subjects: Subject[];
  activeSubjectId: string;
  onSubjectSelect: (id: string) => void;
  onAddSubject: (name: string) => void;
  modules: LearningModule[];
  onUpload: (module: LearningModule) => void;
  onRemove: (id: string) => void;
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  chatSessions: ChatSession[];
  activeChatId: string | null;
  onChatSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
}

export function Sidebar({ 
  subjects, 
  activeSubjectId, 
  onSubjectSelect, 
  onAddSubject, 
  modules, 
  onUpload, 
  onRemove, 
  activeView, 
  onViewChange,
  chatSessions,
  activeChatId,
  onChatSelect,
  onNewChat,
  onDeleteChat
}: SidebarProps) {
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubjectName.trim()) {
      onAddSubject(newSubjectName.trim());
      setNewSubjectName('');
      setIsAddingSubject(false);
    }
  };

  return (
    <aside className="w-64 h-full flex flex-shrink-0 border-r border-white/10 bg-bg-side flex-col">
      <div className="p-6">
        <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
          <div className="w-3 h-3 bg-brand-teal rounded-full"></div>
          LUMINA LEARN
        </h1>
      </div>

      <div className="px-4 py-2 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Subjects</span>
            <button 
              onClick={() => setIsAddingSubject(!isAddingSubject)}
              className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-white transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
          
          {isAddingSubject && (
            <form onSubmit={handleAddSubject} className="px-2 mb-3">
              <input
                autoFocus
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Subject name..."
                className="w-full bg-bg-card border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-teal/50"
              />
            </form>
          )}

          <div className="space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar px-1">
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => onSubjectSelect(s.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs group text-left",
                  activeSubjectId === s.id 
                    ? "bg-white/5 text-white" 
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <div 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: s.color }} 
                />
                <span className="truncate">{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/10 mx-2" />

        <FileUploader 
          subjects={subjects} 
          activeSubjectId={activeSubjectId} 
          onUpload={onUpload} 
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 mt-4 space-y-4">
        <div className="space-y-1">
           <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold px-4 mb-2">Workspace</div>
           <div className="space-y-1">
             <NavItem 
               icon={MessageSquare} 
               label="Knowledge Chat" 
               active={activeView === 'chat'} 
               onClick={() => onViewChange('chat')} 
             />
             
             {activeView === 'chat' && (
               <div className="pl-6 pr-2 space-y-1 animate-in slide-in-from-left-2 duration-200">
                 <div className="flex items-center justify-between px-2 mb-1">
                   <span className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">Sessions</span>
                   <button 
                    onClick={onNewChat}
                    className="p-1 hover:bg-white/5 rounded text-brand-teal transition-colors"
                    title="New Chat Tab"
                   >
                     <Plus size={10} />
                   </button>
                 </div>
                 <div className="space-y-0.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                   {chatSessions.map(session => (
                     <div key={session.id} className="group flex items-center gap-1">
                        <button
                          onClick={() => onChatSelect(session.id)}
                          className={cn(
                            "flex-1 text-left px-3 py-1.5 rounded-lg text-xs truncate transition-all",
                            activeChatId === session.id 
                              ? "bg-white/5 text-white font-medium border border-white/5 shadow-sm" 
                              : "text-slate-500 hover:text-slate-300"
                          )}
                        >
                          {session.name}
                        </button>
                        {chatSessions.length > 1 && (
                          <button 
                            onClick={() => onDeleteChat(session.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </div>
           
           <NavItem 
             icon={Map} 
             label="Study Roadmap" 
             active={activeView === 'roadmap'} 
             onClick={() => onViewChange('roadmap')} 
           />
           <NavItem 
             icon={GraduationCap} 
             label="Practice Tests" 
             active={activeView === 'tests'} 
             onClick={() => onViewChange('tests')} 
           />
           <NavItem 
             icon={Calendar} 
             label="Exam Schedule" 
             active={activeView === 'schedule'} 
             onClick={() => onViewChange('schedule')} 
           />
           <NavItem 
             icon={Layers} 
             label="Flashcards" 
             active={activeView === 'flashcards'} 
             onClick={() => onViewChange('flashcards')} 
           />
        </div>

        <div className="space-y-1">
           <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold px-4 mb-2">Tracking</div>
           <NavItem 
             icon={CalendarDays} 
             label="Study Calendar" 
             active={activeView === 'calendar'} 
             onClick={() => onViewChange('calendar')} 
           />
        </div>

        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold px-4 mb-2 mt-6">Active Sources</div>
        {modules.map((mod) => (
          <div 
            key={mod.id} 
            className="group flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/5 relative border border-transparent hover:border-white/5 transition-all text-xs"
          >
            <div className={cn("text-sm", mod.type === 'pdf' ? "text-brand-teal" : "text-slate-400")}>
              {mod.type === 'pdf' ? "📄" : "📷"}
            </div>
            <div className="text-slate-300 truncate transition-colors group-hover:text-white capitalize lowercase first-letter:uppercase">{mod.name}</div>
            <button 
              onClick={() => onRemove(mod.id)}
              className="ml-auto opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {modules.length === 0 && (
          <p className="px-4 py-2 text-[10px] text-slate-600 italic">No sources in this subject</p>
        )}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="bg-gradient-to-br from-indigo-600/10 to-brand-teal/10 p-4 rounded-xl border border-white/5">
          <p className="text-[10px] text-slate-400 leading-relaxed italic">
            "Your MBBS study buddy is ready for questions."
          </p>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon: Icon, label, active, onClick }: { 
  icon: any, 
  label: string, 
  active?: boolean, 
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm truncate",
        active 
          ? "bg-white/5 border border-white/5 text-white" 
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon size={16} className={cn(active ? "text-brand-teal" : "text-slate-500 group-hover:text-brand-teal")} />
      <span>{label}</span>
    </button>
  );
}
