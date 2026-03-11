
import React, { useEffect, useState, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { motion, AnimatePresence } from 'motion/react';
import { Country } from '../types';
import { COUNTRIES } from '../constants';
import { PlaneTakeoff, PlaneLanding, X, RotateCcw } from 'lucide-react';

interface WorldMapProps {
  selectedOrigin: Country | null;
  selectedDestination: Country | null;
  onSelectOrigin: (country: Country) => void;
  onSelectDestination: (country: Country) => void;
  onReset?: () => void;
}

const WorldMap: React.FC<WorldMapProps> = ({
  selectedOrigin,
  selectedDestination,
  onSelectOrigin,
  onSelectDestination,
  onReset,
}) => {
  const [geographies, setGeographies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; country: Country } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch("https://unpkg.com/world-atlas@2.0.2/countries-110m.json")
      .then(response => response.json())
      .then(data => {
        const countries = (feature(data, data.objects.countries) as any).features;
        setGeographies(countries);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const projection = d3.geoEqualEarth()
    .scale(160)
    .translate([400, 250]);

  const pathGenerator = d3.geoPath().projection(projection);

  const handleCountryClick = (event: React.MouseEvent, geo: any) => {
    event.stopPropagation();
    const countryName = geo.properties.name;
    // Try to match with our COUNTRIES list
    const matchedCountry = COUNTRIES.find(c => 
      c.nameEn.toLowerCase() === countryName.toLowerCase() || 
      c.code.toLowerCase() === countryName.toLowerCase()
    );

    if (matchedCountry) {
      const [x, y] = d3.pointer(event, containerRef.current);
      setTooltip({ x, y, country: matchedCountry });
    }
  };

  const isOrigin = (geo: any) => {
    const countryName = geo.properties.name;
    return selectedOrigin?.nameEn.toLowerCase() === countryName.toLowerCase();
  };

  const isDestination = (geo: any) => {
    const countryName = geo.properties.name;
    return selectedDestination?.nameEn.toLowerCase() === countryName.toLowerCase();
  };

  return (
    <div ref={containerRef} className="relative w-full aspect-[16/10] bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner group flex items-center justify-center">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">جاري تحميل الخريطة...</span>
          </motion.div>
        ) : (
          <motion.svg
            key="map"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            viewBox="0 0 800 500"
            className="w-full h-full"
            onClick={() => setTooltip(null)}
          >
            <g className="countries">
              {geographies.map((geo, i) => {
                const countryName = geo.properties.name;
                const origin = isOrigin(geo);
                const destination = isDestination(geo);
                const active = origin || destination;
                const hovered = hoveredCountry === countryName;

                return (
                  <motion.path
                    key={`path-${i}`}
                    d={pathGenerator(geo) || ""}
                    className="cursor-pointer transition-colors duration-300"
                    fill={
                      origin ? "#059669" : 
                      destination ? "#e11d48" : 
                      hovered ? "#334155" : 
                      "#94a3b833"
                    }
                    stroke={active ? "#fff" : "#cbd5e144"}
                    strokeWidth={active ? 1.5 : 0.5}
                    onMouseEnter={() => setHoveredCountry(countryName)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    onClick={(e) => handleCountryClick(e, geo)}
                    initial={false}
                    animate={{
                      fill: origin ? "#059669" : 
                            destination ? "#e11d48" : 
                            hovered ? (active ? (origin ? "#047857" : "#be123c") : "#475569") : 
                            (active ? (origin ? "#059669" : "#e11d48") : "#94a3b833")
                    }}
                  />
                );
              })}
            </g>
            <g className="labels pointer-events-none">
              {geographies.map((geo, i) => {
                const centroid = pathGenerator.centroid(geo);
                if (!centroid || isNaN(centroid[0]) || isNaN(centroid[1])) return null;
                
                const countryName = geo.properties.name;
                const isSelected = isOrigin(geo) || isDestination(geo);
                const isHovered = hoveredCountry === countryName;
                const area = pathGenerator.area(geo);
                if (area < 500 && !isHovered && !isSelected) return null;

                return (
                  <text
                    key={`label-${i}`}
                    x={centroid[0]}
                    y={centroid[1]}
                    textAnchor="middle"
                    className={`
                      text-[6px] font-bold transition-all duration-300
                      ${isSelected ? 'fill-white scale-110' : 'fill-slate-500/80 dark:fill-slate-400/60'}
                      ${isHovered ? 'fill-slate-900 dark:fill-white scale-105 opacity-100' : ''}
                    `}
                    style={{ 
                      textShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
                      pointerEvents: 'none'
                    }}
                  >
                    {countryName}
                  </text>
                );
              })}
            </g>
          </motion.svg>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 min-w-[180px]"
            style={{ 
              left: tooltip.x, 
              top: tooltip.y, 
              transform: 'translate(-50%, -110%)' 
            }}
          >
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">{tooltip.country.flag}</span>
                <span className="font-bold text-sm dark:text-white">{tooltip.country.nameAr}</span>
              </div>
              <button onClick={() => setTooltip(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => { onSelectOrigin(tooltip.country); setTooltip(null); }}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors group"
              >
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">تحديد كمصدر</span>
                <PlaneTakeoff className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => { onSelectDestination(tooltip.country); setTooltip(null); }}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors group"
              >
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">تحديد كوجهة</span>
                <PlaneLanding className="w-4 h-4 text-rose-500 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4 flex gap-2">
        {(selectedOrigin || selectedDestination) && onReset && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReset();
            }}
            className="flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 group"
            title="إعادة تعيين الخريطة"
          >
            <RotateCcw className="w-4 h-4 text-slate-500 group-hover:text-emerald-500 transition-colors" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">إعادة تعيين</span>
          </button>
        )}
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-3 h-3 rounded-full bg-emerald-600" />
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">المصدر</span>
        </div>
        <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-3 h-3 rounded-full bg-rose-600" />
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">الوجهة</span>
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
