
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { VisaRequestParams, VisaInfoResponse, BankAnalysisResult } from "../types";

export type { BankAnalysisResult };

const ETIAS_RULE = `
**🚨 نظام ETIAS (أوروبا):**
بحلول عام 2026، سيكون تصريح ETIAS إلزامياً بالكامل لكافة المسافرين من الدول المعفاة من التأشيرة لدخول منطقة شنغن. يجب التقديم عليه إلكترونياً قبل السفر، وتبلغ صلاحيته 3 سنوات أو حتى انتهاء صلاحية جواز السفر.
`;

const GREECE_2026_RULE = `
**🚨 تحديث اختصاص التقديم لليونان (مصر):**
يتم تحديد القنصلية المختصة (القاهرة أو الإسكندرية) بناءً على "رقم مكتب الإصدار" الموجود في جواز السفر المصري:
1. **قنصلية القاهرة**: تختص بالجوازات الصادرة من مكاتب القاهرة، الجيزة، وباقي المحافظات غير التابعة للإسكندرية.
2. **قنصلية الإسكندرية**: تختص حصرياً بالجوازات الصادرة من مكاتب (الإسكندرية، البحيرة، مطروح، كفر الشيخ، الغربية).
يجب التأكد من مكتب الإصدار قبل حجز الموعد لتجنب رفض استلام الملف.
`;

const TURKEY_2026_RULE = `
**🚨 تحديث لوائح تأشيرة تركيا (للمتقدمين المقيمين في مصر):**
يُسمح للمتقدمين الذين يعملون في جهات خارج مصر (Remote work أو موظفين دوليين) بالتقديم للحصول على التأشيرة التركية من داخل مصر, بشرط تقديم كشف حساب بنكي مصري شخصي نشط، بالإضافة إلى كشف حساب بنكي من الدولة التي يقع بها مقر العمل لضمان توافق مصادر الدخل.
`;

const SPAIN_RULE = `
**🚨 تحديثات تأشيرة إسبانيا (BLS International - 2024/2025):**
- **رسوم التأشيرة (Schengen)**: 90 يورو للبالغين (حوالي 98-100 دولار أمريكي)، 45 يورو للأطفال (6-12 سنة).
- **رسوم الخدمة (BLS)**: تبلغ حوالي 16.25 يورو (حوالي 18 دولار أمريكي).
- **الإجمالي**: حوالي **106.25 يورو**. 
- **ملاحظة**: قد يظهر المبلغ في بعض المواقع أو الحسابات بقيمة تقريبية تعادل **106 دولار** بناءً على أسعار صرف قديمة أو تقريبية، ولكن العملة الرسمية للرسوم هي **اليورو** وتُدفع بما يعادلها بالعملة المحلية (مثل الجنيه المصري).
- **طريقة الدفع**: تُدفع كافة الرسوم نقداً بالعملة المحلية داخل مركز التقديم BLS.
`;

const ITALY_RULE = `
**🚨 تحديثات تأشيرة إيطاليا (VFS Global / Almaviva):**
- **الرسوم**: 90 يورو للبالغين.
- **طريقة الدفع**: في VFS تُدفع نقداً بالجنيه المصري. في Almaviva قد يتطلب الدفع عبر "فوري" أو بطاقة ميزة.
- **رسوم الخدمة**: حوالي 30-40 يورو.
`;

const FRANCE_RULE = `
**🚨 تحديثات تأشيرة فرنسا (TLScontact):**
- **الرسوم**: 90 يورو للبالغين.
- **طريقة الدفع**: رسوم الخدمة (حوالي 40 يورو) تُدفع مسبقاً (أونلاين أو فوري) لتأكيد الموعد. رسوم التأشيرة تُدفع في المركز.
- **الموقع الرسمي**: يجب التسجيل في France-Visas أولاً.
`;

