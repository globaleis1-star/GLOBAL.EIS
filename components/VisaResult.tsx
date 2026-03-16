
import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { VisaInfoResponse, Country, BankAnalysisResult, FavoriteVisa } from '../types';
import { analyzeBankStatement } from '../services/geminiService';
// Added missing icons ArrowLeftRight and Sparkles to the lucide-react import list
import { AlertCircle, RefreshCw, Loader2, CheckCircle2, AlertTriangle, Info, Smartphone, Globe, Plane, Briefcase, GraduationCap, HeartPulse, ArrowLeftRight, Sparkles, MapPin, Phone, ExternalLink, Bell, Bookmark, BookmarkCheck, ShieldCheck, MessageCircle } from 'lucide-react';
import { EXCHANGE_RATES, COUNTRIES } from '../constants';
import IconManager from './IconManager';

interface VisaResultProps {
  data: VisaInfoResponse;
  origin: Country;
  destination: Country;
  onRefresh: () => void;
  language: 'ar' | 'en';
  onToggleFavorite: (fav: FavoriteVisa) => void;
  isFavorite: boolean;
}

const MarkdownComponents = (language: 'ar' | 'en') => ({
  h3: ({ node, ...props }: any) => <h3 className="hidden" {...props} />,
  p: ({ node, ...props }: any) => <p className={`text-slate-600 dark:text-slate-300 leading-relaxed mb-3 text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`} {...props} />,
  ul: ({ node, ...props }: any) => <ul className={`list-disc list-inside space-y-1 mb-3 text-slate-600 dark:text-slate-300 text-xs ${language === 'ar' ? 'text-right' : 'text-left'}`} {...props} />,
  ol: ({ node, ...props }: any) => (
    <ol className={`relative border-emerald-100 dark:border-emerald-900/30 space-y-6 mb-6 mt-4 ${language === 'ar' ? 'border-r-2 pr-6 mr-2 text-right' : 'border-l-2 pl-6 ml-2 text-left'}`} {...props} />
  ),
  li: ({ node, children, ordered, ...props }: any) => {
    if (ordered) {
      return (
        <li className="relative list-none mb-6" {...props}>
          <div className={`absolute ${language === 'ar' ? '-right-[31px]' : '-left-[31px]'} top-0.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-sm z-10`}>
             <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          <div className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed">{children}</div>
        </li>
      );
    }
    return <li className="text-xs text-slate-600 dark:text-slate-300 mb-1" {...props}>{children}</li>;
  },
  input: ({ node, ...props }: any) => {
    if (props.type === 'checkbox') {
      return (
        <input 
          {...props} 
          className={`w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 ${language === 'ar' ? 'ml-2' : 'mr-2'} cursor-pointer`} 
          readOnly={false}
        />
      );
    }
    return <input {...props} />;
  }
});

