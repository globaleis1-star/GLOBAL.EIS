
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, X, CloudOff, Moon, Sun, RotateCcw, Globe2, TrendingUp, Share2, CheckCircle2, Loader2, Bookmark, ShieldCheck, MessageCircle } from 'lucide-react';
import { COUNTRIES } from './constants';
import { Country, VisaInfoResponse, FavoriteVisa } from './types';
import { getVisaRequirements } from './services/geminiService';
import CountryCombobox from './components/CountryCombobox';
import VisaResult from './components/VisaResult';
import IconManager from './components/IconManager';
import WorldMap from './components/WorldMap';
import ErrorBoundary from './components/ErrorBoundary';
import FAQSection from './components/FAQSection';
import ChatBot from './src/components/ChatBot';
import { useAuth } from './src/context/AuthContext';
import { AlertTriangle } from 'lucide-react';
import { db } from './src/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, setDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';

const Spinner = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const FEATURED_DESTINATIONS = [
  {
    code: 'FR',
    name: 'فرنسا (شنغن)',
    flag: '🇫🇷',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80',
    summary: 'تحديثات شنغن: بدء تفعيل نظام ETIAS الرقمي بالكامل.',
    tagColor: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
  },
  {
    code: 'TR',
    name: 'تركيا',
    flag: '🇹🇷',
    image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=600&q=80',
    summary: 'تسهيلات جديدة لحاملي التأشيرات الأوروبية والأمريكية.',
    tagColor: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300'
  },
  {
    code: 'GB',
    name: 'المملكة المتحدة',
    flag: '🇬🇧',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80',
    summary: 'نظام eVisa: إلغاء البطاقات الورقية والانتقال للهوية الرقمية.',
    tagColor: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300'
  },
  {
    code: 'MY',
    name: 'ماليزيا',
    flag: '🇲🇾',
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=600&q=80',
    summary: 'إعفاءات مع اشتراط التسجيل المسبق عبر نظام MDAC.',
    tagColor: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300'
  },
  {
    code: 'JP',
    name: 'اليابان',
    flag: '🇯🇵',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80',
    summary: 'تأشيرة السياحة الإلكترونية (e-Visa) متاحة الآن للعديد من الجنسيات.',
    tagColor: 'text-pink-600 bg-pink-50 border-pink-200 dark:bg-pink-900/30 dark:border-pink-800 dark:text-pink-300'
  },
  {
    code: 'AE',
    name: 'الإمارات',
    flag: '🇦🇪',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80',
    summary: 'تأشيرات سياحية مرنة وتسهيلات للمقيمين في دول الخليج.',
    tagColor: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300'
  },
  {
    code: 'US',
    name: 'الولايات المتحدة',
    flag: '🇺🇸',
    image: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&w=600&q=80',
    summary: 'تحديثات على رسوم التأشيرة ونظام المواعيد الجديد.',
    tagColor: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
  },
  {
    code: 'KR',
    name: 'كوريا الجنوبية',
    flag: '🇰🇷',
    image: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=600&q=80',
    summary: 'تأشيرة K-ETA للمواطنين المعفيين وتسهيلات كبيرة للسياح.',
    tagColor: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
  },
  {
    code: 'TH',
    name: 'تايلاند',
    flag: '🇹🇭',
    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=600&q=80',
    summary: 'نظام DTV الجديد للإقامة الطويلة والعمل عن بعد.',
    tagColor: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-300'
  },
  {
    code: 'BR',
    name: 'البرازيل',
    flag: '🇧🇷',
    image: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=600&q=80',
    summary: 'اشتراطات جديدة لكشف الحساب البنكي لآخر 3 أشهر.',
    tagColor: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-300'
  },
  {
    code: 'EG',
    name: 'مصر',
    flag: '🇪🇬',
    image: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=600&q=80',
    summary: 'تسهيلات كبيرة للسياح القادمين من دول الخليج وأوروبا.',
    tagColor: 'text-stone-600 bg-stone-50 border-stone-200 dark:bg-stone-900/30 dark:border-stone-800 dark:text-stone-300'
  },
  {
    code: 'ES',
    name: 'إسبانيا',
    flag: '🇪🇸',
    image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=600&q=80',
    summary: 'تحديثات BLS: دفع الرسوم نقداً بالعملة المحلية.',
    tagColor: 'text-red-700 bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300'
  }
];

