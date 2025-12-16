
import React, { useState, useEffect, useRef, useId, useMemo } from 'react';
import { Country } from '../types';
import { ChevronDown, Search, Check, X } from 'lucide-react';

interface CountryComboboxProps {
  label: string;
  countries: Country[];
  selectedCountry: Country | null;
  onSelect: (country: Country) => void;
  placeholder?: string;
}

// --- Fuzzy Search Helpers ---

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
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
};

const CountryCombobox: React.FC<CountryComboboxProps> = ({
  label,
  countries,
  selectedCountry,
  onSelect,
  placeholder = "اختر دولة..."
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
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Pre-compute normalized country names for performance
  const searchableCountries = useMemo(() => {
    return countries.map(country => ({
      ...country,
      normAr: normalizeText(country.nameAr),
      normEn: normalizeText(country.nameEn)
    }));
  }, [countries]);

  // Enhanced Fuzzy Search Logic
  const filteredCountries = useMemo(() => {
    const query = normalizeText(debouncedQuery);
    
    if (!query) return countries;

    return searchableCountries
      .map(item => {
        const { normAr, normEn, ...country } = item;
        let score = 999;
        let match = false;

        // 1. Exact Match (Highest Priority)
        if (normAr === query || normEn === query) {
            score = 0;
            match = true;
        }
        // 2. Starts With
        else if (normAr.startsWith(query) || normEn.startsWith(query)) {
            score = 10;
            match = true;
        }
        // 3. Contains
        else if (normAr.includes(query) || normEn.includes(query)) {
             score = 20;
             match = true;
        }
        // 4. Fuzzy Match (Levenshtein) - Handle Typos
        else if (query.length >= 2) {
            const distAr = levenshteinDistance(query, normAr);
            const distEn = levenshteinDistance(query, normEn);
            
            // Adaptive threshold based on query length
            const threshold = Math.floor(query.length * 0.4) + 1; 

            if (distAr <= threshold || distEn <= threshold) {
                 score = 30 + Math.min(distAr, distEn);
                 match = true;
            } else {
                 // 5. Word-based Fuzzy Match (e.g. "States" in "United States")
                const words = [...normAr.split(' '), ...normEn.split(' ')];
                let bestWordDist = 100;
                
                for (const word of words) {
                    if (Math.abs(word.length - query.length) > 2) continue;
                    const d = levenshteinDistance(query, word);
                    if (d < bestWordDist) bestWordDist = d;
                }

                if (bestWordDist <= 1) { 
                    score = 40 + bestWordDist;
                    match = true;
                }
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

  return (
    <div className="w-full relative" ref={wrapperRef}>
      <label 
        id={labelId}
        className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
      >
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-labelledby={labelId}
        className={`
          w-full flex items-center justify-between 
          bg-white dark:bg-slate-800 border rounded-xl px-4 py-2.5 text-right min-h-[56px]
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
          ${isOpen ? 'border-emerald-500 ring-2 ring-emerald-500/20 dark:ring-emerald-900/40' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600'}
        `}
      >
        <span className={`flex items-center gap-3 ${!selectedCountry ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'} text-right overflow-hidden`}>
          {selectedCountry ? (
            <>
              <span className="text-3xl shrink-0 leading-none filter drop-shadow-sm" aria-hidden="true">{selectedCountry.flag}</span>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="font-bold truncate w-full text-base text-slate-800 dark:text-slate-200 leading-tight">{selectedCountry.nameAr}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal truncate w-full">{selectedCountry.nameEn}</span>
              </div>
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown 
          className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top"
        >
          <div className="p-2 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                placeholder="ابحث باسم الدولة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="بحث عن دولة"
                aria-autocomplete="list"
                aria-controls={listboxId}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDebouncedQuery('');
                    inputRef.current?.focus();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  type="button"
                  aria-label="مسح البحث"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <ul 
            id={listboxId}
            role="listbox"
            aria-label={label}
            className="max-h-60 overflow-y-auto p-1 focus:outline-none scroll-smooth"
            tabIndex={-1}
          >
            {filteredCountries.length === 0 ? (
              <li className="p-4 text-center text-sm text-slate-500 dark:text-slate-400" role="status">
                {debouncedQuery !== searchQuery ? 'جاري البحث...' : 'لا توجد نتائج'}
              </li>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = selectedCountry?.code === country.code;
                return (
                  <li 
                    key={country.code} 
                    role="presentation"
                  >
                    <button
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(country)}
                      className={`
                        w-full flex items-center justify-between px-4 py-2.5 text-right text-sm rounded-lg
                        transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                        focus:outline-none focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:ring-1 focus:ring-emerald-500
                        ${isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-700 dark:text-slate-300'}
                      `}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-2xl leading-none" aria-hidden="true">{country.flag}</span>
                        <span>{country.nameAr}</span>
                        <span className="text-slate-400 dark:text-slate-500 text-xs hidden sm:inline">({country.nameEn})</span>
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-500" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CountryCombobox;
