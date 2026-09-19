export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'LEGAL_METROLOGY_OFFICER'
  | 'FIELD_VERIFICATION_OFFICER'
  | 'GATC_OFFICER'
  | 'BUSINESS_USER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  token: string;
  designation?: string;
  jurisdiction?: {
    state?: string;
    district?: string;
    zone?: string;
  };
  stakeholderId?: string;
}

export interface SystemHealth {
  status: string;
  service: string;
  problemStatement: string;
  timestamp: string;
  environment: string;
}

export interface UserProfile {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  designation?: string;
  jurisdiction?: {
    state?: string;
    district?: string;
    zone?: string;
  };
  status?: string;
  createdAt?: string;
}

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  premiseName?: string;
}

export interface StakeholderItem {
  _id: string;
  user?: string | { _id: string; name: string; email: string; phone?: string };
  businessName: string;
  tradeLicenseNumber?: string;
  gstNumber?: string;
  panNumber?: string;
  businessType?: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  registeredAddress?: Address;
  district?: string;
  state?: string;
  contactPerson?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface InstrumentItem {
  _id: string;
  instrumentId?: string;
  instrumentName?: string;
  category: string;
  instrumentType?: string;
  modelNumber: string;
  serialNumber: string;
  manufacturer: string;
  capacity?: string | { value?: number | string; unit?: string };
  maxCapacity?: number;
  minCapacity?: number;
  unit?: string;
  verificationScaleInterval_e?: string | number;
  verificationScaleInterval?: number | string;
  accuracyClass?: string;
  verificationStatus?: string;
  status?: string;
  nextVerificationDueDate?: string;
  verificationValidityDate?: string;
  verificationExpiryDate?: string;
  stakeholder?: string | StakeholderItem;
  installationAddress?: Address;
  approvalModelNumber?: string;
  createdAt: string;
}

export interface ApplicationDocument {
  name: string;
  documentType: string;
  fileUrl: string;
  uploadedAt?: string;
}

export interface ApplicationTimelineEvent {
  status: string;
  timestamp: string;
  remarks?: string;
  performedBy?: {
    name: string;
    role: string;
  };
}

export interface VerificationApplicationItem {
  _id: string;
  applicationNumber: string;
  applicationType?: string;
  currentStatus?: string;
  status?: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SCHEDULED' | 'INSPECTION' | 'VERIFIED';
  purpose?: string;
  priority?: 'NORMAL' | 'URGENT' | 'HIGH';
  instrument?: InstrumentItem;
  stakeholder?: StakeholderItem;
  assignedLMO?: {
    _id: string;
    name: string;
    email: string;
    designation?: string;
    jurisdiction?: any;
  };
  documents?: ApplicationDocument[];
  verificationLocation?: Address;
  preferredDate?: string;
  rejectionReason?: string;
  feeDetails?: {
    amount?: number;
    feeStatus?: 'PENDING' | 'PAID' | 'EXEMPTED';
    paymentReference?: string;
  };
  statusHistory?: ApplicationTimelineEvent[];
  createdAt: string;
  updatedAt?: string;
}

export interface ScheduleItem {
  _id: string;
  application: VerificationApplicationItem;
  scheduledDate: string;
  timeSlot: string;
  assignedOfficer?: {
    _id: string;
    name: string;
    email: string;
    designation?: string;
    phone?: string;
  };
  status: 'SCHEDULED' | 'RESCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  verificationCenter?: string;
  location?: Address;
  notes?: string;
  rescheduleHistory?: Array<{
    previousDate: string;
    newDate: string;
    reason: string;
    rescheduledAt: string;
  }>;
  createdAt: string;
}

export interface InspectionReading {
  parameterName: string;
  nominalValue: number;
  observedValue: number;
  error?: number;
  maximumPermissibleError?: number;
  unit: string;
  isWithinMpe: boolean;
}

export interface ChecklistItem {
  key: string;
  question: string;
  status: 'PASS' | 'FAIL' | 'NA';
  remarks?: string;
}

export interface EvidenceFile {
  _id?: string;
  fileUrl: string;
  caption?: string;
  evidenceType?: string;
  uploadedAt: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface VerificationInspectionItem {
  _id: string;
  inspectionNumber: string;
  reportNumber?: string;
  inspectionStatus: 'DRAFT' | 'SUBMITTED' | 'FINALIZED' | 'IN_PROGRESS';
  status?: string;
  schedule?: ScheduleItem | string;
  application?: VerificationApplicationItem;
  instrument?: InstrumentItem;
  officer?: {
    _id: string;
    name: string;
    designation?: string;
    email?: string;
  };
  readings?: InspectionReading[];
  testReadings?: InspectionReading[];
  checklist?: ChecklistItem[];
  defectsIdentified?: string[];
  evidenceFiles?: EvidenceFile[];
  evidence?: any[];
  result?: 'PASS' | 'FAIL' | 'PENDING';
  verdict?: string;
  statutoryVerdict?: 'VERIFIED' | 'REJECTED' | 'NEEDS_REPAIRS';
  remarks?: string;
  tamperSealIntact?: boolean;
  tamperSealNumber?: string;
  sealNumber?: string;
  certificate?: any;
  locationCoordinates?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  };
  gpsCoordinates?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    accuracyMeters?: number;
  };
  finalizedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export type InspectionItem = VerificationInspectionItem;

export interface CertificateItem {
  _id: string;
  certificateNumber: string;
  qrToken?: string;
  qrVerificationToken?: string;
  qrUrl?: string;
  certificateUrl?: string;
  certificatePdfPath?: string;
  status?: string;
  sealNumber?: string;
  certificateStatus?: string;
  dynamicStatus?: 'ACTIVE' | 'VALID' | 'EXPIRED' | 'REVOKED' | 'CANCELLED';
  result?: string;
  verificationDate?: string;
  validFrom: string;
  validUntil: string;
  issuedAt?: string;
  issuingAuthority?: string;
  tamperEvidentHash?: string;
  stakeholder?: StakeholderItem;
  instrument?: InstrumentItem;
  application?: VerificationApplicationItem;
  inspection?: VerificationInspectionItem;
  issuedBy?: {
    _id: string;
    name: string;
    designation?: string;
    jurisdiction?: any;
  };
  issuedByOfficer?: {
    _id: string;
    name: string;
    designation?: string;
  };
  revocationReason?: string;
  revokedAt?: string;
  createdAt: string;
}

export interface PublicVerificationResult {
  _id?: string;
  id?: string;
  certificateNumber: string;
  status: string;
  certificateStatus: string;
  isValid: boolean;
  isExpired: boolean;
  isRevoked: boolean;
  verificationResult: string;
  verificationDate: string;
  issuedAt?: string;
  validFrom: string;
  validUntil: string;
  issuingAuthority: string;
  tamperEvidentHash?: string;
  verificationUrl?: string;
  stakeholder?: {
    businessName?: string;
    tradeLicenseNumber?: string;
    district?: string;
    state?: string;
  };
  instrument?: {
    instrumentId?: string;
    category?: string;
    instrumentType?: string;
    manufacturer?: string;
    modelNumber?: string;
    serialNumber?: string;
    capacity?: string;
    accuracyClass?: string;
    scaleInterval?: number;
    premiseLocation?: string;
  };
  officer?: {
    name?: string;
    designation?: string;
    jurisdiction?: string;
  };
  revocationDetails?: {
    revokedAt?: string;
    reason?: string;
  } | null;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
}

export interface AuditLog {
  _id?: string;
  id?: string;
  user?: any;
  userRole?: string;
  userEmail?: string;
  action: string;
  entity?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp?: string | Date;
  details?: string;
  description?: string;
  actor?: any;
  performedBy?: any;
}