const FeaturedDestinationCard: React.FC<{ 
  dest: typeof FEATURED_DESTINATIONS[0]; 
  onClick: () => void; 
}> = ({ dest, onClick }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let ticking = false;
    const updateParallax = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const viewHeight = window.innerHeight;
      if (rect.top < viewHeight && rect.bottom > 0) {
        const center = viewHeight / 2;
        const itemCenter = rect.top + rect.height / 2;
        const move = (itemCenter - center) * -0.15; 
        setOffset(move);
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    updateParallax();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className="group relative flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-right transition-all duration-300 ease-out hover:shadow-xl hover:shadow-emerald-500/10 dark:hover:shadow-emerald-900/20 hover:-translate-y-2 hover:border-emerald-300 dark:hover:border-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
    >
      <div className="relative h-32 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 isolate">
        <div className="absolute inset-0 w-full h-[140%] -top-[20%] will-change-transform" style={{ transform: `translateY(${offset}px)` }}>
            <img src={dest.image} alt={dest.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-80 z-10 pointer-events-none" />
        <span className="absolute bottom-2 right-3 text-2xl drop-shadow-md transform group-hover:scale-110 transition-transform z-20">{dest.flag}</span>
      </div>
      <div className="p-4 flex flex-col flex-1 relative z-20 bg-white dark:bg-slate-900">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">{dest.name}</h4>
          <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${dest.tagColor}`}>محدث</div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-2">{dest.summary}</p>
      </div>
    </button>
  );
};

const App: React.FC = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const [origin, setOrigin] = useState<Country | null>(null);
  const [destination, setDestination] = useState<Country | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VisaInfoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const searchFormRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [recentSearches, setRecentSearches] = useState<{origin: string, destination: string, date: string}[]>([]);
  const [favorites, setFavorites] = useState<FavoriteVisa[]>([]);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language');
    if (savedLang === 'ar' || savedLang === 'en') {
      setLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('app_language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {}
    }

    const savedFavs = localStorage.getItem('favorite_visas');
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('favorite_visas', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getCacheKey = (o: string, d: string) => `visa_cache_${o}_${d}`;

  const handleSearchInternal = async (o: Country, d: Country) => {
    const cacheKey = getCacheKey(o.code, d.code);
    
    // Check cache first if offline
    if (!navigator.onLine) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setResult(parsed);
          setLoading(false);
          return;
        } catch (e) {}
      }
      setError("أنت غير متصل بالإنترنت ولا توجد بيانات مخزنة لهذه الوجهة.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    // Progress simulation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        const step = Math.random() * 15;
        return Math.min(prev + step, 95);
      });
    }, 400);

    try {
      const data = await getVisaRequirements({ origin: o, destination: d, language });
      
      // Save to cache
      localStorage.setItem(cacheKey, JSON.stringify(data));
      
      // Update recent searches
      const newRecent = [
        { origin: o.code, destination: d.code, date: new Date().toISOString() },
        ...recentSearches.filter(s => !(s.origin === o.code && s.destination === d.code))
      ].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('recent_searches', JSON.stringify(newRecent));
      
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setResult(data);
        setLoading(false);
      }, 500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || "حدث خطأ غير متوقع في جلب البيانات");
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromCode = params.get('from');
      const toCode = params.get('to');

      let initialOrigin: Country | null = null;
      let initialDest: Country | null = null;

      if (fromCode) {
        initialOrigin = COUNTRIES.find(c => c.code === fromCode.toUpperCase()) || null;
        if (initialOrigin) setOrigin(initialOrigin);
      }
      if (toCode) {
        initialDest = COUNTRIES.find(c => c.code === toCode.toUpperCase()) || null;
        if (initialDest) setDestination(initialDest);
      }

      if (initialOrigin && initialDest && initialOrigin.code !== initialDest.code) {
        handleSearchInternal(initialOrigin, initialDest);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      const nextParams = new URLSearchParams();
      if (origin) nextParams.set('from', origin.code);
      if (destination) nextParams.set('to', destination.code);
      
      const queryString = nextParams.toString();
      const newUrl = window.location.pathname + (queryString ? '?' + queryString : '');
      window.history.replaceState({}, '', newUrl);
    } catch (e) {}
  }, [origin, destination]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  // Rotation for featured destinations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBatchIndex(prev => (prev + 1) % (FEATURED_DESTINATIONS.length / 4));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleShare = async () => {
    const url = new URL(window.location.origin + window.location.pathname);
    if (origin) url.searchParams.set('from', origin.code);
    if (destination) url.searchParams.set('to', destination.code);
    const shareUrl = url.toString();
    
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        copied = true;
      }
    } catch (err) {
      console.error("Copy failed", err);
    }

    if (copied) {
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);
    }

    if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: 'دليل التأشيرات',
          text: result 
            ? `تعرف على متطلبات السفر من ${origin?.nameAr} إلى ${destination?.nameAr}`
            : 'أداة ذكية لاكتشاف متطلبات التأشيرة المحدثة.',
          url: shareUrl,
        });
      } catch (err) {}
    }
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = () => {
    if (!origin || !destination) return;
    handleSearchInternal(origin, destination);
  };

  const handleReset = () => {
    setResult(null);
    setOrigin(null);
    setDestination(null);
    setError(null);
    try {
      window.history.replaceState({}, '', window.location.pathname);
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavorite = (fav: FavoriteVisa) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.id === fav.id);
      if (exists) {
        return prev.filter(f => f.id !== fav.id);
      }
      return [fav, ...prev];
    });
  };

  const isFormValid = origin && destination && origin.code !== destination.code;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner className="w-12 h-12 text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50 pb-20 transition-colors duration-300">
      
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20">
               <Globe2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-none">
                {language === 'ar' ? 'دليل التأشيرات' : 'Visa Guide'}
              </h1>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-widest mt-1 uppercase">
                {language === 'ar' ? 'دليلك الذكي للسفر' : 'Your Smart Travel Guide'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button
               onClick={() => setLanguage(l => l === 'ar' ? 'en' : 'ar')}
               className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-500 transition-all font-bold text-xs"
             >
               {language === 'ar' ? 'EN' : 'عربي'}
             </button>
             <button 
               type="button"
               onClick={handleShare}
               className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95 group/share"
               title={language === 'ar' ? 'مشاركة' : 'Share'}
             >
               <Share2 className="w-5 h-5 group-hover/share:text-emerald-500 transition-colors" />
               <span className="text-xs font-bold hidden md:block">{language === 'ar' ? 'مشاركة' : 'Share'}</span>
             </button>
             <button 
               type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('toggle-chatbot'));
                }}
                className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95 group/chat"
                title={language === 'ar' ? 'تحدث مع الذكاء الاصطناعي' : 'Chat with AI'}
              >
                <MessageCircle className="w-5 h-5 group-hover/chat:text-emerald-500 transition-colors" />
                <span className="text-xs font-bold hidden md:block">{language === 'ar' ? 'المساعد الذكي' : 'AI Chat'}</span>
              </button>
              <button 
                type="button"
               onClick={toggleTheme}
               className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors active:scale-95"
               title={theme === 'light' ? (language === 'ar' ? 'داكن' : 'Dark') : (language === 'ar' ? 'فاتح' : 'Light')}
             >
               {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
             </button>

             {/* User profile and logout removed as auth is disabled */}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-12 relative">
          <div className="flex flex-col items-center justify-center">
            <div className="flex-1 mb-6">
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight">
                {language === 'ar' ? (
                  <>دليلك حول العالم <br className="hidden md:block" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">لمتطلبات التأشيرات</span></>
                ) : (
                  <>Your Global Guide <br className="hidden md:block" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">For Visa Requirements</span></>
                )}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium">
                {language === 'ar' 
                  ? 'احصل على أدق المعلومات حول الفيزا والرسوم والمستندات'
                  : 'Get the most accurate information about visas, fees, and documents'}
              </p>
            </div>

            <div className="flex w-20 h-20 md:w-28 md:h-28 bg-emerald-100/10 dark:bg-emerald-900/10 rounded-full items-center justify-center relative shadow-[0_0_40px_rgba(16,185,129,0.2)] shrink-0">
              <motion.img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Earth_Western_Hemisphere_transparent_background.png/600px-Earth_Western_Hemisphere_transparent_background.png"
                alt="Rotating Earth"
                className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                style={{ rotateZ: 23.5 }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>

        <div className="mb-12">
          <WorldMap 
            selectedOrigin={origin}
            selectedDestination={destination}
            onSelectOrigin={setOrigin}
            onSelectDestination={setDestination}
            onReset={handleReset}
          />
        </div>

        <div ref={searchFormRef} className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-white dark:border-slate-800 ring-1 ring-slate-100 dark:ring-slate-800 p-6 md:p-8 mb-10 relative overflow-hidden transition-colors duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
          
          {isOffline && (
            <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <CloudOff className="w-5 h-5 text-amber-600" />
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                {language === 'ar' 
                  ? 'أنت تعمل حالياً في وضع عدم الاتصال. يمكنك الوصول فقط إلى البيانات التي تم البحث عنها مسبقاً.'
                  : 'You are currently working offline. You can only access previously searched data.'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-7 gap-6 items-end">
            <div className="md:col-span-3">
              <CountryCombobox 
                label={language === 'ar' ? "أحمل جواز سفر من" : "I hold a passport from"} 
                countries={COUNTRIES} 
                selectedCountry={origin} 
                onSelect={setOrigin} 
                type="origin" 
                language={language}
              />
            </div>
            <div className="md:col-span-1 flex justify-center pb-2">
              <button type="button" onClick={handleSwap} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 rotate-90 md:rotate-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="md:col-span-3">
              <CountryCombobox 
                label={language === 'ar' ? "أريد السفر إلى" : "I want to travel to"} 
                countries={COUNTRIES} 
                selectedCountry={destination} 
                onSelect={setDestination} 
                type="destination" 
                language={language}
              />
            </div>
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              type="button" 
              onClick={handleSearch} 
              disabled={!isFormValid || loading} 
              className={`group relative flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg w-full sm:w-auto md:min-w-[240px] transition-all duration-300 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 ${!isFormValid ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-300 dark:hover:shadow-emerald-900/40 hover:-translate-y-0.5 active:translate-y-0'}`}
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 text-white animate-spin" /><span>{language === 'ar' ? 'جاري الفحص...' : 'Checking...'}</span></>
              ) : (
                <><Sparkles className="w-5 h-5" /><span>{language === 'ar' ? 'فحص المتطلبات' : 'Check Requirements'}</span></>
              )}
            </button>
            
            {result && (
              <button 
                type="button" 
                onClick={handleReset} 
                disabled={loading} 
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg w-full sm:w-auto bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200"
              >
                <RotateCcw className="w-5 h-5" />
                <span>{language === 'ar' ? 'تصفير' : 'Reset'}</span>
              </button>
            )}
          </div>

          {loading && (
            <div className="mt-8 max-w-md mx-auto animate-in fade-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  {language === 'ar' ? 'جاري تحليل البيانات' : 'Analyzing Data'}
                </span>
                <span className="text-xs font-bold text-slate-500">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-3 font-medium animate-pulse">
                {language === 'ar' 
                  ? 'نحن نتواصل مع قواعد البيانات العالمية لتوفير أدق المعلومات...'
                  : 'We are connecting with global databases to provide the most accurate information...'}
              </p>
            </div>
          )}
        </div>

        {error && (
            <div className="bg-red-50 border border-red-100 dark:bg-red-900/20 dark:border-red-800 text-red-900 dark:text-red-200 rounded-xl p-4 mb-8 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="mt-0.5"><IconManager type="warning" className="w-6 h-6 text-red-600 shrink-0" /></div>
              <div className="flex-1">
                <h3 className="font-bold mb-1">{language === 'ar' ? 'عذراً، حدث خطأ' : 'Sorry, an error occurred'}</h3>
                <p className="text-sm leading-relaxed opacity-90">{error}</p>
              </div>
              <button type="button" onClick={() => setError(null)} className="opacity-50 hover:opacity-100 p-1 rounded-full transition-opacity"><X className="w-5 h-5" /></button>
            </div>
        )}

        {result && origin && destination && (
          <ErrorBoundary language={language}>
            <VisaResult 
              data={result} 
              origin={origin} 
              destination={destination} 
              onRefresh={handleSearch} 
              language={language} 
              onToggleFavorite={toggleFavorite}
              isFavorite={favorites.some(f => f.id === `${origin.code}-${destination.code}`)}
            />
          </ErrorBoundary>
        )}

        {!result && !loading && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
             <div className="flex items-center justify-between mb-4 px-1">
               <div className="flex items-center gap-2">
                 <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                   {language === 'ar' ? 'وجهات رائجة' : 'Trending Destinations'}
                 </h3>
               </div>
               <div className="flex gap-1">
                 {Array.from({ length: FEATURED_DESTINATIONS.length / 4 }).map((_, idx) => (
                   <div key={idx} className={`h-1 w-4 rounded-full transition-all duration-500 ${idx === currentBatchIndex ? 'bg-emerald-500 w-8' : 'bg-slate-200 dark:bg-slate-800'}`} />
                 ))}
               </div>
             </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {FEATURED_DESTINATIONS.slice(currentBatchIndex * 4, (currentBatchIndex + 1) * 4).map((dest) => (
                <FeaturedDestinationCard 
                  key={dest.code} 
                  dest={dest} 
                  onClick={() => { 
                    const country = COUNTRIES.find(c => c.code === dest.code); 
                    if (country) { 
                      setDestination(country); 
                      searchFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
                    } 
                  }} 
                />
              ))}
            </div>
          </div>
        )}

        {!result && !loading && recentSearches.length > 0 && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="flex items-center gap-2 mb-4 px-1">
              <RotateCcw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {language === 'ar' ? 'عمليات بحث أخيرة' : 'Recent Searches'}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentSearches.map((search, idx) => {
                const o = COUNTRIES.find(c => c.code === search.origin);
                const d = COUNTRIES.find(c => c.code === search.destination);
                if (!o || !d) return null;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setOrigin(o);
                      setDestination(d);
                      handleSearchInternal(o, d);
                    }}
                    className={`flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all group ${language === 'ar' ? 'text-right' : 'text-left'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2 rtl:space-x-reverse">
                        <span className="text-xl z-10">{o.flag}</span>
                        <span className="text-xl">{d.flag}</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {language === 'ar' ? `من ${o.nameAr} إلى ${d.nameAr}` : `From ${o.nameEn} to ${d.nameEn}`}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(search.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                        </p>
                      </div>
                    </div>
                    <ArrowLeft className={`w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors ${language === 'en' ? 'rotate-180' : ''}`} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!result && !loading && favorites.length > 0 && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="flex items-center gap-2 mb-4 px-1">
              <Bookmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {language === 'ar' ? 'المفضلة' : 'Favorites'}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className={`flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all group ${language === 'ar' ? 'text-right' : 'text-left'}`}
                >
                  <button
                    onClick={() => {
                      setOrigin(fav.origin);
                      setDestination(fav.destination);
                      setResult(fav.data);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex-1 flex items-center gap-3"
                  >
                    <div className="flex -space-x-2 rtl:space-x-reverse">
                      <span className="text-xl z-10">{fav.origin.flag}</span>
                      <span className="text-xl">{fav.destination.flag}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {language === 'ar' ? `من ${fav.origin.nameAr} إلى ${fav.destination.nameAr}` : `From ${fav.origin.nameEn} to ${fav.destination.nameEn}`}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {language === 'ar' ? 'تم الحفظ في: ' : 'Saved on: '}
                        {new Date(fav.savedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(fav);
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                    title={language === 'ar' ? 'إزالة' : 'Remove'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <FAQSection language={language} />
      </main>
      
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${showCopyToast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
          <div className="bg-slate-900 dark:bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-white" />
              <span className="font-bold text-sm">تم نسخ الرابط بنجاح!</span>
          </div>
      </div>

      <footer className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm border-t border-slate-200 dark:border-slate-800 mt-auto bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300" dir="ltr">
        <p className="flex flex-col sm:flex-row items-center justify-center gap-1">
          <span>Developed By</span>
          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-lg tracking-wide">Ahmed Tork</span>
        </p>
      </footer>

      <ChatBot />
    </div>
  );
};

export default App;