const VisaTypeCard: React.FC<{ title: string; icon: any; content: string; colorClass: string; language: 'ar' | 'en' }> = ({ title, icon: Icon, content, colorClass, language }) => {
  return (
    <div className={`flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-2xl ${colorClass} text-white shadow-lg`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-black text-slate-900 dark:text-white text-base">{title}</h3>
      </div>
      <div className={`prose prose-slate dark:prose-invert max-w-none flex-1 ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <ReactMarkdown components={MarkdownComponents(language)} remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

const VisaResult: React.FC<VisaResultProps> = ({ data, origin, destination, onRefresh, language, onToggleFavorite, isFavorite }) => {
  const isUK = destination.code === 'GB';

  const handleToggleFavorite = () => {
    onToggleFavorite({
      id: `${origin.code}-${destination.code}`,
      origin,
      destination,
      data,
      savedAt: new Date().toISOString()
    });
  };

  // Parse alerts from markdown
  const alerts = useMemo(() => {
    const lines = data.markdown.split('\n');
    return lines
      .filter(line => line.includes('🚨') || line.includes('تنبيه') || line.includes('Alert'))
      .map(line => line.replace(/🚨|تنبيه|Alert|[:*]/g, '').trim());
  }, [data.markdown]);

  // Parse the markdown into types
  const parsedTypes = useMemo(() => {
    const sections = data.markdown.split(/###/);
    const types: { title: string; content: string; icon: any; color: string }[] = [];
    const seen = new Set<string>();

    sections.forEach(sec => {
      if (!sec.trim()) return;
      
      const lines = sec.split('\n');
      const header = lines[0].toLowerCase();
      const content = lines.slice(1).join('\n');
      
      let typeKey = '';
      let title = '';
      let icon = null;
      let color = '';

      if (header.includes('سياحة') || header.includes('tourism')) {
        typeKey = 'tourism';
        title = 'تأشيرة السياحة';
        icon = Plane;
        color = 'bg-emerald-500';
      } else if (header.includes('أعمال') || header.includes('business')) {
        typeKey = 'business';
        title = 'تأشيرة الأعمال';
        icon = Briefcase;
        color = 'bg-blue-500';
      } else if (header.includes('دراسة') || header.includes('study')) {
        typeKey = 'study';
        title = 'تأشيرة الدراسة';
        icon = GraduationCap;
        color = 'bg-indigo-500';
      } else if (header.includes('علاج') || header.includes('medical')) {
        typeKey = 'medical';
        title = 'تأشيرة العلاج';
        icon = HeartPulse;
        color = 'bg-rose-500';
      }

      if (typeKey && !seen.has(typeKey)) {
        seen.add(typeKey);
        types.push({ title, icon, color, content });
      }
    });

    return types;
  }, [data.markdown]);

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 mb-8 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {language === 'ar' ? 'تفاصيل التأشيرات المحدثة' : 'Updated Visa Details'}
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
            <p className="text-slate-500 text-xs">
              {language === 'ar' 
                ? `المغادرة من ${origin.nameAr} إلى ${destination.nameAr}`
                : `Departure from ${origin.nameEn} to ${destination.nameEn}`}
            </p>
            <span className="hidden sm:inline text-slate-300">•</span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
              <ShieldCheck className="w-3 h-3" />
              {language === 'ar' ? 'تم التحقق:' : 'Verified:'} {new Date(data.generatedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleToggleFavorite} 
            className={`p-3 rounded-2xl border transition-all active:scale-95 shadow-sm ${
              isFavorite 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-500'
            }`}
            title={language === 'ar' ? (isFavorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة') : (isFavorite ? 'Remove from Favorites' : 'Save to Favorites')}
          >
            {isFavorite ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('toggle-chatbot'));
            }}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-500 transition-all active:scale-95 shadow-sm"
            title={language === 'ar' ? 'اسأل الذكاء الاصطناعي' : 'Ask AI'}
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <button onClick={onRefresh} className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-500 transition-all active:scale-95 shadow-sm">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="mb-8 space-y-3">
          {alerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl animate-in slide-in-from-right duration-300" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="p-2 bg-rose-500 rounded-xl text-white shadow-lg">
                <Bell className="w-4 h-4" />
              </div>
              <p className={`text-xs font-bold text-rose-700 dark:text-rose-300 flex-1 ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>{alert}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {parsedTypes.map((t, i) => (
          <VisaTypeCard key={i} title={t.title} icon={t.icon} content={t.content} colorClass={t.color} language={language} />
        ))}
        {parsedTypes.length === 0 && (
          <div className="col-span-full bg-white dark:bg-slate-900 p-8 rounded-3xl text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
             <p className="text-slate-500">
               {language === 'ar' ? 'جاري معالجة البيانات العامة للتأشيرة...' : 'Processing general visa data...'}
             </p>
             <div className={`mt-4 ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
               <ReactMarkdown>{data.markdown}</ReactMarkdown>
             </div>
          </div>
        )}
      </div>

      {isUK && (
        <div className="mb-10 space-y-6">
           <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center gap-3">
               <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg"><Smartphone className="w-5 h-5" /></div>
               <h3 className="font-black text-slate-800 dark:text-white text-lg">
                 {language === 'ar' ? 'التحول الرقمي البريطاني' : 'British Digital Transformation'}
               </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                <span className="font-bold text-indigo-600 block mb-1">
                  {language === 'ar' ? 'نظام eVisa:' : 'eVisa System:'}
                </span> 
                {language === 'ar' ? 'استبدال الملصقات الورقية بحساب رقمي مرتبط بجواز السفر.' : 'Replacing paper stickers with a digital account linked to your passport.'}
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                <span className="font-bold text-blue-600 block mb-1">
                  {language === 'ar' ? 'نظام ETA:' : 'ETA System:'}
                </span> 
                {language === 'ar' ? 'تصريح إلكتروني إلزامي للزوار المعفيين قبل السفر بـ 72 ساعة.' : 'Mandatory electronic authorization for exempt visitors 72 hours before travel.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Tools */}
      <div className="space-y-8">
        <BankStatementAnalyzer language={language} />
        <CurrencyConverter origin={origin} destination={destination} language={language} />
      </div>

      {/* Verification Mechanism & Sources */}
      {data.sources && data.sources.length > 0 && (
        <div className="mt-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {language === 'ar' ? 'آلية التحقق والمصادر الرسمية' : 'Verification Mechanism & Official Sources'}
              </h3>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                {language === 'ar' ? 'بيانات حية' : 'Live Data'}
              </span>
            </div>
          </div>
          <div className="p-6">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              {language === 'ar' 
                ? 'يتم جلب هذه البيانات ودمجها لحظياً من خلال البحث في المواقع الحكومية الرسمية وقواعد بيانات التأشيرات العالمية لضمان أعلى مستويات الدقة.'
                : 'This data is fetched and synthesized in real-time by searching official government websites and global visa databases to ensure the highest level of accuracy.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.sources.map((source, idx) => (
                <a 
                  key={idx} 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all group"
                >
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-400 group-hover:text-emerald-600 shadow-sm">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{source.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{source.url}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-10 p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
            <strong>{language === 'ar' ? 'إخلاء مسؤولية:' : 'Disclaimer:'}</strong> 
            {language === 'ar' 
              ? 'البيانات بناءً على القوانين المتاحة. راجع المواقع الحكومية الرسمية (GOV.UK, EU Commission, etc.) قبل السفر.'
              : 'Data is based on available laws. Review official government websites (GOV.UK, EU Commission, etc.) before traveling.'}
          </p>
        </div>
      </div>
    </div>
  );
};

// ... Remaining helper components like BankStatementAnalyzer, CurrencyConverter ...
// (Keeping them integrated in the final file as per original structure)

const CurrencyConverter: React.FC<{ origin: Country; destination: Country; language: 'ar' | 'en' }> = ({ origin, destination, language }) => {
  const [amount, setAmount] = useState<number | string>(100);
  const [fromCurrency, setFromCurrency] = useState(destination.currencyCode || 'USD');
  const [toCurrency, setToCurrency] = useState(origin.currencyCode || 'USD');
  const [result, setResult] = useState<number | null>(null);

  const currencyOptions = useMemo(() => {
    return Array.from(new Set(['USD', 'EUR', origin.currencyCode, destination.currencyCode].filter(Boolean))) as string[];
  }, [origin, destination]);

  useEffect(() => {
    const val = parseFloat(amount.toString());
    if (isNaN(val)) return setResult(null);
    const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
    const toRate = EXCHANGE_RATES[toCurrency] || 1;
    setResult((val / fromRate) * toRate);
  }, [amount, fromCurrency, toCurrency]);

  return (
    <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <IconManager type="currency" className="w-5 h-5 text-emerald-600" />
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
          {language === 'ar' ? 'محول تكاليف التأشيرة' : 'Visa Cost Converter'}
        </h3>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center" dir="ltr">
        <div className="space-y-1">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20" />
          <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} className="w-full bg-white dark:bg-slate-800 text-xs p-2 rounded-lg outline-none">{currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}</select>
        </div>
        <div className="flex justify-center"><ArrowLeftRight className="w-4 h-4 text-slate-300" /></div>
        <div className="space-y-1">
          <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl px-4 py-3 font-black text-emerald-700 dark:text-emerald-400">{result?.toLocaleString()}</div>
          <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)} className="w-full bg-white dark:bg-slate-800 text-xs p-2 rounded-lg outline-none">{currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}</select>
        </div>
      </div>
    </div>
  );
};

const BankStatementAnalyzer: React.FC<{ language: 'ar' | 'en' }> = ({ language }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<BankAnalysisResult | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzeBankStatement(file);
      setResult(res);
    } catch (err) { 
      alert(language === 'ar' ? "خطأ في التحليل" : "Analysis error"); 
    }
    finally { setIsAnalyzing(false); }
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 overflow-hidden shadow-sm">
      <div className="bg-indigo-50/50 dark:bg-indigo-900/20 px-6 py-4 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <IconManager type="bank" className="w-5 h-5 text-indigo-600" />
           <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
             {language === 'ar' ? 'فحص كشف الحساب الذكي' : 'Smart Bank Statement Check'}
           </h3>
        </div>
        <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
            {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {isAnalyzing ? (language === 'ar' ? 'جاري الفحص...' : 'Checking...') : (language === 'ar' ? 'ارفع كشف الحساب' : 'Upload Statement')}
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isAnalyzing} />
        </label>
      </div>
      {result && (
        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 animate-in fade-in">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold border ${result.riskLevel === 'Low' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : result.riskLevel === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
              {language === 'ar' ? 'مستوى المخاطرة:' : 'Risk Level:'} {result.riskLevel === 'Low' ? (language === 'ar' ? 'منخفض' : 'Low') : result.riskLevel === 'Medium' ? (language === 'ar' ? 'متوسط' : 'Medium') : (language === 'ar' ? 'مرتفع' : 'High')}
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-3 h-3" />
              {language === 'ar' ? 'درجة الجاهزية:' : 'Readiness Score:'} {result.readinessScore}/100
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{language === 'ar' ? 'متوسط الدخل' : 'Avg. Income'}</p>
              <p className="text-lg font-black text-emerald-600">{result.monthlyAverageIncome.toLocaleString()} <span className="text-[10px]">{result.currency}</span></p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{language === 'ar' ? 'متوسط المصاريف' : 'Avg. Expenses'}</p>
              <p className="text-lg font-black text-rose-600">{result.monthlyAverageExpenses.toLocaleString()} <span className="text-[10px]">{result.currency}</span></p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{language === 'ar' ? 'الرصيد الختامي' : 'Closing Balance'}</p>
              <p className="text-lg font-black text-indigo-600">{result.closingBalance.toLocaleString()} <span className="text-[10px]">{result.currency}</span></p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {result.detectedPatterns.salaryDetected && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-[10px] font-bold text-emerald-600">
                <CheckCircle2 className="w-3 h-3" /> {language === 'ar' ? 'تم رصد راتب منتظم' : 'Regular Salary Detected'}
              </div>
            )}
            {result.detectedPatterns.fundsParkingDetected && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-[10px] font-bold text-rose-600">
                <AlertTriangle className="w-3 h-3" /> {language === 'ar' ? 'رصد إيداعات ضخمة مفاجئة' : 'Funds Parking Detected'}
              </div>
            )}
            {result.detectedPatterns.stableBalance ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-[10px] font-bold text-blue-600">
                <TrendingUp className="w-3 h-3" /> {language === 'ar' ? 'رصيد مستقر/متنامي' : 'Stable/Growing Balance'}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-[10px] font-bold text-amber-600">
                <TrendingUp className="w-3 h-3 rotate-180" /> {language === 'ar' ? 'رصيد متناقص' : 'Depleting Balance'}
              </div>
            )}
          </div>

          <p className={`text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {language === 'ar' ? result.summaryAr : result.summaryEn}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                  <Info className="w-3 h-3" /> {language === 'ar' ? 'الملاحظات التحليلية:' : 'Analytical Findings:'}
                </span>
                <div className="space-y-2">
                  {result.findings.map((f, i) => <div key={i} className={`text-[10px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 ${language === 'ar' ? 'text-right' : 'text-left'}`}>• {f}</div>)}
                </div>
             </div>
             <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> {language === 'ar' ? 'توصيات الخبراء:' : 'Expert Recommendations:'}
                </span>
                <div className="space-y-2">
                  {result.recommendations.map((r, i) => <div key={i} className={`text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30 ${language === 'ar' ? 'text-right' : 'text-left'}`}>✓ {r}</div>)}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisaResult;