const US_RULE = `
**🚨 تحديثات تأشيرة الولايات المتحدة (US Visa):**
- **الإعفاء من المقابلة (Interview Waiver)**: متاح لبعض حالات تجديد التأشيرة (نفس الفئة) إذا لم يمضِ أكثر من 48 شهراً على انتهاء التأشيرة السابقة، وللأطفال دون 14 عاماً وكبار السن فوق 79 عاماً.
- **التدقيق الأمني**: تشديد الرقابة على بيانات نموذج DS-160، خاصة سجل السفر خلال الـ 5 سنوات الماضية وحسابات التواصل الاجتماعي.
- **الرسوم**: 185 دولاراً لتأشيرات السياحة والأعمال (B1/B2).
- **طريقة الدفع**: في مصر يتم الدفع عبر البنك التجاري الدولي (CIB) حصراً قبل حجز الموعد.
`;

const UK_RULE = `
**🚨 تحديثات تأشيرة بريطانيا (UK eVisa & ETA):**
- **نظام eVisa**: تم الاستغناء بالكامل عن الملصقات الورقية وجوازات السفر البيومترية (BRP). يجب على كافة حاملي التأشيرات طويلة الأمد إنشاء حساب UKVI لربط تأشيرتهم رقمياً بجواز السفر.
- **نظام ETA**: سيصبح إلزامياً لكافة الجنسيات المعفاة من التأشيرة (بما في ذلك مواطني الاتحاد الأوروبي والخليج) قبل دخول المملكة المتحدة.
- **الرسوم**: حوالي 115 جنيه إسترليني لتأشيرة الزيارة القياسية (Standard Visitor visa) لمدة 6 أشهر.
- **طريقة الدفع**: الدفع أونلاين عبر موقع GOV.UK الرسمي عند تقديم الطلب.
`;

const CANADA_RULE = `
**🚨 تحديثات تأشيرة كندا (Canada Visa & eTA):**
- **توسيع نظام eTA**: يمكن لمواطني بعض الدول (مثل المغرب، تونس، الفلبين، وغيرها) التقديم على تصريح سفر إلكتروني (eTA) بدلاً من التأشيرة التقليدية إذا كانوا قد حصلوا على تأشيرة كندية في آخر 10 سنوات أو لديهم تأشيرة صالحة للولايات المتحدة (US Non-immigrant visa).
- **حاملي تأشيرة أمريكا/شنغن/بريطانيا**: وجود تأشيرة صالحة من هذه الدول يقوي الملف جداً وقد يسرع المعالجة (نظام CAN+)، لكنه لا يعفي من التأشيرة الكندية إلا للفئات المشمولة بنظام eTA.
- **الرسوم**: 100 دولار كندي للتأشيرة + 85 دولار كندي للبصمات.
- **البصمات**: إلزامية وتظل صالحة لمدة 10 سنوات.
`;

const BRAZIL_RULE = `
**🚨 تحديثات تأشيرة البرازيل (Brazil Visa):**
- **كشف الحساب البنكي**: تشترط القنصلية البرازيلية تقديم كشف حساب بنكي لآخر **3 أشهر** على الأقل، ويفضل أن يكون باللغة الإنجليزية أو مترجماً، مع وجود حركة سحب وإيداع منتظمة.
- **سياسة الرفض**: في حال رفض التأشيرة، يجب على المتقدم الانتظار لمدة **6 أشهر** قبل محاولة التقديم مرة أخرى.
- **الصورة الشخصية**: مقاس 4*6 خلفية بيضاء، حديثة (لم يمر عليها أكثر من 6 أشهر).
`;

/**
 * Fetch visa requirements from Gemini with categorical structure.
 */
