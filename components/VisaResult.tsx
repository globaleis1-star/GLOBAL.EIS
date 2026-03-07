
import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { VisaInfoResponse, Country, BankAnalysisResult } from '../types';
import { analyzeBankStatement } from '../services/geminiService';
// Added missing icons ArrowLeftRight and Sparkles to the lucide-react import list
import { AlertCircle, RefreshCw, Loader2, CheckCircle2, AlertTriangle, Info, Smartphone, Globe, Plane, Briefcase, GraduationCap, HeartPulse, ArrowLeftRight, Sparkles } from 'lucide-react';
import { EXCHANGE_RATES, COUNTRIES } from '../constants';
import IconManager from './IconManager';

interface VisaResultProps {
  data: VisaInfoResponse;
  origin: Country;
  destination: Country;
  onRefresh: () => void;
}

const MarkdownComponents = {
  h3: ({ ...props }) => <h3 className="hidden" {...props} />, // We hide headers as we parse them into the UI
  p: ({ ...props }) => <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3 text-sm" {...props} />,
  ul: ({ ...props }) => <ul className="list-disc list-inside space-y-1 mb-3 text-slate-600 dark:text-slate-300 text-xs" {...props} />,
  ol: ({ ...props }) => (
    <ol className="relative border-r-2 border-emerald-100 dark:border-emerald-900/30 pr-6 mr-2 space-y-6 mb-6 mt-4" {...props} />
  ),
  li: ({ children, ...props }: any) => {
    // If parent is ol, it's a step
    const isStep = props.node?.parent?.tagName === 'ol';
    if (isStep) {
      return (
        <li className="relative list-none" {...props}>
          <div className="absolute -right-[31px] top-0.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-sm z-10">
             <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          <div className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed">{children}</div>
        </li>
      );
    }
    return <li className="text-xs text-slate-600 dark:text-slate-300 mb-1" {...props}>{children}</li>;
  }
};

const VisaTypeCard: React.FC<{ title: string; icon: any; content: string; colorClass: string }> = ({ title, icon: Icon, content, colorClass }) => {
  return (
    <div className={`flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-2xl ${colorClass} text-white shadow-lg`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-black text-slate-900 dark:text-white text-base">{title}</h3>
      </div>
      <div className="prose prose-slate dark:prose-invert max-w-none text-right flex-1" dir="rtl">
        <ReactMarkdown components={MarkdownComponents}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

const VisaResult: React.FC<VisaResultProps> = ({ data, origin, destination, onRefresh }) => {
  const isUK = destination.code === 'GB';

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
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">تفاصيل التأشيرات المحدثة</h2>
          <p className="text-slate-500 text-xs mt-1">المغادرة من {origin.nameAr} إلى {destination.nameAr}</p>
        </div>
        <button onClick={onRefresh} className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-500 transition-all active:scale-95 shadow-sm">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {parsedTypes.map((t, i) => (
          <VisaTypeCard key={i} title={t.title} icon={t.icon} content={t.content} colorClass={t.color} />
        ))}
        {parsedTypes.length === 0 && (
          <div className="col-span-full bg-white dark:bg-slate-900 p-8 rounded-3xl text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
             <p className="text-slate-500">جاري معالجة البيانات العامة للتأشيرة...</p>
             <ReactMarkdown className="mt-4 text-right" dir="rtl">{data.markdown}</ReactMarkdown>
          </div>
        )}
      </div>

      {isUK && (
        <div className="mb-10 space-y-6">
           <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center gap-3">
               <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg"><Smartphone className="w-5 h-5" /></div>
               <h3 className="font-black text-slate-800 dark:text-white text-lg">التحول الرقمي البريطاني</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                <span className="font-bold text-indigo-600 block mb-1">نظام eVisa:</span> استبدال الملصقات الورقية بحساب رقمي مرتبط بجواز السفر.
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                <span className="font-bold text-blue-600 block mb-1">نظام ETA:</span> تصريح إلكتروني إلزامي للزوار المعفيين قبل السفر بـ 72 ساعة.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Tools */}
      <div className="space-y-8">
        <BankStatementAnalyzer />
        <CurrencyConverter origin={origin} destination={destination} />
      </div>

      <div className="mt-10 p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
            <strong>إخلاء مسؤولية:</strong> البيانات بناءً على القوانين المتاحة. راجع المواقع الحكومية الرسمية (GOV.UK, EU Commission, etc.) قبل السفر.
          </p>
        </div>
      </div>
    </div>
  );
};

// ... Remaining helper components like BankStatementAnalyzer, CurrencyConverter ...
// (Keeping them integrated in the final file as per original structure)

const CurrencyConverter: React.FC<{ origin: Country; destination: Country }> = ({ origin, destination }) => {
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
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">محول تكاليف التأشيرة</h3>
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

const BankStatementAnalyzer: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<BankAnalysisResult | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzeBankStatement(file);
      setResult(res);
    } catch (err) { alert("خطأ في التحليل"); }
    finally { setIsAnalyzing(false); }
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 overflow-hidden shadow-sm">
      <div className="bg-indigo-50/50 dark:bg-indigo-900/20 px-6 py-4 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <IconManager type="bank" className="w-5 h-5 text-indigo-600" />
           <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">فحص كشف الحساب الذكي</h3>
        </div>
        <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
            {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {isAnalyzing ? 'جاري الفحص...' : 'ارفع كشف الحساب'}
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isAnalyzing} />
        </label>
      </div>
      {result && (
        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 animate-in fade-in">
          <div className={`mb-4 inline-block px-3 py-1 rounded-full text-[10px] font-bold border ${result.riskLevel === 'Low' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
            مخاطرة: {result.riskLevel === 'Low' ? 'منخفضة' : 'مرتفعة'}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">{result.summaryAr}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">الملاحظات:</span>
                {result.findings.map((f, i) => <div key={i} className="text-[10px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-lg">• {f}</div>)}
             </div>
             <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">التوصيات:</span>
                {result.recommendations.map((r, i) => <div key={i} className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20 p-2 rounded-lg">✓ {r}</div>)}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisaResult;
