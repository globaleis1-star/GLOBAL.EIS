
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
