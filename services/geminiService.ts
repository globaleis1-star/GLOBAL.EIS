
import { GoogleGenAI, Type } from "@google/genai";
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
**🚨 تحديثات تأشيرة إسبانيا (BLS International):**
- **الرسوم**: 90 يورو للبالغين، 45 يورو للأطفال (6-12 سنة).
- **طريقة الدفع**: تُدفع الرسوم نقداً بالجنيه المصري داخل مركز BLS وقت المقابلة.
- **رسوم الخدمة**: حوالي 18 يورو (تُدفع بالجنيه المصري).
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

/**
 * Fetch visa requirements from Gemini with categorical structure.
 */
export const getVisaRequirements = async (params: VisaRequestParams): Promise<VisaInfoResponse> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
      throw new Error("مفتاح التشغيل (API Key) غير متوفر. يرجى التأكد من إعدادات البيئة.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const destCode = params.destination.code;

    const prompt = `
      **ROLE**: SENIOR GLOBAL VISA COMPLIANCE OFFICER.
      **TASK**: Generate a structured visa requirement report with the latest updates.
      
      **APPLICANT**: ${params.origin.nameEn} (From: ${params.origin.nameAr})
      **DESTINATION**: ${params.destination.nameEn} (To: ${params.destination.nameAr})

      **MANDATORY CATEGORIES**:
      You must provide a detailed breakdown for these 4 types EXACTLY ONCE. Do not repeat categories:
      1. ✈️ **تأشيرة السياحة (Tourism Visa)**: General travel and sightseeing.
      2. 💼 **تأشيرة الأعمال (Business Visa)**: Meetings, conferences, and investment.
      3. 🎓 **تأشيرة الدراسة (Study Visa)**: Academic and language courses.
      4. 🏥 **تأشيرة العلاج (Medical Visa)**: Treatment and medical checkups.

      **STRICT PHOTO REQUIREMENTS**:
      - For every visa type that requires a personal photo (الصورة الشخصية), you MUST specify the exact dimensions (e.g., 3.5x4.5 cm for Schengen, 2x2 inches for USA, etc.) and the background color (usually white).
      - Highlight these dimensions clearly within the "Required Documents" section.

      **STRICT FORMATTING**:
      - Start each type with "### [Icon] [Arabic Title] ([English Title])".
      - Within each type, include:
        - **Status**: (Current visa status).
        - **Required Documents**: (List documents, including PHOTO SIZES).
        - **Translation Requirements (الأوراق المطلوب ترجمتها)**: Specify which documents must be translated (e.g., to English or the local language) and any certification requirements (Certified translation, Apostille, etc.).
        - **Fees**: (Current fees).
        - **Processing Time**: (Estimated duration).
        - **Application Roadmap (خريطة خطوات التقديم)**: Provide a clear, step-by-step guide (1, 2, 3...) on how to apply, where to go (Embassy, VFS, TLS, etc.), and what happens during the process (Interview, Biometrics, etc.).
      - If a country doesn't have a specific type (e.g. medical is part of tourism), state that.
      - Use Arabic for all explanations.
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
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
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

export const analyzeBankStatement = async (file: File): Promise<BankAnalysisResult> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
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
          { text: "Analyze this bank statement for a visa application. Check for Funds Parking and regular income. Result in Arabic JSON." }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summaryAr: { type: Type.STRING },
            riskLevel: { type: Type.STRING },
            findings: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summaryAr", "riskLevel", "findings", "recommendations"],
        },
      },
    });
    return JSON.parse(response.text.trim());
  } catch (error: any) {
    throw new Error("فشل في تحليل كشف الحساب.");
  }
};
