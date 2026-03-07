
import React, { useState, useMemo, useRef } from 'react';
import { Country } from '../types';
import { COUNTRIES } from '../constants';
import { PlaneTakeoff, PlaneLanding, MousePointer2 } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';

interface InteractiveMapProps {
  origin: Country | null;
  destination: Country | null;
  onSelectOrigin: (country: Country) => void;
  onSelectDestination: (country: Country) => void;
  theme: 'light' | 'dark';
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  origin, 
  destination, 
  onSelectOrigin, 
  onSelectDestination,
  theme 
}) => {
  const [popup, setPopup] = useState<{ x: number; y: number; country: Country } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const yGrid = useTransform(scrollYProgress, [0, 1], [-20, 20]);
  const yGradient = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const scaleContent = useTransform(scrollYProgress, [0, 0.5, 1], [0.98, 1, 0.98]);

  const handleCountryClick = (e: React.MouseEvent, country: Country) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopup({ 
      x: rect.left + rect.width / 2, 
      y: rect.top, 
      country 
    });
  };

  const closePopup = () => setPopup(null);

  return (
    <div 
      ref={containerRef}
      className={`
        relative w-full aspect-[16/9] rounded-3xl border border-slate-200 dark:border-slate-800 
        overflow-hidden group shadow-inner transition-colors duration-500
        bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 
        dark:from-slate-950 dark:via-slate-900 dark:to-slate-800
      `} 
      onClick={closePopup}
    >
      <motion.div 
        style={{ y: yGradient }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05),transparent_70%)] pointer-events-none" 
      />
      <motion.div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', 
          backgroundSize: '30px 30px',
          y: yGrid
        }} 
      />

      <motion.div 
        style={{ scale: scaleContent }}
        className="absolute inset-0 flex items-center justify-center p-8"
      >
        <div className="text-center w-full">
            <div className="mb-4 flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 ring-8 ring-emerald-500/5">
                    <MousePointer2 className="w-8 h-8 text-emerald-500 animate-bounce" />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-200">الخريطة التفاعلية</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">انقر على أي دولة لتحديدها كمصدر أو وجهة.</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6 max-w-2xl mx-auto">
                {COUNTRIES.slice(0, 18).map(country => {
                    const isOrigin = origin?.code === country.code;
                    const isDest = destination?.code === country.code;
                    const isActive = isOrigin || isDest;
                    
                    return (
                        <button
                            key={country.code}
                            onClick={(e) => handleCountryClick(e, country)}
                            style={{ 
                              borderColor: isActive ? country.color : 'transparent',
                              boxShadow: isActive ? `0 0 15px ${country.color}40` : 'none'
                            }}
                            className={`
                                flex flex-col items-center p-2.5 sm:p-3 rounded-2xl border-2 transition-all duration-300 relative
                                ${isActive ? 'bg-white dark:bg-slate-900 scale-110 z-10' : 
                                  'bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'}
                            `}
                        >
                            <span className="text-2xl mb-1 filter drop-shadow-sm">{country.flag}</span>
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">{country.code}</span>
                            
                            {isOrigin && <div className="absolute -top-2 -right-2 bg-emerald-600 text-white p-1 rounded-full shadow-md animate-in zoom-in-50"><PlaneTakeoff className="w-3 h-3" /></div>}
                            {isDest && <div className="absolute -top-2 -right-2 bg-rose-600 text-white p-1 rounded-full shadow-md animate-in zoom-in-50"><PlaneLanding className="w-3 h-3" /></div>}
                        </button>
                    )
                })}
            </div>
        </div>
      </motion.div>

      {popup && (
        <div 
          className="fixed z-[100] animate-in zoom-in-95 fade-in duration-200 -translate-x-1/2 -translate-y-[110%]"
          style={{ top: popup.y, left: popup.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-2 shadow-2xl rounded-2xl p-2 min-w-[160px]"
            style={{ borderColor: popup.country.color }}
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <span className="text-xl">{popup.country.flag}</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">{popup.country.nameAr}</span>
            </div>
            <button 
                onClick={() => { onSelectOrigin(popup.country); closePopup(); }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-right"
            >
                <span className="text-xs font-bold text-emerald-600">تحديد كمصدر</span>
                <PlaneTakeoff className="w-4 h-4 text-emerald-500" />
            </button>
            <button 
                onClick={() => { onSelectDestination(popup.country); closePopup(); }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-right"
            >
                <span className="text-xs font-bold text-rose-600">تحديد كوجهة</span>
                <PlaneLanding className="w-4 h-4 text-rose-500" />
            </button>
          </div>
          <div className="w-3 h-3 bg-white dark:bg-slate-900 border-r border-b rotate-45 mx-auto -mt-1.5 shadow-sm" style={{ borderColor: popup.country.color }} />
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
