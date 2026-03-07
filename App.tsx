
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Sparkles, X, CloudOff, Moon, Sun, RotateCcw, Globe2, TrendingUp, Share2, CheckCircle2 } from 'lucide-react';
import { COUNTRIES } from './constants';
import { Country, VisaInfoResponse } from './types';
import { getVisaRequirements } from './services/geminiService';
import CountryCombobox from './components/CountryCombobox';
import VisaResult from './components/VisaResult';
import IconManager from './components/IconManager';
import WorldMap from './components/WorldMap';

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
  const [origin, setOrigin] = useState<Country | null>(null);
  const [destination, setDestination] = useState<Country | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisaInfoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const searchFormRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const handleSearchInternal = async (o: Country, d: Country) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await getVisaRequirements({ origin: o, destination: d });
      setResult(data);
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع في جلب البيانات");
    } finally {
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

  const isFormValid = origin && destination && origin.code !== destination.code;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50 pb-20 transition-colors duration-300">
      
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20">
               <Globe2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-none">دليل التأشيرات</h1>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-widest mt-1">دليلك الذكي للسفر</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button 
               type="button"
               onClick={handleShare}
               className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95 group/share"
               title="مشاركة"
             >
               <Share2 className="w-5 h-5 group-hover/share:text-emerald-500 transition-colors" />
               <span className="text-xs font-bold hidden md:block">مشاركة</span>
             </button>
             <button 
               type="button"
               onClick={toggleTheme}
               className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors active:scale-95"
               title={theme === 'light' ? 'داكن' : 'فاتح'}
             >
               {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight">
            دليلك حول العالم <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">لمتطلبات التأشيرات</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium">احصل على أدق المعلومات حول الفيزا والرسوم والمستندات</p>
        </div>

        <div className="mb-12">
          <WorldMap 
            selectedOrigin={origin}
            selectedDestination={destination}
            onSelectOrigin={setOrigin}
            onSelectDestination={setDestination}
          />
        </div>

        <div ref={searchFormRef} className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-white dark:border-slate-800 ring-1 ring-slate-100 dark:ring-slate-800 p-6 md:p-8 mb-10 relative overflow-hidden transition-colors duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
          <div className="grid grid-cols-1 md:grid-cols-7 gap-6 items-end">
            <div className="md:col-span-3"><CountryCombobox label="أحمل جواز سفر من" countries={COUNTRIES} selectedCountry={origin} onSelect={setOrigin} type="origin" /></div>
            <div className="md:col-span-1 flex justify-center pb-2"><button type="button" onClick={handleSwap} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 rotate-90 md:rotate-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"><ArrowLeft className="w-5 h-5" /></button></div>
            <div className="md:col-span-3"><CountryCombobox label="أريد السفر إلى" countries={COUNTRIES} selectedCountry={destination} onSelect={setDestination} type="destination" /></div>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button type="button" onClick={handleSearch} disabled={!isFormValid || loading} className={`group relative flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg w-full sm:w-auto md:min-w-[240px] transition-all duration-300 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 ${!isFormValid ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-300 dark:hover:shadow-emerald-900/40 hover:-translate-y-0.5 active:translate-y-0'}`}>
              {loading ? <><Spinner className="h-5 w-5 text-white" /><span>جاري الفحص...</span></> : <><Sparkles className="w-5 h-5" /><span>فحص المتطلبات</span></>}
            </button>
            {result && <button type="button" onClick={handleReset} disabled={loading} className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg w-full sm:w-auto bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200"><RotateCcw className="w-5 h-5" /><span>تصفير</span></button>}
          </div>
        </div>

        {error && (
            <div className="bg-red-50 border border-red-100 dark:bg-red-900/20 dark:border-red-800 text-red-900 dark:text-red-200 rounded-xl p-4 mb-8 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="mt-0.5"><IconManager type="warning" className="w-6 h-6 text-red-600 shrink-0" /></div>
              <div className="flex-1"><h3 className="font-bold mb-1">عذراً، حدث خطأ</h3><p className="text-sm leading-relaxed opacity-90">{error}</p></div>
              <button type="button" onClick={() => setError(null)} className="opacity-50 hover:opacity-100 p-1 rounded-full transition-opacity"><X className="w-5 h-5" /></button>
            </div>
        )}

        {result && origin && destination && <VisaResult data={result} origin={origin} destination={destination} onRefresh={handleSearch} />}

        {!result && !loading && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
             <div className="flex items-center gap-2 mb-4 px-1"><TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /><h3 className="text-lg font-bold text-slate-800 dark:text-white">وجهات رائجة</h3></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {FEATURED_DESTINATIONS.map((dest) => <FeaturedDestinationCard key={dest.code} dest={dest} onClick={() => { const country = COUNTRIES.find(c => c.code === dest.code); if (country) { setDestination(country); searchFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }} />)}
            </div>
          </div>
        )}
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
    </div>
  );
};

export default App;
