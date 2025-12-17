
import { GoogleGenerativeAI } from "@google/generative-ai";

import { VisaRequestParams, VisaInfoResponse, GroundingChunk } from "../types";

const genAI = new GoogleGenerativeAI(apiKey);


// --- CONSTANTS & TEMPLATES ---

const CANADA_VISA_EXEMPTIONS = `
**⚡ IMPORTANT NOTE: VALID CANADIAN VISA HOLDERS EXEMPTIONS**
If the applicant holds a valid, used, or multi-entry **Canadian Visa**, include this SPECIFIC exemption rule for the destination:
`;

// --- RULES DICTIONARY (EASY TO UPDATE) ---
// Add new countries from the Sales Kit here directly
const VISA_RULES: Record<string, string> = {
  // NORTH & CENTRAL AMERICA
  'MX': `
    ${CANADA_VISA_EXEMPTIONS}
    - **Mexico**: ENTRY ALLOWED WITHOUT MEXICO VISA.
    - **Condition**: Must hold a valid **Multi-Entry Canadian Visa**, USA, Japan, UK, or Schengen.
    - **Max Stay**: Up to 180 days.
  `,
  'CR': `
    ${CANADA_VISA_EXEMPTIONS}
    - **Costa Rica**: ENTRY ALLOWED.
    - **Condition**: Valid tourist, business, or student Canadian visa, USA, or Schengen.
    - **Max Stay**: 30 days.
  `,
  'PA': `
    ${CANADA_VISA_EXEMPTIONS}
    - **Panama**: ENTRY ALLOWED.
    - **Conditions**: 
      1. Canadian/USA/Australia/EU visa must be valid for at least 6 months.
      2. Must have been **used** to enter that country at least once.
      3. Proof of solvency ($500).
    - **Max Stay**: 30 days.
  `,
  'BZ': `
    ${CANADA_VISA_EXEMPTIONS}
    - **Belize**: ENTRY ALLOWED (Visa-free) for USA/Canada/Schengen holders.
    - **Max Stay**: 30 days.
  `,
  'SV': `
    ${CANADA_VISA_EXEMPTIONS}
    - **El Salvador**: ENTRY ALLOWED (CA-4 Zone).
    - **Fee**: $12 Tourist Card purchased at airport upon arrival.
    - **Max Stay**: 90 days.
  `,
  'GT': `
    ${CANADA_VISA_EXEMPTIONS}
    - **Guatemala**: ENTRY ALLOWED (CA-4 Zone) for USA/Canada/Schengen holders.
    - **Max Stay**: 90 days.
  `,
  'HN': `
    ${CANADA_VISA_EXEMPTIONS}
    - **Honduras**: ENTRY ALLOWED (CA-4 Zone).
    - **Condition**: Canadian/USA/Schengen visa must be valid for at least 6 months.
    - **Max Stay**: 90 days.
  `,
  'DO': `
    ${CANADA_VISA_EXEMPTIONS}
    - **Dominican Republic**: ENTRY ALLOWED.
    - **Fee**: Free Tourist Card upon arrival.
    - **Max Stay**: 30 days.
  `,
  'BM': `
    ${CANADA_VISA_EXEMPTIONS}
    - **Bermuda**: ENTRY ALLOWED.
    - **Condition**: Canadian/USA/UK visa must be valid for at least 45 days **after** departure from Bermuda.
    - **Max Stay**: 30 days.
  `,
  'AG': `
    ${CANADA_VISA_EXEMPTIONS}
    - **Antigua and Barbuda**: VISA ON ARRIVAL ALLOWED.
    - **Fee**: $100 USD.
    - **Condition**: Canadian/USA/UK/Schengen visa valid for at least 6 months.
    - **Max Stay**: 30 days.
  `,

  // EUROPE
  'FR': `
    **🚨 SPECIAL RULES FOR FRANCE (TLS CONTACT):**
    1. **Fees**: **90 EUR** (approx. 4,800 EGP).
    2. **Service Fee**: Approx. **40 EUR** (Paid in EGP).
    3. **Payment**:
       - **Service Fee**: Must be **Pre-paid Online** to confirm appointment.
       - **Visa Fee**: Paid in **CASH (EGP)** inside the center.
    4. **Process**: Application must be filled on **France-Visas** website first to get the reference number before booking on TLS.
  `,
  'IT': `
    **🚨 SPECIAL RULES FOR ITALY (ALMAVIVA / VFS):**
    1. **Fees**: **90 EUR** (approx. 4,800 EGP).
    2. **Service Fee**: Variable (~1,100 EGP).
    3. **Payment**: 
       - **Almaviva**: Service fees often paid **Online/Fawry** to confirm booking.
       - **Visa Fee**: Paid in **CASH (EGP)** at the center.
    4. **Critical Document**: **Movement Certificate (Shehadet Taharokat)** covering 7 years is often requested for first-timers.
  `,
  'ES': `
    **🚨 SPECIAL RULES FOR SPAIN (BLS INTERNATIONAL):**
    1. **Fees**: **90 EUR** (approx. 4,800 EGP).
    2. **Service Fee**: Approx. **850 EGP** (Paid at BLS).
    3. **Payment Method**: **CASH ONLY** (EGP) for Visa Fees at the center.
    4. **Documents**: All Arabic documents must be translated to **Spanish** (preferred) or English.
    5. **Jurisdiction**: Cairo and Alexandria have separate jurisdictions based on residence.
  `,
  'GE': `
    ${CANADA_VISA_EXEMPTIONS}
    - **Georgia**: ENTRY ALLOWED WITHOUT VISA for GCC residents, USA, Canada, Schengen, UK, Japan holders.
    - **Max Stay**: 90 days within any 180-day period.
  `,
  'ME': `
    ${CANADA_VISA_EXEMPTIONS}
    - **Montenegro**: ENTRY ALLOWED.
    - **Max Stay**: 30 days.
  `,
  'MK': `
    ${CANADA_VISA_EXEMPTIONS}
    - **North Macedonia**: ENTRY ALLOWED.
    - **Condition**: Canadian/USA/UK/Schengen visa must be valid for at least 5 days **after** planned departure.
    - **Max Stay**: 15 days.
  `,
  'AM': `
    ${CANADA_VISA_EXEMPTIONS}
    - **Armenia**: VISA ON ARRIVAL ALLOWED for many nationalities (Check E-Visa eligibility).
    - **Fees**: 3,000 AMD (21 days) or 15,000 AMD (120 days).
  `,
  'GB': `
    ${CANADA_VISA_EXEMPTIONS}
    - **United Kingdom**: TRANSIT WITHOUT VISA (TWOV) ALLOWED.
    - **Max Stay**: 24 hours (Landside/Airside).
    - **Strict Conditions**: 
      1. Must arrive/depart from London Heathrow, Gatwick, or Manchester.
      2. Must be traveling **to** or **from** Canada/USA/Aus/NZ with a valid visa for that country.
      3. Must have confirmed onward flight within 24 hours.
  `,
  'HR': `
    **🚨 SPECIAL RULES FOR CROATIA:**
    1. **Visa Fee Exemption**: Free ONLY for children **under 6 years old** (previously 12).
    2. **Child Fees**: Children aged **6 to 11 years** pay **45 Euro**.
    3. **Schengen Entry**: Valid 2-entry or Multi-entry Schengen visa holders allow entry.
  `,
  'BG': `
    **🚨 SPECIAL RULES FOR BULGARIA:**
    1. **Access to Other Countries**: Valid Bulgarian visa holders can enter **Romania** and **Cyprus**.
    2. **Condition**: Must enter Bulgaria FIRST (or satisfy the specific multi-entry usage rules).
    3. **Schengen Entry**: Valid 2-entry or Multi-entry Schengen visa holders allow entry.
  `,
  'SE': `
    **🚨 SPECIAL RULES FOR SWEDEN:**
    1. **Personal Invitation**: Must include **PERSONBEVIS** from Swedish Tax Agency.
    2. **Validity**: Personbevis must be less than **3 months old** at time of application.
  `,

  // ASIA
  'TH': `
    **🚨 SPECIAL CRITICAL RULES FOR THAILAND (E-VISA) - MUST INCLUDE IN REPORT:**
    1. **Bank Statement (كشف الحساب)**: Must be **Last 3 Months** only (NOT 6). Transactions must be clear. **Official Bank Stamp (Photo/Scan)** is MANDATORY.
    2. **Employment Proof**: **Social Insurance Printout (برنت تأمينات)** is MANDATORY for employees (Translated to English). Do NOT confuse with Travel Insurance.
    3. **Travel History**: Attach copy of previous visas if available: **Thailand, Schengen, USA, or UK**.
  `,
  'TR': `
    **🚨 SPECIAL CRITICAL RULES FOR TURKEY (BUSINESS & TOURISM) - MUST INCLUDE IN REPORT:**
    1. **Fees**: **Single: $203** + $5 booking. **Multi (1 Year): $369** + $5 (Requires 2 previous visas + Mandatory Invitation).
    2. **Legalization (Tawtheeq)**: 
       - **Employees**: HR Letter (Original, Stamped) **MUST BE LEGALIZED by Egyptian MFA**.
       - **Business Owners**: Commercial Register **MUST BE LEGALIZED by Egyptian MFA**.
    3. **Insurance**: **MUST be issued through the agency office ONLY**. External insurance policies are NOT accepted.
    4. **Submission**: Walk-in (No Appointment). Sun-Thu 9am-3pm.
    5. **Financials**: Last **6 Months** movement, Valid for 10 days, Stamped.
  `,
  'JP': `
    **🚨 SPECIAL RULES FOR JAPAN (UPDATED FEES & PAYMENT):**
    1. **Fees**: **1,050 EGP** (Single Entry) / **2,100 EGP** (Multi Entry).
    2. **Payment Method**: **CASH ONLY** (EGP) upon **Collection** (Not submission).
    3. **Important**: You must bring the **EXACT AMOUNT**. The consulate does not provide change.
  `,
  'CN': `
    **🚨 SPECIAL RULES FOR CHINA (NEW FEES FROM JULY 1, 2025):**
    1. **Fees (Egyptians)**: **1890 EGP** (Single) / **2280 EGP** (Multi).
    2. **Includes**: Visa center service fees.
  `,
  'LB': `
    **🚨 SPECIAL RULES FOR LEBANON:**
    1. **Consulate Fees**: Increased to **525 EGP** (Single) / **1050 EGP** (Multi).
    2. **Visa on Arrival**: Cost is **$17**.
  `,

  // AMERICAS
  'US': `
    **🚨 SPECIAL CRITICAL RULES FOR USA (UPDATED) - STRICT ENFORCEMENT:**
    1. **ADDITIONAL DOCUMENTS REQUIRED**:
       - **Income/Assets**: Proof of tax payment, property ownership, or business assets.
       - **Itinerary**: Detailed travel plan (Conference reg, invitation, or bookings).
       - **Employer Letter**: Must detail Job, Salary, Tenure, Approved Leave, and Business Purpose.
       - **Criminal Record**: Required for ANY arrest/conviction, even if pardoned.
       - **Payslips**: Last **3 Months** required.
       - **Students**: Transcripts, Diplomas, and Financial Support proofs.
    2. **INTERVIEW WAIVER CANCELLED**: 
       - Citizens of **Egypt, Sudan, Syria, Yemen, Libya, etc.** MUST attend a personal interview even for renewals. **NO INTERVIEW WAIVERS ALLOWED**.
    3. **Application Location**: Must apply from country of residence/citizenship. Applying elsewhere increases rejection risk significantly.
    4. **No Refunds**: Fees are non-refundable if you apply in the wrong category or location.
  `,
  'BR': `
    **🚨 SPECIAL RULES FOR BRAZIL:**
    1. **Rejection Policy**: If rejected, applicant MUST wait **6 Months** before re-applying.
  `,
  'AR': `
    **🚨 SPECIAL RULES FOR ARGENTINA:**
    1. **Movement Certificate (Shehadet Taharokat)**:
       - Must be **Original Arabic Version**.
       - Must be **Legalized by Egyptian MFA** first.
       - Then Translated to **Spanish**.
       - *Warning*: Electronic/Digital translations often rejected if not matching the legalized original.
  `,
  'MX_SPECIFIC': `
    **🚨 SPECIAL RULES FOR MEXICO:**
    1. **Exemption**: Visa NOT required if holding a valid **Multi-Entry** visa/residence from:
       - **USA, Canada, Japan, UK, or Schengen Area**.
    2. **Stay**: Up to 180 days.
  `,

  // AFRICA & OTHERS
  'AU': `
    **🚨 SPECIAL RULES FOR AUSTRALIA:**
    1. **Visa Fee**: Increased to **200 AUD**.
    2. **Biometrics Fee**: **729.80 EGP** (Paid at the Visa Center).
  `,
  'TN': `
    **🚨 SPECIAL RULES FOR TUNISIA (EXEMPTIONS):**
    1. **Visa Exemptions (No Embassy application needed)** for:
       - Businessmen, Researchers, Doctors.
       - Holders of **Schengen** or **USA** visas/residence.
       - Organized Tour Groups (>10 people) via certified Tunisian agency.
  `,
  'MA': `
    **🚨 SPECIAL CRITICAL RULES FOR MOROCCO (E-VISA / AEVM):**
    1. **Eligibility for E-Visa**: You can apply for an E-Visa (AEVM) ONLY if you hold a valid visa or residence from:
       - **Australia, Canada, Ireland, Japan, New Zealand, Schengen, USA, or UK**.
    2. **STRICT CONDITIONS for the supporting visa**:
       - MUST be **Multi-Entry**.
       - MUST be valid for **MORE THAN 90 DAYS** at the time of E-Visa application.
    3. **Standard Visa**: If conditions are not met, a paper visa via the Consulate is mandatory (Appointments are difficult).
  `,
  'RW': `
    **🚨 SPECIAL RULES FOR RWANDA:**
    1. **Exemption**: **Mutual Visa Exemption** signed between Egypt and Rwanda. Entry is Visa-Free.
  `,
  'KE': `
    **🚨 SPECIAL RULES FOR KENYA:**
    1. **Exemption**: **Visa-Free** for Egyptians (Stay < 60 days).
    2. **Entry Requirements**:
       - Valid Passport.
       - **Yellow Fever Vaccination Certificate**.
       - Return Flight Ticket.
       - **eTA**: Electronic Travel Authorisation required beforehand (approx $30).
  `
};

