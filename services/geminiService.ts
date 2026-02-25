
import { GoogleGenAI, Type } from "@google/genai";
import { VisaRequestParams, VisaInfoResponse, BankAnalysisResult } from "../types";

export type { BankAnalysisResult };

const ETIAS_RULE = `
**🚨 نظام ETIAS لعام 2026 (أوروبا):**
بحلول عام 2026، سيكون نظام ETIAS إلزامياً بالكامل لكافة المسافرين المعفيين من الفيزا لدخول منطقة شنغن.
`;

const TURKEY_2026_RULE = `
**🚨 تحديث لوائح تأشيرة تركيا 2026 (للمتقدمين المقيمين في مصر):**
يُسمح للمتقدمين الذين يعملون في جهات خارج مصر (Remote work أو موظفين دوليين) بالتقديم للحصول على التأشيرة التركية من داخل مصر، بشرط تقديم كشف حساب بنكي مصري شخصي نشط، بالإضافة إلى كشف حساب بنكي من الدولة التي يقع بها مقر العمل لضمان توافق مصادر الدخل.
`;

/**
 * Fetch visa requirements from Gemini with categorical structure.
 */
export const getVisaRequirements = async (params: VisaRequestParams): Promise<VisaInfoResponse> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const destCode = params.destination.code;

    const prompt = `
      **ROLE**: SENIOR GLOBAL VISA COMPLIANCE OFFICER.
      **TASK**: Generate a structured visa requirement report for **2026**.
      
      **APPLICANT**: ${params.origin.nameEn} (From: ${params.origin.nameAr})
      **DESTINATION**: ${params.destination.nameEn} (To: ${params.destination.nameAr})

      **MANDATORY CATEGORIES**:
      You must provide a detailed breakdown for these 4 types:
      1. ✈️ **تأشيرة السياحة (Tourism Visa)**: General travel and sightseeing.
      2. 💼 **تأشيرة الأعمال (Business Visa)**: Meetings, conferences, and investment.
      3. 🎓 **تأشيرة الدراسة (Study Visa)**: Academic and language courses.
      4. 🏥 **تأشيرة العلاج (Medical Visa)**: Treatment and medical checkups.

      **STRICT PHOTO REQUIREMENTS**:
      - For every visa type that requires a personal photo (الصورة الشخصية), you MUST specify the exact dimensions (e.g., 3.5x4.5 cm for Schengen, 2x2 inches for USA, etc.) and the background color (usually white).
      - Highlight these dimensions clearly within the "Required Documents" section.

      **STRICT FORMATTING**:
      - Start each type with "### [Icon] [Arabic Title] ([English Title])".
      - Within each type, include: (Status, Required Documents with PHOTO SIZES, Fees for 2026, and Processing Time).
      - If a country doesn't have a specific type (e.g. medical is part of tourism), state that.
      - Use Arabic for all explanations.
      - Include the latest 2026 updates (ETIAS, digital visas).

      ${['FR', 'DE', 'IT', 'ES', 'AT', 'BE', 'NL', 'GR', 'CH'].includes(destCode) ? ETIAS_RULE : ''}
      ${destCode === 'TR' ? TURKEY_2026_RULE : ''}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          { inlineData: { data: base64Data, mimeType: file.type || 'image/jpeg' } },
          { text: "Analyze this bank statement for a 2026 visa. Check for Funds Parking and regular income. Result in Arabic JSON." }
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