export const getVisaRequirements = async (params: VisaRequestParams): Promise<VisaInfoResponse> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    
    if (!apiKey || apiKey === "undefined" || apiKey === "" || apiKey === "null") {
      throw new Error("مفتاح التشغيل (API Key) غير متوفر. يرجى الذهاب إلى قائمة Settings في AI Studio والتأكد من إضافة GEMINI_API_KEY.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const destCode = params.destination.code;
    const isEn = params.language === 'en';

    const prompt = `
      **ROLE**: SENIOR GLOBAL VISA COMPLIANCE OFFICER.
      **TASK**: Generate a structured visa requirement report with the latest updates.
      
      **ACCURACY PROTOCOL**: 
      - You MUST use the **googleSearch** tool to verify the current visa status, fees, and procedures from OFFICIAL GOVERNMENT PORTALS (e.g., official embassy websites, Ministry of Foreign Affairs, or official outsourcing partners like VFS Global, TLScontact, BLS International).
      - If there are conflicting sources, prioritize the most recent official government announcement.
      - Explicitly mention if a specific rule (like ETIAS or digital visa transitions) is currently active or has a future implementation date.

      **APPLICANT**: ${params.origin.nameEn} (From: ${params.origin.nameAr})
      **DESTINATION**: ${params.destination.nameEn} (To: ${params.destination.nameAr})
      **LANGUAGE**: ${isEn ? 'English' : 'Arabic'}

      **MANDATORY CATEGORIES**:
      You must provide a detailed breakdown for these 4 types EXACTLY ONCE. Do not repeat categories:
      1. ✈️ ${isEn ? 'Tourism Visa' : 'تأشيرة السياحة (Tourism Visa)'}
      2. 💼 ${isEn ? 'Business Visa' : 'تأشيرة الأعمال (Business Visa)'}
      3. 🎓 ${isEn ? 'Study Visa' : 'تأشيرة الدراسة (Study Visa)'}
      4. 🏥 ${isEn ? 'Medical Visa' : 'تأشيرة العلاج (Medical Visa)'}

      **STRICT PHOTO REQUIREMENTS**:
      - For every visa type that requires a personal photo, you MUST specify the exact dimensions and the background color.
      - Highlight these dimensions clearly within the "Required Documents" section.

      **STRICT FORMATTING**:
      - Start each type with "### [Icon] [Title]".
      - Within each type, include:
        - **Verification Status**: ✅ ${isEn ? 'Verified via Official Sources' : 'تم التحقق عبر المصادر الرسمية'}
        - **Status**: (Current visa status).
        - **Required Documents**: (List documents, including PHOTO SIZES).
        - **Travel Checklist**: Provide a list of actionable items for the applicant to prepare (e.g., [ ] Book flight, [ ] Translate ID).
        - **Translation Requirements**: Specify which documents must be translated and any certification requirements.
        - **Fees**: (Current fees including service fees if applicable).
        - **Processing Time**: (Estimated duration).
        - **Official Portal**: Provide the DIRECT LINK to the official government visa application website.
        - **Embassy Information**: Provide the address, phone number, and official website of the embassy or consulate in ${params.origin.nameEn}.
        - **Detailed Application Process**: Provide a comprehensive, step-by-step guide (1, 2, 3...) on how to apply, from registration to passport collection.
      - If a country doesn't have a specific type, state that.
      - Use ${isEn ? 'English' : 'Arabic'} for all explanations.
      - Include the latest updates (ETIAS, digital visas).

      ${['FR', 'DE', 'IT', 'ES', 'AT', 'BE', 'NL', 'GR', 'CH'].includes(destCode) ? ETIAS_RULE : ''}
      ${destCode === 'GR' ? GREECE_2026_RULE : ''}
      ${destCode === 'TR' ? TURKEY_2026_RULE : ''}
      ${destCode === 'ES' ? SPAIN_RULE : ''}
      ${destCode === 'IT' ? ITALY_RULE : ''}
      ${destCode === 'FR' ? FRANCE_RULE : ''}
      ${destCode === 'US' ? US_RULE : ''}
      ${destCode === 'GB' ? UK_RULE : ''}
      ${destCode === 'CA' ? CANADA_RULE : ''}
      ${destCode === 'BR' ? BRAZIL_RULE : ''}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const markdown = response.text || "لم يتم العثور على بيانات.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks
      ?.filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
      .map((chunk: any) => ({
        title: chunk.web!.title,
        url: chunk.web!.uri
      })) || [];

    return {
      markdown,
      sources: Array.from(new Map(sources.map((s: any) => [s.url, s])).values()) as any,
      generatedAt: new Date().toISOString()
    };

  } catch (error: any) {
    throw new Error(error.message || "فشل في جلب البيانات.");
  }
};

/**
 * Chat with Gemini Pro for complex queries or general assistance.
 */
export const chatWithGemini = async (message: string, history: { role: string, parts: { text: string }[] }[] = []) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });
    
    // Use gemini-3.1-pro-preview for the chatbot with high thinking level
    const chat = ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction: "You are an expert travel and visa assistant. Provide accurate, helpful, and up-to-date information. Use Google Search grounding when needed.",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        tools: [{ googleSearch: {} }]
      },
      history: history
    });

    const response = await chat.sendMessage({ message });
    return response.text || "لم يتم العثور على رد.";
  } catch (error: any) {
    console.error("Chat Error:", error);
    throw new Error("فشل في الحصول على رد من المساعد الذكي.");
  }
};

/**
 * Fast response using Flash Lite.
 */
export const getFastResponse = async (prompt: string) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
    });
    return response.text || "لم يتم العثور على رد.";
  } catch (error: any) {
    throw new Error("فشل في الحصول على رد سريع.");
  }
};

export const analyzeBankStatement = async (file: File): Promise<BankAnalysisResult> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === "undefined" || apiKey === "" || apiKey === "null") {
      throw new Error("مفتاح التشغيل (API Key) غير متوفر.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: [{
        parts: [
          { inlineData: { data: base64Data, mimeType: file.type || 'image/jpeg' } },
          { text: `
            Analyze this bank statement for a visa application, with a special focus on UK Embassy (UKVI) standards. 
            The UKVI is extremely strict about "Funds Parking" and "Source of Wealth".
            
            Perform a granular transaction-level audit:
            1. **Income Consistency**: Match regular credits with declared salary/business income. Note any deviations.
            2. **Funds Parking (UKVI Focus)**: Identify ANY large deposits that don't match the regular income pattern. These are high-risk for UK visas.
            3. **Source of Funds**: Flag transactions that require documented evidence (e.g., large transfers from third parties).
            4. **Affordability**: Compare the closing balance and monthly savings against the typical cost of a UK trip (approx £2000-£5000).
            5. **Spending to Income Ratio**: Analyze if the lifestyle shown by expenses matches the declared income.
            6. **Visa Readiness Score**: Provide a score from 0-100 specifically for a UK Standard Visitor Visa.
            
            Return the result in JSON format with detailed Arabic and English summaries.
          ` }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summaryAr: { type: Type.STRING },
            summaryEn: { type: Type.STRING },
            riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            readinessScore: { type: Type.NUMBER },
            monthlyAverageIncome: { type: Type.NUMBER },
            monthlyAverageExpenses: { type: Type.NUMBER },
            closingBalance: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            findings: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            detectedPatterns: {
              type: Type.OBJECT,
              properties: {
                salaryDetected: { type: Type.BOOLEAN },
                fundsParkingDetected: { type: Type.BOOLEAN },
                stableBalance: { type: Type.BOOLEAN },
                frequentTransfers: { type: Type.BOOLEAN }
              },
              required: ["salaryDetected", "fundsParkingDetected", "stableBalance", "frequentTransfers"]
            }
          },
          required: ["summaryAr", "summaryEn", "riskLevel", "readinessScore", "monthlyAverageIncome", "monthlyAverageExpenses", "closingBalance", "currency", "findings", "recommendations", "detectedPatterns"],
        },
      },
    });
    const text = response.text;
    if (!text) throw new Error("لم يتم العثور على بيانات في التحليل.");
    return JSON.parse(text.trim());
  } catch (error: any) {
    throw new Error("فشل في تحليل كشف الحساب.");
  }
};
