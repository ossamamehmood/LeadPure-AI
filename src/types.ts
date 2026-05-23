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
  /** Core standardized status compliant with schema.md */
  status: 'SAFE' | 'RISKY' | 'INVALID' | 'UNKNOWN';
  /** Sub‑status or detailed reason */
  sub_status?: string;
  /** Machine‑readable failure code compliant with schema.md */
  failure_code?: 'ERR_001' | 'ERR_002' | 'ERR_003' | 'ERR_004' | 'ERR_005' | 'ERR_006' | 'ERR_007' | 'ERR_008' | 'ERR_009' | null;
  /** SMTP response code when applicable */
  smtp_code?: number | null;
  /** Resolved MX host IP address */
  mx_ip?: string | null;
  /** ISO‑8601 timestamp of validation */
  timestamp?: string;
  /** Whether the domain accepts all incoming identities */
  is_catchall?: boolean;
  /** Forensic trace string for auditing */
  trace?: string;

  // ---- Existing auxiliary diagnostics (retained for UI compatibility) ----
  verificationStatus?: 'verified' | 'risky' | 'rejected' | 'blocked' | 'unknown' | 'safe' | 'usable' | 'dangerous';
  verificationReason?: string;
  subStatus?: string;
  provider?: string;
  isFreeEmail?: boolean;
  domainAgeDays?: number;
  mxRecord?: string;
  confidenceScore: number; // 0-100
  bounceRisk: 'Safe' | 'Medium' | 'High' | 'Dangerous' | 'Unknown';
  reputationImpact: 'Positive' | 'Neutral' | 'Negative' | 'Critical' | 'Unknown';
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
