
export interface Country {
  code: string;
  nameAr: string;
  nameEn: string;
  flag: string;
  currencyCode: string;
  color: string;
}

export interface VisaRequestParams {
  origin: Country;
  destination: Country;
  language: 'ar' | 'en';
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface VisaInfoResponse {
  markdown: string;
  sources: { title: string; url: string }[];
  generatedAt: string;
}

/**
 * Interface for the AI-powered bank statement analysis result.
 */
export interface BankAnalysisResult {
  summaryAr: string;
  summaryEn: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  readinessScore: number;
  monthlyAverageIncome: number;
  monthlyAverageExpenses: number;
  closingBalance: number;
  currency: string;
  findings: string[];
  recommendations: string[];
  detectedPatterns: {
    salaryDetected: boolean;
    fundsParkingDetected: boolean;
    stableBalance: boolean;
    frequentTransfers: boolean;
  };
}

export interface FavoriteVisa {
  id: string;
  origin: Country;
  destination: Country;
  data: VisaInfoResponse;
  savedAt: string;
}
