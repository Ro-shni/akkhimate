import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter',
});

interface MermaidProps {
  chart: string;
}

export const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    
    const renderChart = async () => {
      if (!ref.current || !chart) return;
      
      try {
        // Clear previous content
        ref.current.innerHTML = '<div class="flex items-center justify-center p-8"><div class="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-teal"></div></div>';
        
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        
        if (isMounted && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (error) {
        console.error('Mermaid render error:', error);
        if (isMounted && ref.current) {
          ref.current.innerHTML = '<pre class="text-red-500 text-[10px] bg-red-500/10 p-2 rounded">Diagram render error</pre>';
        }
      }
    };
    
    renderChart();
    
    return () => {
      isMounted = false;
    };
  }, [chart]);

  return (
    <div className="mermaid-wrapper my-6 bg-black/40 p-6 rounded-2xl border border-white/10 flex justify-center overflow-x-auto shadow-inner">
      <div ref={ref} className="mermaid-render-target w-full flex justify-center" />
    </div>
  );
};
