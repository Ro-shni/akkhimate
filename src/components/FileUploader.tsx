import React, { useRef, useState } from 'react';
import { Upload, FileText, Image as ImageIcon, X, Loader2, ChevronDown } from 'lucide-react';
import { LearningModule, Subject } from '../types';
import { cn } from '../lib/utils';

interface FileUploaderProps {
  subjects: Subject[];
  activeSubjectId: string;
  onUpload: (module: LearningModule) => void;
}

export function FileUploader({ subjects, activeSubjectId, onUpload }: FileUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(activeSubjectId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update selectedSubjectId when activeSubjectId changes from outside
  React.useEffect(() => {
    setSelectedSubjectId(activeSubjectId);
  }, [activeSubjectId]);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        const module: LearningModule = {
          id: Math.random().toString(36).substr(2, 9),
          subjectId: selectedSubjectId,
          name: file.name,
          type: file.type.includes('pdf') ? 'pdf' : 'image',
          content: base64,
          mimeType: file.type,
          createdAt: Date.now(),
          thumbnail: file.type.includes('image') ? e.target?.result as string : undefined
        };
        onUpload(module);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
      setIsProcessing(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="relative">
        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="w-full bg-bg-card border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white appearance-none focus:outline-none focus:border-brand-teal/50 pr-10 cursor-pointer"
        >
          {subjects.map(s => (
            <option key={s.id} value={s.id}>Upload to: {s.name}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept=".pdf,image/*"
        className="hidden"
      />
      
      <button
        disabled={isProcessing}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 bg-brand-teal/10 border border-brand-teal/30 text-brand-teal rounded-xl text-sm font-medium hover:bg-brand-teal/20 transition-all group active:scale-95 shadow-lg shadow-brand-teal/5",
          isProcessing && "opacity-50 pointer-events-none"
        )}
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
        )}
        {isProcessing ? "Processing..." : "Add to Subject"}
      </button>
    </div>
  );
}
