import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { VisaInfoResponse, Country } from '../types';
import { analyzeBankStatement, BankAnalysisResult } from '../services/geminiService';
import { ExternalLink, AlertCircle, Plane, AlertTriangle, Info, RefreshCw, Calculator, Upload, FileText, Trash2, X, Clock, ShieldCheck, Landmark, MessageCircle, Loader2, Sparkles, Scale, ClipboardList, CheckSquare, Square, StickyNote, PenLine, Coins, ArrowLeftRight } from 'lucide-react';
import { EXCHANGE_RATES, COUNTRIES } from '../constants';

interface VisaResultProps {
  data: VisaInfoResponse;
  origin: Country;
  destination: Country;
  onRefresh: () => void;
}

// Helper to safely extract text from ReactNode for header analysis
const extractTextFromNode = (node: any): string => {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractTextFromNode).join('');
  if (typeof node === 'object' && node.props && node.props.children) {
    return extractTextFromNode(node.props.children);
  }
  return '';
};

// Helper for section styles and types
const getSectionConfig = (text: string) => {
  if (text.includes('رسوم') || text.includes('Fees')) {
    return {
      type: 'fees',
      color: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/10'
    };
  }
  if (text.includes('مستندات') || text.includes('Documents')) {
    return {
      type: 'docs',
      color: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/10'
    };
  }
  if (text.includes('رفض') || text.includes('Red Flags') || text.includes('تحذير')) {
    return {
      type: 'alert',
      color: 'text-red-700 dark:text-red-400',
      border: 'border-red-500',
      bg: 'bg-red-50 dark:bg-red-900/10'
    };
  }
  if (text.includes('مقابلة') || text.includes('Interview')) {
    return {
      type: 'interview',
      color: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/10'
    };
  }
  return null;
};

// Component to render icon based on type
const IconManager = ({ type, className = "w-6 h-6" }: { type: string, className?: string }) => {
  switch (type) {
    case 'fees': return <Calculator className={className} />;
    case 'docs': return <FileText className={className} />;
    case 'alert': return <AlertTriangle className={className} />;
    case 'interview': return <MessageCircle className={className} />;
    default: return null;
  }
};