export const getVisaRequirements = async (params: VisaRequestParams): Promise<VisaInfoResponse> => {
  try {
    // Get current date for context
    const today = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

    // Country Specific Overrides
    const destCode = params.destination.code;
    
    // Retrieve rules from dictionary or empty string
    let specialInstructions = VISA_RULES[destCode] || "";

    // Specific Override for Mexico
    if (destCode === 'MX' && VISA_RULES['MX_SPECIFIC']) {
        // MX already has the Canada rule, no need to append, but if we had separate logic:
        // specialInstructions += VISA_RULES['MX_SPECIFIC'];
    }

    const prompt = `
      **ROLE**: ACT AS A SENIOR VISA COMPLIANCE OFFICER FOR A PROFESSIONAL VISA AGENCY.
      **TASK**: Generate a rigorous, 100% FACT-CHECKED visa requirement report.
      **AUDIENCE**: Professional Visa Agents (Require precise, actionable data, not general advice).
      
      **CONTEXT**:
      - Applicant Nationality: "${params.origin.nameEn} (${params.origin.nameAr})"
      - Destination: "${params.destination.nameEn} (${params.destination.nameAr})"
      - Purpose: Tourism/Business Short Stay
      - Date: ${today}

      ${specialInstructions}

      **STRICT INSTRUCTIONS**:
      1. **SOURCE TRUTH**: Prioritize official government websites (MFA, Embassies) and official service providers (VFS, TLS, BLS).
      2. **NO HALLUCINATIONS**: If a specific detail (like exact fee) is ambiguous, state "Requires verification with embassy" instead of guessing.
      3. **CURRENCY ACCURACY**: State fees in LOCAL currency of the embassy + USD/EUR equivalent.
      4. **CANADIAN VISA HOLDER**: If the country supports entry with a valid Canadian Visa based on the provided instructions, explicitly mention this as a PRIMARY OPTION in the report under "Visa Status".

      **REQUIRED OUTPUT FORMAT (MARKDOWN ARABIC):**

      # 🏛️ تقرير استحقاق التأشيرة (للاستخدام المهني)

      ## 1. حالة التأشيرة ونوعها
      *   **الحالة**: (مطلوبة / عند الوصول / إعفاء / تصريح إلكتروني)
      *   **تنبيه لحاملي تأشيرة كندا 🇨🇦**: (اذكر بوضوح إذا كان الدخول مسموحاً لحاملي تأشيرة كندا والشروط المذكورة أعلاه).
      *   **نوع التأشيرة الدقيق**: (مثلاً: Schengen Type C, B1/B2, ETA, E-Visa, Sticker)
      *   **صلاحية الإقامة المسموحة**: (مثلاً: 90 يوم خلال 180 يوم)
      *   **جهة التقديم**: (اسم المكتب الوسيط بدقة: VFS, TLS, BLS, Almaviva أو السفارة مباشرة أو الموقع الرسمي للتأشيرة الإلكترونية).
      *   **طريقة التقديم (هام)**: هل يحتاج موعد مسبق أم تقديم مباشر (Walk-in)؟ وما هي ساعات العمل؟

      ## 2. 💰 هيكل الرسوم التفصيلي (هام للشركة)
      *   **رسوم القنصلية (Consular Fee)**: [المبلغ بدقة]
      *   **رسوم المكتب الوسيط (Service Fee)**: [المبلغ بدقة إن وجد]
      *   **رسوم إضافية**: (تأمين، شحن، صور، رسوم منصة إلكترونية).
      *   *ملاحظة: هل الرسوم تدفع نقداً أم بطاقة؟*

      ## 3. 📂 قائمة المستندات (تدقيق الامتثال)
      *   **جواز السفر**: الصلاحية المطلوبة بالظبط (3 شهور بعد العودة أم 6 شهور؟) + عدد الصفحات الفارغة.
      *   **الصور الشخصية**: المقاس الدقيق (3.5x4.5 أم 5x5؟) + لون الخلفية + نسبة الوجه (Zoom).
      *   **الملاءة المالية (Bank Statement)**:
          *   المدة المطلوبة: (هل هي 3 أشهر أم 6 أشهر؟ - تحقق من القواعد الخاصة بالدولة).
          *   الحد الأدنى للرصيد (Minimum Balance): رقم تقريبي مطلوب لتغطية الرحلة.
          *   هل يقبل كشف مطبوع من التطبيق أم يحتاج ختم بنكي "Wet Stamp"؟ وهل يحتاج تصديق خارجية؟
      *   **المستندات الوظيفية**: هل يطلب برنت تأمينات اجتماعية؟ هل يحتاج خطاب العمل لتصديق الخارجية؟
      *   **حجوزات**: هل يقبل حجز مبدئي (Dummy Booking) أم مؤكد مدفوع؟
      *   **تأمين السفر**: هل هناك شروط خاصة لجهة الإصدار؟
      *   **الدعوة التجارية (إن وجدت)**: شروط قبول الدعوة وصلاحيتها.

      ## 4. ⏳ الجداول الزمنية (SLA)
      *   **وقت المعالجة الرسمي**: (من 15 إلى 45 يوم عمل مثلاً).
      *   **وضع المواعيد الحالي**: ابحث عن "Current appointment wait times for ${params.destination.nameEn} in ${params.origin.nameEn}". هل المواعيد متاحة قريباً أم مغلقة؟

      ## 5. 🚨 نقاط الرفض الحرجة (Red Flags)
      *   اذكر الأخطاء الشائعة التي تسبب رفض الملف لهذه الجنسية تحديداً.
      *   **انتبه**: راجع قسم التعليمات الخاصة أعلاه (Special Instructions) وادرج التحذيرات المذكورة فيه بدقة (مثل المقابلات الإلزامية، الأوراق المترجمة، شروط الإعفاء).

      ## 6. 🔗 الروابط الرسمية (للموظف)
      *   رابط حجز الموعد المباشر / الموقع الرسمي (إن توفر).
      *   رابط نموذج الطلب (Application Form).

      ## 7. 🗣️ نصائح مقابلة السفارة (Interview Tips)
      *   **التحضير للمقابلة**: نصائح عامة للمظهر وترتيب الملف.
      *   **أسئلة متوقعة**: (أمثلة: لماذا اخترت هذه الوجهة؟، كيف تغطي تكاليفك؟، هل ستعود لبلدك؟).
      *   **السلوك**: كيفية الإجابة بثقة واختصار.

      **STYLE**: Professional, Concise, Bullet points. No fluff.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 32768 },
      },
    });

    const markdown = response.text || "عذراً، لم أتمكن من العثور على المعلومات المطلوبة بدقة. يرجى مراجعة السفارة مباشرة.";
    
    // Extract grounding chunks from the response to build sources
    // @ts-ignore - GroundingChunk typing might vary, casting to unknown then custom type if needed
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    const sources = groundingChunks
      ?.filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
      .map((chunk: any) => ({
        title: chunk.web!.title,
        url: chunk.web!.uri
      })) || [];

    const uniqueSources = Array.from(new Map(sources.map((item: any) => [item.url, item])).values()) as { title: string; url: string }[];

    const result: VisaInfoResponse = {
      markdown,
      sources: uniqueSources,
      generatedAt: new Date().toISOString()
    };

    return result;

  } catch (error: any) {
    console.error("Error fetching visa info:", error);
    
    let errorMessage = "حدث خطأ أثناء استرجاع البيانات.";

    if (error.message) {
      if (error.message.includes('429')) errorMessage = "تجاوز الحد المسموح للطلبات.";
      else if (error.message.includes('API key')) errorMessage = "خطأ في مفتاح API.";
      else if (error.message.includes('network')) errorMessage = "خطأ في الاتصال بالإنترنت.";
    }

    throw new Error(errorMessage);
  }
};

export interface BankAnalysisResult {
  months: { month: string; credit: number; debit: number; lowestBalance?: number }[];
  salaryEstimation: number;
  warnings: string[];
}

export const analyzeBankStatement = async (fileBase64: string, mimeType: string): Promise<BankAnalysisResult> => {
  try {
    const prompt = `
      **ROLE**: You are a UK Visa Entry Clearance Officer (ECO) and Financial Auditor.
      **TASK**: Analyze the provided bank statement image/PDF for a Standard Visitor Visa application.
      
      **OBJECTIVES**:
      1. **Extract Data**: For the last 6 months found, extract:
         - Month Name
         - Total Credits (In)
         - Total Debits (Out)
         - **Lowest Daily Balance**: (CRITICAL for UK Visas) The lowest balance reached during that month.
      
      2. **Detect Red Flags (UKVI Standards)**:
         - **Funds Parking**: Identify if there is a sudden large deposit (>= 2x average monthly credit) in the last 2 months that is NOT salary.
         - **Salary**: Estimate the recurring monthly salary/income.
         - **Consistency**: Is the closing balance significantly higher than the average balance of previous months?

      **OUTPUT FORMAT (JSON ONLY)**:
      {
        "months": [
          { "month": "Jan 2024", "credit": 5000, "debit": 3000, "lowestBalance": 2000 },
          ...
        ],
        "salaryEstimation": 5000,
        "warnings": ["Potential funds parking detected in Month X", "Lowest balance in Jan is too low for sustainability"]
      }

      *Rules*:
      - If no specific lowest balance is visible, estimate conservatively based on large outflows.
      - Return raw JSON only.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64
            }
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 32768 },
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned");
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Bank statement analysis failed", error);
    throw error;
  }
};
