
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  language: 'ar' | 'en';
}

const FAQSection: React.FC<FAQSectionProps> = ({ language }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = language === 'ar' ? [
    {
      question: "ما هي المتطلبات الأساسية لمعظم طلبات التأشيرة؟",
      answer: "بشكل عام، ستحتاج إلى جواز سفر ساري المفعول (لمدة 6 أشهر على الأقل)، صور شخصية حديثة، كشف حساب بنكي لآخر 3-6 أشهر، حجز طيران وفندق مبدئي، وتأمين طبي للسفر. قد تختلف المتطلبات حسب نوع التأشيرة والوجهة."
    },
    {
      question: "كم من الوقت تستغرق معالجة التأشيرة عادةً؟",
      answer: "تتراوح مدة المعالجة عادة بين 5 أيام عمل إلى 3 أسابيع. ننصح دائماً بالتقديم قبل موعد السفر بشهر على الأقل لتجنب أي تأخير غير متوقع."
    },
    {
      question: "هل أحتاج إلى ترجمة جميع مستنداتي؟",
      answer: "نعم، معظم السفارات تطلب ترجمة المستندات الصادرة بلغة غير لغتها الرسمية (أو الإنجليزية) إلى لغتها الرسمية من خلال مكتب ترجمة معتمد."
    },
    {
      question: "ماذا أفعل إذا تم رفض طلبي للحصول على تأشيرة؟",
      answer: "في حالة الرفض، ستتلقى خطاباً يوضح الأسباب. يمكنك إما تقديم استئناف (إذا كان ذلك متاحاً) أو معالجة الأسباب المذكورة والتقديم مرة أخرى بعد فترة زمنية معينة."
    },
    {
      question: "هل التأمين الطبي للسفر إلزامي؟",
      answer: "نعم، بالنسبة لمعظم الوجهات (خاصة دول شنغن)، يعد التأمين الطبي للسفر الذي يغطي ما لا يقل عن 30,000 يورو مطلباً إلزامياً."
    }
  ] : [
    {
      question: "What are the basic requirements for most visa applications?",
      answer: "Generally, you will need a valid passport (for at least 6 months), recent passport-sized photos, bank statements for the last 3-6 months, flight and hotel reservations, and travel medical insurance. Requirements vary by visa type and destination."
    },
    {
      question: "How long does visa processing usually take?",
      answer: "Processing times typically range from 5 working days to 3 weeks. We always recommend applying at least a month before your travel date to avoid unexpected delays."
    },
    {
      question: "Do I need to translate all my documents?",
      answer: "Yes, most embassies require documents issued in a language other than their official language (or English) to be translated by a certified translation office."
    },
    {
      question: "What should I do if my visa application is rejected?",
      answer: "In case of rejection, you will receive a letter explaining the reasons. You can either file an appeal (if available) or address the reasons mentioned and re-apply after a certain period."
    },
    {
      question: "Is travel medical insurance mandatory?",
      answer: "Yes, for most destinations (especially Schengen countries), travel medical insurance covering at least €30,000 is a mandatory requirement."
    }
  ];

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="mt-16 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
      <div className="flex items-center gap-2 mb-6 px-1">
        <HelpCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
          {language === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
        </h3>
      </div>
      
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div 
            key={index}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full flex items-center justify-between p-5 text-right focus:outline-none"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <span className={`text-sm font-bold text-slate-800 dark:text-slate-200 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                {faq.question}
              </span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
              )}
            </button>
            
            {openIndex === index && (
              <div 
                className={`p-5 pt-0 text-xs leading-relaxed text-slate-600 dark:text-slate-400 border-t border-slate-50 dark:border-slate-800/50 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQSection;