// Custom components for Markdown rendering
const MarkdownComponents = {
  h1: ({ ...props }) => <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6 border-b-2 border-slate-200 dark:border-slate-700 pb-4" {...props} />,
  h2: ({ ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text = extractTextFromNode(props.children);
    const config = getSectionConfig(text);
    
    if (config) {
        return (
            <div className={`flex items-center gap-2 mt-8 mb-4 text-lg font-bold ${config.color} border-r-4 ${config.border} pr-3 ${config.bg} py-2 rounded-l-md`}>
                <IconManager type={config.type} />
                <h2 {...props} />
            </div>
        )
    }

    return <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-8 mb-4" {...props} />;
  },
  h3: ({ ...props }) => <h3 className="text-md font-bold text-slate-700 dark:text-slate-300 mt-4 mb-2" {...props} />,
  p: ({ ...props }) => <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-2 text-sm md:text-base" {...props} />,
  ul: ({ ...props }) => <ul className="list-disc list-inside space-y-1.5 mb-4 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm" {...props} />,
  li: ({ ...props }) => <li className="marker:text-slate-400 dark:marker:text-slate-500 pl-2" {...props} />,
  strong: ({ ...props }) => <strong className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1 rounded" {...props} />,
  a: ({ ...props }) => (
    <a 
      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium" 
      target="_blank" 
      rel="noopener noreferrer" 
      {...props} 
    />
  ),
};

const SCHENGEN_CODES = [
  'FR', 'DE', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'PT', 'GR', 
  'CH', 'PL', 'HR', 'BG', 'AT', 'BE', 'CZ', 'HU', 'MT', 'SK', 
  'SI', 'EE', 'LV', 'LT', 'IS', 'LI', 'LU', 'FI', 'RO'
];

const SchengenChecklist: React.FC = () => {
  const [items, setItems] = useState([
    { id: 1, text: 'الموعد (Appointment)', checked: false, note: '', showNote: false },
    { id: 2, text: 'القيد الفردي أو العائلي', checked: false, note: '', showNote: false },
    { id: 3, text: 'تأمين السفر (Travel Insurance)', checked: false, note: '', showNote: false },
    { id: 4, text: 'قيد المدارس (للطلاب)', checked: false, note: '', showNote: false },
    { id: 5, text: 'شهادة التحركات / صور التأشيرات السابقة', checked: false, note: '', showNote: false },
    { id: 6, text: 'السجل التجاري / البطاقة الضريبية', checked: false, note: '', showNote: false },
    { id: 7, text: 'الأبليكشن (Application Form)', checked: false, note: '', showNote: false },
    { id: 8, text: 'HR Letter (خطاب العمل)', checked: false, note: '', showNote: false },
    { id: 9, text: 'خطة السفر / تيكيت المعرض / الدعوة', checked: false, note: '', showNote: false },
    { id: 10, text: 'مستندات خاصة بالعمل', checked: false, note: '', showNote: false },
    { id: 11, text: 'المراسلات (Correspondence)', checked: false, note: '', showNote: false },
    { id: 12, text: 'أملاك (عقود ملكية)', checked: false, note: '', showNote: false },
    { id: 13, text: 'حجز الطيران (مبدئي/مؤكد)', checked: false, note: '', showNote: false },
    { id: 14, text: 'كروت إئتمان (Credit Cards)', checked: false, note: '', showNote: false },
    { id: 15, text: 'حجز الفندق (Hotel Booking)', checked: false, note: '', showNote: false },
    { id: 16, text: 'كشف حساب بنكي (Bank Statement)', checked: false, note: '', showNote: false },
  ]);

  const toggleItem = (id: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const toggleNoteVisibility = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems(items.map(item => 
      item.id === id ? { ...item, showNote: !item.showNote } : item
    ));
  };

  const updateNote = (id: number, text: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, note: text } : item
    ));
  };

  const progress = Math.round((items.filter(i => i.checked).length / items.length) * 100);

  return (
    <div className="mt-8 bg-white dark:bg-slate-950 rounded-xl border border-blue-200 dark:border-blue-900 overflow-hidden shadow-sm">
      <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-3 border-b border-blue-100 dark:border-blue-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <ClipboardList className="w-5 h-5 text-blue-700 dark:text-blue-400" />
           <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">قائمة المراجعة الإلزامية (Schengen Checklist)</h3>
        </div>
        <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
          {progress}% مكتمل
        </span>
      </div>
      
      <div className="p-4">
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-6 overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          {items.map((item) => (
            <div 
              key={item.id} 
              onClick={() => toggleItem(item.id)}
              className={`
                flex flex-col gap-2 p-3 rounded-lg border cursor-pointer transition-all duration-200
                ${item.checked 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50' 
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                }
              `}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                    <div className={`shrink-0 transition-colors ${item.checked ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {item.checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </div>
                    <span className={`text-sm font-medium transition-all ${item.checked ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                        {item.text}
                    </span>
                </div>
                
                <button 
                    onClick={(e) => toggleNoteVisibility(item.id, e)}
                    className={`
                        p-1.5 rounded-full transition-colors shrink-0
                        ${(item.showNote || item.note) 
                            ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/50' 
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }
                    `}
                    title="أضف ملاحظة"
                >
                    {item.note ? <StickyNote className="w-4 h-4" /> : <PenLine className="w-4 h-4" />}
                </button>
              </div>
              
              {(item.showNote || item.note) && (
                <div 
                    className="w-full animate-in slide-in-from-top-2 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <textarea
                        value={item.note}
                        onChange={(e) => updateNote(item.id, e.target.value)}
                        placeholder="أضف ملاحظاتك هنا..."
                        rows={2}
                        className="w-full text-xs p-2 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-blue-500 outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400 resize-none"
                    />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded border border-blue-100 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
                هذه القائمة موحدة لجميع دول الشنغن. تأكد من توفر أصول المستندات بالإضافة إلى نسخة منها عند التقديم. المستندات العربية (مثل السجل التجاري والقيد العائلي) تحتاج إلى ترجمة معتمدة.
            </p>
        </div>
      </div>
    </div>
  );
};

const CurrencyConverter: React.FC<{ origin: Country; destination: Country }> = ({ origin, destination }) => {
  const [amount, setAmount] = useState<number | string>(100);
  const [fromCurrency, setFromCurrency] = useState(destination.currencyCode || 'EUR');
  // Default to USD as requested
  const [toCurrency, setToCurrency] = useState('USD');
  const [result, setResult] = useState<number | null>(null);

  const currencyOptions = Array.from(new Set(['USD', 'EUR', origin.currencyCode, destination.currencyCode].filter(Boolean))) as string[];

  const handleConvert = () => {
    const val = parseFloat(amount.toString());
    if (isNaN(val)) {
      setResult(null);
      return;
    }
    const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
    const toRate = EXCHANGE_RATES[toCurrency] || 1;
    // Formula: (Amount / RateOfFrom) * RateOfTo
    setResult((val / fromRate) * toRate);
  };

  useEffect(() => {
    handleConvert();
  }, [amount, fromCurrency, toCurrency]);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="mt-6 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">محول العملات (لتقدير التكلفة)</h3>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setToCurrency('USD')}
             className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${toCurrency === 'USD' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800' : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}
           >
             USD ($)
           </button>
           {origin.currencyCode && origin.currencyCode !== 'USD' && (
             <button 
                onClick={() => setToCurrency(origin.currencyCode)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${toCurrency === origin.currencyCode ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800' : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}
             >
                {origin.currencyCode} (محلي)
             </button>
           )}
        </div>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end" dir="ltr">
        
        {/* From Section */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">From (Fees)</label>
          <div className="flex rounded-lg shadow-sm">
             <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full rounded-l-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-3 pr-2 text-sm border text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="rounded-r-lg border border-l-0 border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 pl-2 pr-1 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Swap Icon */}
        <div className="flex items-center justify-center pb-2 text-slate-400">
             <button onClick={swapCurrencies} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 transition-all active:rotate-180 duration-300">
                <ArrowLeftRight className="w-4 h-4" />
             </button>
        </div>

        {/* To Section */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">To (You Pay)</label>
          <div className="flex rounded-lg shadow-sm relative">
            <div className="block w-full rounded-l-lg border border-r-0 border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10 py-2 pl-3 pr-2 text-sm text-emerald-700 dark:text-emerald-400 font-bold flex items-center h-[38px]">
                {result !== null ? result.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '---'}
            </div>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="rounded-r-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-100/50 dark:bg-emerald-900/30 py-2 pl-2 pr-1 text-sm font-semibold text-emerald-900 dark:text-emerald-100 focus:outline-none cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors h-[38px]"
            >
               {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

const BankStatementAnalyzer: React.FC = () => {
  const [data, setData] = useState<{month: string, credit: number, debit: number, lowestBalance?: number}[]>(
    Array.from({ length: 6 }).map((_, i) => ({ 
      month: `شهر ${i + 1}`, 
      credit: 0, 
      debit: 0,
      lowestBalance: 0
    }))
  );
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);
  const [estimatedSalary, setEstimatedSalary] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAiWarnings([]);
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64String = (reader.result as string).split(',')[1];
            const mimeType = file.type;
            
            const results: BankAnalysisResult = await analyzeBankStatement(base64String, mimeType);
            
            const formattedData = Array.from({ length: 6 }).map((_, i) => {
                const res = results.months[i];
                return {
                    month: res ? res.month : `شهر ${i + 1}`,
                    credit: res ? res.credit : 0,
                    debit: res ? res.debit : 0,
                    lowestBalance: res && res.lowestBalance ? res.lowestBalance : 0
                };
            });
            
            setData(formattedData);
            if (results.warnings) setAiWarnings(results.warnings);
            if (results.salaryEstimation) setEstimatedSalary(results.salaryEstimation);
        };
    } catch (err) {
        alert("فشل تحليل الملف. يرجى التأكد من وضوح الصورة أو ملف الـ PDF.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const updateVal = (index: number, field: 'credit' | 'debit' | 'lowestBalance', val: string) => {
    const newData = [...data];
    // @ts-ignore
    newData[index][field] = parseFloat(val) || 0;
    setData(newData);
  };

  // UK Specific Logic
  const totalCredit = data.reduce((acc, cur) => acc + cur.credit, 0);
  const totalDebit = data.reduce((acc, cur) => acc + cur.debit, 0);
  const avgCredit = totalCredit / 6;
  const netDisposable = (totalCredit - totalDebit) / 6;
  
  // UKVI Red Flag: Funds Parking
  // Refined Logic: Check trend of the last 3 months (indices 2, 3, 4) against the final month (index 5)
  // Indices 0,1,2,3,4,5 correspond to Month 1 to Month 6
  // We compare Month 6 vs Average(Month 3, 4, 5)
  const recentMonths = data.slice(2, 5); // Month 3, 4, 5
  const avgRecentCredit = recentMonths.reduce((acc, cur) => acc + cur.credit, 0) / (recentMonths.length || 1);
  const lastMonthCredit = data[5]?.credit || 0;
  
  // Threshold: > 200% of the recent 3-month average
  const isFundsParking = avgRecentCredit > 0 && lastMonthCredit > (avgRecentCredit * 2);

  // UKVI Check: Lowest Balance Sustainability
  const minBalanceAcross6Months = Math.min(...data.map(d => d.lowestBalance || 0));
  
  const getRiskAssessment = () => {
    if (netDisposable < 0) return { status: 'رفض مؤكد (Refusal)', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', icon: X, msg: 'المصروفات الشهرية تتجاوز الدخل. هذا سبب رفض مباشر بموجب Appendix V 4.2.' };
    
    if (isFundsParking) return { 
        status: 'تضخيم حساب (Funds Parking)', 
        color: 'text-red-600', 
        bg: 'bg-red-100 dark:bg-red-900/30', 
        icon: AlertTriangle, 
        msg: `تم رصد إيداع كبير في الشهر الأخير (${lastMonthCredit.toLocaleString()}) يتجاوز 200% من متوسط الـ 3 أشهر السابقة (${Math.round(avgRecentCredit).toLocaleString()}). يعتبر هذا "تضخيم للحساب" وقد يؤدي للرفض.` 
    };
    
    if (minBalanceAcross6Months < 0) return { status: 'استخدام سحب مكشوف (Overdraft)', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: AlertCircle, msg: 'وجود رصيد بالسالب في أي وقت يضعف الملف ويدل على عدم استقرار مالي.' };

    if (netDisposable < (estimatedSalary * 0.2) && estimatedSalary > 0) return { status: 'فائض ضئيل', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: AlertCircle, msg: 'المبلغ المتبقي شهرياً قليل جداً مقارنة بالراتب. يجب إثبات مدخرات تراكمية.' };

    return { status: 'متوافق (Compliant)', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: ShieldCheck, msg: 'نمط الحساب يعكس دخلاً حقيقياً ومستقراً يتوافق مع معايير الهجرة البريطانية.' };
  };

  const assessment = getRiskAssessment();

  return (
    <div className="mt-8 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Landmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
           <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">🇬🇧 فحص الامتثال المالي (UKVI Appendix V)</h3>
        </div>
        
        <label className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
            ${isAnalyzing 
                ? 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-wait' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 dark:shadow-none'
            }`}>
            {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {isAnalyzing ? 'جاري التحليل...' : 'تحليل PDF/صور'}
            <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileUpload} disabled={isAnalyzing} />
        </label>
      </div>
      
      <div className="p-4">
        {aiWarnings.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg">
            <h4 className="text-xs font-bold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1">
               <AlertTriangle className="w-3 h-3" /> تنبيهات الذكاء الاصطناعي:
            </h4>
            <ul className="list-disc list-inside text-xs text-red-600 dark:text-red-300">
               {aiWarnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        <div className="text-xs text-slate-500 dark:text-slate-400 mb-4 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded border border-indigo-100 dark:border-indigo-800">
          <Info className="w-3 h-3 inline ml-1" /> 
          وفقاً لقواعد التأشيرة البريطانية، يتم النظر إلى <strong>أقل رصيد شهري (Lowest Balance)</strong> وليس متوسط الرصيد فقط. يرجى إدخال البيانات بدقة.
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="p-2 rounded-r-lg">الشهر</th>
                <th className="p-2 text-emerald-600 dark:text-emerald-400">إيداع (In)</th>
                <th className="p-2 text-red-600 dark:text-red-400">سحب (Out)</th>
                <th className="p-2 text-blue-600 dark:text-blue-400 rounded-l-lg">أقل رصيد (Low Bal)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td className="p-2 font-medium text-slate-700 dark:text-slate-300">{row.month}</td>
                  <td className="p-2">
                    <input 
                      type="number" 
                      value={row.credit || ''}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500 outline-none"
                      placeholder="0.00"
                      onChange={(e) => updateVal(idx, 'credit', e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="number" 
                      value={row.debit || ''}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:ring-1 focus:ring-red-500 outline-none"
                      placeholder="0.00"
                      onChange={(e) => updateVal(idx, 'debit', e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="number" 
                      value={row.lowestBalance || ''}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none font-bold text-blue-600 dark:text-blue-400"
                      placeholder="Low Bal"
                      onChange={(e) => updateVal(idx, 'lowestBalance', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* UK Analysis Metrics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800 space-y-3">
             <h4 className="text-xs font-bold text-slate-500 flex items-center gap-1"><Scale className="w-3 h-3" /> تحليل الدخل (Disposable Income)</h4>
             
             <div className="flex justify-between text-sm">
                <span>متوسط الدخل الشهري:</span>
                <span className="font-mono font-bold text-emerald-600">{avgCredit.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
             </div>
             
             {estimatedSalary > 0 && (
                 <div className="flex justify-between text-sm">
                    <span>الراتب المقدر (AI):</span>
                    <span className="font-mono font-bold text-indigo-600">{estimatedSalary.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                 </div>
             )}

             <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
                <div className="flex justify-between text-sm">
                    <span>صافي الفائض الشهري:</span>
                    <span className={`font-mono font-bold ${netDisposable > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {netDisposable.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                    * هذا هو المبلغ الحقيقي المتاح للسفر بعد خصم التزامات المعيشة.
                </p>
             </div>
          </div>

          <div className={`p-4 rounded-lg border flex flex-col justify-center ${assessment.bg} border-transparent`}>
             <div className="flex items-center gap-2 mb-2">
                <assessment.icon className={`w-5 h-5 ${assessment.color}`} />
                <h4 className={`font-bold ${assessment.color}`}>النتيجة: {assessment.status}</h4>
             </div>
             <p className="text-xs text-slate-700 dark:text-slate-300 opacity-90 leading-relaxed font-medium">
               {assessment.msg}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentWallet: React.FC = () => {
  const [docs, setDocs] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('visa_app_docs');
    if (stored) { try { setDocs(JSON.parse(stored)); } catch {} }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const newDoc = { id: Date.now().toString(), fileName: file.name, data: reader.result as string };
      const updated = [...docs, newDoc];
      try {
        localStorage.setItem('visa_app_docs', JSON.stringify(updated));
        setDocs(updated);
      } catch { alert('Storage full'); }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mt-8 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> ملفات العميل</h3>
        <label className="cursor-pointer text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition flex items-center gap-1">
          <Upload className="w-3 h-3" /> {isUploading ? '...' : 'رفع'}
          <input type="file" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>
      <div className="p-4 space-y-2">
        {docs.length === 0 ? <p className="text-xs text-slate-400 text-center">لا توجد مستندات مرفقة</p> : 
          docs.map(d => (
            <div key={d.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
              <span className="text-xs truncate max-w-[150px]">{d.fileName}</span>
              <button onClick={() => {
                const n = docs.filter(x => x.id !== d.id);
                setDocs(n);
                localStorage.setItem('visa_app_docs', JSON.stringify(n));
              }} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))
        }
      </div>
    </div>
  );
};

const VisaResult: React.FC<VisaResultProps> = ({ data, origin, destination, onRefresh }) => {
  // Memoize the enhanced markdown to avoid recalculating on every render
  const enhancedMarkdown = useMemo(() => {
    let text = data.markdown;

    // Currency bolding (Existing logic)
    const currencyPattern = /(?<!\*\*)(\b\d+(?:\.\d+)?\s?(?:USD|EUR|GBP|SAR|AED|EGP|TRY)\b)(?!\*\*)/gi;
    text = text.replace(currencyPattern, '**$&**');

    // Flag injection logic
    // Sort countries by name length descending to handle substrings correctly
    const sortedCountries = [...COUNTRIES].sort((a, b) => b.nameAr.length - a.nameAr.length);

    sortedCountries.forEach(country => {
        // Arabic Replacement
        if (country.nameAr) {
            // Safe replacement avoiding double flagging
            // We use a regex replacer function to check context if safe lookbehind isn't guaranteed in all envs
            // But simple string checks are often robust enough for this specific content
            const escapedName = country.nameAr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedName, 'g');
            text = text.replace(regex, (match, offset, fullString) => {
                 // Check 5 chars behind to see if flag is already there
                 const preceding = fullString.substring(Math.max(0, offset - 5), offset);
                 if (preceding.includes(country.flag)) return match; 
                 return `${country.flag} ${match}`;
            });
        }

        // English Replacement
        if (country.nameEn) {
             const escapedEn = country.nameEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
             // Use word boundary for English
             const regexEn = new RegExp(`\\b${escapedEn}\\b`, 'g');
             text = text.replace(regexEn, (match, offset, fullString) => {
                 const preceding = fullString.substring(Math.max(0, offset - 5), offset);
                 if (preceding.includes(country.flag)) return match;
                 return `${country.flag} ${match}`;
             });
        }
    });

    return text;
  }, [data.markdown]);

  const isUK = destination.code === 'GB';
  const isSchengen = SCHENGEN_CODES.includes(destination.code);

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Agency Disclaimer - High Priority */}
      <div className="bg-slate-800 text-slate-200 p-5 rounded-xl mb-6 border-l-4 border-yellow-500 shadow-lg">
        <div className="flex items-start gap-4">
            <ShieldCheck className="w-7 h-7 text-yellow-500 shrink-0 mt-1 hover:scale-110 transition-transform duration-300" />
            <div>
                <h4 className="font-bold text-white mb-2 text-lg">تنبيه هام للشركات والوكلاء (Agency Use Only)</h4>
                <p className="opacity-95 text-sm leading-relaxed text-slate-100">
                    هذا التقرير تم إنشاؤه بواسطة الذكاء الاصطناعي بناءً على البيانات المتاحة أونلاين. 
                    بينما نسعى للدقة بنسبة 100%، يجب على موظف التأشيرات **دائماً** مطابقة الرسوم والمتطلبات مع الموقع الرسمي للسفارة قبل اعتماد الملف للعميل، حيث أن القوانين القنصلية قد تتغير فجأة بدون إشعار مسبق.
                </p>
            </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6">
        <div className="bg-slate-50 dark:bg-slate-950 p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">ملف متطلبات التأشيرة</h2>
                <button 
                  onClick={onRefresh}
                  className="group flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all shadow-sm"
                  title="إعادة تحميل البيانات"
                >
                  <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="hidden sm:inline">تحديث</span>
                </button>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-mono">
                 REF: {new Date().getTime().toString().slice(-6)} | {new Date().toLocaleDateString('en-GB')}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
               <Plane className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            </div>
          </div>
        </div>
        
        <div className="p-6 md:p-8">
          <div className="prose prose-slate dark:prose-invert max-w-none text-right" dir="rtl">
            <ReactMarkdown components={MarkdownComponents}>
              {enhancedMarkdown}
            </ReactMarkdown>

            {/* Schengen Specific Checklist */}
            {isSchengen && <SchengenChecklist />}

            {/* UK Specific Tool */}
            {isUK && <BankStatementAnalyzer />}

            <CurrencyConverter origin={origin} destination={destination} />
            <DocumentWallet />
            
            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
               <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                     <strong>تنويه هام:</strong> متطلبات التأشيرات تخضع للتغيير المستمر. المعلومات الواردة أعلاه هي لأغراض إرشادية فقط. يرجى التحقق دائماً من المصادر الرسمية للسفارة أو القنصلية المعنية قبل السفر.
                  </span>
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sources & Timestamp */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-12">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> المصادر المعتمدة في التقرير
        </h3>
        <div className="grid gap-2">
            {data.sources.length > 0 ? data.sources.map((source, idx) => (
            <a key={idx} href={source.url} className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline truncate">
                <ExternalLink className="w-3 h-3 shrink-0" /> {source.title}
            </a>
            )) : <span className="text-xs text-slate-400">تم الاعتماد على المعلومات العامة للسفارات.</span>}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
             <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 font-medium">
              <Clock className="w-3 h-3" /> 
              آخر تحديث للبيانات: <span dir="ltr">{new Date(data.generatedAt).toLocaleString('ar-EG')}</span>
             </p>
        </div>
      </div>
    </div>
  );
};

export default VisaResult;