
import React, { useState, useEffect, useRef, useId, useMemo } from 'react';
import { Country } from '../types';
import { ChevronDown, Search, Check, X } from 'lucide-react';

interface CountryComboboxProps {
  label: string;
  countries: Country[];
  selectedCountry: Country | null;
  onSelect: (country: Country) => void;
  placeholder?: string;
  type?: 'origin' | 'destination';
  language?: 'ar' | 'en';
}

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\w\s\u0600-\u06FF]/g, '')
    .trim();
};

const levenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[b.length][a.length];
};

const CountryCombobox: React.FC<CountryComboboxProps> = ({
  label,
  countries,
  selectedCountry,
  onSelect,
  placeholder,
  type = 'origin',
  language = 'ar'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const uniqueId = useId();
  const labelId = `label-${uniqueId}`;
  const listboxId = `listbox-${uniqueId}`;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchableCountries = useMemo(() => {
    return countries.map(country => ({
      ...country,
      normAr: normalizeText(country.nameAr),
      normEn: normalizeText(country.nameEn)
    }));
  }, [countries]);

  const filteredCountries = useMemo(() => {
    const query = normalizeText(debouncedQuery);
    if (!query) return countries;

    return searchableCountries
      .map(item => {
        const { normAr, normEn, ...country } = item;
        let score = 1000;
        let match = false;

        // 1. Exact match on code (highest priority)
        if (country.code.toLowerCase() === query) {
          score = 0;
          match = true;
        }
        // 2. Exact match on normalized names
        else if (normAr === query || normEn === query) {
          score = 1;
          match = true;
        }
        // 3. Starts with
        else if (normAr.startsWith(query) || normEn.startsWith(query)) {
          score = 10;
          match = true;
        }
        // 4. Includes
        else if (normAr.includes(query) || normEn.includes(query)) {
          score = 20;
          match = true;
        }
        // 5. Word-order agnostic match (e.g., "States United" -> "United States")
        else {
          const queryWords = query.split(/\s+/).filter(Boolean);
          if (queryWords.length > 1) {
            const allWordsMatchAr = queryWords.every(qw => normAr.includes(qw));
            const allWordsMatchEn = queryWords.every(qw => normEn.includes(qw));
            if (allWordsMatchAr || allWordsMatchEn) {
              score = 30;
              match = true;
            }
          }
        }

        // 6. Fuzzy match (lowest priority)
        if (!match && query.length >= 3) {
          const distAr = levenshteinDistance(query, normAr);
          const distEn = levenshteinDistance(query, normEn);
          const threshold = Math.floor(query.length * 0.4) + 1; // Slightly more relaxed threshold
          
          if (distAr <= threshold || distEn <= threshold) {
            score = 100 + Math.min(distAr, distEn);
            match = true;
          }
        }

        return { country, score, match };
      })
      .filter(item => item.match)
      .sort((a, b) => a.score - b.score)
      .map(item => item.country);
  }, [debouncedQuery, searchableCountries, countries]);

  const handleSelect = (country: Country) => {
    onSelect(country);
    setIsOpen(false);
    setSearchQuery('');
    setDebouncedQuery('');
  };

  const dynamicStyles = useMemo(() => {
    if (!selectedCountry) return {};
    return {
      borderColor: selectedCountry.color,
      boxShadow: isOpen ? `0 0 0 4px ${selectedCountry.color}20` : 'none'
    };
  }, [selectedCountry, isOpen]);

  const resolvedPlaceholder = placeholder || (
    language === 'ar' 
      ? (type === 'origin' ? 'اختر دولة الجنسية / المغادرة' : 'اختر وجهة السفر المقصودة')
      : (type === 'origin' ? 'Select country of citizenship / departure' : 'Select intended travel destination')
  );

  return (
    <div className="w-full relative group" ref={wrapperRef} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <label 
        id={labelId}
        className={`block text-[10px] font-black mb-1.5 uppercase tracking-widest ${selectedCountry ? 'text-slate-900 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'} ${language === 'ar' ? 'text-right' : 'text-left'}`}
      >
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        style={dynamicStyles}
        className={`
          w-full flex items-center justify-between 
          bg-white dark:bg-slate-900 border rounded-2xl px-4 py-3 min-h-[64px]
          transition-all duration-300 relative z-10 focus:outline-none
          ${language === 'ar' ? 'text-right' : 'text-left'}
          ${!selectedCountry ? 'border-slate-200 dark:border-slate-800 hover:border-emerald-400' : 'border-2'}
        `}
      >
        <span className={`flex items-center gap-3 truncate w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
          {selectedCountry ? (
            <>
              <div className="relative">
                <span className="text-2xl drop-shadow-sm">{selectedCountry.flag}</span>
                <div 
                  className={`absolute -bottom-1 ${language === 'ar' ? '-right-1' : '-left-1'} w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm`} 
                  style={{ backgroundColor: selectedCountry.color }} 
                />
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="font-bold text-slate-900 dark:text-white truncate">
                  {language === 'ar' ? selectedCountry.nameAr : selectedCountry.nameEn}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-black" style={{ color: selectedCountry.color }}>
                  {language === 'ar' ? selectedCountry.nameEn : selectedCountry.nameAr}
                </span>
              </div>
            </>
          ) : (
            <span className="text-slate-400 font-medium">{resolvedPlaceholder}</span>
          )}
        </span>
        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'text-slate-300'}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="relative">
              <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
              <input
                ref={inputRef}
                type="text"
                className={`w-full ${language === 'ar' ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20`}
                placeholder={language === 'ar' ? "ابحث باسم الدولة..." : "Search by country name..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    inputRef.current?.focus();
                  }}
                  className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <ul id={listboxId} role="listbox" className="max-h-72 overflow-y-auto custom-scrollbar">
            {filteredCountries.length === 0 ? (
              <li className="px-6 py-10 text-center text-slate-400 text-sm italic">
                {language === 'ar' ? 'لا توجد نتائج مطابقة' : 'No matching results'}
              </li>
            ) : (
              filteredCountries.map((country) => (
                <li key={country.code}>
                  <button
                    onClick={() => handleSelect(country)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors
                      ${language === 'ar' ? 'text-right' : 'text-left'}
                      ${selectedCountry?.code === country.code ? 'bg-slate-50 dark:bg-slate-800' : ''}
                    `}
                  >
                    <span className="flex items-center gap-3">
                      <div className="relative">
                        <span className="text-xl">{country.flag}</span>
                        <div className={`absolute -top-1 ${language === 'ar' ? '-left-1' : '-right-1'} w-2 h-2 rounded-full shadow-sm`} style={{ backgroundColor: country.color }} />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {language === 'ar' ? country.nameAr : country.nameEn}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold" style={{ color: `${country.color}CC` }}>
                          {language === 'ar' ? country.nameEn : country.nameAr}
                        </span>
                      </div>
                    </span>
                    {selectedCountry?.code === country.code && <Check className="w-4 h-4" style={{ color: country.color }} />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CountryCombobox;
