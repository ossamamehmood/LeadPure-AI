export interface ContactData {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  postalCode?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ProcessedContact extends Omit<ContactData, '__originalData'> {
  verificationStatus: 'verified' | 'rejected' | 'valid' | 'risky' | 'blocked';
  verificationReason?: string;
  subStatus?: string;
  provider?: string;
  isFreeEmail?: boolean;
  domainAgeDays?: number;
  mxRecord?: string;
  confidenceScore: number; // 0-100
  bounceRisk: 'Safe' | 'Medium' | 'High' | 'Dangerous';
  reputationImpact: 'Positive' | 'Neutral' | 'Negative' | 'Critical';
  mxRecordFound: boolean;
  isCatchAll?: boolean;
  isDisposable?: boolean;
  isRoleBased?: boolean;
  isSpamtrapProbability?: number; // 0 to 1
  smtpValid?: boolean;
  syntaxValid?: boolean;
  domainAge?: string;
  spfExists?: boolean;
  dkimExists?: boolean;
  originalIndex: number;
  __originalData?: any;
}

export interface ValidationRules {
  strictTitleCase: boolean;
  forcePlusSign: boolean;
  excludeDisposable: boolean;
  excludeRoleBased: boolean;
  excludeCatchAll: boolean;
  excludeSpamTraps: boolean;
}

export interface HistoryItem {
  id: string;
  date: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  processedData: ProcessedContact[];
  eliminatedData: any[];
  mappings: any;
  stats: {
    removed: number;
    phoneFormatted: number;
    avgConfidence: number;
  };
}

export interface CleaningStats {
  total: number;
  valid: number;
  invalid: number;
  cleaned: number;
} 
