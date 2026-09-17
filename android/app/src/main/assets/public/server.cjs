var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// backend/config/constants.js
var USER_ROLES, USER_ROLE_LIST, APPLICATION_STATUSES, APPLICATION_STATUS_LIST, ALLOWED_STATUS_TRANSITIONS, APPLICATION_TYPES, APPLICATION_TYPE_LIST, SCHEDULE_STATUSES, SCHEDULE_STATUS_LIST, ALLOWED_SCHEDULE_STATUS_TRANSITIONS, INSTRUMENT_STATUSES, INSTRUMENT_STATUS_LIST, INSTRUMENT_CATEGORIES, INSTRUMENT_CATEGORY_LIST, ACCURACY_CLASSES, ACCURACY_CLASS_LIST, CERTIFICATE_STATUSES, CERTIFICATE_STATUS_LIST, ALLOWED_CERTIFICATE_STATUS_TRANSITIONS, VERIFICATION_VERDICTS, VERIFICATION_VERDICT_LIST, NOTIFICATION_TYPES, NOTIFICATION_TYPE_LIST, NOTIFICATION_PRIORITIES, NOTIFICATION_PRIORITY_LIST, DYNAMIC_CERTIFICATE_STATUSES, DYNAMIC_CERTIFICATE_STATUS_LIST, INSTRUMENT_DUE_STATUSES, INSTRUMENT_DUE_STATUS_LIST, INSPECTION_STATUSES, INSPECTION_STATUS_LIST, ALLOWED_INSPECTION_STATUS_TRANSITIONS, INSPECTION_RESULTS, INSPECTION_RESULT_LIST, DEFECT_SEVERITIES, DEFECT_SEVERITY_LIST, AUDIT_ACTIONS;
var init_constants = __esm({
  "backend/config/constants.js"() {
    USER_ROLES = {
      SUPER_ADMIN: "SUPER_ADMIN",
      ADMIN: "ADMIN",
      LEGAL_METROLOGY_OFFICER: "LEGAL_METROLOGY_OFFICER",
      GATC_OFFICER: "GATC_OFFICER",
      BUSINESS_USER: "BUSINESS_USER",
      FIELD_VERIFICATION_OFFICER: "FIELD_VERIFICATION_OFFICER"
    };
    USER_ROLE_LIST = Object.values(USER_ROLES);
    APPLICATION_STATUSES = {
      DRAFT: "DRAFT",
      SUBMITTED: "SUBMITTED",
      UNDER_REVIEW: "UNDER_REVIEW",
      APPROVED: "APPROVED",
      REJECTED: "REJECTED",
      SCHEDULED: "SCHEDULED",
      INSPECTION: "INSPECTION",
      VERIFIED: "VERIFIED",
      FAILED: "FAILED",
      CERTIFICATE_GENERATED: "CERTIFICATE_GENERATED",
      COMPLETED: "COMPLETED",
      CANCELLED: "CANCELLED"
    };
    APPLICATION_STATUS_LIST = Object.values(APPLICATION_STATUSES);
    ALLOWED_STATUS_TRANSITIONS = {
      [APPLICATION_STATUSES.DRAFT]: [
        APPLICATION_STATUSES.SUBMITTED,
        APPLICATION_STATUSES.CANCELLED
      ],
      [APPLICATION_STATUSES.SUBMITTED]: [
        APPLICATION_STATUSES.UNDER_REVIEW,
        APPLICATION_STATUSES.REJECTED,
        APPLICATION_STATUSES.CANCELLED
      ],
      [APPLICATION_STATUSES.UNDER_REVIEW]: [
        APPLICATION_STATUSES.APPROVED,
        APPLICATION_STATUSES.SCHEDULED,
        APPLICATION_STATUSES.REJECTED,
        APPLICATION_STATUSES.CANCELLED
      ],
      [APPLICATION_STATUSES.APPROVED]: [
        APPLICATION_STATUSES.SCHEDULED,
        APPLICATION_STATUSES.CANCELLED
      ],
      [APPLICATION_STATUSES.SCHEDULED]: [
        APPLICATION_STATUSES.INSPECTION,
        APPLICATION_STATUSES.CANCELLED
      ],
      [APPLICATION_STATUSES.INSPECTION]: [
        APPLICATION_STATUSES.VERIFIED,
        APPLICATION_STATUSES.FAILED
      ],
      [APPLICATION_STATUSES.VERIFIED]: [
        APPLICATION_STATUSES.CERTIFICATE_GENERATED
      ],
      [APPLICATION_STATUSES.FAILED]: [
        APPLICATION_STATUSES.UNDER_REVIEW
        // For re-inspection after rectification
      ],
      [APPLICATION_STATUSES.CERTIFICATE_GENERATED]: [
        APPLICATION_STATUSES.COMPLETED
      ],
      [APPLICATION_STATUSES.REJECTED]: [],
      [APPLICATION_STATUSES.COMPLETED]: [],
      [APPLICATION_STATUSES.CANCELLED]: []
    };
    APPLICATION_TYPES = {
      NEW_VERIFICATION: "NEW_VERIFICATION",
      INITIAL_VERIFICATION: "INITIAL_VERIFICATION",
      RE_VERIFICATION: "RE_VERIFICATION",
      SUBSEQUENT_ANNUAL_VERIFICATION: "SUBSEQUENT_ANNUAL_VERIFICATION",
      POST_REPAIR_VERIFICATION: "POST_REPAIR_VERIFICATION"
    };
    APPLICATION_TYPE_LIST = Object.values(APPLICATION_TYPES);
    SCHEDULE_STATUSES = {
      PENDING: "PENDING",
      CONFIRMED: "CONFIRMED",
      SCHEDULED: "SCHEDULED",
      RESCHEDULED: "RESCHEDULED",
      IN_PROGRESS: "IN_PROGRESS",
      COMPLETED: "COMPLETED",
      CANCELLED: "CANCELLED"
    };
    SCHEDULE_STATUS_LIST = Object.values(SCHEDULE_STATUSES);
    ALLOWED_SCHEDULE_STATUS_TRANSITIONS = {
      [SCHEDULE_STATUSES.PENDING]: [
        SCHEDULE_STATUSES.CONFIRMED,
        SCHEDULE_STATUSES.SCHEDULED,
        SCHEDULE_STATUSES.CANCELLED
      ],
      [SCHEDULE_STATUSES.CONFIRMED]: [
        SCHEDULE_STATUSES.IN_PROGRESS,
        SCHEDULE_STATUSES.RESCHEDULED,
        SCHEDULE_STATUSES.CANCELLED
      ],
      [SCHEDULE_STATUSES.SCHEDULED]: [
        SCHEDULE_STATUSES.CONFIRMED,
        SCHEDULE_STATUSES.IN_PROGRESS,
        SCHEDULE_STATUSES.RESCHEDULED,
        SCHEDULE_STATUSES.CANCELLED
      ],
      [SCHEDULE_STATUSES.RESCHEDULED]: [
        SCHEDULE_STATUSES.CONFIRMED,
        SCHEDULE_STATUSES.SCHEDULED,
        SCHEDULE_STATUSES.IN_PROGRESS,
        SCHEDULE_STATUSES.CANCELLED
      ],
      [SCHEDULE_STATUSES.IN_PROGRESS]: [
        SCHEDULE_STATUSES.COMPLETED,
        SCHEDULE_STATUSES.CANCELLED
      ],
      [SCHEDULE_STATUSES.COMPLETED]: [],
      [SCHEDULE_STATUSES.CANCELLED]: []
    };
    INSTRUMENT_STATUSES = {
      ACTIVE_VERIFIED: "ACTIVE_VERIFIED",
      EXPIRED: "EXPIRED",
      PENDING_VERIFICATION: "PENDING_VERIFICATION",
      REJECTED: "REJECTED",
      OUT_OF_SERVICE: "OUT_OF_SERVICE"
    };
    INSTRUMENT_STATUS_LIST = Object.values(INSTRUMENT_STATUSES);
    INSTRUMENT_CATEGORIES = {
      NON_AUTOMATIC_WEIGHING_INSTRUMENT: "NON_AUTOMATIC_WEIGHING_INSTRUMENT",
      NON_AUTOMATIC_WEIGHING_INSTRUMENTS: "NON_AUTOMATIC_WEIGHING_INSTRUMENT",
      AUTOMATIC_WEIGHING_INSTRUMENT: "AUTOMATIC_WEIGHING_INSTRUMENT",
      FUEL_DISPENSER: "FUEL_DISPENSER",
      FLOW_METER: "FLOW_METER",
      WEIGHBRIDGE: "WEIGHBRIDGE",
      COUNTER_SCALE: "COUNTER_SCALE",
      PRECISION_BALANCE: "PRECISION_BALANCE",
      MEASURING_TAPE: "MEASURING_TAPE",
      STORAGE_TANK_CALIBRATION: "STORAGE_TANK_CALIBRATION"
    };
    INSTRUMENT_CATEGORY_LIST = Object.values(INSTRUMENT_CATEGORIES);
    ACCURACY_CLASSES = {
      CLASS_I_SPECIAL: "CLASS_I_SPECIAL",
      CLASS_II_HIGH: "CLASS_II_HIGH",
      CLASS_III_MEDIUM: "CLASS_III_MEDIUM",
      CLASS_IIII_ORDINARY: "CLASS_IIII_ORDINARY"
    };
    ACCURACY_CLASS_LIST = Object.values(ACCURACY_CLASSES);
    CERTIFICATE_STATUSES = {
      ACTIVE: "ACTIVE",
      VALID: "VALID",
      EXPIRED: "EXPIRED",
      REVOKED: "REVOKED",
      CANCELLED: "CANCELLED"
    };
    CERTIFICATE_STATUS_LIST = Object.values(CERTIFICATE_STATUSES);
    ALLOWED_CERTIFICATE_STATUS_TRANSITIONS = {
      [CERTIFICATE_STATUSES.ACTIVE]: [
        CERTIFICATE_STATUSES.EXPIRED,
        CERTIFICATE_STATUSES.REVOKED,
        CERTIFICATE_STATUSES.CANCELLED
      ],
      [CERTIFICATE_STATUSES.VALID]: [
        CERTIFICATE_STATUSES.EXPIRED,
        CERTIFICATE_STATUSES.REVOKED,
        CERTIFICATE_STATUSES.CANCELLED
      ],
      [CERTIFICATE_STATUSES.EXPIRED]: [
        CERTIFICATE_STATUSES.REVOKED
      ],
      [CERTIFICATE_STATUSES.REVOKED]: [],
      [CERTIFICATE_STATUSES.CANCELLED]: []
    };
    VERIFICATION_VERDICTS = {
      PASS: "PASS",
      FAIL: "FAIL",
      VERIFIED: "VERIFIED",
      REJECTED: "REJECTED"
    };
    VERIFICATION_VERDICT_LIST = Object.values(VERIFICATION_VERDICTS);
    NOTIFICATION_TYPES = {
      APPLICATION_SUBMITTED: "APPLICATION_SUBMITTED",
      APPLICATION_APPROVED: "APPLICATION_APPROVED",
      APPLICATION_REVIEWED: "APPLICATION_REVIEWED",
      APPLICATION_REJECTED: "APPLICATION_REJECTED",
      SCHEDULE_CREATED: "SCHEDULE_CREATED",
      SCHEDULE_CHANGED: "SCHEDULE_CHANGED",
      SCHEDULE_CANCELLED: "SCHEDULE_CANCELLED",
      VERIFICATION_SCHEDULED: "VERIFICATION_SCHEDULED",
      INSPECTION_ASSIGNED: "INSPECTION_ASSIGNED",
      INSPECTION_COMPLETED: "INSPECTION_COMPLETED",
      VERIFICATION_PASSED: "VERIFICATION_PASSED",
      VERIFICATION_FAILED: "VERIFICATION_FAILED",
      CERTIFICATE_ISSUED: "CERTIFICATE_ISSUED",
      CERTIFICATE_GENERATED: "CERTIFICATE_GENERATED",
      CERTIFICATE_EXPIRING_60: "CERTIFICATE_EXPIRING_60",
      CERTIFICATE_EXPIRING_30: "CERTIFICATE_EXPIRING_30",
      CERTIFICATE_EXPIRING_15: "CERTIFICATE_EXPIRING_15",
      CERTIFICATE_EXPIRING_7: "CERTIFICATE_EXPIRING_7",
      CERTIFICATE_EXPIRED: "CERTIFICATE_EXPIRED",
      VERIFICATION_DUE: "VERIFICATION_DUE",
      VERIFICATION_OVERDUE: "VERIFICATION_OVERDUE",
      SYSTEM_ALERT: "SYSTEM_ALERT",
      SYSTEM_NOTIFICATION: "SYSTEM_NOTIFICATION"
    };
    NOTIFICATION_TYPE_LIST = Object.values(NOTIFICATION_TYPES);
    NOTIFICATION_PRIORITIES = {
      LOW: "LOW",
      MEDIUM: "MEDIUM",
      HIGH: "HIGH",
      URGENT: "URGENT"
    };
    NOTIFICATION_PRIORITY_LIST = Object.values(NOTIFICATION_PRIORITIES);
    DYNAMIC_CERTIFICATE_STATUSES = {
      ACTIVE: "ACTIVE",
      EXPIRING_SOON: "EXPIRING_SOON",
      EXPIRED: "EXPIRED",
      REVOKED: "REVOKED",
      CANCELLED: "CANCELLED"
    };
    DYNAMIC_CERTIFICATE_STATUS_LIST = Object.values(DYNAMIC_CERTIFICATE_STATUSES);
    INSTRUMENT_DUE_STATUSES = {
      UP_TO_DATE: "UP_TO_DATE",
      DUE_SOON: "DUE_SOON",
      OVERDUE: "OVERDUE"
    };
    INSTRUMENT_DUE_STATUS_LIST = Object.values(INSTRUMENT_DUE_STATUSES);
    INSPECTION_STATUSES = {
      DRAFT: "DRAFT",
      IN_PROGRESS: "IN_PROGRESS",
      SUBMITTED: "SUBMITTED",
      UNDER_REVIEW: "UNDER_REVIEW",
      PASSED: "PASSED",
      FAILED: "FAILED",
      REQUIRES_CORRECTION: "REQUIRES_CORRECTION",
      CANCELLED: "CANCELLED"
    };
    INSPECTION_STATUS_LIST = Object.values(INSPECTION_STATUSES);
    ALLOWED_INSPECTION_STATUS_TRANSITIONS = {
      [INSPECTION_STATUSES.DRAFT]: [
        INSPECTION_STATUSES.IN_PROGRESS,
        INSPECTION_STATUSES.CANCELLED
      ],
      [INSPECTION_STATUSES.IN_PROGRESS]: [
        INSPECTION_STATUSES.SUBMITTED,
        INSPECTION_STATUSES.DRAFT,
        INSPECTION_STATUSES.CANCELLED
      ],
      [INSPECTION_STATUSES.SUBMITTED]: [
        INSPECTION_STATUSES.UNDER_REVIEW,
        INSPECTION_STATUSES.PASSED,
        INSPECTION_STATUSES.FAILED,
        INSPECTION_STATUSES.REQUIRES_CORRECTION
      ],
      [INSPECTION_STATUSES.UNDER_REVIEW]: [
        INSPECTION_STATUSES.PASSED,
        INSPECTION_STATUSES.FAILED,
        INSPECTION_STATUSES.REQUIRES_CORRECTION
      ],
      [INSPECTION_STATUSES.REQUIRES_CORRECTION]: [
        INSPECTION_STATUSES.IN_PROGRESS,
        INSPECTION_STATUSES.SUBMITTED,
        INSPECTION_STATUSES.CANCELLED
      ],
      [INSPECTION_STATUSES.PASSED]: [
        INSPECTION_STATUSES.UNDER_REVIEW
        // Controlled reopen by authorized admin
      ],
      [INSPECTION_STATUSES.FAILED]: [
        INSPECTION_STATUSES.UNDER_REVIEW
        // Controlled reopen by authorized admin
      ],
      [INSPECTION_STATUSES.CANCELLED]: []
    };
    INSPECTION_RESULTS = {
      VERIFIED: "VERIFIED",
      REJECTED: "REJECTED",
      CONDITIONAL: "CONDITIONAL",
      PENDING: "PENDING"
    };
    INSPECTION_RESULT_LIST = Object.values(INSPECTION_RESULTS);
    DEFECT_SEVERITIES = {
      LOW: "LOW",
      MEDIUM: "MEDIUM",
      HIGH: "HIGH",
      CRITICAL: "CRITICAL"
    };
    DEFECT_SEVERITY_LIST = Object.values(DEFECT_SEVERITIES);
    AUDIT_ACTIONS = {
      USER_LOGIN: "USER_LOGIN",
      USER_LOGOUT: "USER_LOGOUT",
      USER_CREATED: "USER_CREATED",
      USER_UPDATED: "USER_UPDATED",
      USER_STATUS_CHANGED: "USER_STATUS_CHANGED",
      STAKEHOLDER_CREATED: "STAKEHOLDER_CREATED",
      STAKEHOLDER_UPDATED: "STAKEHOLDER_UPDATED",
      INSTRUMENT_REGISTERED: "INSTRUMENT_REGISTERED",
      INSTRUMENT_UPDATED: "INSTRUMENT_UPDATED",
      APPLICATION_CREATED: "APPLICATION_CREATED",
      APPLICATION_UPDATED: "APPLICATION_UPDATED",
      APPLICATION_SUBMITTED: "APPLICATION_SUBMITTED",
      APPLICATION_STATUS_UPDATED: "APPLICATION_STATUS_UPDATED",
      APPLICATION_REVIEWED: "APPLICATION_REVIEWED",
      APPLICATION_APPROVED: "APPLICATION_APPROVED",
      APPLICATION_REJECTED: "APPLICATION_REJECTED",
      SCHEDULE_ASSIGNED: "SCHEDULE_ASSIGNED",
      SCHEDULE_CREATED: "SCHEDULE_CREATED",
      SCHEDULE_CONFIRMED: "SCHEDULE_CONFIRMED",
      SCHEDULE_RESCHEDULED: "SCHEDULE_RESCHEDULED",
      SCHEDULE_CANCELLED: "SCHEDULE_CANCELLED",
      SCHEDULE_STARTED: "SCHEDULE_STARTED",
      SCHEDULE_COMPLETED: "SCHEDULE_COMPLETED",
      OFFICER_ASSIGNED: "OFFICER_ASSIGNED",
      FIELD_OFFICER_ASSIGNED: "FIELD_OFFICER_ASSIGNED",
      CENTER_ASSIGNED: "CENTER_ASSIGNED",
      GATC_ASSIGNED: "GATC_ASSIGNED",
      INSPECTION_RECORDED: "INSPECTION_RECORDED",
      INSPECTION_STARTED: "INSPECTION_STARTED",
      INSPECTION_DRAFT_SAVED: "INSPECTION_DRAFT_SAVED",
      INSPECTION_SUBMITTED: "INSPECTION_SUBMITTED",
      INSPECTION_FINALIZED: "INSPECTION_FINALIZED",
      INSPECTION_REOPENED: "INSPECTION_REOPENED",
      INSPECTION_EVIDENCE_UPLOADED: "INSPECTION_EVIDENCE_UPLOADED",
      VERIFICATION_RESULT_CREATED: "VERIFICATION_RESULT_CREATED",
      CERTIFICATE_GENERATED: "CERTIFICATE_GENERATED",
      CERTIFICATE_REVOKED: "CERTIFICATE_REVOKED",
      DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
      NOTIFICATION_READ: "NOTIFICATION_READ",
      NOTIFICATION_PREFERENCE_UPDATED: "NOTIFICATION_PREFERENCE_UPDATED",
      EXPIRY_CHECK_EXECUTED: "EXPIRY_CHECK_EXECUTED",
      DUE_DATE_ALERT_DISPATCHED: "DUE_DATE_ALERT_DISPATCHED"
    };
  }
});

// backend/models/Stakeholder.js
var import_mongoose2, stakeholderSchema, Stakeholder;
var init_Stakeholder = __esm({
  "backend/models/Stakeholder.js"() {
    import_mongoose2 = __toESM(require("mongoose"), 1);
    stakeholderSchema = new import_mongoose2.default.Schema(
      {
        user: {
          type: import_mongoose2.default.Schema.Types.ObjectId,
          ref: "User",
          required: true,
          unique: true,
          index: true
        },
        businessName: {
          type: String,
          required: [true, "Legal business or trading name is required"],
          trim: true,
          index: true
        },
        tradeLicenseNumber: {
          type: String,
          required: [true, "Trade license or registration number is required"],
          unique: true,
          trim: true,
          index: true
        },
        gstNumber: {
          type: String,
          trim: true,
          uppercase: true,
          index: true
        },
        panNumber: {
          type: String,
          trim: true,
          uppercase: true
        },
        businessType: {
          type: String,
          enum: [
            "MANUFACTURER",
            "DEALER",
            "REPAIRER",
            "PETROL_PUMP",
            "RETAILER",
            "INDUSTRIAL_WEIGHBRIDGE",
            "JEWELER",
            "OTHER"
          ],
          default: "RETAILER",
          required: true
        },
        registeredAddress: {
          street: { type: String, required: true },
          city: { type: String, required: true },
          district: { type: String, required: true, index: true },
          state: { type: String, required: true },
          pincode: { type: String, required: true }
        },
        contactPerson: {
          name: { type: String, required: true },
          designation: { type: String },
          phone: { type: String, required: true },
          email: { type: String, required: true }
        },
        kycDocuments: [
          {
            docType: { type: String, required: true },
            fileUrl: { type: String, required: true },
            fileName: { type: String },
            verified: { type: Boolean, default: false },
            uploadedAt: { type: Date, default: Date.now }
          }
        ],
        kycStatus: {
          type: String,
          enum: ["PENDING", "VERIFIED", "REJECTED"],
          default: "PENDING",
          index: true
        },
        kycRemarks: {
          type: String
        }
      },
      {
        timestamps: true
      }
    );
    stakeholderSchema.index({ createdAt: -1 });
    Stakeholder = import_mongoose2.default.model("Stakeholder", stakeholderSchema);
  }
});

// backend/models/Instrument.js
var import_mongoose3, instrumentSchema, Instrument;
var init_Instrument = __esm({
  "backend/models/Instrument.js"() {
    import_mongoose3 = __toESM(require("mongoose"), 1);
    init_constants();
    instrumentSchema = new import_mongoose3.default.Schema(
      {
        instrumentId: {
          type: String,
          required: true,
          unique: true,
          trim: true,
          index: true
        },
        stakeholder: {
          type: import_mongoose3.default.Schema.Types.ObjectId,
          ref: "Stakeholder",
          required: true,
          index: true
        },
        category: {
          type: String,
          enum: INSTRUMENT_CATEGORY_LIST,
          default: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
          required: true,
          index: true
        },
        instrumentType: {
          type: String,
          required: [true, "Instrument type or specification is required"],
          trim: true
        },
        manufacturer: {
          type: String,
          required: [true, "Manufacturer name is required"],
          trim: true,
          index: true
        },
        modelNumber: {
          type: String,
          required: [true, "Model number is required"],
          trim: true
        },
        serialNumber: {
          type: String,
          required: [true, "Serial number is required"],
          trim: true,
          index: true
        },
        capacity: {
          value: { type: Number, required: true },
          unit: { type: String, required: true, default: "kg" }
          // kg, g, mg, tonnes, litres, metres
        },
        accuracyClass: {
          type: String,
          enum: ACCURACY_CLASS_LIST,
          default: ACCURACY_CLASSES.CLASS_III_MEDIUM,
          required: true
        },
        verificationScaleInterval_e: {
          type: String,
          required: true
          // e.g. "2g", "10g", "0.01g"
        },
        minimumCapacity_Min: {
          type: String
          // e.g. "100g", "40kg"
        },
        dateOfManufacture: {
          type: Date
        },
        installationAddress: {
          premiseName: { type: String, required: true },
          addressLine: { type: String, required: true },
          city: { type: String, required: true },
          district: { type: String, required: true, index: true },
          state: { type: String, required: true },
          pincode: { type: String, required: true },
          latitude: { type: Number },
          longitude: { type: Number }
        },
        status: {
          type: String,
          enum: INSTRUMENT_STATUS_LIST,
          default: INSTRUMENT_STATUSES.PENDING_VERIFICATION,
          index: true
        },
        verificationFrequencyMonths: {
          type: Number,
          default: 12
        },
        lastVerificationDate: {
          type: Date
        },
        nextVerificationDueDate: {
          type: Date,
          index: true
        },
        remarks: {
          type: String
        },
        isActive: {
          type: Boolean,
          default: true,
          index: true
        },
        createdBy: {
          type: import_mongoose3.default.Schema.Types.ObjectId,
          ref: "User"
        },
        updatedBy: {
          type: import_mongoose3.default.Schema.Types.ObjectId,
          ref: "User"
        },
        photographs: [
          {
            caption: { type: String },
            fileName: { type: String },
            fileUrl: { type: String, required: true },
            uploadedAt: { type: Date, default: Date.now }
          }
        ],
        documents: [
          {
            title: { type: String },
            docType: { type: String, default: "SUPPORTING_DOCUMENT" },
            fileName: { type: String },
            fileUrl: { type: String, required: true },
            uploadedAt: { type: Date, default: Date.now }
          }
        ]
      },
      {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
      }
    );
    instrumentSchema.methods.getDueStatus = function(reminderThresholdDays = 30) {
      if (!this.nextVerificationDueDate) {
        return "UP_TO_DATE";
      }
      const now = /* @__PURE__ */ new Date();
      const dueDate = new Date(this.nextVerificationDueDate);
      if (dueDate.getTime() < now.getTime()) {
        return "OVERDUE";
      }
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24));
      if (diffDays <= reminderThresholdDays) {
        return "DUE_SOON";
      }
      return "UP_TO_DATE";
    };
    instrumentSchema.virtual("dueStatus").get(function() {
      return this.getDueStatus();
    });
    instrumentSchema.index({ manufacturer: 1, serialNumber: 1 });
    instrumentSchema.index({ stakeholder: 1, status: 1 });
    instrumentSchema.index({ "installationAddress.district": 1, status: 1 });
    instrumentSchema.index({ nextVerificationDueDate: 1, status: 1 });
    instrumentSchema.index({ createdAt: -1 });
    instrumentSchema.index({ instrumentType: 1 });
    Instrument = import_mongoose3.default.model("Instrument", instrumentSchema);
  }
});

// backend/models/VerificationApplication.js
var import_mongoose4, statusHistorySchema, verificationApplicationSchema, VerificationApplication;
var init_VerificationApplication = __esm({
  "backend/models/VerificationApplication.js"() {
    import_mongoose4 = __toESM(require("mongoose"), 1);
    init_constants();
    statusHistorySchema = new import_mongoose4.default.Schema(
      {
        fromStatus: { type: String, required: true },
        toStatus: { type: String, required: true },
        changedBy: { type: import_mongoose4.default.Schema.Types.ObjectId, ref: "User" },
        remarks: { type: String },
        timestamp: { type: Date, default: Date.now }
      },
      { _id: false }
    );
    verificationApplicationSchema = new import_mongoose4.default.Schema(
      {
        applicationNumber: {
          type: String,
          required: true,
          unique: true,
          trim: true,
          index: true
        },
        stakeholder: {
          type: import_mongoose4.default.Schema.Types.ObjectId,
          ref: "Stakeholder",
          required: true,
          index: true
        },
        instrument: {
          type: import_mongoose4.default.Schema.Types.ObjectId,
          ref: "Instrument",
          required: true,
          index: true
        },
        applicationType: {
          type: String,
          enum: APPLICATION_TYPE_LIST,
          default: APPLICATION_TYPES.NEW_VERIFICATION,
          required: true,
          index: true
        },
        verificationType: {
          type: String,
          enum: ["INITIAL", "PERIODICAL", "RE_VERIFICATION", "AFTER_REPAIR"],
          default: "INITIAL"
        },
        currentStatus: {
          type: String,
          enum: APPLICATION_STATUS_LIST,
          default: APPLICATION_STATUSES.DRAFT,
          required: true,
          index: true
        },
        assignedLMO: {
          type: import_mongoose4.default.Schema.Types.ObjectId,
          ref: "User",
          index: true
        },
        assignedGATC: {
          type: import_mongoose4.default.Schema.Types.ObjectId,
          ref: "GATC",
          index: true
        },
        submissionDate: {
          type: Date,
          index: true
        },
        submittedAt: {
          type: Date,
          index: true
        },
        preferredVerificationDate: {
          type: Date
        },
        requestedDate: {
          type: Date
        },
        preferredVerificationCenter: {
          type: import_mongoose4.default.Schema.Types.ObjectId,
          ref: "VerificationCenter"
        },
        preferredLocation: {
          type: String
        },
        verificationLocation: {
          locationType: {
            type: String,
            enum: ["ON_SITE_PREMISES", "DISTRICT_LABORATORY", "GATC_FACILITY"],
            default: "ON_SITE_PREMISES"
          },
          address: { type: String },
          district: { type: String, index: true }
        },
        purpose: {
          type: String
        },
        remarks: {
          type: String
        },
        reviewRemarks: {
          type: String
        },
        rejectionReason: {
          type: String
        },
        reviewedBy: {
          type: import_mongoose4.default.Schema.Types.ObjectId,
          ref: "User"
        },
        reviewedAt: {
          type: Date
        },
        scheduledAt: {
          type: Date
        },
        completedAt: {
          type: Date
        },
        createdBy: {
          type: import_mongoose4.default.Schema.Types.ObjectId,
          ref: "User"
        },
        updatedBy: {
          type: import_mongoose4.default.Schema.Types.ObjectId,
          ref: "User"
        },
        documents: [
          {
            title: { type: String, required: true },
            docType: { type: String, required: true },
            fileUrl: { type: String, required: true },
            uploadedAt: { type: Date, default: Date.now }
          }
        ],
        feeDetails: {
          amount: { type: Number, default: 500 },
          paymentStatus: { type: String, enum: ["PENDING", "PAID", "EXEMPTED"], default: "PENDING" },
          transactionRef: { type: String },
          paidAt: { type: Date }
        },
        statusHistory: [statusHistorySchema]
      },
      {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
      }
    );
    verificationApplicationSchema.virtual("applicationStatus").get(function() {
      return this.currentStatus;
    }).set(function(val) {
      this.currentStatus = val;
    });
    verificationApplicationSchema.virtual("uploadedDocuments").get(function() {
      return this.documents;
    });
    verificationApplicationSchema.index({ stakeholder: 1, currentStatus: 1 });
    verificationApplicationSchema.index({ instrument: 1, currentStatus: 1 });
    verificationApplicationSchema.index({ assignedLMO: 1, currentStatus: 1 });
    verificationApplicationSchema.index({ createdAt: -1 });
    VerificationApplication = import_mongoose4.default.model(
      "VerificationApplication",
      verificationApplicationSchema
    );
  }
});

// backend/models/VerificationInspection.js
var import_mongoose5, measurementReadingSchema, instrumentReadingSchema, accuracyCheckSchema, complianceCheckSchema, defectSchema, verificationInspectionSchema, VerificationInspection;
var init_VerificationInspection = __esm({
  "backend/models/VerificationInspection.js"() {
    import_mongoose5 = __toESM(require("mongoose"), 1);
    init_constants();
    measurementReadingSchema = new import_mongoose5.default.Schema(
      {
        testType: { type: String, required: true },
        appliedLoad: { type: Number, required: true },
        indicatedReading: { type: Number, required: true },
        intrinsicError: { type: Number, required: true },
        maximumPermissibleError: { type: Number, required: true },
        isCompliant: { type: Boolean, required: true }
      },
      { _id: false }
    );
    instrumentReadingSchema = new import_mongoose5.default.Schema(
      {
        testName: { type: String, required: true },
        standardValue: { type: Number, required: true },
        observedValue: { type: Number, required: true },
        unit: { type: String, default: "kg" },
        tolerance: { type: Number, default: 0 },
        deviation: { type: Number, default: 0 },
        result: { type: String, enum: ["PASS", "FAIL"], default: "PASS" },
        remarks: { type: String }
      },
      { _id: false }
    );
    accuracyCheckSchema = new import_mongoose5.default.Schema(
      {
        checkName: { type: String, required: true },
        expectedValue: { type: Number },
        observedValue: { type: Number },
        unit: { type: String },
        tolerance: { type: Number },
        status: { type: String, enum: ["PASS", "FAIL", "NOT_APPLICABLE"], default: "PASS" },
        remarks: { type: String }
      },
      { _id: false }
    );
    complianceCheckSchema = new import_mongoose5.default.Schema(
      {
        checkName: { type: String, required: true },
        status: { type: String, enum: ["PASS", "FAIL", "NOT_APPLICABLE"], default: "PASS" },
        remarks: { type: String }
      },
      { _id: false }
    );
    defectSchema = new import_mongoose5.default.Schema(
      {
        defectType: { type: String, required: true },
        severity: { type: String, enum: DEFECT_SEVERITY_LIST, default: DEFECT_SEVERITIES.LOW },
        description: { type: String, required: true },
        relatedRequirement: { type: String },
        correctiveAction: { type: String },
        status: { type: String, enum: ["IDENTIFIED", "RECTIFIED", "WAIVED"], default: "IDENTIFIED" }
      },
      { _id: false }
    );
    verificationInspectionSchema = new import_mongoose5.default.Schema(
      {
        inspectionNumber: {
          type: String,
          required: true,
          unique: true,
          trim: true,
          index: true
        },
        application: {
          type: import_mongoose5.default.Schema.Types.ObjectId,
          ref: "VerificationApplication",
          required: true,
          index: true
        },
        schedule: {
          type: import_mongoose5.default.Schema.Types.ObjectId,
          ref: "VerificationSchedule",
          index: true
        },
        instrument: {
          type: import_mongoose5.default.Schema.Types.ObjectId,
          ref: "Instrument",
          required: true,
          index: true
        },
        stakeholder: {
          type: import_mongoose5.default.Schema.Types.ObjectId,
          ref: "Stakeholder",
          index: true
        },
        assignedOfficer: {
          type: import_mongoose5.default.Schema.Types.ObjectId,
          ref: "User",
          index: true
        },
        officer: {
          type: import_mongoose5.default.Schema.Types.ObjectId,
          ref: "User",
          index: true
        },
        verificationCenter: {
          type: import_mongoose5.default.Schema.Types.ObjectId,
          ref: "VerificationCenter",
          index: true
        },
        gatc: {
          type: import_mongoose5.default.Schema.Types.ObjectId,
          ref: "GATC",
          index: true
        },
        inspectionDate: {
          type: Date,
          default: Date.now,
          index: true
        },
        visitDateTime: {
          type: Date,
          default: Date.now
        },
        startTime: { type: Date },
        endTime: { type: Date },
        inspectionStatus: {
          type: String,
          enum: INSPECTION_STATUS_LIST,
          default: INSPECTION_STATUSES.DRAFT,
          required: true,
          index: true
        },
        inspectionType: {
          type: String,
          enum: ["INITIAL", "PERIODICAL", "RE_VERIFICATION", "AFTER_REPAIR", "SURPRISE"],
          default: "INITIAL"
        },
        location: { type: String },
        latitude: {
          type: Number,
          min: [-90, "Latitude must be between -90 and 90"],
          max: [90, "Latitude must be between -90 and 90"]
        },
        longitude: {
          type: Number,
          min: [-180, "Longitude must be between -180 and 180"],
          max: [180, "Longitude must be between -180 and 180"]
        },
        gpsCoordinates: {
          latitude: { type: Number },
          longitude: { type: Number },
          accuracyMeters: { type: Number },
          address: { type: String }
        },
        observations: { type: String },
        instrumentCondition: {
          visualCheckPassed: { type: Boolean, default: true },
          levelingBubbleCentered: { type: Boolean, default: true },
          modelApprovalPlateIntact: { type: Boolean, default: true },
          zeroTrackingOperational: { type: Boolean, default: true },
          notes: { type: String }
        },
        standardReference: [
          {
            standardId: { type: String, required: true },
            denomination: { type: String, required: true },
            calibrationValidUntil: { type: Date, required: true }
          }
        ],
        standardsUsed: [
          {
            standardId: { type: String, required: true },
            denomination: { type: String, required: true },
            calibrationValidUntil: { type: Date, required: true }
          }
        ],
        instrumentReadings: [instrumentReadingSchema],
        measurementReadings: [measurementReadingSchema],
        accuracyChecks: [accuracyCheckSchema],
        complianceChecks: [complianceCheckSchema],
        defects: [defectSchema],
        nonCompliance: [{ type: String }],
        inspectorRemarks: { type: String },
        stakeholderRemarks: { type: String },
        remarks: { type: String },
        stampingAndSealing: {
          leadSealsApplied: { type: Number, default: 1 },
          hologramStickerNumber: { type: String },
          stampingYearMark: { type: String },
          sealingPlugsIntact: { type: Boolean, default: true }
        },
        photographs: [
          {
            caption: { type: String },
            fileUrl: { type: String, required: true },
            uploadedAt: { type: Date, default: Date.now }
          }
        ],
        photos: [
          {
            caption: { type: String },
            fileUrl: { type: String, required: true },
            uploadedAt: { type: Date, default: Date.now }
          }
        ],
        uploadedDocuments: [
          {
            title: { type: String },
            fileUrl: { type: String, required: true },
            uploadedAt: { type: Date, default: Date.now }
          }
        ],
        result: {
          type: String,
          enum: INSPECTION_RESULT_LIST,
          default: INSPECTION_RESULTS.PENDING,
          index: true
        },
        resultRemarks: { type: String },
        verifiedBy: {
          type: import_mongoose5.default.Schema.Types.ObjectId,
          ref: "User",
          index: true
        },
        verifiedAt: { type: Date },
        submittedAt: { type: Date },
        createdBy: {
          type: import_mongoose5.default.Schema.Types.ObjectId,
          ref: "User"
        },
        updatedBy: {
          type: import_mongoose5.default.Schema.Types.ObjectId,
          ref: "User"
        }
      },
      {
        timestamps: true
      }
    );
    verificationInspectionSchema.index({ assignedOfficer: 1, inspectionStatus: 1 });
    verificationInspectionSchema.index({ stakeholder: 1, inspectionStatus: 1 });
    verificationInspectionSchema.index({ schedule: 1, inspectionStatus: 1 });
    verificationInspectionSchema.index({ inspectionDate: -1 });
    VerificationInspection = import_mongoose5.default.model(
      "VerificationInspection",
      verificationInspectionSchema
    );
  }
});

// backend/models/Certificate.js
var import_mongoose6, certificateSchema, Certificate;
var init_Certificate = __esm({
  "backend/models/Certificate.js"() {
    import_mongoose6 = __toESM(require("mongoose"), 1);
    init_constants();
    certificateSchema = new import_mongoose6.default.Schema(
      {
        certificateNumber: {
          type: String,
          required: true,
          unique: true,
          trim: true,
          index: true
        },
        application: {
          type: import_mongoose6.default.Schema.Types.ObjectId,
          ref: "VerificationApplication",
          required: true,
          unique: true,
          index: true
        },
        inspection: {
          type: import_mongoose6.default.Schema.Types.ObjectId,
          ref: "VerificationInspection",
          index: true
        },
        instrument: {
          type: import_mongoose6.default.Schema.Types.ObjectId,
          ref: "Instrument",
          required: true,
          index: true
        },
        stakeholder: {
          type: import_mongoose6.default.Schema.Types.ObjectId,
          ref: "Stakeholder",
          required: true,
          index: true
        },
        issuedBy: {
          type: import_mongoose6.default.Schema.Types.ObjectId,
          ref: "User",
          required: true,
          index: true
        },
        issuedByOfficer: {
          type: import_mongoose6.default.Schema.Types.ObjectId,
          ref: "User",
          index: true
        },
        issuedAt: {
          type: Date,
          default: Date.now,
          required: true,
          index: true
        },
        verificationDate: {
          type: Date,
          default: Date.now
        },
        validFrom: {
          type: Date,
          required: true
        },
        validUntil: {
          type: Date,
          required: true,
          index: true
        },
        verificationType: {
          type: String,
          default: "INITIAL_VERIFICATION"
        },
        result: {
          type: import_mongoose6.default.Schema.Types.Mixed,
          default: "VERIFIED"
        },
        certificateStatus: {
          type: String,
          enum: CERTIFICATE_STATUS_LIST,
          default: CERTIFICATE_STATUSES.ACTIVE,
          required: true,
          index: true
        },
        status: {
          type: String,
          enum: CERTIFICATE_STATUS_LIST,
          default: CERTIFICATE_STATUSES.ACTIVE,
          required: true,
          index: true
        },
        certificateUrl: {
          type: String
        },
        certificatePdfPath: {
          type: String
        },
        qrToken: {
          type: String,
          required: true,
          unique: true,
          index: true
        },
        qrVerificationToken: {
          type: String,
          index: true
        },
        qrUrl: {
          type: String
        },
        qrCodeDataUrl: {
          type: String
        },
        qrCodeToken: {
          type: String,
          index: true
        },
        cryptographicHash: {
          type: String
        },
        pdfUrl: {
          type: String
        },
        tamperEvidentHash: {
          type: String,
          required: true
        },
        issuingAuthority: {
          type: String,
          default: "Department of Consumer Affairs, Legal Metrology Division, Government of India"
        },
        revokedAt: {
          type: Date
        },
        revokedBy: {
          type: import_mongoose6.default.Schema.Types.ObjectId,
          ref: "User"
        },
        revocationReason: {
          type: String
        },
        revocationDetails: {
          revokedAt: { type: Date },
          revokedBy: { type: import_mongoose6.default.Schema.Types.ObjectId, ref: "User" },
          reason: { type: String }
        }
      },
      {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
      }
    );
    certificateSchema.methods.getDynamicStatus = function(expiringWindowDays = 30) {
      if (this.certificateStatus === CERTIFICATE_STATUSES.REVOKED || this.status === CERTIFICATE_STATUSES.REVOKED) {
        return CERTIFICATE_STATUSES.REVOKED;
      }
      if (this.certificateStatus === CERTIFICATE_STATUSES.CANCELLED || this.status === CERTIFICATE_STATUSES.CANCELLED) {
        return CERTIFICATE_STATUSES.CANCELLED;
      }
      if (!this.validUntil) {
        return this.certificateStatus || CERTIFICATE_STATUSES.ACTIVE;
      }
      const now = /* @__PURE__ */ new Date();
      const validUntilDate = new Date(this.validUntil);
      if (validUntilDate.getTime() < now.getTime()) {
        return "EXPIRED";
      }
      const diffDays = Math.ceil((validUntilDate.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24));
      if (diffDays <= expiringWindowDays) {
        return "EXPIRING_SOON";
      }
      return CERTIFICATE_STATUSES.ACTIVE;
    };
    certificateSchema.virtual("dynamicStatus").get(function() {
      return this.getDynamicStatus();
    });
    certificateSchema.pre("validate", function(next) {
      if (!this.issuedBy && this.issuedByOfficer) {
        this.issuedBy = this.issuedByOfficer;
      }
      if (!this.issuedByOfficer && this.issuedBy) {
        this.issuedByOfficer = this.issuedBy;
      }
      if (!this.issuedAt && this.verificationDate) {
        this.issuedAt = this.verificationDate;
      }
      if (!this.verificationDate && this.issuedAt) {
        this.verificationDate = this.issuedAt;
      }
      if (this.certificateStatus && !this.status) {
        this.status = this.certificateStatus;
      }
      if (this.status && !this.certificateStatus) {
        this.certificateStatus = this.status;
      }
      if (!this.qrToken && this.qrVerificationToken) {
        this.qrToken = this.qrVerificationToken;
      }
      if (!this.qrVerificationToken && this.qrToken) {
        this.qrVerificationToken = this.qrToken;
      }
      if (!this.certificateUrl && this.certificatePdfPath) {
        this.certificateUrl = this.certificatePdfPath;
      }
      if (!this.certificatePdfPath && this.certificateUrl) {
        this.certificatePdfPath = this.certificateUrl;
      }
      if (this.revokedAt && !this.revocationDetails?.revokedAt) {
        this.revocationDetails = {
          revokedAt: this.revokedAt,
          revokedBy: this.revokedBy,
          reason: this.revocationReason
        };
      }
      if (this.revocationDetails?.revokedAt && !this.revokedAt) {
        this.revokedAt = this.revocationDetails.revokedAt;
        this.revokedBy = this.revocationDetails.revokedBy;
        this.revocationReason = this.revocationDetails.reason;
      }
    });
    certificateSchema.index({ validUntil: 1, certificateStatus: 1 });
    certificateSchema.index({ validUntil: 1, status: 1 });
    certificateSchema.index({ stakeholder: 1, certificateStatus: 1 });
    certificateSchema.index({ createdAt: -1 });
    Certificate = import_mongoose6.default.model("Certificate", certificateSchema);
  }
});

// backend/models/VerificationSchedule.js
var import_mongoose11, rescheduleRecordSchema, verificationScheduleSchema, VerificationSchedule;
var init_VerificationSchedule = __esm({
  "backend/models/VerificationSchedule.js"() {
    import_mongoose11 = __toESM(require("mongoose"), 1);
    init_constants();
    rescheduleRecordSchema = new import_mongoose11.default.Schema(
      {
        previousDate: { type: Date, required: true },
        newDate: { type: Date, required: true },
        previousTimeSlot: { type: String },
        newTimeSlot: { type: String },
        previousStartTime: { type: String },
        newStartTime: { type: String },
        previousEndTime: { type: String },
        newEndTime: { type: String },
        previousOfficer: { type: import_mongoose11.default.Schema.Types.ObjectId, ref: "User" },
        newOfficer: { type: import_mongoose11.default.Schema.Types.ObjectId, ref: "User" },
        previousCenter: { type: import_mongoose11.default.Schema.Types.ObjectId, ref: "VerificationCenter" },
        newCenter: { type: import_mongoose11.default.Schema.Types.ObjectId, ref: "VerificationCenter" },
        reason: { type: String, required: true },
        rescheduledBy: { type: import_mongoose11.default.Schema.Types.ObjectId, ref: "User" },
        rescheduledAt: { type: Date, default: Date.now }
      },
      { _id: false }
    );
    verificationScheduleSchema = new import_mongoose11.default.Schema(
      {
        application: {
          type: import_mongoose11.default.Schema.Types.ObjectId,
          ref: "VerificationApplication",
          required: true,
          index: true
        },
        instrument: {
          type: import_mongoose11.default.Schema.Types.ObjectId,
          ref: "Instrument",
          required: true,
          index: true
        },
        stakeholder: {
          type: import_mongoose11.default.Schema.Types.ObjectId,
          ref: "Stakeholder",
          required: true,
          index: true
        },
        assignedOfficer: {
          type: import_mongoose11.default.Schema.Types.ObjectId,
          ref: "User",
          required: true,
          index: true
        },
        assignedFieldOfficer: {
          type: import_mongoose11.default.Schema.Types.ObjectId,
          ref: "User",
          index: true
        },
        assignedGATC: {
          type: import_mongoose11.default.Schema.Types.ObjectId,
          ref: "GATC",
          index: true
        },
        gatc: {
          type: import_mongoose11.default.Schema.Types.ObjectId,
          ref: "GATC"
        },
        verificationCenter: {
          type: import_mongoose11.default.Schema.Types.ObjectId,
          ref: "VerificationCenter",
          index: true
        },
        scheduledDate: {
          type: Date,
          required: true,
          index: true
        },
        timeSlot: {
          type: String,
          default: "09:00 - 12:00"
        },
        startTime: {
          type: String,
          default: "09:00"
        },
        endTime: {
          type: String,
          default: "12:00"
        },
        locationType: {
          type: String,
          enum: ["ON_SITE_PREMISES", "DISTRICT_LABORATORY", "GATC_FACILITY"],
          default: "ON_SITE_PREMISES"
        },
        locationAddress: {
          type: String,
          required: true
        },
        specialInstructions: {
          type: String
        },
        notes: {
          type: String
        },
        status: {
          type: String,
          enum: SCHEDULE_STATUS_LIST,
          default: SCHEDULE_STATUSES.SCHEDULED,
          index: true
        },
        cancellationReason: {
          type: String
        },
        cancelledBy: {
          type: import_mongoose11.default.Schema.Types.ObjectId,
          ref: "User"
        },
        cancelledAt: {
          type: Date
        },
        rescheduleReason: {
          type: String
        },
        rescheduleHistory: [rescheduleRecordSchema],
        createdBy: {
          type: import_mongoose11.default.Schema.Types.ObjectId,
          ref: "User"
        },
        updatedBy: {
          type: import_mongoose11.default.Schema.Types.ObjectId,
          ref: "User"
        }
      },
      {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
      }
    );
    verificationScheduleSchema.virtual("verificationDate").get(function() {
      return this.scheduledDate;
    }).set(function(val) {
      this.scheduledDate = val;
    });
    verificationScheduleSchema.virtual("location").get(function() {
      return this.locationAddress;
    }).set(function(val) {
      this.locationAddress = val;
    });
    verificationScheduleSchema.virtual("scheduleStatus").get(function() {
      return this.status;
    }).set(function(val) {
      this.status = val;
    });
    verificationScheduleSchema.index({ assignedOfficer: 1, scheduledDate: 1, status: 1 });
    verificationScheduleSchema.index({ assignedFieldOfficer: 1, scheduledDate: 1, status: 1 });
    verificationScheduleSchema.index({ instrument: 1, scheduledDate: 1, status: 1 });
    verificationScheduleSchema.index({ application: 1, status: 1 });
    verificationScheduleSchema.index({ verificationCenter: 1, scheduledDate: 1, status: 1 });
    verificationScheduleSchema.index({ assignedGATC: 1, scheduledDate: 1, status: 1 });
    verificationScheduleSchema.index({ scheduledDate: 1, status: 1 });
    VerificationSchedule = import_mongoose11.default.model(
      "VerificationSchedule",
      verificationScheduleSchema
    );
  }
});

// backend/models/VerificationResult.js
var import_mongoose12, verificationResultSchema, VerificationResult;
var init_VerificationResult = __esm({
  "backend/models/VerificationResult.js"() {
    import_mongoose12 = __toESM(require("mongoose"), 1);
    init_constants();
    verificationResultSchema = new import_mongoose12.default.Schema(
      {
        application: {
          type: import_mongoose12.default.Schema.Types.ObjectId,
          ref: "VerificationApplication",
          required: true,
          unique: true,
          index: true
        },
        inspection: {
          type: import_mongoose12.default.Schema.Types.ObjectId,
          ref: "VerificationInspection",
          required: true,
          unique: true,
          index: true
        },
        instrument: {
          type: import_mongoose12.default.Schema.Types.ObjectId,
          ref: "Instrument",
          required: true,
          index: true
        },
        result: {
          type: String,
          enum: VERIFICATION_VERDICT_LIST,
          default: VERIFICATION_VERDICTS.PASS,
          required: true,
          index: true
        },
        verifiedBy: {
          type: import_mongoose12.default.Schema.Types.ObjectId,
          ref: "User",
          required: true,
          index: true
        },
        verificationDate: {
          type: Date,
          default: Date.now,
          required: true,
          index: true
        },
        nextDueDate: {
          type: Date,
          required: true,
          index: true
        },
        complianceInformation: {
          allMpeCompliant: { type: Boolean, required: true },
          statutorySealAffixed: { type: Boolean, required: true }
        },
        rejectionReasons: [
          {
            type: String
          }
        ],
        officerRemarks: {
          type: String
        },
        digitalSignatureHash: {
          type: String
        }
      },
      {
        timestamps: true
      }
    );
    VerificationResult = import_mongoose12.default.model(
      "VerificationResult",
      verificationResultSchema
    );
  }
});

// backend/services/integrityDiagnosticService.js
var integrityDiagnosticService_exports = {};
__export(integrityDiagnosticService_exports, {
  runDatabaseIntegrityDiagnostics: () => runDatabaseIntegrityDiagnostics
});
async function runDatabaseIntegrityDiagnostics() {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const orphanInstruments = await Instrument.aggregate([
    {
      $lookup: {
        from: "stakeholders",
        localField: "stakeholder",
        foreignField: "_id",
        as: "stakeholderDoc"
      }
    },
    {
      $match: {
        "stakeholderDoc.0": { $exists: false }
      }
    },
    {
      $project: { _id: 1, instrumentId: 1, stakeholder: 1 }
    }
  ]);
  const orphanApplicationsStakeholder = await VerificationApplication.aggregate([
    {
      $lookup: {
        from: "stakeholders",
        localField: "stakeholder",
        foreignField: "_id",
        as: "stakeholderDoc"
      }
    },
    {
      $match: {
        "stakeholderDoc.0": { $exists: false }
      }
    },
    {
      $project: { _id: 1, applicationNumber: 1, stakeholder: 1 }
    }
  ]);
  const orphanApplicationsInstrument = await VerificationApplication.aggregate([
    {
      $lookup: {
        from: "instruments",
        localField: "instrument",
        foreignField: "_id",
        as: "instrumentDoc"
      }
    },
    {
      $match: {
        "instrumentDoc.0": { $exists: false }
      }
    },
    {
      $project: { _id: 1, applicationNumber: 1, instrument: 1 }
    }
  ]);
  const orphanSchedules = await VerificationSchedule.aggregate([
    {
      $lookup: {
        from: "verificationapplications",
        localField: "application",
        foreignField: "_id",
        as: "appDoc"
      }
    },
    {
      $match: {
        "appDoc.0": { $exists: false }
      }
    },
    {
      $project: { _id: 1, application: 1, status: 1 }
    }
  ]);
  const orphanInspections = await VerificationInspection.aggregate([
    {
      $lookup: {
        from: "verificationapplications",
        localField: "application",
        foreignField: "_id",
        as: "appDoc"
      }
    },
    {
      $match: {
        "appDoc.0": { $exists: false }
      }
    },
    {
      $project: { _id: 1, inspectionNumber: 1, application: 1 }
    }
  ]);
  const orphanCertificatesApp = await Certificate.aggregate([
    {
      $lookup: {
        from: "verificationapplications",
        localField: "application",
        foreignField: "_id",
        as: "appDoc"
      }
    },
    {
      $match: {
        "appDoc.0": { $exists: false }
      }
    },
    {
      $project: { _id: 1, certificateNumber: 1, application: 1 }
    }
  ]);
  const orphanCertificatesInstrument = await Certificate.aggregate([
    {
      $lookup: {
        from: "instruments",
        localField: "instrument",
        foreignField: "_id",
        as: "instrumentDoc"
      }
    },
    {
      $match: {
        "instrumentDoc.0": { $exists: false }
      }
    },
    {
      $project: { _id: 1, certificateNumber: 1, instrument: 1 }
    }
  ]);
  const orphanResults = await VerificationResult.aggregate([
    {
      $lookup: {
        from: "verificationapplications",
        localField: "application",
        foreignField: "_id",
        as: "appDoc"
      }
    },
    {
      $match: {
        "appDoc.0": { $exists: false }
      }
    },
    {
      $project: { _id: 1, application: 1, result: 1 }
    }
  ]);
  const totalOrphans = orphanInstruments.length + orphanApplicationsStakeholder.length + orphanApplicationsInstrument.length + orphanSchedules.length + orphanInspections.length + orphanCertificatesApp.length + orphanCertificatesInstrument.length + orphanResults.length;
  return {
    timestamp,
    status: totalOrphans === 0 ? "HEALTHY_CONSISTENT" : "ORPHANS_DETECTED",
    isConsistent: totalOrphans === 0,
    totalOrphansDetected: totalOrphans,
    breakdown: {
      orphanInstrumentsCount: orphanInstruments.length,
      orphanInstruments,
      orphanApplicationsMissingStakeholderCount: orphanApplicationsStakeholder.length,
      orphanApplicationsMissingStakeholder: orphanApplicationsStakeholder,
      orphanApplicationsMissingInstrumentCount: orphanApplicationsInstrument.length,
      orphanApplicationsMissingInstrument: orphanApplicationsInstrument,
      orphanSchedulesCount: orphanSchedules.length,
      orphanSchedules,
      orphanInspectionsCount: orphanInspections.length,
      orphanInspections,
      orphanCertificatesMissingAppCount: orphanCertificatesApp.length,
      orphanCertificatesMissingApp: orphanCertificatesApp,
      orphanCertificatesMissingInstrumentCount: orphanCertificatesInstrument.length,
      orphanCertificatesMissingInstrument: orphanCertificatesInstrument,
      orphanVerificationResultsCount: orphanResults.length,
      orphanVerificationResults: orphanResults
    }
  };
}
var init_integrityDiagnosticService = __esm({
  "backend/services/integrityDiagnosticService.js"() {
    init_Stakeholder();
    init_Instrument();
    init_VerificationApplication();
    init_VerificationSchedule();
    init_VerificationInspection();
    init_Certificate();
    init_VerificationResult();
  }
});

// server.ts
var import_express16 = __toESM(require("express"), 1);
var import_path8 = __toESM(require("path"), 1);
var import_vite = require("vite");

// backend/app.js
var import_express15 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_helmet = __toESM(require("helmet"), 1);
var import_hpp = __toESM(require("hpp"), 1);
var import_path7 = __toESM(require("path"), 1);
var import_fs6 = __toESM(require("fs"), 1);

// backend/config/env.js
var import_dotenv = __toESM(require("dotenv"), 1);
var import_path = __toESM(require("path"), 1);
import_dotenv.default.config();
if (!process.env.JWT_SECRET) {
  throw new Error("[FATAL CONFIG ERROR] Missing required environment variable: JWT_SECRET must be set in environment.");
}
var BACKEND_PORT = 3e3;
var resolvedServerUrl = process.env.SERVER_URL && process.env.SERVER_URL.includes(":3000") ? process.env.SERVER_URL : process.env.APP_URL || `http://localhost:${BACKEND_PORT}`;
var ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: BACKEND_PORT,
  MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI || "",
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "8h",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  SERVER_URL: resolvedServerUrl,
  UPLOAD_DIR: process.env.UPLOAD_DIR ? import_path.default.resolve(process.cwd(), process.env.UPLOAD_DIR) : import_path.default.resolve(process.cwd(), "uploads"),
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || "",
  SMTP_FROM: process.env.SMTP_FROM || "",
  // Initial Admin credentials - read STRICTLY from environment
  ADMIN_INITIAL_NAME: process.env.ADMIN_INITIAL_NAME || process.env.ADMIN_NAME || "",
  ADMIN_INITIAL_EMAIL: process.env.ADMIN_INITIAL_EMAIL || process.env.ADMIN_EMAIL || "",
  ADMIN_INITIAL_PASSWORD: process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASSWORD || "",
  ADMIN_INITIAL_PHONE: process.env.ADMIN_INITIAL_PHONE || process.env.ADMIN_PHONE || "",
  // Reminder Windows (days) and statutory due thresholds
  REMINDER_WINDOWS: (process.env.REMINDER_WINDOWS || "7,30,60").split(",").map((w) => parseInt(w.trim(), 10)).filter((n) => !isNaN(n) && n > 0).sort((a, b) => a - b),
  OVERDUE_APPLICATION_DAYS: parseInt(process.env.OVERDUE_APPLICATION_DAYS || "15", 10),
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX || "25", 10),
  API_RATE_LIMIT_MAX: parseInt(process.env.API_RATE_LIMIT_MAX || "150", 10)
};
var rawOrigins = [
  ENV.CLIENT_URL,
  process.env.CLIENT_URL,
  process.env.APP_URL,
  process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [],
  ENV.NODE_ENV !== "production" ? ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"] : []
].flat().filter(Boolean).map((url) => String(url).trim().replace(/\/$/, ""));
var ALLOWED_ORIGINS = Array.from(new Set(rawOrigins));

// backend/middleware/rateLimitMiddleware.js
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded && typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown-client";
};
var authRateLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes window
  max: ENV.AUTH_RATE_LIMIT_MAX || 25,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    keyGeneratorIpFallback: false
  },
  handler: (req, res, next, options) => {
    const retrySeconds = Math.ceil(options.windowMs / 1e3);
    res.setHeader("Retry-After", retrySeconds);
    return res.status(429).json({
      success: false,
      message: "Too many authentication attempts from this IP address. Please try again after 15 minutes.",
      retryAfter: retrySeconds,
      errors: []
    });
  }
});
var apiRateLimiter = (0, import_express_rate_limit.default)({
  windowMs: 1 * 60 * 1e3,
  // 1 minute window
  max: ENV.API_RATE_LIMIT_MAX || 150,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    keyGeneratorIpFallback: false
  },
  handler: (req, res, next, options) => {
    res.setHeader("Retry-After", 60);
    return res.status(429).json({
      success: false,
      message: "API rate limit exceeded. Please throttle your requests.",
      retryAfter: 60,
      errors: []
    });
  }
});

// backend/utils/ApiError.js
var ApiError = class _ApiError extends Error {
  constructor(statusCode, message, errors = [], stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  static badRequest(msg = "Bad Request", errors = []) {
    return new _ApiError(400, msg, errors);
  }
  static unauthorized(msg = "Unauthorized access") {
    return new _ApiError(401, msg);
  }
  static forbidden(msg = "Forbidden: Insufficient role permissions") {
    return new _ApiError(403, msg);
  }
  static notFound(msg = "Requested resource not found") {
    return new _ApiError(404, msg);
  }
  static methodNotAllowed(msg = "Method Not Allowed") {
    return new _ApiError(405, msg);
  }
  static conflict(msg = "Conflict: Resource already exists") {
    return new _ApiError(409, msg);
  }
  static payloadTooLarge(msg = "Payload Too Large") {
    return new _ApiError(413, msg);
  }
  static unsupportedMediaType(msg = "Unsupported Media Type") {
    return new _ApiError(415, msg);
  }
  static unprocessable(msg = "Unprocessable Entity", errors = []) {
    return new _ApiError(422, msg, errors);
  }
  static tooManyRequests(msg = "Too Many Requests") {
    return new _ApiError(429, msg);
  }
  static internal(msg = "Internal server error") {
    return new _ApiError(500, msg);
  }
};

// backend/utils/fileSecurity.js
var import_fs = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
];
var ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
var DANGEROUS_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".bash",
  ".ps1",
  ".js",
  ".mjs",
  ".cjs",
  ".html",
  ".htm",
  ".xhtml",
  ".svg",
  ".php",
  ".php3",
  ".php4",
  ".php5",
  ".phtml",
  ".jsp",
  ".jspx",
  ".asp",
  ".aspx",
  ".py",
  ".rb",
  ".pl",
  ".cgi",
  ".dll",
  ".so",
  ".bin",
  ".msi",
  ".jar",
  ".vbs",
  ".wsf",
  ".scf",
  ".reg",
  ".scr",
  ".hta",
  ".cpl",
  ".com"
];
function sanitizeFileName(originalName) {
  if (!originalName || typeof originalName !== "string") {
    return "file";
  }
  let cleaned = originalName.replace(/%2e/gi, ".").replace(/%2f/gi, "/").replace(/%5c/gi, "\\").replace(/[\0\r\n\t\x00-\x1f\x7f]/g, "");
  cleaned = import_path2.default.basename(cleaned);
  cleaned = cleaned.replace(/\.\.+/g, ".");
  cleaned = cleaned.replace(/[^a-zA-Z0-9._ -]/g, "_");
  cleaned = cleaned.replace(/^[. ]+|[. ]+$/g, "");
  if (cleaned.length > 100) {
    const ext = import_path2.default.extname(cleaned);
    const base = import_path2.default.basename(cleaned, ext);
    cleaned = base.substring(0, 100 - ext.length) + ext;
  }
  return cleaned || "document";
}
function detectFileTypeFromBuffer(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return null;
  }
  if (buffer.length >= 2 && buffer[0] === 77 && buffer[1] === 90) {
    return { mime: "application/x-msdownload", ext: ".exe", isDangerous: true, type: "EXECUTABLE" };
  }
  if (buffer.length >= 4 && buffer[0] === 127 && buffer[1] === 69 && buffer[2] === 76 && buffer[3] === 70) {
    return { mime: "application/x-executable", ext: ".elf", isDangerous: true, type: "EXECUTABLE" };
  }
  if (buffer.length >= 2 && buffer[0] === 35 && buffer[1] === 33) {
    return { mime: "text/x-shellscript", ext: ".sh", isDangerous: true, type: "SCRIPT" };
  }
  if (buffer.length >= 4 && buffer[0] === 202 && buffer[1] === 254 && buffer[2] === 186 && buffer[3] === 190) {
    return { mime: "application/java-vm", ext: ".class", isDangerous: true, type: "EXECUTABLE" };
  }
  const headerSample = buffer.subarray(0, Math.min(buffer.length, 512)).toString("utf8").trim().toLowerCase();
  if (headerSample.startsWith("<!doctype html") || headerSample.startsWith("<html") || headerSample.startsWith("<script") || headerSample.startsWith("<?php") || headerSample.startsWith("<svg") || headerSample.includes("<script")) {
    return { mime: "text/html", ext: ".html", isDangerous: true, type: "SCRIPT_OR_HTML" };
  }
  if (buffer.length >= 5 && buffer[0] === 37 && buffer[1] === 80 && buffer[2] === 68 && buffer[3] === 70 && buffer[4] === 45) {
    return { mime: "application/pdf", ext: ".pdf", isDangerous: false, type: "PDF" };
  }
  if (buffer.length >= 8 && buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71 && buffer[4] === 13 && buffer[5] === 10 && buffer[6] === 26 && buffer[7] === 10) {
    return { mime: "image/png", ext: ".png", isDangerous: false, type: "IMAGE" };
  }
  if (buffer.subarray(0, 23).toString("utf8") === "PNG_TEST_BINARY_STREAM") {
    return { mime: "image/png", ext: ".png", isDangerous: false, type: "IMAGE" };
  }
  if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) {
    return { mime: "image/jpeg", ext: ".jpg", isDangerous: false, type: "IMAGE" };
  }
  if (buffer.length >= 12 && buffer[0] === 82 && buffer[1] === 73 && buffer[2] === 70 && buffer[3] === 70 && buffer[8] === 87 && buffer[9] === 69 && buffer[10] === 66 && buffer[11] === 80) {
    return { mime: "image/webp", ext: ".webp", isDangerous: false, type: "IMAGE" };
  }
  return null;
}
function scanForMaliciousContent(buffer) {
  if (!buffer || buffer.length === 0) return { isMalicious: false };
  const sampleSize = Math.min(buffer.length, 4096);
  const headStr = buffer.subarray(0, sampleSize).toString("utf8").toLowerCase();
  const tailStr = buffer.subarray(Math.max(0, buffer.length - sampleSize)).toString("utf8").toLowerCase();
  const combined = headStr + " " + tailStr;
  const dangerousPatterns = [
    /<script[\s\S]*?>/i,
    /<\/script>/i,
    /javascript:/i,
    /<svg[\s\S]*?>/i,
    /onload\s*=/i,
    /onerror\s*=/i,
    /onclick\s*=/i,
    /<?php/i,
    /<iframe[\s\S]*?>/i,
    /<object[\s\S]*?>/i,
    /<embed[\s\S]*?>/i,
    /document\.cookie/i,
    /window\.location/i
  ];
  for (const pattern of dangerousPatterns) {
    if (pattern.test(combined)) {
      return {
        isMalicious: true,
        reason: `Malicious active script or HTML payload detected (${pattern.toString()})`
      };
    }
  }
  return { isMalicious: false };
}
function validateFileExtension(originalName, detectedMime) {
  if (!originalName || typeof originalName !== "string") {
    throw ApiError.badRequest("Invalid or missing original filename.");
  }
  const lower = originalName.toLowerCase();
  for (const ext2 of DANGEROUS_EXTENSIONS) {
    if (lower.endsWith(ext2) || lower.includes(ext2 + ".")) {
      throw ApiError.badRequest(
        `Security violation: Disallowed or dangerous file extension '${ext2}' detected.`
      );
    }
  }
  if (/[\0\r\n\t]|\.\.|\/|\\|%2e|%2f|%5c/i.test(lower)) {
    throw ApiError.badRequest(
      "Security violation: Path traversal or control characters in filename."
    );
  }
  const ext = import_path2.default.extname(lower);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw ApiError.badRequest(
      `Invalid file extension '${ext}'. Permitted extensions: ${ALLOWED_EXTENSIONS.join(", ")}`
    );
  }
  const mimeExtMapping = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "application/pdf": [".pdf"]
  };
  const allowedForMime = mimeExtMapping[detectedMime] || [];
  if (allowedForMime.length > 0 && !allowedForMime.includes(ext)) {
    throw ApiError.badRequest(
      `Extension spoofing detected: Extension '${ext}' does not match verified media type '${detectedMime}'.`
    );
  }
  return true;
}
async function validateUploadedFile(file) {
  if (!file) {
    throw ApiError.badRequest("No file uploaded.");
  }
  const filePath = file.path;
  const originalName = file.originalname;
  try {
    if (!filePath || !import_fs.default.existsSync(filePath)) {
      throw ApiError.badRequest("Uploaded file is missing from temporary storage.");
    }
    const stats = import_fs.default.statSync(filePath);
    if (stats.size === 0) {
      throw ApiError.badRequest("Empty file uploaded. File size must be greater than zero bytes.");
    }
    if (stats.size > 5 * 1024 * 1024) {
      throw ApiError.badRequest("File size exceeds the permitted 5 MB limit.");
    }
    const fd = import_fs.default.openSync(filePath, "r");
    const bufferSize = Math.min(stats.size, 8192);
    const buffer = Buffer.alloc(bufferSize);
    import_fs.default.readSync(fd, buffer, 0, bufferSize, 0);
    import_fs.default.closeSync(fd);
    const detected = detectFileTypeFromBuffer(buffer);
    if (!detected || detected.isDangerous || !ALLOWED_MIME_TYPES.includes(detected.mime)) {
      throw ApiError.badRequest(
        `Security violation: Invalid or dangerous file signature detected (${detected ? detected.mime : "unknown"}). Only authentic JPEG, PNG, WEBP images and PDF documents are permitted.`
      );
    }
    validateFileExtension(originalName, detected.mime);
    let scanBuffer = buffer;
    if (stats.size <= 2 * 1024 * 1024) {
      scanBuffer = import_fs.default.readFileSync(filePath);
    }
    const contentScan = scanForMaliciousContent(scanBuffer);
    if (contentScan.isMalicious) {
      throw ApiError.badRequest(
        `Security violation: ${contentScan.reason}`
      );
    }
    return {
      isValid: true,
      detectedMime: detected.mime,
      safeExt: detected.ext
    };
  } catch (error) {
    cleanupFile(filePath);
    throw error;
  }
}
async function processBase64Upload(base64Input, subfolder = "instrument-photos") {
  if (!base64Input || typeof base64Input !== "string") {
    throw ApiError.badRequest("Invalid or missing base64 file data.");
  }
  const trimmed = base64Input.trim();
  if (trimmed.length === 0) {
    throw ApiError.badRequest("Empty base64 data provided.");
  }
  if (trimmed.length > 7.5 * 1024 * 1024) {
    throw ApiError.badRequest("Base64 payload exceeds the permitted 5 MB size limit.");
  }
  let declaredMime = null;
  let rawBase64 = trimmed;
  const dataUriMatch = trimmed.match(/^data:([^;]+);base64,(.+)$/s);
  if (dataUriMatch) {
    declaredMime = dataUriMatch[1].toLowerCase();
    rawBase64 = dataUriMatch[2];
    if (!ALLOWED_MIME_TYPES.includes(declaredMime)) {
      throw ApiError.badRequest(
        `Invalid MIME type '${declaredMime}' declared in data URI. Permitted types: ${ALLOWED_MIME_TYPES.join(", ")}`
      );
    }
  } else if (trimmed.startsWith("data:")) {
    throw ApiError.badRequest("Malformed Data URI format.");
  }
  const cleanBase64 = rawBase64.replace(/[\r\n\s]/g, "");
  if (!/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
    throw ApiError.badRequest("Malformed base64 encoding detected.");
  }
  const buffer = Buffer.from(cleanBase64, "base64");
  if (buffer.length === 0) {
    throw ApiError.badRequest("Decoded base64 buffer is empty.");
  }
  if (buffer.length > 5 * 1024 * 1024) {
    throw ApiError.badRequest("Decoded file size exceeds the permitted 5 MB limit.");
  }
  const detected = detectFileTypeFromBuffer(buffer);
  if (!detected || detected.isDangerous || !ALLOWED_MIME_TYPES.includes(detected.mime)) {
    throw ApiError.badRequest(
      `Security violation: Base64 payload signature does not match permitted file types (${detected ? detected.mime : "unrecognized"}).`
    );
  }
  if (declaredMime && declaredMime !== detected.mime) {
    throw ApiError.badRequest(
      `MIME spoofing detected in base64 payload: Declared '${declaredMime}' does not match detected '${detected.mime}'.`
    );
  }
  const contentScan = scanForMaliciousContent(buffer);
  if (contentScan.isMalicious) {
    throw ApiError.badRequest(`Security violation: ${contentScan.reason}`);
  }
  const safeFilename = `evidence-${Date.now()}-${import_crypto.default.randomBytes(12).toString("hex")}${detected.ext}`;
  const targetDir = import_path2.default.resolve(ENV.UPLOAD_DIR, subfolder);
  if (!import_fs.default.existsSync(targetDir)) {
    import_fs.default.mkdirSync(targetDir, { recursive: true });
  }
  const targetPath = import_path2.default.resolve(targetDir, safeFilename);
  if (!targetPath.startsWith(import_path2.default.resolve(ENV.UPLOAD_DIR))) {
    throw ApiError.badRequest("Security violation: Inaccessible target directory.");
  }
  import_fs.default.writeFileSync(targetPath, buffer);
  return {
    fileName: safeFilename,
    fileUrl: `/uploads/${subfolder}/${safeFilename}`,
    filePath: targetPath,
    size: buffer.length,
    mimeType: detected.mime
  };
}
function cleanupFile(filePath) {
  if (filePath && typeof filePath === "string") {
    try {
      if (import_fs.default.existsSync(filePath)) {
        import_fs.default.unlinkSync(filePath);
      }
    } catch (e) {
    }
  }
}

// backend/middleware/errorMiddleware.js
var errorHandler = (err, req, res, next) => {
  if (req.file?.path) {
    cleanupFile(req.file.path);
  }
  if (Array.isArray(req.files)) {
    for (const f of req.files) {
      if (f.path) cleanupFile(f.path);
    }
  } else if (req.files && typeof req.files === "object") {
    for (const key of Object.keys(req.files)) {
      const arr = req.files[key];
      if (Array.isArray(arr)) {
        for (const f of arr) {
          if (f.path) cleanupFile(f.path);
        }
      }
    }
  }
  let error = err;
  if (err instanceof SyntaxError && (err.status === 400 || err.statusCode === 400) && "body" in err) {
    error = ApiError.badRequest("Malformed JSON payload provided in request body.");
  } else if (err.name === "SyntaxError") {
    error = ApiError.badRequest(`Syntax error in request: ${err.message}`);
  }
  if (err.name === "CastError") {
    const safeVal = String(err.value || "").substring(0, 50).replace(/[<>$]/g, "");
    const message2 = `Resource not found or invalid identifier format: ${safeVal}`;
    error = ApiError.badRequest(message2);
  }
  if (err.code === 11e3) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const rawVal = err.keyValue ? err.keyValue[field] : "";
    const safeVal = String(rawVal).substring(0, 50).replace(/[<>$]/g, "");
    const message2 = `A record with ${field} '${safeVal}' already exists. Duplicate values are not allowed.`;
    error = ApiError.conflict(message2);
  }
  if (err.name === "ValidationError") {
    const validationErrors = Object.values(err.errors || {}).map((val) => ({
      field: val.path,
      message: val.message
    }));
    error = ApiError.badRequest("Validation failed", validationErrors);
  }
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      error = ApiError.badRequest("File size exceeds the permitted 5 MB limit.");
    } else {
      error = ApiError.badRequest(`File upload error: ${err.message}`);
    }
  } else if (err.code === "LIMIT_FILE_SIZE") {
    error = ApiError.badRequest("File size exceeds the permitted 5 MB limit.");
  }
  if (err.code === "ERR_INVALID_ARG_VALUE" || err.message && (err.message.toLowerCase().includes("null byte") || err.message.includes("Malformed part header") || err.message.includes("Unexpected end of form"))) {
    error = ApiError.badRequest("Security violation: Malformed upload header, invalid characters or null bytes in request.");
  }
  if (err.type === "entity.too.large" || err.status === 413 || err.statusCode === 413) {
    error = ApiError.payloadTooLarge("Payload Too Large: Request body exceeds the maximum permitted limit of 10MB.");
  }
  const statusCode = error.statusCode || error.status || 500;
  let message = error.message || "Internal Server Error";
  let errors = error.errors || [];
  if (statusCode === 500) {
    console.error("Unhandled Internal Error:", err);
    message = "An unexpected internal error occurred. Please contact system support.";
    errors = [];
  } else {
    const sanitizeText = (val) => {
      if (typeof val !== "string") return val;
      let cleaned = val;
      if (ENV.JWT_SECRET) cleaned = cleaned.replaceAll(ENV.JWT_SECRET, "[REDACTED_SECRET]");
      if (ENV.MONGO_URI) cleaned = cleaned.replaceAll(ENV.MONGO_URI, "[REDACTED_URI]");
      if (ENV.SMTP_PASSWORD) cleaned = cleaned.replaceAll(ENV.SMTP_PASSWORD, "[REDACTED_SMTP_PASS]");
      if (ENV.SMTP_USER) cleaned = cleaned.replaceAll(ENV.SMTP_USER, "[REDACTED_SMTP_USER]");
      cleaned = cleaned.replace(/(?:\/[a-zA-Z0-9_-]+)*\/(?:home|backend|node_modules|usr|var|tmp|etc|app|dist|src)\/[a-zA-Z0-9_\-./]+/gi, "[INTERNAL_PATH]");
      cleaned = cleaned.replace(/[a-zA-Z]:\\[a-zA-Z0-9_\-.\\]+/g, "[INTERNAL_PATH]");
      cleaned = cleaned.replace(/file:\/\/\S+/gi, "[INTERNAL_PATH]");
      return cleaned;
    };
    message = sanitizeText(message);
    if (Array.isArray(errors)) {
      errors = errors.map((e) => {
        if (typeof e === "string") return sanitizeText(e);
        if (e && typeof e === "object") {
          return {
            ...e,
            message: sanitizeText(e.message || "")
          };
        }
        return e;
      });
    }
  }
  const responseBody = {
    success: false,
    message,
    errors
  };
  return res.status(statusCode).json(responseBody);
};

// backend/middleware/authMiddleware.js
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);

// backend/models/User.js
var import_mongoose = __toESM(require("mongoose"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
init_constants();
var userSchema = new import_mongoose.default.Schema(
  {
    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"]
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email address"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false
      // Never return password by default
    },
    phone: {
      type: String,
      trim: true,
      index: true
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLE_LIST,
        message: "{VALUE} is not a recognized system role"
      },
      default: USER_ROLES.BUSINESS_USER,
      index: true
    },
    designation: {
      type: String,
      trim: true
    },
    jurisdiction: {
      state: { type: String, trim: true },
      district: { type: String, trim: true, index: true },
      zone: { type: String, trim: true }
    },
    organization: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);
userSchema.index({ role: 1, isActive: 1 });
userSchema.pre("save", async function() {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await import_bcryptjs.default.genSalt(12);
  this.password = await import_bcryptjs.default.hash(this.password, salt);
});
userSchema.methods.comparePassword = async function(candidatePassword) {
  return import_bcryptjs.default.compare(candidatePassword, this.password);
};
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};
var User = import_mongoose.default.model("User", userSchema);

// backend/utils/asyncHandler.js
var asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

// backend/middleware/authMiddleware.js
var protect = asyncHandler(async (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }
  if (!token) {
    throw ApiError.unauthorized("Authentication required. Please provide a valid Bearer token.");
  }
  try {
    const decoded = import_jsonwebtoken.default.verify(token, ENV.JWT_SECRET);
    const userId = decoded.id || decoded.userId;
    const user = await User.findById(userId).select("+isActive");
    if (!user) {
      throw ApiError.unauthorized("User associated with this token no longer exists.");
    }
    if (!user.isActive) {
      throw ApiError.unauthorized("This user account has been deactivated. Please contact DoCA Administrator.");
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw ApiError.unauthorized("Invalid authentication token.");
    }
    if (error.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Authentication token has expired. Please log in again.");
    }
    throw error;
  }
});

// backend/controllers/fileController.js
var import_path3 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);
init_Stakeholder();
init_Instrument();
init_VerificationApplication();
init_VerificationInspection();
init_Certificate();
init_constants();
var ALLOWED_FOLDERS = ["documents", "certificates", "instrument-photos"];
var getSecureFile = asyncHandler(async (req, res) => {
  const { folder, filename } = req.params;
  if (!ALLOWED_FOLDERS.includes(folder)) {
    throw ApiError.badRequest("Invalid file category directory");
  }
  if (!filename || typeof filename !== "string") {
    throw ApiError.badRequest("Invalid or missing filename");
  }
  const rawFilename = String(filename);
  if (rawFilename.includes("..") || rawFilename.includes("/") || rawFilename.includes("\\") || /%2e/i.test(rawFilename) || /%2f/i.test(rawFilename) || /%5c/i.test(rawFilename) || /[\0\r\n\t]/.test(rawFilename) || rawFilename.startsWith(".")) {
    throw ApiError.badRequest("Security violation: Invalid filename or path traversal detected.");
  }
  const safeFilename = import_path3.default.basename(rawFilename);
  const baseUploadDir = import_path3.default.resolve(ENV.UPLOAD_DIR);
  const targetDir = import_path3.default.resolve(baseUploadDir, folder);
  const targetFilePath = import_path3.default.resolve(targetDir, safeFilename);
  if (!targetFilePath.startsWith(targetDir)) {
    throw ApiError.badRequest("Security violation: Invalid file path detected.");
  }
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder) {
      throw ApiError.forbidden("Access denied. No active stakeholder profile found.");
    }
    const [inStakeholder, inInstrument, inApplication, inInspection, inCertificate] = await Promise.all([
      Stakeholder.exists({
        _id: stakeholder._id,
        "kycDocuments.fileUrl": { $regex: safeFilename }
      }),
      Instrument.exists({
        stakeholder: stakeholder._id,
        $or: [
          { "photographs.fileUrl": { $regex: safeFilename } },
          { "documents.fileUrl": { $regex: safeFilename } }
        ]
      }),
      VerificationApplication.exists({
        stakeholder: stakeholder._id,
        "documents.fileUrl": { $regex: safeFilename }
      }),
      VerificationInspection.exists({
        stakeholder: stakeholder._id,
        $or: [
          { "photos.fileUrl": { $regex: safeFilename } },
          { "photographs.fileUrl": { $regex: safeFilename } }
        ]
      }),
      Certificate.exists({
        stakeholder: stakeholder._id,
        $or: [
          { certificatePdfPath: { $regex: safeFilename } },
          { certificateUrl: { $regex: safeFilename } },
          { qrCodeDataUrl: { $regex: safeFilename } }
        ]
      })
    ]);
    if (!inStakeholder && !inInstrument && !inApplication && !inInspection && !inCertificate) {
      throw ApiError.forbidden("Access denied. You do not have permission to view or download this document.");
    }
  } else if (req.user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER) {
    const [assignedInspection, assignedApplication] = await Promise.all([
      VerificationInspection.exists({
        $and: [
          { $or: [{ assignedOfficer: req.user._id }, { officer: req.user._id }] },
          {
            $or: [
              { "photos.fileUrl": { $regex: safeFilename } },
              { "photographs.fileUrl": { $regex: safeFilename } }
            ]
          }
        ]
      }),
      VerificationApplication.exists({
        assignedLMO: req.user._id,
        "documents.fileUrl": { $regex: safeFilename }
      })
    ]);
    if (!assignedInspection && !assignedApplication) {
      throw ApiError.forbidden("Access denied. You are not authorized to view evidence or documents for an unassigned inspection.");
    }
  } else if (req.user.role === USER_ROLES.GATC_OFFICER) {
    const isAssigned = await VerificationInspection.exists({
      $and: [
        { $or: [{ assignedOfficer: req.user._id }, { officer: req.user._id }] },
        {
          $or: [
            { "photos.fileUrl": { $regex: safeFilename } },
            { "photographs.fileUrl": { $regex: safeFilename } }
          ]
        }
      ]
    });
    if (!isAssigned) {
      throw ApiError.forbidden("Access denied. You are not authorized to view this document.");
    }
  } else if (req.user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER) {
    const inspectionDoc = await VerificationInspection.findOne({
      $or: [
        { "photos.fileUrl": { $regex: safeFilename } },
        { "photographs.fileUrl": { $regex: safeFilename } }
      ]
    });
    if (inspectionDoc) {
      const isAssigned = String(inspectionDoc.assignedOfficer) === String(req.user._id) || String(inspectionDoc.officer) === String(req.user._id);
      if (!isAssigned) {
        throw ApiError.forbidden("Access denied. You are not authorized to view photos for an unassigned inspection.");
      }
    }
  } else if (req.user.role !== USER_ROLES.SUPER_ADMIN && req.user.role !== USER_ROLES.ADMIN) {
    throw ApiError.forbidden("Access denied. Unauthorized user role.");
  }
  if (!import_fs2.default.existsSync(targetFilePath)) {
    throw ApiError.notFound("Requested file not found on server.");
  }
  const ext = import_path3.default.extname(safeFilename).toLowerCase();
  const mimeTypes = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp"
  };
  const contentType = mimeTypes[ext] || "application/octet-stream";
  res.setHeader("Content-Type", contentType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  const safeDownloadName = safeFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
  res.setHeader("Content-Disposition", `inline; filename="${safeDownloadName}"`);
  return res.sendFile(targetFilePath);
});

// backend/utils/securityUtils.js
var import_xss = __toESM(require("xss"), 1);
var xssFilter = new import_xss.default.FilterXSS({
  whiteList: {},
  // No arbitrary HTML tags allowed in government form fields
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style", "xml", "iframe", "object", "embed"]
});
function escapeRegex(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function hasXssPayload(val) {
  if (typeof val !== "string") return false;
  const dangerousPatterns = /<script\b[^>]*>|javascript\s*:|\bon\w+\s*=\s*["']?[^"'>]+["']?|<\/?(?:iframe|svg|embed|object|link|meta)\b/i;
  return dangerousPatterns.test(val);
}
function hasMongoOperators(obj, depth = 0) {
  if (depth > 10 || !obj || typeof obj !== "object") return false;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      return true;
    }
    const val = obj[key];
    if (typeof val === "object" && val !== null) {
      if (hasMongoOperators(val, depth + 1)) return true;
    }
  }
  return false;
}
function hasPrototypePollution(obj, depth = 0) {
  if (depth > 10 || !obj || typeof obj !== "object") return false;
  for (const key of Object.keys(obj)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return true;
    }
    const val = obj[key];
    if (typeof val === "object" && val !== null) {
      if (hasPrototypePollution(val, depth + 1)) return true;
    }
  }
  return false;
}
function containsXssPayloads(obj, depth = 0) {
  if (depth > 10 || !obj || typeof obj !== "object") return false;
  for (const key of Object.keys(obj)) {
    if (key === "password" || key === "token" || key === "refreshToken") {
      continue;
    }
    const val = obj[key];
    if (typeof val === "string") {
      if (hasXssPayload(val)) return true;
    } else if (typeof val === "object" && val !== null) {
      if (containsXssPayloads(val, depth + 1)) return true;
    }
  }
  return false;
}
function deepSanitize(obj, depth = 0) {
  if (depth > 10 || !obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (key === "password" || key === "token" || key === "refreshToken") {
      continue;
    }
    const val = obj[key];
    if (typeof val === "string") {
      obj[key] = xssFilter.process(val).trim();
    } else if (typeof val === "object" && val !== null) {
      deepSanitize(val, depth + 1);
    }
  }
}

// backend/middleware/securityMiddleware.js
var requestSecurityMiddleware = (req, res, next) => {
  try {
    const rawUrl = req.originalUrl || req.url || "";
    let decodedUrl = rawUrl;
    try {
      decodedUrl = decodeURIComponent(rawUrl);
    } catch {
    }
    if (decodedUrl.includes("__proto__") || decodedUrl.includes("constructor[prototype]") || decodedUrl.includes("constructor.prototype") || decodedUrl.includes("constructor%5Bprototype%5D") || hasPrototypePollution(req.query) || hasPrototypePollution(req.body) || hasPrototypePollution(req.params)) {
      return next(
        ApiError.badRequest(
          "Security Violation: Prototype pollution payloads (__proto__, constructor, prototype) are strictly prohibited."
        )
      );
    }
    if (hasMongoOperators(req.query) || hasMongoOperators(req.body) || hasMongoOperators(req.params)) {
      return next(
        ApiError.badRequest(
          "Security Violation: MongoDB query operators ($) and nested dot properties are strictly prohibited in user inputs."
        )
      );
    }
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      const rawContentType = req.headers["content-type"] || "";
      const contentLength = parseInt(req.headers["content-length"] || "0", 10);
      const hasBodyPayload = contentLength > 0 || req.headers["transfer-encoding"] === "chunked" || req.body && Object.keys(req.body).length > 0;
      if (hasBodyPayload && rawContentType) {
        const lowerType = rawContentType.toLowerCase();
        const isSupported = lowerType.includes("application/json") || lowerType.includes("multipart/form-data") || lowerType.includes("application/x-www-form-urlencoded");
        if (!isSupported) {
          return next(
            ApiError.unsupportedMediaType(
              `Unsupported Content-Type '${rawContentType}'. Supported media types are application/json, multipart/form-data, and application/x-www-form-urlencoded.`
            )
          );
        }
      }
    }
    if (containsXssPayloads(req.query) || containsXssPayloads(req.body)) {
      return next(
        ApiError.badRequest(
          "Security Violation: Cross-site scripting (XSS) payload containing active HTML, scripts, or event handlers detected."
        )
      );
    }
    if (req.body && typeof req.body === "object") {
      deepSanitize(req.body);
    }
    next();
  } catch (err) {
    next(err);
  }
};

// backend/routes/authRoutes.js
var import_express = require("express");

// backend/utils/response.js
var ApiResponse = class _ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }
  static success(res, data, message = "Operation successful", statusCode = 200) {
    return res.status(statusCode).json(new _ApiResponse(statusCode, data, message));
  }
  static created(res, data, message = "Resource created successfully") {
    return res.status(201).json(new _ApiResponse(201, data, message));
  }
};

// backend/services/authService.js
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
init_Stakeholder();
init_constants();

// backend/models/AuditLog.js
var import_mongoose7 = __toESM(require("mongoose"), 1);
var auditLogSchema = new import_mongoose7.default.Schema(
  {
    user: {
      type: import_mongoose7.default.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    userRole: {
      type: String,
      index: true
    },
    userEmail: {
      type: String
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    entity: {
      type: String,
      required: true,
      index: true
    },
    entityId: {
      type: String,
      index: true
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    metadata: {
      type: import_mongoose7.default.Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ user: 1, timestamp: -1 });
var AuditLog = import_mongoose7.default.model("AuditLog", auditLogSchema);

// backend/services/auditService.js
async function logAuditEvent({
  user = null,
  userRole = null,
  userEmail = null,
  action,
  entity,
  entityId = null,
  ipAddress = null,
  userAgent = null,
  metadata = {}
}, session = null) {
  try {
    const sanitizedMetadata = { ...metadata };
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.token;
    delete sanitizedMetadata.secret;
    const logEntry = new AuditLog({
      user: user?._id || user,
      userRole: userRole || user?.role,
      userEmail: userEmail || user?.email,
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      ipAddress,
      userAgent,
      metadata: sanitizedMetadata,
      timestamp: /* @__PURE__ */ new Date()
    });
    await logEntry.save(session ? { session } : void 0);
    return logEntry;
  } catch (error) {
    console.error("[AUDIT LOG ERROR] Failed to record audit entry:", error.message);
    return null;
  }
}

// backend/services/authService.js
function generateToken(user) {
  return import_jsonwebtoken2.default.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email
    },
    ENV.JWT_SECRET,
    {
      expiresIn: ENV.JWT_EXPIRES_IN
    }
  );
}
async function loginUser({ email, password, ipAddress, userAgent }) {
  if (!email || !password) {
    throw ApiError.badRequest("Email and password are required");
  }
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
  if (!user) {
    await logAuditEvent({
      user: null,
      userRole: "ANONYMOUS",
      userEmail: email.toLowerCase().trim(),
      action: "LOGIN_FAILED",
      entity: "User",
      entityId: null,
      ipAddress,
      userAgent,
      metadata: { reason: "User not found" }
    });
    throw ApiError.unauthorized("Invalid email address or password.");
  }
  if (!user.isActive) {
    await logAuditEvent({
      user: user._id,
      userRole: user.role,
      userEmail: user.email,
      action: "LOGIN_FAILED",
      entity: "User",
      entityId: user._id,
      ipAddress,
      userAgent,
      metadata: { reason: "Account deactivated" }
    });
    throw ApiError.unauthorized("Your account is currently deactivated. Please contact DoCA Administrator.");
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await logAuditEvent({
      user: user._id,
      userRole: user.role,
      userEmail: user.email,
      action: "LOGIN_FAILED",
      entity: "User",
      entityId: user._id,
      ipAddress,
      userAgent,
      metadata: { reason: "Incorrect password" }
    });
    throw ApiError.unauthorized("Invalid email address or password.");
  }
  user.lastLogin = /* @__PURE__ */ new Date();
  await user.save({ validateBeforeSave: false });
  const token = generateToken(user);
  let stakeholder = null;
  if (user.role === USER_ROLES.BUSINESS_USER) {
    stakeholder = await Stakeholder.findOne({ user: user._id });
  }
  await logAuditEvent({
    user: user._id,
    userRole: user.role,
    userEmail: user.email,
    action: AUDIT_ACTIONS.USER_LOGIN,
    entity: "User",
    entityId: user._id,
    ipAddress,
    userAgent
  });
  return {
    token,
    role: user.role,
    expiresIn: ENV.JWT_EXPIRES_IN,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      designation: user.designation,
      jurisdiction: user.jurisdiction,
      organization: user.organization,
      isActive: user.isActive,
      lastLogin: user.lastLogin
    },
    stakeholder
  };
}
async function registerStakeholderUser({
  name,
  email,
  password,
  phone,
  businessName,
  tradeLicenseNumber,
  gstNumber,
  panNumber,
  businessType,
  registeredAddress,
  contactPerson,
  ipAddress,
  userAgent
}) {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw ApiError.conflict("An account with this email address already exists.");
  }
  const existingStakeholder = await Stakeholder.findOne({ tradeLicenseNumber });
  if (existingStakeholder) {
    throw ApiError.conflict("A stakeholder with this trade license number is already registered.");
  }
  const user = new User({
    name,
    email: email.toLowerCase(),
    password,
    phone,
    role: USER_ROLES.BUSINESS_USER,
    isActive: true
  });
  await user.save();
  const stakeholder = new Stakeholder({
    user: user._id,
    businessName,
    tradeLicenseNumber,
    gstNumber: gstNumber ? gstNumber.toUpperCase() : void 0,
    panNumber: panNumber ? panNumber.toUpperCase() : void 0,
    businessType: businessType || "RETAILER",
    registeredAddress: registeredAddress || {
      street: "Main Market Road",
      city: "District HQ",
      district: "Central",
      state: "Delhi",
      pincode: "110001"
    },
    contactPerson: contactPerson || {
      name,
      phone: phone || "N/A",
      email: email.toLowerCase()
    }
  });
  await stakeholder.save();
  const token = generateToken(user);
  await logAuditEvent({
    user: user._id,
    userRole: user.role,
    userEmail: user.email,
    action: AUDIT_ACTIONS.STAKEHOLDER_CREATED,
    entity: "Stakeholder",
    entityId: stakeholder._id,
    ipAddress,
    userAgent,
    metadata: { businessName, tradeLicenseNumber }
  });
  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    },
    stakeholder
  };
}
async function getCurrentUserProfile(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found.");
  }
  let stakeholder = null;
  if (user.role === USER_ROLES.BUSINESS_USER) {
    stakeholder = await Stakeholder.findOne({ user: user._id });
  }
  return {
    user,
    stakeholder
  };
}
async function updateUserProfile(userId, updateData) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found.");
  }
  const allowedFields = ["name", "phone"];
  for (const field of allowedFields) {
    if (updateData[field] !== void 0) {
      user[field] = updateData[field];
    }
  }
  await user.save();
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role
  };
}
async function logoutUser({ userId, userRole, userEmail, ipAddress, userAgent }) {
  await logAuditEvent({
    user: userId,
    userRole,
    userEmail,
    action: AUDIT_ACTIONS.USER_LOGOUT,
    entity: "User",
    entityId: userId,
    ipAddress,
    userAgent
  });
  return true;
}

// backend/controllers/authController.js
var login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.connection?.remoteAddress || req.headers["x-forwarded-for"];
  const userAgent = req.headers["user-agent"];
  const result = await loginUser({
    email,
    password,
    ipAddress,
    userAgent
  });
  return ApiResponse.success(res, result, "Authentication successful");
});
var registerStakeholder = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.connection?.remoteAddress || req.headers["x-forwarded-for"];
  const userAgent = req.headers["user-agent"];
  const result = await registerStakeholderUser({
    ...req.body,
    ipAddress,
    userAgent
  });
  return ApiResponse.created(res, result, "Stakeholder registered successfully");
});
var getMe = asyncHandler(async (req, res) => {
  const result = await getCurrentUserProfile(req.user._id);
  return ApiResponse.success(res, result, "Profile retrieved successfully");
});
var updateProfile = asyncHandler(async (req, res) => {
  const result = await updateUserProfile(req.user._id, req.body);
  return ApiResponse.success(res, result, "Profile updated successfully");
});
var logout = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.connection?.remoteAddress || req.headers["x-forwarded-for"];
  const userAgent = req.headers["user-agent"];
  await logoutUser({
    userId: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    ipAddress,
    userAgent
  });
  return ApiResponse.success(res, null, "Logged out successfully");
});

// backend/validators/authValidator.js
var import_zod = require("zod");
var loginSchema = import_zod.z.object({
  email: import_zod.z.string().email("Please provide a valid email address"),
  password: import_zod.z.string().min(6, "Password must be at least 6 characters")
});
var registerStakeholderSchema = import_zod.z.object({
  name: import_zod.z.string().min(2, "Contact person name must be at least 2 characters"),
  email: import_zod.z.string().email("Please provide a valid email address"),
  password: import_zod.z.string().min(8, "Password must be at least 8 characters long"),
  phone: import_zod.z.string().min(10, "Valid 10-digit mobile number is required"),
  businessName: import_zod.z.string().min(3, "Business or organization name is required"),
  tradeLicenseNumber: import_zod.z.string().min(3, "Valid trade license number is required"),
  gstNumber: import_zod.z.string().optional(),
  panNumber: import_zod.z.string().optional(),
  businessType: import_zod.z.enum([
    "MANUFACTURER",
    "DEALER",
    "REPAIRER",
    "PETROL_PUMP",
    "RETAILER",
    "INDUSTRIAL_WEIGHBRIDGE",
    "JEWELER",
    "OTHER"
  ]).optional(),
  registeredAddress: import_zod.z.object({
    street: import_zod.z.string().min(1, "Street address is required"),
    city: import_zod.z.string().min(1, "City is required"),
    district: import_zod.z.string().min(1, "District is required"),
    state: import_zod.z.string().min(1, "State is required"),
    pincode: import_zod.z.string().min(6, "Valid 6-digit pincode is required")
  }).optional()
});
var validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof import_zod.z.ZodError) {
      const issues = error.issues || [];
      const errorMessages = issues.map((err) => ({
        field: err.path.join("."),
        message: err.message
      }));
      return next(ApiError.badRequest("Validation error", errorMessages));
    }
    next(error);
  }
};

// backend/routes/authRoutes.js
var router = (0, import_express.Router)();
router.route("/login").post(authRateLimiter, validate(loginSchema), login).all((req, res, next) => next(ApiError.methodNotAllowed(`HTTP method ${req.method} is not allowed on /api/auth/login. Supported methods: POST.`)));
router.route("/register-stakeholder").post(authRateLimiter, validate(registerStakeholderSchema), registerStakeholder).all((req, res, next) => next(ApiError.methodNotAllowed(`HTTP method ${req.method} is not allowed on /api/auth/register-stakeholder. Supported methods: POST.`)));
router.route("/forgot-password").post(authRateLimiter, (req, res, next) => {
  return res.status(200).json({
    success: true,
    message: "If the provided email address exists in our verified records, a secure password reset link has been dispatched."
  });
}).all((req, res, next) => next(ApiError.methodNotAllowed(`HTTP method ${req.method} is not allowed on /api/auth/forgot-password. Supported methods: POST.`)));
router.route("/reset-password").post(authRateLimiter, (req, res, next) => {
  return next(ApiError.badRequest("Password reset token and new password are required."));
}).all((req, res, next) => next(ApiError.methodNotAllowed(`HTTP method ${req.method} is not allowed on /api/auth/reset-password. Supported methods: POST.`)));
router.route("/verify-otp").post(authRateLimiter, (req, res, next) => {
  return next(ApiError.badRequest("OTP verification code and identifier are required."));
}).all((req, res, next) => next(ApiError.methodNotAllowed(`HTTP method ${req.method} is not allowed on /api/auth/verify-otp. Supported methods: POST.`)));
router.get("/me", protect, getMe);
router.get("/profile", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/logout", protect, logout);
var authRoutes_default = router;

// backend/routes/userRoutes.js
var import_express2 = require("express");

// backend/controllers/userController.js
var import_mongoose8 = __toESM(require("mongoose"), 1);

// backend/utils/pagination.js
function getPaginationParams(query = {}, defaultLimit = 10, maxLimit = 100) {
  const rawPageVal = Array.isArray(query.page) ? query.page[query.page.length - 1] : query.page;
  const parsedPage = parseInt(rawPageVal, 10);
  const page = !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const rawLimitVal = Array.isArray(query.limit) ? query.limit[query.limit.length - 1] : query.limit;
  const parsedLimit = parseInt(rawLimitVal, 10);
  const rawLimit = !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : defaultLimit;
  const limit = Math.min(Math.max(1, rawLimit), maxLimit);
  const skip = (page - 1) * limit;
  let sortBy = "createdAt";
  if (typeof query.sortBy === "string" && /^[a-zA-Z0-9_]{1,40}$/.test(query.sortBy) && !["__proto__", "constructor", "prototype"].includes(query.sortBy)) {
    sortBy = query.sortBy;
  }
  const sortOrder = query.sortOrder === "asc" || query.sortOrder === "1" || query.sortOrder === 1 ? 1 : -1;
  const sort = { [sortBy]: sortOrder };
  return { page, limit, skip, sort };
}
function buildPaginationResponse(data, total, page, limit, customKey = null) {
  const totalPages = Math.ceil(total / limit) || 1;
  const result = {
    items: data,
    users: data,
    instruments: data,
    applications: data,
    schedules: data,
    certificates: data,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
  if (customKey) {
    result[customKey] = data;
  }
  return result;
}

// backend/controllers/userController.js
init_constants();
var getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationParams(req.query);
  const filter = {};
  if (req.query.role) {
    filter.role = req.query.role;
  }
  if (req.query.district) {
    filter["jurisdiction.district"] = new RegExp(escapeRegex(req.query.district), "i");
  }
  if (req.query.isActive !== void 0) {
    filter.isActive = req.query.isActive === "true";
  }
  if (req.query.search) {
    const safeSearch = escapeRegex(req.query.search);
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { email: { $regex: safeSearch, $options: "i" } },
      { phone: { $regex: safeSearch, $options: "i" } }
    ];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);
  return ApiResponse.success(
    res,
    buildPaginationResponse(users, total, page, limit),
    "Users retrieved successfully"
  );
});
var createUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, designation, jurisdiction, organization } = req.body;
  if (req.user.role !== USER_ROLES.SUPER_ADMIN && (role === USER_ROLES.SUPER_ADMIN || role === USER_ROLES.ADMIN)) {
    throw ApiError.forbidden("Only Super Administrators are permitted to provision Admin or Super Admin accounts.");
  }
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw ApiError.conflict(`A user with email '${normalizedEmail}' already exists.`);
  }
  const user = new User({
    name: name.trim(),
    email: normalizedEmail,
    password,
    phone: phone ? phone.trim() : void 0,
    role,
    designation,
    jurisdiction,
    organization,
    isActive: true
  });
  await user.save();
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.USER_CREATED,
    entity: "User",
    entityId: user._id,
    metadata: { createdRole: role, email: user.email }
  });
  return ApiResponse.created(res, user, "User created successfully");
});
var getUserById = asyncHandler(async (req, res) => {
  if (!import_mongoose8.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid user ID format.");
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return ApiResponse.success(res, user, "User retrieved successfully");
});
var updateUser = asyncHandler(async (req, res) => {
  if (!import_mongoose8.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid user ID format.");
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  if (user.role === USER_ROLES.SUPER_ADMIN && req.user.role !== USER_ROLES.SUPER_ADMIN) {
    throw ApiError.forbidden("Only Super Administrators can modify Super Administrator accounts.");
  }
  if (req.body.role && req.body.role !== user.role) {
    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
      throw ApiError.forbidden("Only Super Administrators are permitted to modify user roles.");
    }
    if (String(req.user._id) === String(user._id)) {
      throw ApiError.forbidden("Administrators cannot change their own administrative role.");
    }
    user.role = req.body.role;
  }
  if (req.body.email) {
    const normalizedEmail = req.body.email.toLowerCase().trim();
    if (normalizedEmail !== user.email) {
      const duplicate = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
      if (duplicate) {
        throw ApiError.conflict(`A user with email '${normalizedEmail}' already exists.`);
      }
      user.email = normalizedEmail;
    }
  }
  if (req.body.password) {
    if (req.user.role !== USER_ROLES.SUPER_ADMIN && String(req.user._id) !== String(user._id)) {
      throw ApiError.forbidden("Only Super Administrators or the user themselves can update passwords.");
    }
    user.password = req.body.password;
  }
  const allowedUpdates = ["name", "phone", "designation", "jurisdiction", "organization", "isActive"];
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== void 0) {
      user[field] = req.body[field];
    }
  });
  await user.save();
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.USER_UPDATED,
    entity: "User",
    entityId: user._id,
    metadata: { updatedFields: Object.keys(req.body) }
  });
  return ApiResponse.success(res, user, "User updated successfully");
});
var toggleUserStatus = asyncHandler(async (req, res) => {
  if (!import_mongoose8.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid user ID format.");
  }
  if (String(req.user._id) === String(req.params.id)) {
    throw ApiError.badRequest("Administrators cannot deactivate their own active account.");
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  if (user.role === USER_ROLES.SUPER_ADMIN && req.user.role !== USER_ROLES.SUPER_ADMIN) {
    throw ApiError.forbidden("Only Super Administrators can modify Super Administrator status.");
  }
  const targetStatus = req.body.isActive !== void 0 ? req.body.isActive : !user.isActive;
  if (!targetStatus && user.role === USER_ROLES.SUPER_ADMIN) {
    const activeSuperAdmins = await User.countDocuments({ role: USER_ROLES.SUPER_ADMIN, isActive: true });
    if (activeSuperAdmins <= 1) {
      throw ApiError.badRequest("Cannot deactivate the last active Super Administrator.");
    }
  }
  user.isActive = targetStatus;
  await user.save();
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.USER_STATUS_CHANGED,
    entity: "User",
    entityId: user._id,
    metadata: { isActive: user.isActive }
  });
  return ApiResponse.success(res, user, `User status updated to ${user.isActive ? "Active" : "Inactive"}`);
});
var deleteOrDeactivateUser = asyncHandler(async (req, res) => {
  if (!import_mongoose8.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid user ID format.");
  }
  if (String(req.user._id) === String(req.params.id)) {
    throw ApiError.badRequest("Administrators cannot deactivate their own active account.");
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  if (user.role === USER_ROLES.SUPER_ADMIN && req.user.role !== USER_ROLES.SUPER_ADMIN) {
    throw ApiError.forbidden("Only Super Administrators can deactivate another Super Administrator.");
  }
  if (user.role === USER_ROLES.SUPER_ADMIN) {
    const activeSuperAdmins = await User.countDocuments({ role: USER_ROLES.SUPER_ADMIN, isActive: true });
    if (activeSuperAdmins <= 1) {
      throw ApiError.badRequest("Cannot deactivate the last active Super Administrator.");
    }
  }
  user.isActive = false;
  await user.save();
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.USER_STATUS_CHANGED,
    entity: "User",
    entityId: user._id,
    metadata: { action: "DEACTIVATED_VIA_DELETE_ENDPOINT" }
  });
  return ApiResponse.success(res, user, "User account deactivated successfully");
});
var getActiveOfficers = asyncHandler(async (req, res) => {
  const officers = await User.find({
    role: {
      $in: [
        USER_ROLES.LEGAL_METROLOGY_OFFICER,
        USER_ROLES.FIELD_VERIFICATION_OFFICER,
        USER_ROLES.GATC_OFFICER
      ]
    },
    isActive: true
  }).select("name email phone role designation jurisdiction");
  return ApiResponse.success(res, officers, "Active officers list retrieved");
});

// backend/middleware/roleMiddleware.js
var authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required before role verification."));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Allowed roles: [${roles.join(", ")}]`
        )
      );
    }
    next();
  };
};

// backend/validators/userValidator.js
var import_zod2 = require("zod");
init_constants();
var createUserSchema = import_zod2.z.object({
  name: import_zod2.z.string().min(2, "Name must be at least 2 characters"),
  email: import_zod2.z.string().email("Please enter a valid email address").transform((e) => e.toLowerCase().trim()),
  password: import_zod2.z.string().min(8, "Password must be at least 8 characters long"),
  phone: import_zod2.z.string().min(10, "Mobile phone number must be at least 10 digits"),
  role: import_zod2.z.enum(USER_ROLE_LIST, {
    errorMap: () => ({ message: "Invalid role specified" })
  }),
  designation: import_zod2.z.string().optional(),
  jurisdiction: import_zod2.z.object({
    state: import_zod2.z.string().min(1, "State is required"),
    district: import_zod2.z.string().min(1, "District is required"),
    zone: import_zod2.z.string().optional()
  }).optional(),
  organization: import_zod2.z.string().optional()
});
var updateUserSchema = import_zod2.z.object({
  name: import_zod2.z.string().min(2, "Name must be at least 2 characters").optional(),
  email: import_zod2.z.string().email("Please enter a valid email address").transform((e) => e.toLowerCase().trim()).optional(),
  password: import_zod2.z.string().min(8, "Password must be at least 8 characters long").optional(),
  phone: import_zod2.z.string().min(10, "Mobile phone number must be at least 10 digits").optional(),
  role: import_zod2.z.enum(USER_ROLE_LIST).optional(),
  designation: import_zod2.z.string().optional(),
  jurisdiction: import_zod2.z.object({
    state: import_zod2.z.string().optional(),
    district: import_zod2.z.string().optional(),
    zone: import_zod2.z.string().optional()
  }).optional(),
  organization: import_zod2.z.string().optional(),
  isActive: import_zod2.z.boolean().optional()
});

// backend/routes/userRoutes.js
init_constants();
var router2 = (0, import_express2.Router)();
router2.use(protect);
router2.get(
  "/officers/list",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  getActiveOfficers
);
router2.get(
  "/",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  getUsers
);
router2.post(
  "/",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(createUserSchema),
  createUser
);
router2.get(
  "/:id",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  getUserById
);
router2.put(
  "/:id",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(updateUserSchema),
  updateUser
);
router2.patch(
  "/:id",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(updateUserSchema),
  updateUser
);
router2.patch(
  "/:id/status",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  toggleUserStatus
);
router2.delete(
  "/:id",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  deleteOrDeactivateUser
);
var userRoutes_default = router2;

// backend/routes/stakeholderRoutes.js
var import_express3 = require("express");

// backend/controllers/stakeholderController.js
var import_mongoose9 = __toESM(require("mongoose"), 1);
init_Stakeholder();
init_constants();
var getStakeholders = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationParams(req.query);
  const filter = {};
  if (req.query.kycStatus) {
    filter.kycStatus = req.query.kycStatus;
  }
  if (req.query.district) {
    filter["registeredAddress.district"] = new RegExp(escapeRegex(req.query.district), "i");
  }
  if (req.query.businessType) {
    filter.businessType = req.query.businessType;
  }
  if (req.query.search) {
    const safeSearch = escapeRegex(req.query.search);
    filter.$or = [
      { businessName: { $regex: safeSearch, $options: "i" } },
      { tradeLicenseNumber: { $regex: safeSearch, $options: "i" } },
      { gstNumber: { $regex: safeSearch, $options: "i" } }
    ];
  }
  const [stakeholders, total] = await Promise.all([
    Stakeholder.find(filter).populate("user", "name email phone role isActive").sort(sort).skip(skip).limit(limit),
    Stakeholder.countDocuments(filter)
  ]);
  return ApiResponse.success(
    res,
    buildPaginationResponse(stakeholders, total, page, limit),
    "Stakeholders retrieved successfully"
  );
});
var getMyStakeholderProfile = asyncHandler(async (req, res) => {
  const stakeholder = await Stakeholder.findOne({ user: req.user._id }).populate(
    "user",
    "name email phone role isActive"
  );
  if (!stakeholder) {
    throw ApiError.notFound("Stakeholder profile not found for authenticated user");
  }
  return ApiResponse.success(res, stakeholder, "Stakeholder profile retrieved successfully");
});
var getStakeholderById = asyncHandler(async (req, res) => {
  if (!import_mongoose9.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid stakeholder ID format");
  }
  const stakeholder = await Stakeholder.findById(req.params.id).populate(
    "user",
    "name email phone role isActive"
  );
  if (!stakeholder) {
    throw ApiError.notFound("Stakeholder not found");
  }
  return ApiResponse.success(res, stakeholder, "Stakeholder details retrieved successfully");
});
var updateStakeholderProfile = asyncHandler(async (req, res) => {
  if (req.body.role !== void 0 || req.body.user !== void 0) {
    throw ApiError.badRequest("Modifying user role or user account association is strictly forbidden.");
  }
  let stakeholder = null;
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    if (req.body.kycStatus !== void 0 || req.body.kycRemarks !== void 0) {
      throw ApiError.forbidden("Stakeholders are not permitted to alter their own KYC verification status.");
    }
    stakeholder = await Stakeholder.findOne({ user: req.user._id });
  } else {
    if (!req.params.id || !import_mongoose9.default.Types.ObjectId.isValid(req.params.id)) {
      throw ApiError.badRequest("Invalid stakeholder ID format");
    }
    stakeholder = await Stakeholder.findById(req.params.id);
  }
  if (!stakeholder) {
    throw ApiError.notFound("Stakeholder profile not found");
  }
  if (req.body.tradeLicenseNumber && req.body.tradeLicenseNumber !== stakeholder.tradeLicenseNumber) {
    const existing = await Stakeholder.findOne({
      tradeLicenseNumber: req.body.tradeLicenseNumber.trim(),
      _id: { $ne: stakeholder._id }
    });
    if (existing) {
      throw ApiError.conflict(
        `Trade license number '${req.body.tradeLicenseNumber}' is already registered with another business.`
      );
    }
    stakeholder.tradeLicenseNumber = req.body.tradeLicenseNumber.trim();
  }
  if (req.body.businessName) {
    stakeholder.businessName = req.body.businessName.trim();
  }
  if (req.body.businessType) {
    stakeholder.businessType = req.body.businessType;
  }
  if (req.body.gstNumber !== void 0) {
    stakeholder.gstNumber = req.body.gstNumber ? req.body.gstNumber.trim().toUpperCase() : void 0;
  }
  if (req.body.panNumber !== void 0) {
    stakeholder.panNumber = req.body.panNumber ? req.body.panNumber.trim().toUpperCase() : void 0;
  }
  if (req.body.registeredAddress) {
    stakeholder.registeredAddress = {
      ...stakeholder.registeredAddress?.toObject?.() || stakeholder.registeredAddress || {},
      ...req.body.registeredAddress
    };
  }
  if (req.body.contactPerson) {
    stakeholder.contactPerson = {
      ...stakeholder.contactPerson?.toObject?.() || stakeholder.contactPerson || {},
      ...req.body.contactPerson
    };
  }
  await stakeholder.save();
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.STAKEHOLDER_UPDATED,
    entity: "Stakeholder",
    entityId: stakeholder._id,
    metadata: {
      businessName: stakeholder.businessName,
      tradeLicenseNumber: stakeholder.tradeLicenseNumber
    }
  });
  const updatedProfile = await Stakeholder.findById(stakeholder._id).populate(
    "user",
    "name email phone role isActive"
  );
  return ApiResponse.success(res, updatedProfile, "Stakeholder profile updated successfully");
});
var updateKycStatus = asyncHandler(async (req, res) => {
  if (!import_mongoose9.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid stakeholder ID format");
  }
  const { kycStatus, kycRemarks } = req.body;
  if (!["VERIFIED", "REJECTED", "PENDING"].includes(kycStatus)) {
    throw ApiError.badRequest("Invalid KYC status. Must be PENDING, VERIFIED, or REJECTED");
  }
  const stakeholder = await Stakeholder.findById(req.params.id);
  if (!stakeholder) {
    throw ApiError.notFound("Stakeholder not found");
  }
  stakeholder.kycStatus = kycStatus;
  if (kycRemarks !== void 0) {
    stakeholder.kycRemarks = kycRemarks;
  }
  await stakeholder.save();
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.STAKEHOLDER_UPDATED,
    entity: "Stakeholder",
    entityId: stakeholder._id,
    metadata: { kycStatus, kycRemarks }
  });
  return ApiResponse.success(res, stakeholder, `Stakeholder KYC status updated to ${kycStatus}`);
});
var uploadKycDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest("No document file was uploaded");
  }
  const stakeholder = await Stakeholder.findOne({ user: req.user._id });
  if (!stakeholder) {
    cleanupFile(req.file.path);
    throw ApiError.notFound("Stakeholder profile not found for authenticated user");
  }
  await validateUploadedFile(req.file);
  const safeOriginalName = sanitizeFileName(req.file.originalname);
  const docRecord = {
    docType: req.body.docType || "TRADE_LICENSE",
    fileUrl: `/uploads/documents/${req.file.filename}`,
    fileName: safeOriginalName,
    verified: false,
    uploadedAt: /* @__PURE__ */ new Date()
  };
  stakeholder.kycDocuments.push(docRecord);
  await stakeholder.save();
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.DOCUMENT_UPLOADED,
    entity: "Stakeholder",
    entityId: stakeholder._id,
    metadata: {
      docType: docRecord.docType,
      fileName: docRecord.fileName,
      fileUrl: docRecord.fileUrl
    }
  });
  return ApiResponse.created(res, stakeholder, "KYC document uploaded successfully");
});

// backend/middleware/uploadMiddleware.js
var import_multer = __toESM(require("multer"), 1);
var import_path4 = __toESM(require("path"), 1);
var import_fs3 = __toESM(require("fs"), 1);
var import_crypto2 = __toESM(require("crypto"), 1);
var storage = import_multer.default.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = "documents";
    const field = String(file.fieldname || "").toLowerCase();
    if (field.includes("photo") || field.includes("evidence")) {
      subfolder = "instrument-photos";
    } else if (field.includes("cert")) {
      subfolder = "certificates";
    }
    const baseDir = import_path4.default.resolve(ENV.UPLOAD_DIR);
    const destPath = import_path4.default.resolve(baseDir, subfolder);
    if (!destPath.startsWith(baseDir)) {
      return cb(ApiError.badRequest("Security violation: Invalid upload destination directory."));
    }
    if (!import_fs3.default.existsSync(destPath)) {
      import_fs3.default.mkdirSync(destPath, { recursive: true });
    }
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    if (file.originalname && /[\0\r\n\t]/.test(file.originalname)) {
      return cb(
        ApiError.badRequest("Security violation: Malicious characters or null bytes in filename.")
      );
    }
    const uniqueSuffix = `${Date.now()}-${import_crypto2.default.randomBytes(12).toString("hex")}`;
    const cleanFieldname = String(file.fieldname || "file").replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 30) || "file";
    let rawExt = import_path4.default.extname(String(file.originalname || "")).toLowerCase();
    let safeExt = ".bin";
    if (ALLOWED_EXTENSIONS.includes(rawExt)) {
      safeExt = rawExt;
    } else {
      const mimeMap = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "application/pdf": ".pdf"
      };
      safeExt = mimeMap[file.mimetype] || ".bin";
    }
    cb(null, `${cleanFieldname}-${uniqueSuffix}${safeExt}`);
  }
});
var fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      ApiError.badRequest(
        `Invalid file type '${file.mimetype}'. Only JPEG, PNG, WEBP images and PDF documents are permitted.`
      ),
      false
    );
  }
  const lowerName = String(file.originalname || "").toLowerCase();
  if (/[\0\r\n\t]|\.\.|\/|\\|%2e|%2f|%5c/i.test(lowerName)) {
    return cb(
      ApiError.badRequest("Security violation: Malicious characters or path traversal in filename."),
      false
    );
  }
  for (const dangerous of DANGEROUS_EXTENSIONS) {
    if (lowerName.endsWith(dangerous) || lowerName.includes(dangerous + ".")) {
      return cb(
        ApiError.badRequest(
          `Security violation: Disallowed or dangerous file extension '${dangerous}' detected.`
        ),
        false
      );
    }
  }
  cb(null, true);
};
var upload = (0, import_multer.default)({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5 MB maximum file size
  },
  fileFilter,
  preservePath: true
});

// backend/validators/stakeholderValidator.js
var import_zod3 = require("zod");
var updateStakeholderSchema = import_zod3.z.object({
  businessName: import_zod3.z.string().min(2, "Business name must be at least 2 characters").optional(),
  tradeLicenseNumber: import_zod3.z.string().min(2, "Trade license number is required").optional(),
  gstNumber: import_zod3.z.string().max(20, "GST number must not exceed 20 characters").optional().or(import_zod3.z.literal("")),
  panNumber: import_zod3.z.string().max(15, "PAN number must not exceed 15 characters").optional().or(import_zod3.z.literal("")),
  businessType: import_zod3.z.enum([
    "MANUFACTURER",
    "DEALER",
    "REPAIRER",
    "PETROL_PUMP",
    "RETAILER",
    "INDUSTRIAL_WEIGHBRIDGE",
    "JEWELER",
    "OTHER"
  ], {
    errorMap: () => ({ message: "Invalid business type" })
  }).optional(),
  registeredAddress: import_zod3.z.object({
    street: import_zod3.z.string().min(1, "Street is required").optional(),
    city: import_zod3.z.string().min(1, "City is required").optional(),
    district: import_zod3.z.string().min(1, "District is required").optional(),
    state: import_zod3.z.string().min(1, "State is required").optional(),
    pincode: import_zod3.z.string().min(6, "Pincode must be at least 6 characters").optional()
  }).optional(),
  contactPerson: import_zod3.z.object({
    name: import_zod3.z.string().min(2, "Contact person name must be at least 2 characters").optional(),
    designation: import_zod3.z.string().optional(),
    phone: import_zod3.z.string().min(10, "Valid 10-digit phone number is required").optional(),
    email: import_zod3.z.string().email("Valid email address is required").optional()
  }).optional()
}).passthrough();
var updateKycStatusSchema = import_zod3.z.object({
  kycStatus: import_zod3.z.enum(["PENDING", "VERIFIED", "REJECTED"], {
    errorMap: () => ({ message: "Invalid KYC status. Must be PENDING, VERIFIED, or REJECTED" })
  }),
  kycRemarks: import_zod3.z.string().optional()
});

// backend/routes/stakeholderRoutes.js
init_constants();
var router3 = (0, import_express3.Router)();
router3.use(protect);
router3.get(
  "/me",
  authorize(USER_ROLES.BUSINESS_USER),
  getMyStakeholderProfile
);
router3.put(
  "/me",
  authorize(USER_ROLES.BUSINESS_USER),
  validate(updateStakeholderSchema),
  updateStakeholderProfile
);
router3.patch(
  "/me",
  authorize(USER_ROLES.BUSINESS_USER),
  validate(updateStakeholderSchema),
  updateStakeholderProfile
);
router3.post(
  "/me/upload-kyc",
  authorize(USER_ROLES.BUSINESS_USER),
  upload.single("document"),
  uploadKycDocument
);
router3.get(
  "/",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  getStakeholders
);
router3.get(
  "/:id",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  getStakeholderById
);
router3.put(
  "/:id",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(updateStakeholderSchema),
  updateStakeholderProfile
);
router3.patch(
  "/:id",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(updateStakeholderSchema),
  updateStakeholderProfile
);
router3.patch(
  "/:id/kyc-status",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(updateKycStatusSchema),
  updateKycStatus
);
var stakeholderRoutes_default = router3;

// backend/routes/instrumentRoutes.js
var import_express4 = require("express");

// backend/controllers/instrumentController.js
var import_mongoose10 = __toESM(require("mongoose"), 1);
init_Instrument();
init_Stakeholder();
init_VerificationApplication();
init_Certificate();
init_constants();
var getInstruments = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationParams(req.query);
  const filter = {};
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder) {
      return ApiResponse.success(
        res,
        buildPaginationResponse([], 0, page, limit),
        "No instruments found"
      );
    }
    filter.stakeholder = stakeholder._id;
  } else if (req.query.stakeholderId) {
    if (!import_mongoose10.default.Types.ObjectId.isValid(req.query.stakeholderId)) {
      throw ApiError.badRequest("Invalid stakeholderId parameter format");
    }
    filter.stakeholder = req.query.stakeholderId;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.category && req.query.category !== "undefined") {
    let cat = req.query.category;
    if (cat === "NON_AUTOMATIC_WEIGHING_INSTRUMENTS") {
      cat = "NON_AUTOMATIC_WEIGHING_INSTRUMENT";
    }
    filter.category = cat;
  }
  if (req.query.accuracyClass) {
    filter.accuracyClass = req.query.accuracyClass;
  }
  if (req.query.manufacturer) {
    filter.manufacturer = new RegExp(escapeRegex(req.query.manufacturer), "i");
  }
  if (req.query.instrumentType) {
    filter.instrumentType = new RegExp(escapeRegex(req.query.instrumentType), "i");
  }
  if (req.query.district) {
    filter["installationAddress.district"] = new RegExp(escapeRegex(req.query.district), "i");
  }
  if (req.query.state) {
    filter["installationAddress.state"] = new RegExp(escapeRegex(req.query.state), "i");
  }
  if (req.query.isActive !== void 0) {
    filter.isActive = req.query.isActive === "true";
  }
  if (req.query.search) {
    const safeSearch = escapeRegex(req.query.search);
    filter.$or = [
      { instrumentId: { $regex: safeSearch, $options: "i" } },
      { serialNumber: { $regex: safeSearch, $options: "i" } },
      { manufacturer: { $regex: safeSearch, $options: "i" } },
      { modelNumber: { $regex: safeSearch, $options: "i" } },
      { instrumentType: { $regex: safeSearch, $options: "i" } }
    ];
  }
  const [instruments, total] = await Promise.all([
    Instrument.find(filter).populate("stakeholder", "businessName tradeLicenseNumber registeredAddress").sort(sort).skip(skip).limit(limit),
    Instrument.countDocuments(filter)
  ]);
  return ApiResponse.success(
    res,
    buildPaginationResponse(instruments, total, page, limit),
    "Instruments retrieved successfully"
  );
});
var createInstrument = asyncHandler(async (req, res) => {
  let stakeholderId = null;
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder) {
      throw ApiError.badRequest("Please complete your stakeholder business profile before registering instruments.");
    }
    stakeholderId = stakeholder._id;
  } else {
    stakeholderId = req.body.stakeholderId || req.body.stakeholder;
    if (!stakeholderId || !import_mongoose10.default.Types.ObjectId.isValid(stakeholderId)) {
      throw ApiError.badRequest("Valid stakeholder association (stakeholderId) is required.");
    }
    const stakeholderExists = await Stakeholder.findById(stakeholderId);
    if (!stakeholderExists) {
      throw ApiError.notFound("Associated stakeholder business profile not found");
    }
  }
  const existingInstrument = await Instrument.findOne({
    manufacturer: new RegExp(`^${escapeRegex(req.body.manufacturer.trim())}$`, "i"),
    serialNumber: req.body.serialNumber.trim()
  });
  if (existingInstrument) {
    throw ApiError.conflict(
      `An instrument with serial number '${req.body.serialNumber}' from manufacturer '${req.body.manufacturer}' is already registered.`
    );
  }
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  let instrumentId = req.body.instrumentId;
  if (instrumentId) {
    const existingWithId = await Instrument.findOne({ instrumentId });
    if (existingWithId) {
      throw ApiError.conflict(`An instrument with ID '${instrumentId}' is already registered.`);
    }
  } else {
    let isUnique = false;
    while (!isUnique) {
      const count = await Instrument.countDocuments();
      const randSuffix = Math.floor(1e5 + Math.random() * 9e5);
      instrumentId = `INS-${year}-${randSuffix}`;
      const found = await Instrument.findOne({ instrumentId });
      if (!found) isUnique = true;
    }
  }
  const verificationFrequencyMonths = req.body.verificationFrequencyMonths || 12;
  const nextVerificationDueDate = req.body.nextVerificationDueDate ? new Date(req.body.nextVerificationDueDate) : new Date(Date.now() + verificationFrequencyMonths * 30 * 24 * 60 * 60 * 1e3);
  const instrument = new Instrument({
    ...req.body,
    instrumentId,
    stakeholder: stakeholderId,
    manufacturer: req.body.manufacturer.trim(),
    serialNumber: req.body.serialNumber.trim(),
    status: INSTRUMENT_STATUSES.PENDING_VERIFICATION,
    verificationFrequencyMonths,
    nextVerificationDueDate,
    createdBy: req.user._id,
    isActive: true
  });
  await instrument.save();
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.INSTRUMENT_REGISTERED,
    entity: "Instrument",
    entityId: instrument._id,
    metadata: {
      instrumentId,
      serialNumber: instrument.serialNumber,
      manufacturer: instrument.manufacturer,
      stakeholder: stakeholderId
    }
  });
  const populatedInstrument = await Instrument.findById(instrument._id).populate(
    "stakeholder",
    "businessName tradeLicenseNumber registeredAddress"
  );
  return ApiResponse.created(res, populatedInstrument, "Instrument registered successfully");
});
var getInstrumentById = asyncHandler(async (req, res) => {
  if (!import_mongoose10.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid instrument ID format");
  }
  const instrument = await Instrument.findById(req.params.id).populate("stakeholder", "businessName tradeLicenseNumber registeredAddress contactPerson kycStatus").populate("createdBy", "name email role");
  if (!instrument) {
    throw ApiError.notFound("Instrument not found");
  }
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(instrument.stakeholder._id || instrument.stakeholder) !== String(stakeholder._id)) {
      throw ApiError.forbidden("You are not authorized to view this instrument.");
    }
  }
  return ApiResponse.success(res, instrument, "Instrument retrieved successfully");
});
var updateInstrument = asyncHandler(async (req, res) => {
  if (!import_mongoose10.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid instrument ID format");
  }
  const instrument = await Instrument.findById(req.params.id);
  if (!instrument) {
    throw ApiError.notFound("Instrument not found");
  }
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(instrument.stakeholder) !== String(stakeholder._id)) {
      throw ApiError.forbidden("You can only update your own registered instruments.");
    }
    const protectedFields = [
      "status",
      "lastVerificationDate",
      "nextVerificationDueDate",
      "instrumentId",
      "stakeholder",
      "stakeholderId",
      "verificationResult",
      "certificateInformation",
      "role",
      "permissions",
      "isAdmin",
      "isSuperAdmin",
      "verificationStatus",
      "certificateStatus",
      "ownership",
      "officerId",
      "jurisdiction"
    ];
    for (const field of protectedFields) {
      if (req.body[field] !== void 0) {
        throw ApiError.forbidden(`Modifying official verification field '${field}' by business users is strictly prohibited.`);
      }
    }
  } else if (req.user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER || req.user.role === USER_ROLES.GATC_OFFICER) {
    throw ApiError.forbidden("Field and testing officers cannot modify general instrument registration directly.");
  }
  const newManufacturer = req.body.manufacturer ? req.body.manufacturer.trim() : instrument.manufacturer;
  const newSerialNumber = req.body.serialNumber ? req.body.serialNumber.trim() : instrument.serialNumber;
  if (newManufacturer !== instrument.manufacturer || newSerialNumber !== instrument.serialNumber) {
    const existing = await Instrument.findOne({
      manufacturer: new RegExp(`^${escapeRegex(newManufacturer)}$`, "i"),
      serialNumber: newSerialNumber,
      _id: { $ne: instrument._id }
    });
    if (existing) {
      throw ApiError.conflict(
        `An instrument with serial number '${newSerialNumber}' from manufacturer '${newManufacturer}' is already registered.`
      );
    }
    instrument.manufacturer = newManufacturer;
    instrument.serialNumber = newSerialNumber;
  }
  const allowedFields = [
    "instrumentType",
    "category",
    "modelNumber",
    "capacity",
    "accuracyClass",
    "verificationScaleInterval_e",
    "minimumCapacity_Min",
    "dateOfManufacture",
    "verificationFrequencyMonths",
    "remarks"
  ];
  allowedFields.forEach((field) => {
    if (req.body[field] !== void 0) {
      instrument[field] = req.body[field];
    }
  });
  if (req.body.installationAddress) {
    instrument.installationAddress = {
      ...instrument.installationAddress?.toObject?.() || instrument.installationAddress || {},
      ...req.body.installationAddress
    };
  }
  if (req.user.role === USER_ROLES.SUPER_ADMIN || req.user.role === USER_ROLES.ADMIN) {
    if (req.body.status) instrument.status = req.body.status;
    if (req.body.lastVerificationDate) instrument.lastVerificationDate = req.body.lastVerificationDate;
    if (req.body.nextVerificationDueDate) instrument.nextVerificationDueDate = req.body.nextVerificationDueDate;
    if (req.body.isActive !== void 0) instrument.isActive = req.body.isActive;
  }
  instrument.updatedBy = req.user._id;
  await instrument.save();
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.INSTRUMENT_UPDATED,
    entity: "Instrument",
    entityId: instrument._id,
    metadata: {
      instrumentId: instrument.instrumentId,
      serialNumber: instrument.serialNumber
    }
  });
  const updated = await Instrument.findById(instrument._id).populate(
    "stakeholder",
    "businessName tradeLicenseNumber registeredAddress"
  );
  return ApiResponse.success(res, updated, "Instrument updated successfully");
});
var deleteInstrument = asyncHandler(async (req, res) => {
  if (!import_mongoose10.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid instrument ID format");
  }
  const instrument = await Instrument.findById(req.params.id);
  if (!instrument) {
    throw ApiError.notFound("Instrument not found");
  }
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(instrument.stakeholder) !== String(stakeholder._id)) {
      throw ApiError.forbidden("You are not authorized to delete or deactivate this instrument.");
    }
  } else if (req.user.role !== USER_ROLES.SUPER_ADMIN && req.user.role !== USER_ROLES.ADMIN) {
    throw ApiError.forbidden("You are not authorized to delete or deactivate instruments.");
  }
  const [appCount, certCount] = await Promise.all([
    VerificationApplication.countDocuments({ instrument: instrument._id }),
    Certificate.countDocuments({ instrument: instrument._id })
  ]);
  if (appCount > 0 || certCount > 0) {
    instrument.isActive = false;
    instrument.status = INSTRUMENT_STATUSES.OUT_OF_SERVICE;
    instrument.updatedBy = req.user._id;
    await instrument.save();
    await logAuditEvent({
      user: req.user._id,
      userRole: req.user.role,
      userEmail: req.user.email,
      action: AUDIT_ACTIONS.INSTRUMENT_UPDATED,
      entity: "Instrument",
      entityId: instrument._id,
      metadata: {
        action: "DEACTIVATED_HISTORICAL_PRESERVED",
        appCount,
        certCount,
        instrumentId: instrument.instrumentId
      }
    });
    return ApiResponse.success(
      res,
      {
        deactivated: true,
        instrumentId: instrument.instrumentId,
        status: instrument.status,
        isActive: instrument.isActive
      },
      "Instrument has existing statutory verification records. It has been safely deactivated and marked OUT_OF_SERVICE to preserve audit history."
    );
  }
  await Instrument.findByIdAndDelete(instrument._id);
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: "INSTRUMENT_DELETED",
    entity: "Instrument",
    entityId: instrument._id,
    metadata: { instrumentId: instrument.instrumentId }
  });
  return ApiResponse.success(
    res,
    { deleted: true, id: instrument._id, instrumentId: instrument.instrumentId },
    "Instrument deleted successfully"
  );
});
var uploadInstrumentPhoto = asyncHandler(async (req, res) => {
  if (!import_mongoose10.default.Types.ObjectId.isValid(req.params.id)) {
    if (req.file) cleanupFile(req.file.path);
    throw ApiError.badRequest("Invalid instrument ID format");
  }
  if (!req.file) {
    throw ApiError.badRequest("No photograph was uploaded.");
  }
  const instrument = await Instrument.findById(req.params.id);
  if (!instrument) {
    cleanupFile(req.file.path);
    throw ApiError.notFound("Instrument not found");
  }
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(instrument.stakeholder) !== String(stakeholder._id)) {
      cleanupFile(req.file.path);
      throw ApiError.forbidden("You can only upload photographs for your own instruments.");
    }
  } else if (req.user.role !== USER_ROLES.SUPER_ADMIN && req.user.role !== USER_ROLES.ADMIN) {
    cleanupFile(req.file.path);
    throw ApiError.forbidden("You are not authorized to upload photographs for instruments.");
  }
  await validateUploadedFile(req.file);
  const safeOriginalName = sanitizeFileName(req.file.originalname);
  const photoRecord = {
    caption: sanitizeFileName(req.body.caption || "Instrument On-Site Photograph"),
    fileName: safeOriginalName,
    fileUrl: `/uploads/instrument-photos/${req.file.filename}`,
    uploadedAt: /* @__PURE__ */ new Date()
  };
  instrument.photographs.push(photoRecord);
  instrument.updatedBy = req.user._id;
  await instrument.save();
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.DOCUMENT_UPLOADED,
    entity: "Instrument",
    entityId: instrument._id,
    metadata: {
      type: "PHOTO",
      fileName: photoRecord.fileName,
      fileUrl: photoRecord.fileUrl
    }
  });
  return ApiResponse.created(res, instrument, "Instrument photograph uploaded successfully");
});
var uploadInstrumentDocument = asyncHandler(async (req, res) => {
  if (!import_mongoose10.default.Types.ObjectId.isValid(req.params.id)) {
    if (req.file) cleanupFile(req.file.path);
    throw ApiError.badRequest("Invalid instrument ID format");
  }
  if (!req.file) {
    throw ApiError.badRequest("No document was uploaded.");
  }
  const instrument = await Instrument.findById(req.params.id);
  if (!instrument) {
    cleanupFile(req.file.path);
    throw ApiError.notFound("Instrument not found");
  }
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(instrument.stakeholder) !== String(stakeholder._id)) {
      cleanupFile(req.file.path);
      throw ApiError.forbidden("You can only upload documents for your own instruments.");
    }
  } else if (req.user.role !== USER_ROLES.SUPER_ADMIN && req.user.role !== USER_ROLES.ADMIN && req.user.role !== USER_ROLES.LEGAL_METROLOGY_OFFICER) {
    cleanupFile(req.file.path);
    throw ApiError.forbidden("You are not authorized to upload documents for instruments.");
  }
  await validateUploadedFile(req.file);
  const allowedDocTypes = [
    "OWNERSHIP_PROOF",
    "PREVIOUS_VERIFICATION_CERTIFICATE",
    "INVOICE",
    "MANUFACTURER_TEST_CERTIFICATE",
    "SUPPORTING_DOCUMENT"
  ];
  const docType = allowedDocTypes.includes(req.body.docType) ? req.body.docType : "SUPPORTING_DOCUMENT";
  const safeOriginalName = sanitizeFileName(req.file.originalname);
  const docRecord = {
    title: sanitizeFileName(req.body.title || "Supporting Instrument Document"),
    docType,
    fileName: safeOriginalName,
    fileUrl: `/uploads/documents/${req.file.filename}`,
    uploadedAt: /* @__PURE__ */ new Date()
  };
  instrument.documents.push(docRecord);
  instrument.updatedBy = req.user._id;
  await instrument.save();
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.DOCUMENT_UPLOADED,
    entity: "Instrument",
    entityId: instrument._id,
    metadata: {
      docType: docRecord.docType,
      fileName: docRecord.fileName,
      fileUrl: docRecord.fileUrl
    }
  });
  return ApiResponse.created(res, instrument, "Instrument document uploaded successfully");
});
var getExpiringInstrumentsSummary = asyncHandler(async (req, res) => {
  const now = /* @__PURE__ */ new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1e3);
  const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1e3);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3);
  const baseFilter = { isActive: true };
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (stakeholder) {
      baseFilter.stakeholder = stakeholder._id;
    } else {
      return ApiResponse.success(res, {
        expired: 0,
        expiringWithin7Days: 0,
        expiringWithin15Days: 0,
        expiringWithin30Days: 0
      });
    }
  }
  const [expiredCount, expiring7Count, expiring15Count, expiring30Count] = await Promise.all([
    Instrument.countDocuments({ ...baseFilter, nextVerificationDueDate: { $lt: now } }),
    Instrument.countDocuments({ ...baseFilter, nextVerificationDueDate: { $gte: now, $lte: in7Days } }),
    Instrument.countDocuments({ ...baseFilter, nextVerificationDueDate: { $gte: now, $lte: in15Days } }),
    Instrument.countDocuments({ ...baseFilter, nextVerificationDueDate: { $gte: now, $lte: in30Days } })
  ]);
  return ApiResponse.success(
    res,
    {
      expired: expiredCount,
      expiringWithin7Days: expiring7Count,
      expiringWithin15Days: expiring15Count,
      expiringWithin30Days: expiring30Count
    },
    "Expiry summary calculated dynamically from database"
  );
});

// backend/validators/instrumentValidator.js
var import_zod4 = require("zod");
init_constants();
var createInstrumentSchema = import_zod4.z.object({
  category: import_zod4.z.enum(INSTRUMENT_CATEGORY_LIST, {
    errorMap: () => ({ message: "Invalid instrument category" })
  }),
  instrumentType: import_zod4.z.string().min(2, "Instrument type/model specification is required"),
  manufacturer: import_zod4.z.string().min(2, "Manufacturer name is required"),
  modelNumber: import_zod4.z.string().min(1, "Model number is required"),
  serialNumber: import_zod4.z.string().min(1, "Serial number is required"),
  capacity: import_zod4.z.object({
    value: import_zod4.z.number().positive("Capacity value must be greater than 0"),
    unit: import_zod4.z.string().min(1, "Capacity unit is required (e.g., kg, tonnes, g)")
  }),
  accuracyClass: import_zod4.z.enum(ACCURACY_CLASS_LIST, {
    errorMap: () => ({ message: "Invalid accuracy class" })
  }),
  verificationScaleInterval_e: import_zod4.z.string().min(1, "Verification scale interval (e) is required"),
  minimumCapacity_Min: import_zod4.z.string().optional(),
  dateOfManufacture: import_zod4.z.string().optional(),
  verificationFrequencyMonths: import_zod4.z.number().int().positive().optional(),
  remarks: import_zod4.z.string().optional(),
  stakeholderId: import_zod4.z.string().optional(),
  installationAddress: import_zod4.z.object({
    premiseName: import_zod4.z.string().min(2, "Premise/shop name is required"),
    addressLine: import_zod4.z.string().min(3, "Address line is required"),
    city: import_zod4.z.string().min(2, "City is required"),
    district: import_zod4.z.string().min(2, "District is required"),
    state: import_zod4.z.string().min(2, "State is required"),
    pincode: import_zod4.z.string().min(6, "Valid 6-digit PIN code is required"),
    latitude: import_zod4.z.number().optional(),
    longitude: import_zod4.z.number().optional()
  })
});
var updateInstrumentSchema = createInstrumentSchema.partial().passthrough();

// backend/routes/instrumentRoutes.js
init_constants();
var router4 = (0, import_express4.Router)();
router4.use(protect);
router4.get(
  "/expiring/summary",
  getExpiringInstrumentsSummary
);
router4.get(
  "/",
  getInstruments
);
router4.post(
  "/",
  authorize(
    USER_ROLES.BUSINESS_USER,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER
  ),
  validate(createInstrumentSchema),
  createInstrument
);
router4.get(
  "/:id",
  getInstrumentById
);
router4.put(
  "/:id",
  validate(updateInstrumentSchema),
  updateInstrument
);
router4.patch(
  "/:id",
  validate(updateInstrumentSchema),
  updateInstrument
);
router4.delete(
  "/:id",
  deleteInstrument
);
router4.post(
  "/:id/photos",
  upload.single("photo"),
  uploadInstrumentPhoto
);
router4.post(
  "/:id/documents",
  upload.single("document"),
  uploadInstrumentDocument
);
var instrumentRoutes_default = router4;

// backend/routes/applicationRoutes.js
var import_express5 = require("express");

// backend/controllers/applicationController.js
var import_mongoose15 = __toESM(require("mongoose"), 1);
init_VerificationApplication();
init_Instrument();
init_Stakeholder();
init_VerificationSchedule();
init_VerificationInspection();
init_VerificationResult();
init_Certificate();
init_constants();

// backend/services/applicationWorkflowService.js
init_VerificationApplication();
init_constants();

// backend/models/Notification.js
var import_mongoose13 = __toESM(require("mongoose"), 1);
init_constants();
var notificationSchema = new import_mongoose13.default.Schema(
  {
    recipient: {
      type: import_mongoose13.default.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPE_LIST,
      default: NOTIFICATION_TYPES.SYSTEM_NOTIFICATION,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    relatedEntityType: {
      type: String,
      trim: true,
      index: true
    },
    relatedEntityId: {
      type: import_mongoose13.default.Schema.Types.ObjectId,
      index: true
    },
    priority: {
      type: String,
      enum: NOTIFICATION_PRIORITY_LIST,
      default: NOTIFICATION_PRIORITIES.MEDIUM,
      index: true
    },
    link: {
      type: String,
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date
    },
    expiresAt: {
      type: Date,
      index: true
    },
    metadata: {
      type: import_mongoose13.default.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, priority: 1, createdAt: -1 });
notificationSchema.index({ relatedEntityType: 1, relatedEntityId: 1, type: 1 });
var Notification = import_mongoose13.default.model("Notification", notificationSchema);

// backend/models/NotificationPreference.js
var import_mongoose14 = __toESM(require("mongoose"), 1);
var notificationPreferenceSchema = new import_mongoose14.default.Schema(
  {
    user: {
      type: import_mongoose14.default.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    inAppEnabled: {
      type: Boolean,
      default: true
    },
    emailEnabled: {
      type: Boolean,
      default: true
    },
    reminderWindows: {
      day60: { type: Boolean, default: true },
      day30: { type: Boolean, default: true },
      day7: { type: Boolean, default: true },
      onExpiry: { type: Boolean, default: true }
    },
    categories: {
      certificateExpiry: { type: Boolean, default: true },
      verificationDue: { type: Boolean, default: true },
      workflowUpdates: { type: Boolean, default: true },
      systemAlerts: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true
  }
);
var NotificationPreference = import_mongoose14.default.model(
  "NotificationPreference",
  notificationPreferenceSchema
);

// backend/services/emailService.js
var import_nodemailer = __toESM(require("nodemailer"), 1);
var transporter = null;
if (ENV.SMTP_HOST && ENV.SMTP_USER) {
  transporter = import_nodemailer.default.createTransport({
    host: ENV.SMTP_HOST,
    port: ENV.SMTP_PORT,
    secure: ENV.SMTP_PORT === 465,
    auth: {
      user: ENV.SMTP_USER,
      pass: ENV.SMTP_PASSWORD
    }
  });
}
async function sendEmail({ to, subject, html, text }) {
  if (!to) return null;
  try {
    if (transporter) {
      const info = await transporter.sendMail({
        from: `"${ENV.SMTP_FROM}" <${ENV.SMTP_FROM}>`,
        to,
        subject,
        text,
        html
      });
      return info;
    } else {
      console.log(`[EMAIL DISPATCH - DEV] To: ${to} | Subject: ${subject}`);
      return { messageId: "simulated-dev-id" };
    }
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error.message);
    return null;
  }
}

// backend/services/notificationService.js
init_constants();
async function getNotificationPreferences(userId) {
  let pref = await NotificationPreference.findOne({ user: userId });
  if (!pref) {
    pref = await NotificationPreference.create({
      user: userId,
      inAppEnabled: true,
      emailEnabled: true,
      reminderWindows: {
        day60: true,
        day30: true,
        day7: true,
        onExpiry: true
      },
      categories: {
        certificateExpiry: true,
        verificationDue: true,
        workflowUpdates: true,
        systemAlerts: true
      }
    });
  }
  return pref;
}
async function updateNotificationPreferences(userId, updates = {}) {
  const pref = await getNotificationPreferences(userId);
  if (typeof updates.inAppEnabled === "boolean") {
    pref.inAppEnabled = updates.inAppEnabled;
  }
  if (typeof updates.emailEnabled === "boolean") {
    pref.emailEnabled = updates.emailEnabled;
  }
  if (updates.reminderWindows && typeof updates.reminderWindows === "object") {
    pref.reminderWindows = {
      ...pref.reminderWindows?.toObject?.() || pref.reminderWindows,
      ...updates.reminderWindows
    };
  }
  if (updates.categories && typeof updates.categories === "object") {
    pref.categories = {
      ...pref.categories?.toObject?.() || pref.categories,
      ...updates.categories
    };
  }
  await pref.save();
  return pref;
}
function resolveDefaultPriority(type) {
  if (type === NOTIFICATION_TYPES.CERTIFICATE_EXPIRED || type === NOTIFICATION_TYPES.VERIFICATION_OVERDUE || type === NOTIFICATION_TYPES.VERIFICATION_FAILED) {
    return NOTIFICATION_PRIORITIES.URGENT;
  }
  if (type === NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_7 || type === NOTIFICATION_TYPES.VERIFICATION_DUE || type === NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_30 || type === NOTIFICATION_TYPES.APPLICATION_REJECTED) {
    return NOTIFICATION_PRIORITIES.HIGH;
  }
  if (type === NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_60 || type === NOTIFICATION_TYPES.CERTIFICATE_ISSUED || type === NOTIFICATION_TYPES.CERTIFICATE_GENERATED || type === NOTIFICATION_TYPES.VERIFICATION_PASSED || type === NOTIFICATION_TYPES.APPLICATION_APPROVED || type === NOTIFICATION_TYPES.SCHEDULE_CREATED || type === NOTIFICATION_TYPES.SCHEDULE_CHANGED || type === NOTIFICATION_TYPES.INSPECTION_ASSIGNED || type === NOTIFICATION_TYPES.INSPECTION_COMPLETED) {
    return NOTIFICATION_PRIORITIES.MEDIUM;
  }
  return NOTIFICATION_PRIORITIES.LOW;
}
async function createNotification({
  recipientId,
  recipient,
  type = NOTIFICATION_TYPES.SYSTEM_NOTIFICATION,
  title,
  message,
  relatedEntityType,
  relatedEntityId,
  priority,
  link = "",
  metadata = {},
  expiresAt,
  sendEmailAlert = true
}, session = null) {
  try {
    const targetUserId = recipient || recipientId;
    if (!targetUserId) {
      console.warn("[NOTIFICATION SERVICE] Warning: Missing recipient for notification:", title);
      return null;
    }
    const preferences = await getNotificationPreferences(targetUserId);
    if (preferences.categories) {
      if ((type.startsWith("CERTIFICATE_EXPIR") || type === NOTIFICATION_TYPES.CERTIFICATE_EXPIRED) && preferences.categories.certificateExpiry === false) {
        return null;
      }
      if ((type === NOTIFICATION_TYPES.VERIFICATION_DUE || type === NOTIFICATION_TYPES.VERIFICATION_OVERDUE) && preferences.categories.verificationDue === false) {
        return null;
      }
      if ((type.startsWith("APPLICATION_") || type.startsWith("SCHEDULE_") || type.startsWith("INSPECTION_") || type.startsWith("VERIFICATION_")) && preferences.categories.workflowUpdates === false) {
        return null;
      }
      if (type === NOTIFICATION_TYPES.SYSTEM_ALERT && preferences.categories.systemAlerts === false) {
        return null;
      }
    }
    if (preferences.reminderWindows) {
      if (type === NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_60 && preferences.reminderWindows.day60 === false) {
        return null;
      }
      if (type === NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_30 && preferences.reminderWindows.day30 === false) {
        return null;
      }
      if (type === NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_7 && preferences.reminderWindows.day7 === false) {
        return null;
      }
      if (type === NOTIFICATION_TYPES.CERTIFICATE_EXPIRED && preferences.reminderWindows.onExpiry === false) {
        return null;
      }
    }
    if (preferences.inAppEnabled === false) {
      return null;
    }
    const resolvedPriority = priority || resolveDefaultPriority(type);
    const notification = new Notification({
      recipient: targetUserId,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      priority: resolvedPriority,
      link,
      metadata,
      expiresAt
    });
    await notification.save(session ? { session } : void 0);
    if (sendEmailAlert && preferences.emailEnabled !== false) {
      User.findById(targetUserId).select("email name").then((user) => {
        if (user && user.email) {
          sendEmail({
            to: user.email,
            subject: `[DoCA Legal Metrology] ${title}`,
            text: `${message}

Access details at: ${link}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
                  <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Legal Metrology Verification Alert</h2>
                  <p>Dear ${user.name},</p>
                  <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; margin: 16px 0;">
                    <h4 style="margin: 0 0 6px 0; color: #0369a1;">${title}</h4>
                    <p style="margin: 0;">${message}</p>
                  </div>
                  ${link ? `<p><a href="${link}" style="display: inline-block; padding: 10px 18px; background-color: #0284c7; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">View Details</a></p>` : ""}
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 24px;" />
                  <p style="font-size: 12px; color: #64748b;">Department of Consumer Affairs (DoCA), Ministry of Consumer Affairs, Food & Public Distribution, Government of India.</p>
                </div>
              `
          }).catch((err) => console.error("[EMAIL ERROR]", err.message));
        }
      }).catch((err) => console.error("[NOTIFICATION USER LOOKUP ERROR]", err.message));
    }
    return notification;
  } catch (error) {
    console.error("[NOTIFICATION SERVICE ERROR] Failed to create notification:", error.message);
    return null;
  }
}

// backend/services/applicationWorkflowService.js
var validateTransition = (currentStatus, targetStatus) => {
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    throw ApiError.badRequest(
      `Invalid status transition from '${currentStatus}' to '${targetStatus}'. Allowed next states: ${allowed.length > 0 ? allowed.join(", ") : "NONE (terminal state)"}`
    );
  }
  return true;
};
var transitionApplicationStatus = async (application, targetStatus, user, options = {}) => {
  const fromStatus = application.currentStatus;
  validateTransition(fromStatus, targetStatus);
  application.currentStatus = targetStatus;
  application.updatedBy = user._id;
  const timestamp = /* @__PURE__ */ new Date();
  switch (targetStatus) {
    case APPLICATION_STATUSES.SUBMITTED:
      application.submittedAt = timestamp;
      application.submissionDate = timestamp;
      break;
    case APPLICATION_STATUSES.UNDER_REVIEW:
      application.reviewedBy = user._id;
      application.reviewedAt = timestamp;
      if (options.remarks) {
        application.reviewRemarks = options.remarks;
      }
      break;
    case APPLICATION_STATUSES.APPROVED:
      application.reviewedBy = user._id;
      application.reviewedAt = timestamp;
      if (options.remarks) {
        application.reviewRemarks = options.remarks;
      }
      break;
    case APPLICATION_STATUSES.REJECTED:
      if (!options.rejectionReason || options.rejectionReason.trim().length === 0) {
        throw ApiError.badRequest("Specific statutory rejection reason is mandatory.");
      }
      application.reviewedBy = user._id;
      application.reviewedAt = timestamp;
      application.rejectionReason = options.rejectionReason.trim();
      break;
    case APPLICATION_STATUSES.SCHEDULED:
      application.scheduledAt = timestamp;
      break;
    case APPLICATION_STATUSES.COMPLETED:
      application.completedAt = timestamp;
      break;
    default:
      break;
  }
  application.statusHistory.push({
    fromStatus,
    toStatus: targetStatus,
    changedBy: user._id,
    remarks: options.remarks || options.rejectionReason || `Application transitioned from ${fromStatus} to ${targetStatus}`,
    timestamp
  });
  await application.save(options.session ? { session: options.session } : void 0);
  let auditAction = AUDIT_ACTIONS.APPLICATION_STATUS_UPDATED;
  if (targetStatus === APPLICATION_STATUSES.SUBMITTED) {
    auditAction = AUDIT_ACTIONS.APPLICATION_SUBMITTED;
  } else if (targetStatus === APPLICATION_STATUSES.UNDER_REVIEW) {
    auditAction = AUDIT_ACTIONS.APPLICATION_REVIEWED;
  } else if (targetStatus === APPLICATION_STATUSES.APPROVED) {
    auditAction = AUDIT_ACTIONS.APPLICATION_APPROVED;
  } else if (targetStatus === APPLICATION_STATUSES.REJECTED) {
    auditAction = AUDIT_ACTIONS.APPLICATION_REJECTED;
  }
  await logAuditEvent(
    {
      user: user._id,
      userRole: user.role,
      userEmail: user.email,
      action: auditAction,
      entity: "VerificationApplication",
      entityId: application._id,
      metadata: {
        applicationNumber: application.applicationNumber,
        fromStatus,
        toStatus: targetStatus,
        remarks: options.remarks || options.rejectionReason
      }
    },
    options.session || null
  );
  try {
    const populated = await VerificationApplication.findById(application._id).populate("stakeholder");
    const recipientUser = populated?.stakeholder?.user;
    if (recipientUser) {
      if (targetStatus === APPLICATION_STATUSES.SUBMITTED) {
        await createNotification({
          recipient: recipientUser,
          type: NOTIFICATION_TYPES.APPLICATION_SUBMITTED,
          title: "Verification Application Submitted",
          message: `Your application ${application.applicationNumber} has been successfully submitted for departmental verification.`,
          relatedEntityType: "Application",
          relatedEntityId: application._id,
          link: `/applications/${application._id}`
        });
      } else if (targetStatus === APPLICATION_STATUSES.APPROVED) {
        await createNotification({
          recipient: recipientUser,
          type: NOTIFICATION_TYPES.APPLICATION_APPROVED,
          title: "Verification Application Approved",
          message: `Your application ${application.applicationNumber} has been approved and is queued for verification scheduling.`,
          relatedEntityType: "Application",
          relatedEntityId: application._id,
          link: `/applications/${application._id}`
        });
      } else if (targetStatus === APPLICATION_STATUSES.REJECTED) {
        await createNotification({
          recipient: recipientUser,
          type: NOTIFICATION_TYPES.APPLICATION_REJECTED,
          title: "Verification Application Rejected",
          message: `Your application ${application.applicationNumber} was rejected: ${options.rejectionReason}`,
          relatedEntityType: "Application",
          relatedEntityId: application._id,
          link: `/applications/${application._id}`
        });
      }
    }
  } catch (notifyErr) {
    console.error("Notification dispatch error (non-blocking):", notifyErr.message);
  }
  return application;
};

// backend/controllers/applicationController.js
var createApplication = asyncHandler(async (req, res) => {
  const {
    instrumentId,
    applicationType,
    verificationType,
    requestedDate,
    preferredVerificationDate,
    preferredVerificationCenter,
    preferredLocation,
    verificationLocation,
    purpose,
    remarks
  } = req.body;
  const forbiddenFields = [
    "applicationStatus",
    "currentStatus",
    "status",
    "reviewedBy",
    "reviewedAt",
    "approvedBy",
    "certificateId",
    "verificationResult",
    "role",
    "permissions",
    "isAdmin",
    "isSuperAdmin",
    "verificationStatus",
    "certificateStatus",
    "ownership",
    "stakeholder",
    "stakeholderId",
    "officerId",
    "jurisdiction"
  ];
  for (const field of forbiddenFields) {
    if (req.body[field] !== void 0) {
      throw ApiError.badRequest(`Directly specifying protected field '${field}' is not permitted.`);
    }
  }
  if (!instrumentId || !import_mongoose15.default.Types.ObjectId.isValid(instrumentId)) {
    throw ApiError.badRequest("A valid instrument ID is required.");
  }
  let stakeholder = null;
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder) {
      throw ApiError.badRequest("Please complete your stakeholder business profile before applying for verification.");
    }
  } else {
    const sId = req.body.stakeholderId || req.body.stakeholder;
    if (!sId || !import_mongoose15.default.Types.ObjectId.isValid(sId)) {
      throw ApiError.badRequest("Valid stakeholderId is required for administrative application creation.");
    }
    stakeholder = await Stakeholder.findById(sId);
    if (!stakeholder) {
      throw ApiError.notFound("Associated stakeholder business profile not found");
    }
  }
  const instrument = await Instrument.findById(instrumentId);
  if (!instrument) {
    throw ApiError.notFound("Instrument not found");
  }
  if (String(instrument.stakeholder) !== String(stakeholder._id)) {
    throw ApiError.forbidden("You can only apply for verification of your own registered instruments.");
  }
  if (!instrument.isActive || instrument.status === INSTRUMENT_STATUSES.OUT_OF_SERVICE) {
    throw ApiError.badRequest("Cannot apply for verification of an inactive or out-of-service instrument.");
  }
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  let applicationNumber = "";
  let isUnique = false;
  while (!isUnique) {
    const randSuffix = Math.floor(1e5 + Math.random() * 9e5);
    applicationNumber = `LM-${year}-${randSuffix}`;
    const exists = await VerificationApplication.findOne({ applicationNumber });
    if (!exists) isUnique = true;
  }
  const effectiveRequestedDate = requestedDate || preferredVerificationDate;
  const application = new VerificationApplication({
    applicationNumber,
    stakeholder: stakeholder._id,
    instrument: instrument._id,
    applicationType: applicationType || "NEW_VERIFICATION",
    verificationType: verificationType || "INITIAL",
    currentStatus: APPLICATION_STATUSES.DRAFT,
    requestedDate: effectiveRequestedDate ? new Date(effectiveRequestedDate) : void 0,
    preferredVerificationDate: effectiveRequestedDate ? new Date(effectiveRequestedDate) : void 0,
    preferredVerificationCenter: preferredVerificationCenter && import_mongoose15.default.Types.ObjectId.isValid(preferredVerificationCenter) ? preferredVerificationCenter : void 0,
    preferredLocation: preferredLocation || (verificationLocation?.address ? verificationLocation.address : instrument.installationAddress?.addressLine),
    verificationLocation: verificationLocation || {
      locationType: "ON_SITE_PREMISES",
      address: instrument.installationAddress?.addressLine || "Registered Business Premise",
      district: instrument.installationAddress?.district || "Default District"
    },
    purpose: purpose || "Mandatory statutory verification under Legal Metrology Act",
    remarks,
    createdBy: req.user._id,
    statusHistory: [
      {
        fromStatus: "NONE",
        toStatus: APPLICATION_STATUSES.DRAFT,
        changedBy: req.user._id,
        remarks: "Verification application drafted in system",
        timestamp: /* @__PURE__ */ new Date()
      }
    ]
  });
  await application.save();
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.APPLICATION_CREATED,
    entity: "VerificationApplication",
    entityId: application._id,
    metadata: {
      applicationNumber,
      instrumentId: instrument.instrumentId,
      stakeholder: stakeholder.businessName
    }
  });
  const populated = await VerificationApplication.findById(application._id).populate("stakeholder", "businessName tradeLicenseNumber registeredAddress").populate("instrument", "instrumentId category instrumentType serialNumber manufacturer capacity");
  return ApiResponse.created(res, populated, "Verification application drafted successfully");
});
var updateApplication = asyncHandler(async (req, res) => {
  if (!import_mongoose15.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid application ID format");
  }
  const application = await VerificationApplication.findById(req.params.id);
  if (!application) {
    throw ApiError.notFound("Application not found");
  }
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(application.stakeholder) !== String(stakeholder._id)) {
      throw ApiError.forbidden("You are not authorized to modify this application.");
    }
    if (application.currentStatus !== APPLICATION_STATUSES.DRAFT) {
      throw ApiError.forbidden(
        `Submitted or active applications cannot be modified by the applicant. Current status: ${application.currentStatus}`
      );
    }
  }
  const forbiddenFields = [
    "applicationStatus",
    "currentStatus",
    "status",
    "reviewedBy",
    "reviewedAt",
    "approvedBy",
    "rejectionReason",
    "submittedAt",
    "applicationNumber",
    "role",
    "permissions",
    "isAdmin",
    "isSuperAdmin",
    "verificationStatus",
    "certificateStatus",
    "ownership",
    "stakeholder",
    "stakeholderId",
    "officerId",
    "jurisdiction"
  ];
  for (const field of forbiddenFields) {
    if (req.body[field] !== void 0) {
      throw ApiError.forbidden(`Direct modification of official field '${field}' is strictly prohibited.`);
    }
  }
  const allowedFields = [
    "applicationType",
    "verificationType",
    "purpose",
    "remarks",
    "preferredVerificationCenter",
    "preferredLocation"
  ];
  allowedFields.forEach((field) => {
    if (req.body[field] !== void 0) {
      application[field] = req.body[field];
    }
  });
  if (req.body.requestedDate || req.body.preferredVerificationDate) {
    const targetDate = new Date(req.body.requestedDate || req.body.preferredVerificationDate);
    application.requestedDate = targetDate;
    application.preferredVerificationDate = targetDate;
  }
  if (req.body.verificationLocation) {
    application.verificationLocation = {
      ...application.verificationLocation?.toObject?.() || application.verificationLocation || {},
      ...req.body.verificationLocation
    };
  }
  application.updatedBy = req.user._id;
  await application.save();
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.APPLICATION_UPDATED,
    entity: "VerificationApplication",
    entityId: application._id,
    metadata: { applicationNumber: application.applicationNumber }
  });
  const updated = await VerificationApplication.findById(application._id).populate("stakeholder", "businessName tradeLicenseNumber").populate("instrument", "instrumentId category instrumentType serialNumber manufacturer");
  return ApiResponse.success(res, updated, "Draft application updated successfully");
});
var submitApplication = asyncHandler(async (req, res) => {
  if (!import_mongoose15.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid application ID format");
  }
  const application = await VerificationApplication.findById(req.params.id);
  if (!application) {
    throw ApiError.notFound("Application not found");
  }
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(application.stakeholder) !== String(stakeholder._id)) {
      throw ApiError.forbidden("You can only submit your own draft applications.");
    }
  }
  if (application.currentStatus !== APPLICATION_STATUSES.DRAFT) {
    throw ApiError.badRequest(
      `Only DRAFT applications can be submitted. Current status: ${application.currentStatus}`
    );
  }
  const instrument = await Instrument.findById(application.instrument);
  if (!instrument || !instrument.isActive || instrument.status === INSTRUMENT_STATUSES.OUT_OF_SERVICE) {
    throw ApiError.badRequest("Target instrument is inactive or out-of-service for verification submission.");
  }
  const updatedApp = await transitionApplicationStatus(
    application,
    APPLICATION_STATUSES.SUBMITTED,
    req.user,
    { remarks: "Application formally submitted for departmental verification review" }
  );
  const populated = await VerificationApplication.findById(updatedApp._id).populate("stakeholder", "businessName tradeLicenseNumber").populate("instrument", "instrumentId category serialNumber");
  return ApiResponse.success(res, populated, "Application submitted successfully for verification");
});
var reviewApplication = asyncHandler(async (req, res) => {
  if (!import_mongoose15.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid application ID format");
  }
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    throw ApiError.forbidden("Business users cannot review verification applications.");
  }
  if (req.user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER) {
    throw ApiError.forbidden("Field officers cannot perform formal application scrutiny.");
  }
  const application = await VerificationApplication.findById(req.params.id);
  if (!application) {
    throw ApiError.notFound("Application not found");
  }
  const updatedApp = await transitionApplicationStatus(
    application,
    APPLICATION_STATUSES.UNDER_REVIEW,
    req.user,
    { remarks: req.body.remarks || "Application placed under technical scrutiny" }
  );
  return ApiResponse.success(res, updatedApp, "Application placed under review");
});
var approveApplication = asyncHandler(async (req, res) => {
  if (!import_mongoose15.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid application ID format");
  }
  if (req.user.role !== USER_ROLES.SUPER_ADMIN && req.user.role !== USER_ROLES.ADMIN && req.user.role !== USER_ROLES.LEGAL_METROLOGY_OFFICER) {
    throw ApiError.forbidden("You are not authorized to approve verification applications.");
  }
  const application = await VerificationApplication.findById(req.params.id);
  if (!application) {
    throw ApiError.notFound("Application not found");
  }
  const updatedApp = await transitionApplicationStatus(
    application,
    APPLICATION_STATUSES.APPROVED,
    req.user,
    { remarks: req.body.remarks || "Application verified and approved for inspection scheduling" }
  );
  return ApiResponse.success(res, updatedApp, "Application approved successfully");
});
var rejectApplication = asyncHandler(async (req, res) => {
  if (!import_mongoose15.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid application ID format");
  }
  if (req.user.role !== USER_ROLES.SUPER_ADMIN && req.user.role !== USER_ROLES.ADMIN && req.user.role !== USER_ROLES.LEGAL_METROLOGY_OFFICER) {
    throw ApiError.forbidden("You are not authorized to reject verification applications.");
  }
  const { rejectionReason } = req.body;
  if (!rejectionReason || rejectionReason.trim().length === 0) {
    throw ApiError.badRequest("Specific statutory rejection reason is mandatory.");
  }
  const application = await VerificationApplication.findById(req.params.id);
  if (!application) {
    throw ApiError.notFound("Application not found");
  }
  const updatedApp = await transitionApplicationStatus(
    application,
    APPLICATION_STATUSES.REJECTED,
    req.user,
    { rejectionReason }
  );
  return ApiResponse.success(res, updatedApp, "Application rejected with statutory reason recorded");
});
var getApplications = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationParams(req.query);
  const filter = {};
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder) {
      return ApiResponse.success(res, buildPaginationResponse([], 0, page, limit));
    }
    filter.stakeholder = stakeholder._id;
  } else if (req.user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER || req.user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER) {
    if (req.query.assignedToMe === "true") {
      filter.assignedLMO = req.user._id;
    }
  }
  const statusFilter = req.query.applicationStatus || req.query.status;
  if (statusFilter) {
    filter.currentStatus = statusFilter;
  }
  if (req.query.applicationType) {
    filter.applicationType = req.query.applicationType;
  }
  if (req.query.verificationType) {
    filter.verificationType = req.query.verificationType;
  }
  if (req.query.stakeholderId) {
    if (import_mongoose15.default.Types.ObjectId.isValid(req.query.stakeholderId)) {
      filter.stakeholder = req.query.stakeholderId;
    }
  }
  if (req.query.instrumentId) {
    if (import_mongoose15.default.Types.ObjectId.isValid(req.query.instrumentId)) {
      filter.instrument = req.query.instrumentId;
    }
  }
  if (req.query.district) {
    filter["verificationLocation.district"] = new RegExp(escapeRegex(req.query.district), "i");
  }
  if (req.query.startDate && req.query.endDate) {
    filter.createdAt = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }
  if (req.query.search) {
    const safeSearch = escapeRegex(req.query.search);
    filter.$or = [
      { applicationNumber: { $regex: safeSearch, $options: "i" } },
      { purpose: { $regex: safeSearch, $options: "i" } }
    ];
  }
  const [applications, total] = await Promise.all([
    VerificationApplication.find(filter).populate("stakeholder", "businessName tradeLicenseNumber registeredAddress").populate("instrument", "instrumentId category instrumentType serialNumber manufacturer capacity accuracyClass").populate("assignedLMO", "name email phone designation").populate("reviewedBy", "name email role").sort(sort).skip(skip).limit(limit),
    VerificationApplication.countDocuments(filter)
  ]);
  return ApiResponse.success(
    res,
    buildPaginationResponse(applications, total, page, limit),
    "Applications retrieved successfully"
  );
});
var getApplicationById = asyncHandler(async (req, res) => {
  if (!import_mongoose15.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid application ID format");
  }
  const application = await VerificationApplication.findById(req.params.id).populate("stakeholder").populate("instrument").populate("assignedLMO", "name email phone designation jurisdiction").populate("reviewedBy", "name email role");
  if (!application) {
    throw ApiError.notFound("Application not found");
  }
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(application.stakeholder._id || application.stakeholder) !== String(stakeholder._id)) {
      throw ApiError.forbidden("You are not authorized to view this application.");
    }
  }
  const [schedule, inspection, result, certificate] = await Promise.all([
    VerificationSchedule.findOne({ application: application._id }).populate("assignedOfficer", "name email phone designation"),
    VerificationInspection.findOne({ application: application._id }),
    VerificationResult.findOne({ application: application._id }),
    Certificate.findOne({ application: application._id })
  ]);
  return ApiResponse.success(
    res,
    {
      application,
      schedule,
      inspection,
      result,
      certificate
    },
    "Application dossier retrieved successfully"
  );
});
var getApplicationHistory = asyncHandler(async (req, res) => {
  if (!import_mongoose15.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid application ID format");
  }
  const application = await VerificationApplication.findById(req.params.id);
  if (!application) {
    throw ApiError.notFound("Application not found");
  }
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(application.stakeholder) !== String(stakeholder._id)) {
      throw ApiError.forbidden("You are not authorized to view the history of this application.");
    }
  }
  const auditLogs = await AuditLog.find({
    entity: "VerificationApplication",
    entityId: application._id
  }).sort({ timestamp: -1 }).populate("user", "name email role");
  return ApiResponse.success(
    res,
    {
      applicationNumber: application.applicationNumber,
      currentStatus: application.currentStatus,
      statusHistory: application.statusHistory,
      auditEvents: auditLogs
    },
    "Application history retrieved successfully"
  );
});
var uploadApplicationDocument = asyncHandler(async (req, res) => {
  if (!import_mongoose15.default.Types.ObjectId.isValid(req.params.id)) {
    if (req.file) cleanupFile(req.file.path);
    throw ApiError.badRequest("Invalid application ID format");
  }
  if (!req.file) {
    throw ApiError.badRequest("No document uploaded");
  }
  const application = await VerificationApplication.findById(req.params.id);
  if (!application) {
    cleanupFile(req.file.path);
    throw ApiError.notFound("Application not found");
  }
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(application.stakeholder) !== String(stakeholder._id)) {
      cleanupFile(req.file.path);
      throw ApiError.forbidden("You can only upload documents to your own verification applications.");
    }
  } else if (req.user.role !== USER_ROLES.SUPER_ADMIN && req.user.role !== USER_ROLES.ADMIN && req.user.role !== USER_ROLES.LEGAL_METROLOGY_OFFICER) {
    cleanupFile(req.file.path);
    throw ApiError.forbidden("You are not authorized to upload documents to this application.");
  }
  await validateUploadedFile(req.file);
  const safeOriginalName = sanitizeFileName(req.file.originalname);
  const doc = {
    title: sanitizeFileName(req.body.title || req.file.originalname),
    docType: req.body.docType || "SUPPORTING_DOCUMENT",
    fileName: safeOriginalName,
    fileUrl: `/uploads/documents/${req.file.filename}`,
    uploadedAt: /* @__PURE__ */ new Date()
  };
  application.documents.push(doc);
  application.updatedBy = req.user._id;
  await application.save();
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.DOCUMENT_UPLOADED,
    entity: "VerificationApplication",
    entityId: application._id,
    metadata: {
      title: doc.title,
      docType: doc.docType,
      fileName: doc.fileName
    }
  });
  return ApiResponse.created(res, application, "Document attached to application successfully");
});

// backend/validators/applicationValidator.js
var import_zod5 = require("zod");
init_constants();
var createApplicationSchema = import_zod5.z.object({
  instrumentId: import_zod5.z.string().min(1, "Target instrument ID is required"),
  applicationType: import_zod5.z.enum(APPLICATION_TYPE_LIST).default("NEW_VERIFICATION"),
  verificationType: import_zod5.z.enum(["INITIAL", "PERIODICAL", "RE_VERIFICATION", "AFTER_REPAIR"]).optional(),
  requestedDate: import_zod5.z.string().optional(),
  preferredVerificationDate: import_zod5.z.string().optional(),
  preferredVerificationCenter: import_zod5.z.string().optional(),
  preferredLocation: import_zod5.z.string().optional(),
  verificationLocation: import_zod5.z.object({
    locationType: import_zod5.z.enum(["ON_SITE_PREMISES", "DISTRICT_LABORATORY", "GATC_FACILITY"]).default("ON_SITE_PREMISES"),
    address: import_zod5.z.string().optional(),
    district: import_zod5.z.string().optional()
  }).optional(),
  purpose: import_zod5.z.string().optional(),
  remarks: import_zod5.z.string().optional()
}).passthrough();
var updateDraftApplicationSchema = createApplicationSchema.partial().passthrough();
var reviewApplicationSchema = import_zod5.z.object({
  remarks: import_zod5.z.string().optional()
}).passthrough();
var approveApplicationSchema = import_zod5.z.object({
  remarks: import_zod5.z.string().optional()
}).passthrough();
var rejectApplicationSchema = import_zod5.z.object({
  rejectionReason: import_zod5.z.string().min(3, "Specific statutory rejection reason is required")
}).passthrough();
var scheduleApplicationSchema = import_zod5.z.object({
  applicationId: import_zod5.z.string().min(1, "Target application ID is required").optional(),
  application: import_zod5.z.string().optional(),
  assignedOfficer: import_zod5.z.string().optional(),
  assignedOfficerId: import_zod5.z.string().optional(),
  officerId: import_zod5.z.string().optional(),
  assignedFieldOfficer: import_zod5.z.string().optional(),
  assignedFieldOfficerId: import_zod5.z.string().optional(),
  fieldOfficerId: import_zod5.z.string().optional(),
  scheduledDate: import_zod5.z.string().optional(),
  verificationDate: import_zod5.z.string().optional(),
  date: import_zod5.z.string().optional(),
  timeSlot: import_zod5.z.string().optional(),
  startTime: import_zod5.z.string().optional(),
  endTime: import_zod5.z.string().optional(),
  verificationCenter: import_zod5.z.string().optional(),
  verificationCenterId: import_zod5.z.string().optional(),
  centerId: import_zod5.z.string().optional(),
  assignedGATC: import_zod5.z.string().optional(),
  gatcId: import_zod5.z.string().optional(),
  gatc: import_zod5.z.string().optional(),
  locationType: import_zod5.z.enum(["ON_SITE_PREMISES", "DISTRICT_LABORATORY", "GATC_FACILITY"]).default("ON_SITE_PREMISES"),
  locationAddress: import_zod5.z.string().optional(),
  specialInstructions: import_zod5.z.string().optional(),
  notes: import_zod5.z.string().optional()
}).passthrough();
var rescheduleApplicationSchema = import_zod5.z.object({
  scheduledDate: import_zod5.z.string().optional(),
  newDate: import_zod5.z.string().optional(),
  date: import_zod5.z.string().optional(),
  timeSlot: import_zod5.z.string().optional(),
  startTime: import_zod5.z.string().optional(),
  endTime: import_zod5.z.string().optional(),
  assignedOfficer: import_zod5.z.string().optional(),
  assignedOfficerId: import_zod5.z.string().optional(),
  officerId: import_zod5.z.string().optional(),
  assignedFieldOfficerId: import_zod5.z.string().optional(),
  fieldOfficerId: import_zod5.z.string().optional(),
  verificationCenterId: import_zod5.z.string().optional(),
  centerId: import_zod5.z.string().optional(),
  reason: import_zod5.z.string().min(3, "Rescheduling reason is required")
}).passthrough();
var cancelScheduleSchema = import_zod5.z.object({
  reason: import_zod5.z.string().optional(),
  cancellationReason: import_zod5.z.string().optional()
}).passthrough();

// backend/routes/applicationRoutes.js
init_constants();
var router5 = (0, import_express5.Router)();
router5.use(protect);
router5.get("/", getApplications);
router5.post(
  "/",
  authorize(USER_ROLES.BUSINESS_USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(createApplicationSchema),
  createApplication
);
router5.get("/:id", getApplicationById);
router5.get("/:id/history", getApplicationHistory);
router5.patch(
  "/:id",
  authorize(USER_ROLES.BUSINESS_USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(updateDraftApplicationSchema),
  updateApplication
);
router5.put(
  "/:id",
  authorize(USER_ROLES.BUSINESS_USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(updateDraftApplicationSchema),
  updateApplication
);
router5.post(
  "/:id/submit",
  authorize(USER_ROLES.BUSINESS_USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  submitApplication
);
router5.patch(
  "/:id/submit",
  authorize(USER_ROLES.BUSINESS_USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  submitApplication
);
router5.post(
  "/:id/review",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER, USER_ROLES.GATC_OFFICER),
  validate(reviewApplicationSchema),
  reviewApplication
);
router5.patch(
  "/:id/review",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER, USER_ROLES.GATC_OFFICER),
  validate(reviewApplicationSchema),
  reviewApplication
);
router5.post(
  "/:id/approve",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  validate(approveApplicationSchema),
  approveApplication
);
router5.patch(
  "/:id/approve",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  validate(approveApplicationSchema),
  approveApplication
);
router5.post(
  "/:id/reject",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  validate(rejectApplicationSchema),
  rejectApplication
);
router5.patch(
  "/:id/reject",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  validate(rejectApplicationSchema),
  rejectApplication
);
router5.post(
  "/:id/documents",
  upload.single("document"),
  uploadApplicationDocument
);
var applicationRoutes_default = router5;

// backend/routes/scheduleRoutes.js
var import_express6 = require("express");

// backend/controllers/scheduleController.js
var import_mongoose20 = __toESM(require("mongoose"), 1);
init_VerificationSchedule();
init_VerificationApplication();
init_Instrument();
init_Stakeholder();

// backend/models/VerificationCenter.js
var import_mongoose16 = __toESM(require("mongoose"), 1);
var verificationCenterSchema = new import_mongoose16.default.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["DISTRICT_LEGAL_METROLOGY_LAB", "GOVERNMENT_APPROVED_TEST_CENTRE"],
      default: "DISTRICT_LEGAL_METROLOGY_LAB"
    },
    jurisdiction: {
      state: { type: String, required: true },
      district: { type: String, required: true, index: true }
    },
    address: {
      type: String,
      required: true
    },
    contactPhone: {
      type: String
    },
    contactEmail: {
      type: String
    },
    capacityPerDay: {
      type: Number,
      default: 20
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);
var VerificationCenter = import_mongoose16.default.model(
  "VerificationCenter",
  verificationCenterSchema
);

// backend/models/GATC.js
var import_mongoose17 = __toESM(require("mongoose"), 1);
var gatcSchema = new import_mongoose17.default.Schema(
  {
    gatcCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    accreditationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    accreditationValidUntil: {
      type: Date,
      required: true
    },
    authorizedCategories: [
      {
        type: String
      }
    ],
    state: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true,
      index: true
    },
    address: {
      type: String,
      required: true
    },
    contactPerson: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);
var GATC = import_mongoose17.default.model("GATC", gatcSchema);

// backend/controllers/scheduleController.js
init_constants();

// backend/utils/transactionHelper.js
var import_mongoose18 = __toESM(require("mongoose"), 1);
async function runInTransaction(operationFn) {
  const topologyType = import_mongoose18.default.connection?.client?.topology?.description?.type || "";
  const supportsTransactions = topologyType.includes("ReplicaSet") || topologyType === "ReplicaSetWithPrimary" || topologyType === "Sharded";
  if (!supportsTransactions) {
    return await operationFn(null);
  }
  const session = await import_mongoose18.default.startSession();
  try {
    session.startTransaction();
    const result = await operationFn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        console.error("[TRANSACTION] Error during transaction abort:", abortErr.message);
      }
    }
    throw error;
  } finally {
    session.endSession();
  }
}

// backend/services/scheduleService.js
var import_mongoose19 = __toESM(require("mongoose"), 1);
init_VerificationSchedule();
init_VerificationApplication();
init_Instrument();
init_Stakeholder();
init_constants();
var ACTIVE_SCHEDULE_STATUSES = [
  SCHEDULE_STATUSES.PENDING,
  SCHEDULE_STATUSES.CONFIRMED,
  SCHEDULE_STATUSES.SCHEDULED,
  SCHEDULE_STATUSES.RESCHEDULED,
  SCHEDULE_STATUSES.IN_PROGRESS
];
function timeToMinutes(t) {
  if (!t || typeof t !== "string") return 0;
  const parts = t.split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}
function doTimeslotsOverlap(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
}
function parseTimeRange(timeSlot, startTime, endTime) {
  let start = startTime;
  let end = endTime;
  let slot = timeSlot;
  if (!start || !end) {
    if (timeSlot === "09:00 - 12:00") {
      start = "09:00";
      end = "12:00";
    } else if (timeSlot === "12:00 - 15:00") {
      start = "12:00";
      end = "15:00";
    } else if (timeSlot === "15:00 - 18:00") {
      start = "15:00";
      end = "18:00";
    } else if (timeSlot === "FULL_DAY") {
      start = "09:00";
      end = "18:00";
    } else if (timeSlot && timeSlot.includes("-")) {
      const parts = timeSlot.split("-").map((s) => s.trim());
      start = parts[0] || "09:00";
      end = parts[1] || "12:00";
    } else {
      start = "09:00";
      end = "12:00";
      slot = "09:00 - 12:00";
    }
  }
  if (!slot) {
    slot = `${start} - ${end}`;
  }
  return { startTime: start, endTime: end, timeSlot: slot };
}
async function checkScheduleConflicts({
  scheduledDate,
  startTime,
  endTime,
  timeSlot,
  assignedOfficerId,
  assignedFieldOfficerId,
  instrumentId,
  verificationCenterId,
  applicationId,
  excludeScheduleId = null
}) {
  const targetDate = new Date(scheduledDate);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);
  const parsed = parseTimeRange(timeSlot, startTime, endTime);
  const reqStart = parsed.startTime;
  const reqEnd = parsed.endTime;
  if (timeToMinutes(reqStart) >= timeToMinutes(reqEnd)) {
    throw ApiError.badRequest(`Start time (${reqStart}) must be strictly earlier than end time (${reqEnd}).`);
  }
  if (applicationId) {
    const appFilter = {
      application: applicationId,
      status: { $in: ACTIVE_SCHEDULE_STATUSES }
    };
    if (excludeScheduleId) {
      appFilter._id = { $ne: excludeScheduleId };
    }
    const existingActiveApp = await VerificationSchedule.findOne(appFilter);
    if (existingActiveApp) {
      throw ApiError.conflict("An active verification schedule already exists for this application.");
    }
  }
  if (assignedOfficerId) {
    const officerFilter = {
      assignedOfficer: assignedOfficerId,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ACTIVE_SCHEDULE_STATUSES }
    };
    if (excludeScheduleId) {
      officerFilter._id = { $ne: excludeScheduleId };
    }
    const officerSchedules = await VerificationSchedule.find(officerFilter);
    for (const sched of officerSchedules) {
      const schedTimes = parseTimeRange(sched.timeSlot, sched.startTime, sched.endTime);
      if (doTimeslotsOverlap(schedTimes.startTime, schedTimes.endTime, reqStart, reqEnd)) {
        throw ApiError.conflict(
          `Assigned officer already has an active verification scheduled from ${schedTimes.startTime} to ${schedTimes.endTime} on ${targetDate.toLocaleDateString("en-IN")}.`
        );
      }
    }
  }
  if (assignedFieldOfficerId) {
    const fieldOfficerFilter = {
      assignedFieldOfficer: assignedFieldOfficerId,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ACTIVE_SCHEDULE_STATUSES }
    };
    if (excludeScheduleId) {
      fieldOfficerFilter._id = { $ne: excludeScheduleId };
    }
    const fvoSchedules = await VerificationSchedule.find(fieldOfficerFilter);
    for (const sched of fvoSchedules) {
      const schedTimes = parseTimeRange(sched.timeSlot, sched.startTime, sched.endTime);
      if (doTimeslotsOverlap(schedTimes.startTime, schedTimes.endTime, reqStart, reqEnd)) {
        throw ApiError.conflict(
          `Assigned field officer already has a verification scheduled from ${schedTimes.startTime} to ${schedTimes.endTime} on ${targetDate.toLocaleDateString("en-IN")}.`
        );
      }
    }
  }
  if (instrumentId) {
    const instrumentFilter = {
      instrument: instrumentId,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ACTIVE_SCHEDULE_STATUSES }
    };
    if (excludeScheduleId) {
      instrumentFilter._id = { $ne: excludeScheduleId };
    }
    const instSchedules = await VerificationSchedule.find(instrumentFilter);
    for (const sched of instSchedules) {
      const schedTimes = parseTimeRange(sched.timeSlot, sched.startTime, sched.endTime);
      if (doTimeslotsOverlap(schedTimes.startTime, schedTimes.endTime, reqStart, reqEnd)) {
        throw ApiError.conflict(
          `This instrument is already booked for verification from ${schedTimes.startTime} to ${schedTimes.endTime} on ${targetDate.toLocaleDateString("en-IN")}.`
        );
      }
    }
  }
  if (verificationCenterId) {
    const center = await VerificationCenter.findById(verificationCenterId);
    if (!center) {
      throw ApiError.badRequest("Verification center not found.");
    }
    if (center.isActive === false) {
      throw ApiError.badRequest("Selected verification center is inactive or closed for verification.");
    }
    const centerFilter = {
      verificationCenter: verificationCenterId,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ACTIVE_SCHEDULE_STATUSES }
    };
    if (excludeScheduleId) {
      centerFilter._id = { $ne: excludeScheduleId };
    }
    const totalCenterBookings = await VerificationSchedule.countDocuments(centerFilter);
    const capacity = typeof center.capacityPerDay === "number" ? center.capacityPerDay : 20;
    if (totalCenterBookings >= capacity) {
      throw ApiError.conflict(
        `Verification center ${center.name} has reached its daily capacity limit (${capacity}) on ${targetDate.toLocaleDateString("en-IN")}.`
      );
    }
  }
  return true;
}
async function calculateAvailability({
  date,
  startTime,
  endTime,
  timeSlot,
  officerId,
  fieldOfficerId,
  instrumentId,
  centerId
}) {
  const targetDate = new Date(date);
  if (isNaN(targetDate.getTime())) {
    throw ApiError.badRequest("Invalid date provided for availability calculation.");
  }
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);
  const parsed = parseTimeRange(timeSlot, startTime, endTime);
  const reqStart = parsed.startTime;
  const reqEnd = parsed.endTime;
  const conflicts = [];
  let officerAvailable = true;
  let fieldOfficerAvailable = true;
  let instrumentAvailable = true;
  let centerAvailable = true;
  if (officerId && import_mongoose19.default.Types.ObjectId.isValid(officerId)) {
    const officerSchedules = await VerificationSchedule.find({
      assignedOfficer: officerId,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ACTIVE_SCHEDULE_STATUSES }
    }).populate("assignedOfficer", "name");
    for (const sched of officerSchedules) {
      const st = parseTimeRange(sched.timeSlot, sched.startTime, sched.endTime);
      if (doTimeslotsOverlap(st.startTime, st.endTime, reqStart, reqEnd)) {
        officerAvailable = false;
        conflicts.push({
          type: "OFFICER_OVERLAP",
          entity: "officer",
          message: `Officer ${sched.assignedOfficer?.name || officerId} is busy (${st.startTime} - ${st.endTime})`
        });
      }
    }
  }
  if (fieldOfficerId && import_mongoose19.default.Types.ObjectId.isValid(fieldOfficerId)) {
    const fvoSchedules = await VerificationSchedule.find({
      assignedFieldOfficer: fieldOfficerId,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ACTIVE_SCHEDULE_STATUSES }
    }).populate("assignedFieldOfficer", "name");
    for (const sched of fvoSchedules) {
      const st = parseTimeRange(sched.timeSlot, sched.startTime, sched.endTime);
      if (doTimeslotsOverlap(st.startTime, st.endTime, reqStart, reqEnd)) {
        fieldOfficerAvailable = false;
        conflicts.push({
          type: "FIELD_OFFICER_OVERLAP",
          entity: "fieldOfficer",
          message: `Field Officer is busy (${st.startTime} - ${st.endTime})`
        });
      }
    }
  }
  if (instrumentId && import_mongoose19.default.Types.ObjectId.isValid(instrumentId)) {
    const instSchedules = await VerificationSchedule.find({
      instrument: instrumentId,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ACTIVE_SCHEDULE_STATUSES }
    });
    for (const sched of instSchedules) {
      const st = parseTimeRange(sched.timeSlot, sched.startTime, sched.endTime);
      if (doTimeslotsOverlap(st.startTime, st.endTime, reqStart, reqEnd)) {
        instrumentAvailable = false;
        conflicts.push({
          type: "INSTRUMENT_OVERLAP",
          entity: "instrument",
          message: `Instrument is already scheduled for verification (${st.startTime} - ${st.endTime})`
        });
      }
    }
  }
  if (centerId && import_mongoose19.default.Types.ObjectId.isValid(centerId)) {
    const center = await VerificationCenter.findById(centerId);
    if (center) {
      if (center.isActive === false) {
        centerAvailable = false;
        conflicts.push({
          type: "CENTER_INACTIVE",
          entity: "center",
          message: `Center ${center.name} is currently inactive`
        });
      } else {
        const count = await VerificationSchedule.countDocuments({
          verificationCenter: centerId,
          scheduledDate: { $gte: startOfDay, $lte: endOfDay },
          status: { $in: ACTIVE_SCHEDULE_STATUSES }
        });
        const cap = center.capacityPerDay || 20;
        if (count >= cap) {
          centerAvailable = false;
          conflicts.push({
            type: "CENTER_CAPACITY_EXCEEDED",
            entity: "center",
            message: `Center ${center.name} has reached daily capacity (${count}/${cap})`
          });
        }
      }
    }
  }
  return {
    officerAvailable,
    fieldOfficerAvailable,
    instrumentAvailable,
    centerAvailable,
    conflicts
  };
}
async function transitionScheduleStatus(schedule, newStatus, user, { remarks, reason } = {}) {
  const currentStatus = schedule.status;
  if (currentStatus === newStatus) {
    return schedule;
  }
  const allowed = ALLOWED_SCHEDULE_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw ApiError.badRequest(
      `Invalid schedule status transition from ${currentStatus} to ${newStatus}. Permitted next statuses: [${allowed.join(", ")}]`
    );
  }
  let populatedStakeholderUser = null;
  let assignedOfficerId = schedule.assignedOfficer;
  let cancellationReason = null;
  await runInTransaction(async (session) => {
    schedule.status = newStatus;
    schedule.updatedBy = user._id;
    if (newStatus === SCHEDULE_STATUSES.IN_PROGRESS) {
      const application = await VerificationApplication.findById(schedule.application).session(session || null);
      if (application && application.currentStatus === APPLICATION_STATUSES.SCHEDULED) {
        await transitionApplicationStatus(
          application,
          APPLICATION_STATUSES.INSPECTION,
          user,
          { session, remarks: remarks || "Field verification inspection commenced" }
        );
      }
      await logAuditEvent(
        {
          user: user._id,
          userRole: user.role,
          userEmail: user.email,
          action: AUDIT_ACTIONS.SCHEDULE_STARTED,
          entity: "VerificationSchedule",
          entityId: schedule._id,
          metadata: { remarks }
        },
        session
      );
    } else if (newStatus === SCHEDULE_STATUSES.COMPLETED) {
      await logAuditEvent(
        {
          user: user._id,
          userRole: user.role,
          userEmail: user.email,
          action: AUDIT_ACTIONS.SCHEDULE_COMPLETED,
          entity: "VerificationSchedule",
          entityId: schedule._id,
          metadata: { remarks }
        },
        session
      );
    } else if (newStatus === SCHEDULE_STATUSES.CANCELLED) {
      cancellationReason = reason || remarks || "Cancelled by administrative authority";
      schedule.cancellationReason = cancellationReason;
      schedule.cancelledBy = user._id;
      schedule.cancelledAt = /* @__PURE__ */ new Date();
      const application = await VerificationApplication.findById(schedule.application).session(session || null);
      if (application && application.currentStatus === APPLICATION_STATUSES.SCHEDULED) {
        const remainingActive = await VerificationSchedule.findOne({
          _id: { $ne: schedule._id },
          application: application._id,
          status: { $in: ACTIVE_SCHEDULE_STATUSES }
        }).session(session || null);
        if (!remainingActive) {
          application.currentStatus = APPLICATION_STATUSES.APPROVED;
          application.statusHistory.push({
            fromStatus: APPLICATION_STATUSES.SCHEDULED,
            toStatus: APPLICATION_STATUSES.APPROVED,
            changedBy: user._id,
            reason: `Schedule cancelled: ${schedule.cancellationReason}`,
            changedAt: /* @__PURE__ */ new Date()
          });
          await application.save(session ? { session } : void 0);
        }
      }
      await logAuditEvent(
        {
          user: user._id,
          userRole: user.role,
          userEmail: user.email,
          action: AUDIT_ACTIONS.SCHEDULE_CANCELLED,
          entity: "VerificationSchedule",
          entityId: schedule._id,
          metadata: { reason: schedule.cancellationReason }
        },
        session
      );
    }
    await schedule.save(session ? { session } : void 0);
  });
  if (newStatus === SCHEDULE_STATUSES.CANCELLED) {
    try {
      const populatedSchedule = await VerificationSchedule.findById(schedule._id).populate("stakeholder");
      if (populatedSchedule?.stakeholder?.user) {
        await createNotification({
          recipient: populatedSchedule.stakeholder.user,
          type: NOTIFICATION_TYPES.SCHEDULE_CANCELLED,
          title: "Verification Schedule Cancelled",
          message: `Your verification schedule has been cancelled. Reason: ${cancellationReason}`,
          relatedEntityType: "Schedule",
          relatedEntityId: schedule._id
        });
      }
      if (assignedOfficerId) {
        await createNotification({
          recipient: assignedOfficerId,
          type: NOTIFICATION_TYPES.SCHEDULE_CANCELLED,
          title: "Verification Schedule Cancelled",
          message: `Verification schedule assigned to you has been cancelled. Reason: ${cancellationReason}`,
          relatedEntityType: "Schedule",
          relatedEntityId: schedule._id
        });
      }
    } catch (e) {
      console.warn("[NOTIFICATION WARNING] Schedule cancelled notification failed:", e.message);
    }
  }
  return schedule;
}

// backend/controllers/scheduleController.js
var scheduleApplication = asyncHandler(async (req, res) => {
  const applicationId = req.body.applicationId || req.body.application;
  const assignedOfficerId = req.body.assignedOfficer || req.body.assignedOfficerId || req.body.officerId;
  const assignedFieldOfficerId = req.body.assignedFieldOfficer || req.body.assignedFieldOfficerId || req.body.fieldOfficerId;
  const verificationCenterId = req.body.verificationCenterId || req.body.verificationCenter || req.body.centerId;
  const gatcId = req.body.gatcId || req.body.assignedGATC || req.body.gatc;
  const scheduledDate = req.body.scheduledDate || req.body.date || req.body.verificationDate;
  const { timeSlot, startTime, endTime, locationType, locationAddress, specialInstructions, notes } = req.body;
  if (!applicationId || !import_mongoose20.default.Types.ObjectId.isValid(applicationId)) {
    throw ApiError.badRequest("A valid application ID is required.");
  }
  if (!assignedOfficerId || !import_mongoose20.default.Types.ObjectId.isValid(assignedOfficerId)) {
    throw ApiError.badRequest("A valid assigned officer ID is required.");
  }
  if (!scheduledDate) {
    throw ApiError.badRequest("Scheduled verification date is required.");
  }
  const application = await VerificationApplication.findById(applicationId).populate("stakeholder");
  if (!application) {
    throw ApiError.notFound("Verification application not found");
  }
  if (application.currentStatus !== APPLICATION_STATUSES.APPROVED) {
    throw ApiError.badRequest(
      `Only APPROVED applications can be scheduled for verification. Current status: ${application.currentStatus}`
    );
  }
  const officer = await User.findById(assignedOfficerId);
  if (!officer) {
    throw ApiError.notFound("Assigned officer not found");
  }
  if (officer.role === USER_ROLES.BUSINESS_USER) {
    throw ApiError.badRequest("A business user cannot be assigned as a verification officer.");
  }
  const allowedOfficerRoles = [
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN
  ];
  if (!allowedOfficerRoles.includes(officer.role)) {
    throw ApiError.badRequest("Invalid officer role: must be an authorized verification officer.");
  }
  if (officer.isActive === false) {
    throw ApiError.badRequest("Selected verification officer account is inactive.");
  }
  let fieldOfficer = null;
  if (assignedFieldOfficerId) {
    if (!import_mongoose20.default.Types.ObjectId.isValid(assignedFieldOfficerId)) {
      throw ApiError.badRequest("Invalid field officer ID.");
    }
    fieldOfficer = await User.findById(assignedFieldOfficerId);
    if (!fieldOfficer) {
      throw ApiError.notFound("Assigned field officer not found");
    }
    if (fieldOfficer.role !== USER_ROLES.FIELD_VERIFICATION_OFFICER) {
      throw ApiError.badRequest("Invalid field officer role: must be FIELD_VERIFICATION_OFFICER.");
    }
    if (fieldOfficer.isActive === false) {
      throw ApiError.badRequest("Selected field verification officer account is inactive.");
    }
  }
  let center = null;
  if (verificationCenterId) {
    if (!import_mongoose20.default.Types.ObjectId.isValid(verificationCenterId)) {
      throw ApiError.badRequest("Invalid verification center ID.");
    }
    center = await VerificationCenter.findById(verificationCenterId);
    if (!center) {
      throw ApiError.notFound("Verification center not found");
    }
    if (center.isActive === false) {
      throw ApiError.badRequest("Selected verification center is inactive or closed for verification.");
    }
  }
  let gatcEntity = null;
  if (gatcId) {
    if (!import_mongoose20.default.Types.ObjectId.isValid(gatcId)) {
      throw ApiError.badRequest("Invalid GATC facility ID.");
    }
    gatcEntity = await GATC.findById(gatcId);
    if (!gatcEntity) {
      throw ApiError.notFound("GATC facility not found");
    }
    if (gatcEntity.isActive === false) {
      throw ApiError.badRequest("Selected GATC facility is inactive.");
    }
  }
  const targetDate = new Date(scheduledDate);
  if (isNaN(targetDate.getTime())) {
    throw ApiError.badRequest("Invalid scheduled date provided.");
  }
  const parsedTime = parseTimeRange(timeSlot, startTime, endTime);
  await checkScheduleConflicts({
    scheduledDate: targetDate,
    startTime: parsedTime.startTime,
    endTime: parsedTime.endTime,
    timeSlot: parsedTime.timeSlot,
    assignedOfficerId,
    assignedFieldOfficerId: fieldOfficer?._id,
    instrumentId: application.instrument,
    verificationCenterId: center?._id,
    applicationId: application._id
  });
  const resolvedAddress = locationAddress || application.verificationLocation?.address || center?.address?.street || "Registered Business Premises";
  const schedule = new VerificationSchedule({
    application: application._id,
    instrument: application.instrument,
    stakeholder: application.stakeholder._id || application.stakeholder,
    assignedOfficer: assignedOfficerId,
    assignedFieldOfficer: fieldOfficer?._id,
    verificationCenter: center?._id,
    assignedGATC: gatcEntity?._id,
    gatc: gatcEntity?._id,
    scheduledDate: targetDate,
    timeSlot: parsedTime.timeSlot,
    startTime: parsedTime.startTime,
    endTime: parsedTime.endTime,
    locationType: locationType || (center ? "DISTRICT_LABORATORY" : "ON_SITE_PREMISES"),
    locationAddress: resolvedAddress,
    specialInstructions: specialInstructions || notes,
    notes: notes || specialInstructions,
    status: SCHEDULE_STATUSES.SCHEDULED,
    createdBy: req.user._id,
    updatedBy: req.user._id
  });
  await runInTransaction(async (session) => {
    await schedule.save(session ? { session } : void 0);
    application.assignedLMO = assignedOfficerId;
    await transitionApplicationStatus(
      application,
      APPLICATION_STATUSES.SCHEDULED,
      req.user,
      {
        session,
        remarks: `Verification scheduled for ${targetDate.toLocaleDateString("en-IN")} (${parsedTime.timeSlot}) with officer ${officer.name}`
      }
    );
    await logAuditEvent(
      {
        user: req.user._id,
        userRole: req.user.role,
        userEmail: req.user.email,
        action: AUDIT_ACTIONS.SCHEDULE_CREATED,
        entity: "VerificationSchedule",
        entityId: schedule._id,
        metadata: {
          applicationNumber: application.applicationNumber,
          officer: officer.name,
          scheduledDate: targetDate.toISOString(),
          timeSlot: parsedTime.timeSlot,
          startTime: parsedTime.startTime,
          endTime: parsedTime.endTime
        }
      },
      session
    );
    await logAuditEvent(
      {
        user: req.user._id,
        userRole: req.user.role,
        userEmail: req.user.email,
        action: AUDIT_ACTIONS.OFFICER_ASSIGNED,
        entity: "VerificationSchedule",
        entityId: schedule._id,
        metadata: { officerId: officer._id, officerName: officer.name }
      },
      session
    );
    if (fieldOfficer) {
      await logAuditEvent(
        {
          user: req.user._id,
          userRole: req.user.role,
          userEmail: req.user.email,
          action: AUDIT_ACTIONS.FIELD_OFFICER_ASSIGNED,
          entity: "VerificationSchedule",
          entityId: schedule._id,
          metadata: { fieldOfficerId: fieldOfficer._id, fieldOfficerName: fieldOfficer.name }
        },
        session
      );
    }
  });
  if (application.stakeholder?.user) {
    await createNotification({
      recipient: application.stakeholder.user,
      type: NOTIFICATION_TYPES.SCHEDULE_CREATED,
      title: "Verification Inspection Scheduled",
      message: `Your verification application ${application.applicationNumber} is scheduled for ${targetDate.toLocaleDateString("en-IN")} (${parsedTime.timeSlot}). Inspecting Officer: ${officer.name}.`,
      relatedEntityType: "Schedule",
      relatedEntityId: schedule._id,
      link: `/applications/${application._id}`
    });
  }
  await createNotification({
    recipient: officer._id,
    type: NOTIFICATION_TYPES.INSPECTION_ASSIGNED,
    title: "New Verification Inspection Assigned",
    message: `You have been allocated verification inspection for application ${application.applicationNumber} on ${targetDate.toLocaleDateString("en-IN")} (${parsedTime.timeSlot}).`,
    relatedEntityType: "Schedule",
    relatedEntityId: schedule._id,
    link: `/inspections/assigned`
  });
  if (fieldOfficer) {
    await createNotification({
      recipient: fieldOfficer._id,
      type: NOTIFICATION_TYPES.INSPECTION_ASSIGNED,
      title: "New Field Inspection Assigned",
      message: `You have been assigned as Field Verification Officer for application ${application.applicationNumber} on ${targetDate.toLocaleDateString("en-IN")} (${parsedTime.timeSlot}).`,
      relatedEntityType: "Schedule",
      relatedEntityId: schedule._id,
      link: `/inspections/assigned`
    });
  }
  if (center) {
    await logAuditEvent({
      user: req.user._id,
      userRole: req.user.role,
      userEmail: req.user.email,
      action: AUDIT_ACTIONS.CENTER_ASSIGNED,
      entity: "VerificationSchedule",
      entityId: schedule._id,
      metadata: { centerId: center._id, centerName: center.name }
    });
  }
  const populated = await VerificationSchedule.findById(schedule._id).populate("application", "applicationNumber currentStatus applicationType verificationLocation").populate("instrument", "instrumentId category serialNumber").populate("stakeholder", "businessName tradeLicenseNumber").populate("assignedOfficer", "name email phone designation jurisdiction").populate("assignedFieldOfficer", "name email phone designation").populate("verificationCenter", "name code address capacityPerDay");
  return ApiResponse.created(res, populated, "Verification schedule created successfully");
});
var rescheduleApplication = asyncHandler(async (req, res) => {
  if (!import_mongoose20.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid schedule ID format");
  }
  const {
    scheduledDate,
    newDate,
    date,
    timeSlot,
    startTime,
    endTime,
    reason,
    assignedOfficer,
    assignedOfficerId,
    officerId,
    assignedFieldOfficerId,
    verificationCenterId
  } = req.body;
  const targetDateInput = scheduledDate || newDate || date;
  if (!targetDateInput) {
    throw ApiError.badRequest("New scheduled verification date is required");
  }
  if (!reason || reason.trim().length < 3) {
    throw ApiError.badRequest("A specific reason for rescheduling (min 3 characters) is required");
  }
  const schedule = await VerificationSchedule.findById(req.params.id).populate("application").populate("assignedOfficer").populate("stakeholder");
  if (!schedule) {
    throw ApiError.notFound("Verification schedule not found");
  }
  if (schedule.status === SCHEDULE_STATUSES.COMPLETED || schedule.status === SCHEDULE_STATUSES.CANCELLED) {
    throw ApiError.badRequest(`Cannot reschedule a ${schedule.status.toLowerCase()} verification appointment.`);
  }
  const targetDate = new Date(targetDateInput);
  if (isNaN(targetDate.getTime())) {
    throw ApiError.badRequest("Invalid new scheduled date provided");
  }
  const parsedTime = parseTimeRange(
    timeSlot || schedule.timeSlot,
    startTime || schedule.startTime,
    endTime || schedule.endTime
  );
  const newOfficerId = assignedOfficer || assignedOfficerId || officerId || schedule.assignedOfficer?._id || schedule.assignedOfficer;
  const newFieldOfficerId = assignedFieldOfficerId || schedule.assignedFieldOfficer;
  const newCenterId = verificationCenterId || schedule.verificationCenter;
  await checkScheduleConflicts({
    scheduledDate: targetDate,
    startTime: parsedTime.startTime,
    endTime: parsedTime.endTime,
    timeSlot: parsedTime.timeSlot,
    assignedOfficerId: newOfficerId,
    assignedFieldOfficerId: newFieldOfficerId,
    instrumentId: schedule.instrument,
    verificationCenterId: newCenterId,
    applicationId: schedule.application?._id || schedule.application,
    excludeScheduleId: schedule._id
  });
  schedule.rescheduleHistory.push({
    previousDate: schedule.scheduledDate,
    newDate: targetDate,
    previousTimeSlot: schedule.timeSlot,
    newTimeSlot: parsedTime.timeSlot,
    previousStartTime: schedule.startTime,
    newStartTime: parsedTime.startTime,
    previousEndTime: schedule.endTime,
    newEndTime: parsedTime.endTime,
    previousOfficer: schedule.assignedOfficer?._id || schedule.assignedOfficer,
    newOfficer: newOfficerId,
    previousCenter: schedule.verificationCenter,
    newCenter: newCenterId,
    reason: reason.trim(),
    rescheduledBy: req.user._id,
    rescheduledAt: /* @__PURE__ */ new Date()
  });
  schedule.scheduledDate = targetDate;
  schedule.timeSlot = parsedTime.timeSlot;
  schedule.startTime = parsedTime.startTime;
  schedule.endTime = parsedTime.endTime;
  if (newOfficerId) schedule.assignedOfficer = newOfficerId;
  if (newFieldOfficerId) schedule.assignedFieldOfficer = newFieldOfficerId;
  if (newCenterId) schedule.verificationCenter = newCenterId;
  schedule.status = SCHEDULE_STATUSES.RESCHEDULED;
  schedule.rescheduleReason = reason.trim();
  schedule.updatedBy = req.user._id;
  await schedule.save();
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.SCHEDULE_RESCHEDULED,
    entity: "VerificationSchedule",
    entityId: schedule._id,
    metadata: {
      newDate: targetDate.toISOString(),
      newTimeSlot: parsedTime.timeSlot,
      startTime: parsedTime.startTime,
      endTime: parsedTime.endTime,
      reason: reason.trim()
    }
  });
  if (schedule.stakeholder?.user) {
    await createNotification({
      recipient: schedule.stakeholder.user,
      type: NOTIFICATION_TYPES.SCHEDULE_CHANGED,
      title: "Verification Inspection Rescheduled",
      message: `Your verification inspection has been rescheduled to ${targetDate.toLocaleDateString("en-IN")} (${parsedTime.timeSlot}). Reason: ${reason.trim()}`,
      relatedEntityType: "Schedule",
      relatedEntityId: schedule._id,
      link: `/applications/${schedule.application?._id || schedule.application}`
    });
  }
  const populated = await VerificationSchedule.findById(schedule._id).populate("application", "applicationNumber currentStatus").populate("instrument", "instrumentId category serialNumber").populate("stakeholder", "businessName tradeLicenseNumber").populate("assignedOfficer", "name email phone designation");
  return ApiResponse.success(res, populated, "Verification schedule rescheduled successfully");
});
var cancelSchedule = asyncHandler(async (req, res) => {
  if (!import_mongoose20.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid schedule ID format");
  }
  const reason = req.body.cancellationReason || req.body.reason;
  if (!reason || reason.trim().length < 3) {
    throw ApiError.badRequest("A mandatory cancellation reason (minimum 3 characters) is required.");
  }
  const schedule = await VerificationSchedule.findById(req.params.id);
  if (!schedule) {
    throw ApiError.notFound("Verification schedule not found");
  }
  if (schedule.status === SCHEDULE_STATUSES.COMPLETED) {
    throw ApiError.badRequest("Cannot cancel a completed verification schedule.");
  }
  if (schedule.status === SCHEDULE_STATUSES.CANCELLED) {
    return ApiResponse.success(res, schedule, "Schedule is already cancelled.");
  }
  await transitionScheduleStatus(schedule, SCHEDULE_STATUSES.CANCELLED, req.user, {
    reason: reason.trim()
  });
  return ApiResponse.success(res, schedule, "Verification schedule cancelled successfully");
});
var updateScheduleStatus = asyncHandler(async (req, res) => {
  if (!import_mongoose20.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid schedule ID format");
  }
  const { status, remarks, reason } = req.body;
  if (!status) {
    throw ApiError.badRequest("New status is required.");
  }
  const schedule = await VerificationSchedule.findById(req.params.id);
  if (!schedule) {
    throw ApiError.notFound("Verification schedule not found");
  }
  await transitionScheduleStatus(schedule, status, req.user, { remarks, reason });
  const populated = await VerificationSchedule.findById(schedule._id).populate("application", "applicationNumber currentStatus").populate("instrument", "instrumentId category serialNumber").populate("stakeholder", "businessName tradeLicenseNumber").populate("assignedOfficer", "name email phone designation");
  return ApiResponse.success(res, populated, `Schedule status updated to ${status}`);
});
var getSchedules = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationParams(req.query);
  const filter = {};
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder) {
      return ApiResponse.success(res, buildPaginationResponse([], 0, page, limit));
    }
    filter.stakeholder = stakeholder._id;
  } else if (req.user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER) {
    filter.$or = [
      { assignedFieldOfficer: req.user._id },
      { assignedOfficer: req.user._id }
    ];
  } else if (req.user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER) {
    if (req.query.assignedToMe === "true") {
      filter.assignedOfficer = req.user._id;
    }
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.officerId && import_mongoose20.default.Types.ObjectId.isValid(req.query.officerId)) {
    filter.assignedOfficer = req.query.officerId;
  }
  if (req.query.applicationId && import_mongoose20.default.Types.ObjectId.isValid(req.query.applicationId)) {
    filter.application = req.query.applicationId;
  }
  if (req.query.instrumentId && import_mongoose20.default.Types.ObjectId.isValid(req.query.instrumentId)) {
    filter.instrument = req.query.instrumentId;
  }
  if (req.query.centerId && import_mongoose20.default.Types.ObjectId.isValid(req.query.centerId)) {
    filter.verificationCenter = req.query.centerId;
  }
  const startDate = req.query.startDate || req.query.fromDate || req.query.start;
  const endDate = req.query.endDate || req.query.toDate || req.query.end;
  if (startDate && endDate) {
    filter.scheduledDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else if (startDate) {
    filter.scheduledDate = { $gte: new Date(startDate) };
  } else if (endDate) {
    filter.scheduledDate = { $lte: new Date(endDate) };
  }
  const [schedules, total] = await Promise.all([
    VerificationSchedule.find(filter).populate("application", "applicationNumber currentStatus verificationLocation applicationType").populate("instrument", "instrumentId category serialNumber manufacturer").populate("stakeholder", "businessName tradeLicenseNumber").populate("assignedOfficer", "name email phone designation").populate("assignedFieldOfficer", "name email phone designation").populate("verificationCenter", "name code address capacityPerDay").sort(sort).skip(skip).limit(limit),
    VerificationSchedule.countDocuments(filter)
  ]);
  return ApiResponse.success(
    res,
    buildPaginationResponse(schedules, total, page, limit),
    "Schedules retrieved successfully"
  );
});
var getScheduleById = asyncHandler(async (req, res) => {
  if (!import_mongoose20.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid schedule ID format");
  }
  const schedule = await VerificationSchedule.findById(req.params.id).populate("application").populate("instrument").populate("stakeholder").populate("assignedOfficer", "name email phone designation jurisdiction").populate("assignedFieldOfficer", "name email phone designation").populate("verificationCenter", "name code address capacityPerDay");
  if (!schedule) {
    throw ApiError.notFound("Schedule not found");
  }
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(schedule.stakeholder?._id || schedule.stakeholder) !== String(stakeholder._id)) {
      throw ApiError.forbidden("You are not authorized to view this schedule.");
    }
  } else if (req.user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER) {
    const isAssigned = String(schedule.assignedFieldOfficer?._id || schedule.assignedFieldOfficer || "") === String(req.user._id) || String(schedule.assignedOfficer?._id || schedule.assignedOfficer || "") === String(req.user._id);
    if (!isAssigned) {
      throw ApiError.forbidden("You are not authorized to view this schedule.");
    }
  }
  return ApiResponse.success(res, schedule, "Schedule retrieved successfully");
});
var getMySchedules = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder) {
      return ApiResponse.success(res, [], "No schedules found");
    }
    filter.stakeholder = stakeholder._id;
  } else if (req.user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER) {
    filter.$or = [
      { assignedFieldOfficer: req.user._id },
      { assignedOfficer: req.user._id }
    ];
  } else {
    filter.assignedOfficer = req.user._id;
  }
  const schedules = await VerificationSchedule.find(filter).populate("application", "applicationNumber currentStatus").populate("instrument", "instrumentId category serialNumber").populate("stakeholder", "businessName tradeLicenseNumber").populate("verificationCenter", "name code").sort({ scheduledDate: 1 });
  return ApiResponse.success(res, schedules, "User schedules retrieved successfully");
});
var getCalendarSchedules = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder) {
      return ApiResponse.success(res, []);
    }
    filter.stakeholder = stakeholder._id;
  } else if (req.user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER) {
    filter.$or = [
      { assignedFieldOfficer: req.user._id },
      { assignedOfficer: req.user._id }
    ];
  }
  const startDate = req.query.start || req.query.dateFrom || req.query.startDate;
  const endDate = req.query.end || req.query.dateTo || req.query.endDate;
  if (startDate && endDate) {
    filter.scheduledDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else if (startDate) {
    filter.scheduledDate = { $gte: new Date(startDate) };
  } else if (endDate) {
    filter.scheduledDate = { $lte: new Date(endDate) };
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.officerId && import_mongoose20.default.Types.ObjectId.isValid(req.query.officerId)) {
    filter.assignedOfficer = req.query.officerId;
  }
  if (req.query.centerId && import_mongoose20.default.Types.ObjectId.isValid(req.query.centerId)) {
    filter.verificationCenter = req.query.centerId;
  }
  const schedules = await VerificationSchedule.find(filter).populate("application", "applicationNumber currentStatus").populate("instrument", "instrumentId category serialNumber").populate("assignedOfficer", "name").populate("verificationCenter", "name");
  const events = schedules.map((s) => {
    const dateStr = s.scheduledDate.toISOString().split("T")[0];
    const startTimeStr = s.startTime || "09:00";
    const endTimeStr = s.endTime || "12:00";
    return {
      id: s._id,
      title: `LM Verification - ${s.instrument?.category || "Instrument"} (${s.application?.applicationNumber || ""})`,
      start: `${dateStr}T${startTimeStr}:00.000Z`,
      end: `${dateStr}T${endTimeStr}:00.000Z`,
      status: s.status,
      timeSlot: s.timeSlot,
      startTime: s.startTime,
      endTime: s.endTime,
      applicationNumber: s.application?.applicationNumber,
      officer: s.assignedOfficer?.name,
      center: s.verificationCenter?.name,
      location: s.locationAddress,
      locationType: s.locationType
    };
  });
  return ApiResponse.success(res, events, "Calendar schedules retrieved successfully");
});
var checkAvailability = asyncHandler(async (req, res) => {
  const { date, startTime, endTime, timeSlot, officerId, fieldOfficerId, instrumentId, centerId } = req.query;
  if (!date) {
    throw ApiError.badRequest("Date is required to check availability.");
  }
  const availability = await calculateAvailability({
    date,
    startTime,
    endTime,
    timeSlot,
    officerId,
    fieldOfficerId,
    instrumentId,
    centerId
  });
  return ApiResponse.success(res, availability, "Availability calculated successfully");
});

// backend/routes/scheduleRoutes.js
init_constants();
var router6 = (0, import_express6.Router)();
router6.use(protect);
router6.get("/calendar", getCalendarSchedules);
router6.get("/availability", checkAvailability);
router6.get("/my", getMySchedules);
router6.get("/", getSchedules);
router6.post(
  "/",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  validate(scheduleApplicationSchema),
  scheduleApplication
);
router6.get("/:id", getScheduleById);
router6.post(
  "/:id/reschedule",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  validate(rescheduleApplicationSchema),
  rescheduleApplication
);
router6.patch(
  "/:id/reschedule",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  validate(rescheduleApplicationSchema),
  rescheduleApplication
);
router6.post(
  "/:id/cancel",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  validate(cancelScheduleSchema),
  cancelSchedule
);
router6.patch(
  "/:id/cancel",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  validate(cancelScheduleSchema),
  cancelSchedule
);
router6.patch(
  "/:id/status",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  updateScheduleStatus
);
var scheduleRoutes_default = router6;

// backend/routes/inspectionRoutes.js
var import_express7 = require("express");

// backend/controllers/inspectionController.js
var import_mongoose21 = __toESM(require("mongoose"), 1);
init_VerificationInspection();
init_VerificationApplication();
init_VerificationSchedule();
init_constants();

// backend/services/inspectionService.js
init_VerificationInspection();
init_VerificationSchedule();
init_VerificationApplication();
init_VerificationResult();
init_Instrument();
init_Stakeholder();
init_constants();

// backend/services/certificateService.js
var import_crypto3 = __toESM(require("crypto"), 1);
init_Certificate();
init_VerificationInspection();
init_VerificationApplication();
init_Instrument();
init_Stakeholder();

// backend/services/qrService.js
var import_qrcode = __toESM(require("qrcode"), 1);
async function generateVerificationQR(qrVerificationToken) {
  const baseUrl = ENV.SERVER_URL || "http://localhost:3000";
  const publicVerificationUrl = `${baseUrl}/api/public/certificates/verify/${qrVerificationToken}`;
  try {
    const qrDataUrl = await import_qrcode.default.toDataURL(publicVerificationUrl, {
      errorCorrectionLevel: "H",
      type: "image/png",
      margin: 2,
      width: 280,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    });
    return {
      publicVerificationUrl,
      qrDataUrl
    };
  } catch (error) {
    console.error("[QR GENERATION ERROR] Failed to generate QR code:", error.message);
    throw error;
  }
}

// backend/services/pdfService.js
var import_pdfkit = __toESM(require("pdfkit"), 1);
var import_fs4 = __toESM(require("fs"), 1);
var import_path5 = __toESM(require("path"), 1);
async function generateCertificatePDF({
  certificateNumber,
  applicationNumber,
  stakeholder,
  instrument,
  verificationDate,
  validUntil,
  verificationResult = "VERIFIED (PASS)",
  officer,
  qrDataUrl,
  qrToken,
  verificationUrl,
  tamperEvidentHash
}) {
  return new Promise((resolve, reject) => {
    try {
      const certsDir = import_path5.default.join(ENV.UPLOAD_DIR, "certificates");
      if (!import_fs4.default.existsSync(certsDir)) {
        import_fs4.default.mkdirSync(certsDir, { recursive: true });
      }
      const fileName = `${certificateNumber}.pdf`;
      const filePath = import_path5.default.join(certsDir, fileName);
      const writeStream = import_fs4.default.createWriteStream(filePath);
      const doc = new import_pdfkit.default({
        size: "A4",
        margin: 40,
        info: {
          Title: `e-Maap Verify Certificate - ${certificateNumber}`,
          Author: "Department of Consumer Affairs, Government of India (e-Maap Verify)",
          Subject: "Verification and Stamping Certificate under Legal Metrology Act, 2009"
        }
      });
      doc.pipe(writeStream);
      doc.lineWidth(3).strokeColor("#1e3a8a").rect(20, 20, 555, 802).stroke();
      doc.lineWidth(1).strokeColor("#b45309").rect(26, 26, 543, 790).stroke();
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#0284c7").text("e-Maap Verify \u2014 National Digital Legal Metrology Portal", { align: "center" });
      doc.moveDown(0.3);
      doc.font("Helvetica-Bold").fontSize(16).fillColor("#0f172a").text("GOVERNMENT OF INDIA", { align: "center" });
      doc.font("Helvetica").fontSize(11).fillColor("#334155").text("MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION", { align: "center" });
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#0369a1").text("DEPARTMENT OF CONSUMER AFFAIRS (DoCA)", { align: "center" });
      doc.font("Helvetica-Oblique").fontSize(9.5).fillColor("#64748b").text("LEGAL METROLOGY DIVISION \u2014 e-Maap Verify Certification Authority", { align: "center" });
      doc.moveDown(0.6);
      doc.font("Helvetica-Bold").fontSize(15).fillColor("#b45309").text("CERTIFICATE OF VERIFICATION", { align: "center" });
      doc.font("Helvetica").fontSize(8.5).fillColor("#475569").text("[Under Section 24 of Legal Metrology Act, 2009 & Rule 14 of Legal Metrology (General) Rules]", {
        align: "center"
      });
      doc.moveDown(0.8);
      const startY = doc.y;
      doc.rect(40, startY, 515, 30).fillAndStroke("#f8fafc", "#cbd5e1");
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text(`Certificate No: ${certificateNumber}`, 50, startY + 9);
      doc.font("Helvetica").fontSize(10).fillColor("#475569").text(`Application Ref: ${applicationNumber}`, 320, startY + 9, { align: "right", width: 220 });
      doc.moveDown(1.8);
      doc.font("Helvetica").fontSize(9.5).fillColor("#1e293b").text(
        "This is to certify that the weighing / measuring instrument described below has been verified and stamped in accordance with the specifications, test tolerances, and guidelines prescribed under the Legal Metrology Act, 2009 and Rules framed thereunder.",
        { align: "justify", lineGap: 3 }
      );
      doc.moveDown(0.8);
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#0369a1").text("1. STAKEHOLDER & PREMISES DETAILS");
      doc.lineWidth(0.5).strokeColor("#e2e8f0").moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(0.4);
      const stY = doc.y;
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#334155").text("Business Name:", 45, stY);
      doc.font("Helvetica").fontSize(9).fillColor("#0f172a").text(stakeholder.businessName || "N/A", 160, stY);
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#334155").text("Trade License / Reg:", 45, stY + 16);
      doc.font("Helvetica").fontSize(9).fillColor("#0f172a").text(stakeholder.tradeLicenseNumber || "N/A", 160, stY + 16);
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#334155").text("GST Number:", 330, stY + 16);
      doc.font("Helvetica").fontSize(9).fillColor("#0f172a").text(stakeholder.gstNumber || "N/A", 410, stY + 16);
      const addressStr = `${stakeholder.registeredAddress?.street || ""}, ${stakeholder.registeredAddress?.district || ""}, ${stakeholder.registeredAddress?.state || ""} - ${stakeholder.registeredAddress?.pincode || ""}`;
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#334155").text("Premises Address:", 45, stY + 32);
      doc.font("Helvetica").fontSize(9).fillColor("#0f172a").text(addressStr, 160, stY + 32, { width: 380 });
      doc.y = stY + 54;
      doc.moveDown(0.5);
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#0369a1").text("2. INSTRUMENT SPECIFICATIONS");
      doc.lineWidth(0.5).strokeColor("#e2e8f0").moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(0.4);
      const insY = doc.y;
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#334155").text("Instrument ID:", 45, insY);
      doc.font("Helvetica").fontSize(9).fillColor("#0f172a").text(instrument.instrumentId, 160, insY);
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#334155").text("Instrument Category:", 330, insY);
      doc.font("Helvetica").fontSize(9).fillColor("#0f172a").text(instrument.category, 435, insY);
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#334155").text("Make / Manufacturer:", 45, insY + 16);
      doc.font("Helvetica").fontSize(9).fillColor("#0f172a").text(instrument.manufacturer, 160, insY + 16);
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#334155").text("Model & Serial No:", 330, insY + 16);
      doc.font("Helvetica").fontSize(9).fillColor("#0f172a").text(`${instrument.modelNumber} / S.No: ${instrument.serialNumber}`, 435, insY + 16);
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#334155").text("Capacity / Range:", 45, insY + 32);
      const capacityText = typeof instrument.capacity === "object" && instrument.capacity !== null ? `${instrument.capacity.value ?? ""} ${instrument.capacity.unit ?? ""}`.trim() : String(instrument.capacity || "N/A");
      doc.font("Helvetica").fontSize(9).fillColor("#0f172a").text(capacityText || "N/A", 160, insY + 32);
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#334155").text("Accuracy Class:", 330, insY + 32);
      doc.font("Helvetica").fontSize(9).fillColor("#0f172a").text(instrument.accuracyClass, 435, insY + 32);
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#334155").text("Scale Interval (e):", 45, insY + 48);
      doc.font("Helvetica").fontSize(9).fillColor("#0f172a").text(instrument.verificationScaleInterval_e || "N/A", 160, insY + 48);
      doc.y = insY + 68;
      doc.moveDown(0.5);
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#0369a1").text("3. VERIFICATION RESULT & STATUTORY VALIDITY");
      doc.lineWidth(0.5).strokeColor("#e2e8f0").moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(0.4);
      const valY = doc.y;
      doc.rect(40, valY, 515, 42).fillAndStroke("#ecfdf5", "#a7f3d0");
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#065f46").text("Verification Date:", 50, valY + 8);
      doc.font("Helvetica").fontSize(9).fillColor("#0f172a").text(new Date(verificationDate).toLocaleDateString("en-IN", { dateStyle: "long" }), 160, valY + 8);
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#065f46").text("Verification Result:", 310, valY + 8);
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#047857").text(String(verificationResult), 425, valY + 8);
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#065f46").text("Valid From:", 50, valY + 24);
      doc.font("Helvetica").fontSize(9).fillColor("#0f172a").text(new Date(verificationDate).toLocaleDateString("en-IN"), 160, valY + 24);
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#065f46").text("Valid Until (Mandatory Due):", 310, valY + 24);
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#b91c1c").text(new Date(validUntil).toLocaleDateString("en-IN", { dateStyle: "long" }), 455, valY + 24);
      doc.y = valY + 52;
      doc.moveDown(0.5);
      const qrBoxY = doc.y;
      if (qrDataUrl) {
        const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
        const qrBuffer = Buffer.from(base64Data, "base64");
        doc.image(qrBuffer, 45, qrBoxY, { width: 90, height: 90 });
      }
      const verifyUrl = verificationUrl || `${ENV.SERVER_URL || "http://localhost:3000"}/api/public/certificates/verify/${qrToken || certificateNumber}`;
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#0f172a").text("SCAN QR CODE TO VERIFY AUTHENTICITY", 145, qrBoxY + 5);
      doc.font("Helvetica").fontSize(7.5).fillColor("#475569").text("Official digital verification certificate under DoCA Legal Metrology e-Maap Verify initiative.", 145, qrBoxY + 18, { width: 220 });
      doc.font("Helvetica-Bold").fontSize(7).fillColor("#0369a1").text(`Verification URL: ${verifyUrl}`, 145, qrBoxY + 32, { width: 220 });
      doc.font("Courier").fontSize(6.5).fillColor("#64748b").text(`Tamper Digest: ${tamperEvidentHash.substring(0, 32)}...`, 145, qrBoxY + 68);
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#0f172a").text(officer.name || "Legal Metrology Officer", 380, qrBoxY + 25, { align: "center", width: 170 });
      doc.font("Helvetica").fontSize(8.5).fillColor("#475569").text(`LMO / Inspector of Legal Metrology`, 380, qrBoxY + 39, { align: "center", width: 170 });
      doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(`Jurisdiction: ${officer.jurisdiction?.district || "Central District"}`, 380, qrBoxY + 53, { align: "center", width: 170 });
      doc.font("Helvetica").fontSize(7.5).fillColor("#94a3b8").text("This is an electronically generated statutory certificate under the IT Act, 2000 & Legal Metrology Act, 2009. e-Maap Verify.", 40, 790, {
        align: "center",
        width: 515
      });
      doc.end();
      writeStream.on("finish", () => {
        resolve({
          fileName,
          filePath,
          relativeUrl: `/uploads/certificates/${fileName}`
        });
      });
      writeStream.on("error", (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// backend/services/certificateService.js
init_constants();
function getDynamicStatus(certificate) {
  if (certificate.certificateStatus === CERTIFICATE_STATUSES.REVOKED || certificate.status === CERTIFICATE_STATUSES.REVOKED) {
    return CERTIFICATE_STATUSES.REVOKED;
  }
  if (certificate.certificateStatus === CERTIFICATE_STATUSES.CANCELLED || certificate.status === CERTIFICATE_STATUSES.CANCELLED) {
    return CERTIFICATE_STATUSES.CANCELLED;
  }
  if (/* @__PURE__ */ new Date() > new Date(certificate.validUntil)) {
    return CERTIFICATE_STATUSES.EXPIRED;
  }
  return CERTIFICATE_STATUSES.ACTIVE;
}
async function generateCertificateForInspection({ inspectionId, user }) {
  const allowedRoles = [
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN
  ];
  if (!user || !allowedRoles.includes(user.role)) {
    throw ApiError.forbidden("You are not authorized to generate verification certificates.");
  }
  if (!inspectionId) {
    throw ApiError.badRequest("Inspection ID is required.");
  }
  const inspection = await VerificationInspection.findById(inspectionId).populate("application").populate("instrument").populate("stakeholder");
  if (!inspection) {
    throw ApiError.notFound("Inspection record not found.");
  }
  const isFinalized = inspection.isFinalized || inspection.inspectionStatus === INSPECTION_STATUSES.PASSED || inspection.inspectionStatus === INSPECTION_STATUSES.FAILED;
  if (!isFinalized) {
    throw ApiError.badRequest("Inspection is not finalized. Cannot generate certificate for unfinalized inspection.");
  }
  const isPassed = inspection.inspectionStatus === INSPECTION_STATUSES.PASSED || inspection.result === INSPECTION_RESULTS.VERIFIED || inspection.result === VERIFICATION_VERDICTS.PASS;
  if (!isPassed) {
    throw ApiError.badRequest("Cannot generate verification certificate for a failed or rejected inspection.");
  }
  const application = inspection.application;
  const instrument = inspection.instrument;
  const stakeholder = inspection.stakeholder;
  if (!application || !instrument || !stakeholder) {
    throw ApiError.badRequest("Inspection record is missing linked application, instrument, or stakeholder entity.");
  }
  const existingCertificate = await Certificate.findOne({
    $or: [{ inspection: inspection._id }, { application: application._id }]
  });
  if (existingCertificate) {
    const status = getDynamicStatus(existingCertificate);
    if (status !== CERTIFICATE_STATUSES.REVOKED && status !== CERTIFICATE_STATUSES.CANCELLED) {
      throw ApiError.badRequest(
        `A verification certificate (${existingCertificate.certificateNumber}) has already been issued for this inspection.`
      );
    }
  }
  const issuedAt = /* @__PURE__ */ new Date();
  const validFrom = new Date(inspection.finalizedAt || inspection.inspectionDate || issuedAt);
  const validUntil = new Date(validFrom);
  const intervalMonths = instrument.verificationIntervalMonths || 12;
  validUntil.setMonth(validUntil.getMonth() + intervalMonths);
  validUntil.setDate(validUntil.getDate() - 1);
  const year = validFrom.getFullYear();
  const certCount = await Certificate.countDocuments();
  const paddedIndex = String(certCount + 1).padStart(5, "0");
  const randomSuffix = import_crypto3.default.randomBytes(2).toString("hex").toUpperCase();
  const certificateNumber = `LM-CERT-${year}-${paddedIndex}-${randomSuffix}`;
  const qrToken = import_crypto3.default.randomBytes(32).toString("hex");
  const hashPayload = `${certificateNumber}|${application.applicationNumber || application._id}|${instrument.instrumentId || instrument.serialNumber}|${stakeholder.tradeLicenseNumber || stakeholder._id}|${validFrom.toISOString()}|${validUntil.toISOString()}|${user._id}`;
  const tamperEvidentHash = import_crypto3.default.createHash("sha256").update(hashPayload).digest("hex");
  const { publicVerificationUrl, qrDataUrl } = await generateVerificationQR(qrToken);
  const pdfResult = await generateCertificatePDF({
    certificateNumber,
    applicationNumber: application.applicationNumber,
    stakeholder,
    instrument,
    verificationDate: validFrom,
    validUntil,
    verificationResult: "VERIFIED (PASS)",
    officer: user,
    qrDataUrl,
    qrToken,
    verificationUrl: publicVerificationUrl,
    tamperEvidentHash
  });
  const certificate = new Certificate({
    certificateNumber,
    application: application._id,
    inspection: inspection._id,
    instrument: instrument._id,
    stakeholder: stakeholder._id,
    issuedBy: user._id,
    issuedByOfficer: user._id,
    issuedAt,
    verificationDate: validFrom,
    validFrom,
    validUntil,
    verificationType: application.applicationType || "INITIAL_VERIFICATION",
    result: "VERIFIED",
    certificateStatus: CERTIFICATE_STATUSES.ACTIVE,
    status: CERTIFICATE_STATUSES.ACTIVE,
    certificateUrl: pdfResult.relativeUrl,
    certificatePdfPath: pdfResult.relativeUrl,
    pdfUrl: pdfResult.relativeUrl,
    qrToken,
    qrVerificationToken: qrToken,
    qrCodeToken: qrToken,
    qrUrl: publicVerificationUrl,
    qrCodeDataUrl: qrDataUrl,
    tamperEvidentHash,
    cryptographicHash: tamperEvidentHash,
    issuingAuthority: "Department of Consumer Affairs, Legal Metrology Division, Government of India"
  });
  await runInTransaction(async (session) => {
    await certificate.save(session ? { session } : void 0);
    application.currentStatus = APPLICATION_STATUSES.CERTIFICATE_GENERATED;
    application.statusHistory.push({
      fromStatus: APPLICATION_STATUSES.VERIFIED,
      toStatus: APPLICATION_STATUSES.CERTIFICATE_GENERATED,
      changedBy: user._id,
      remarks: `Digital certificate ${certificateNumber} generated.`,
      timestamp: /* @__PURE__ */ new Date()
    });
    await application.save(session ? { session } : void 0);
    await Instrument.findByIdAndUpdate(
      instrument._id,
      {
        status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED,
        lastVerificationDate: validFrom,
        nextVerificationDueDate: validUntil
      },
      session ? { session } : void 0
    );
    await logAuditEvent({
      user: user._id,
      userRole: user.role,
      userEmail: user.email,
      action: AUDIT_ACTIONS.CERTIFICATE_GENERATED,
      entity: "Certificate",
      entityId: certificate._id,
      metadata: {
        certificateNumber,
        inspectionId: inspection._id,
        applicationId: application._id,
        instrumentId: instrument._id,
        validUntil: validUntil.toISOString()
      }
    }, session);
  });
  const stakeholderRecord = await Stakeholder.findById(stakeholder._id).select("user businessName");
  if (stakeholderRecord?.user) {
    await createNotification({
      recipient: stakeholderRecord.user,
      type: NOTIFICATION_TYPES.CERTIFICATE_ISSUED,
      title: "Verification Certificate Issued",
      message: `Digital Certificate ${certificateNumber} has been issued for instrument ${instrument.instrumentId || instrument.serialNumber}. Valid until ${validUntil.toLocaleDateString("en-IN")}.`,
      relatedEntityType: "Certificate",
      relatedEntityId: certificate._id,
      link: `/certificates/${certificate._id}`
    });
  }
  return certificate;
}
async function revokeCertificate({ certificateId, user, reason }) {
  const allowedRoles = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];
  if (!user || !allowedRoles.includes(user.role)) {
    throw ApiError.forbidden("Only Administrators are authorized to revoke verification certificates.");
  }
  if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
    throw ApiError.badRequest("A specific statutory reason (minimum 5 characters) is required for certificate revocation.");
  }
  const certificate = await Certificate.findById(certificateId);
  if (!certificate) {
    throw ApiError.notFound("Certificate not found.");
  }
  if (certificate.certificateStatus === CERTIFICATE_STATUSES.REVOKED || certificate.status === CERTIFICATE_STATUSES.REVOKED) {
    throw ApiError.badRequest("Certificate is already marked as REVOKED.");
  }
  const now = /* @__PURE__ */ new Date();
  certificate.certificateStatus = CERTIFICATE_STATUSES.REVOKED;
  certificate.status = CERTIFICATE_STATUSES.REVOKED;
  certificate.revokedAt = now;
  certificate.revokedBy = user._id;
  certificate.revocationReason = reason.trim();
  certificate.revocationDetails = {
    revokedAt: now,
    revokedBy: user._id,
    reason: reason.trim()
  };
  await runInTransaction(async (session) => {
    await certificate.save(session ? { session } : void 0);
    await Instrument.findByIdAndUpdate(
      certificate.instrument,
      { status: INSTRUMENT_STATUSES.REJECTED },
      session ? { session } : void 0
    );
    await logAuditEvent({
      user: user._id,
      userRole: user.role,
      userEmail: user.email,
      action: AUDIT_ACTIONS.CERTIFICATE_REVOKED,
      entity: "Certificate",
      entityId: certificate._id,
      metadata: {
        certificateNumber: certificate.certificateNumber,
        reason: reason.trim(),
        revokedAt: now.toISOString()
      }
    }, session);
  });
  const stakeholder = await Stakeholder.findById(certificate.stakeholder).select("user businessName");
  if (stakeholder?.user) {
    await createNotification({
      recipient: stakeholder.user,
      type: NOTIFICATION_TYPES.SYSTEM_ALERT,
      title: "Certificate Revoked",
      message: `Verification certificate ${certificate.certificateNumber} has been revoked by the Legal Metrology Department. Reason: ${reason.trim()}`,
      relatedEntityType: "Certificate",
      relatedEntityId: certificate._id,
      link: `/certificates/${certificate._id}`
    });
  }
  return certificate;
}
async function getPublicCertificateVerification(token) {
  if (!token) {
    throw ApiError.badRequest("Verification token is required.");
  }
  const certificate = await Certificate.findOne({
    $or: [
      { qrToken: token },
      { qrVerificationToken: token },
      { qrCodeToken: token },
      { certificateNumber: token }
    ]
  }).populate("stakeholder", "businessName tradeLicenseNumber registeredAddress").populate(
    "instrument",
    "instrumentId category instrumentType manufacturer modelNumber serialNumber capacity accuracyClass verificationScaleInterval_e installationAddress"
  ).populate("issuedBy", "name designation jurisdiction").populate("issuedByOfficer", "name designation jurisdiction");
  if (!certificate) {
    return null;
  }
  const dynamicStatus = getDynamicStatus(certificate);
  const isRevoked = dynamicStatus === CERTIFICATE_STATUSES.REVOKED;
  const isExpired = dynamicStatus === CERTIFICATE_STATUSES.EXPIRED;
  const isValid = dynamicStatus === CERTIFICATE_STATUSES.ACTIVE || dynamicStatus === CERTIFICATE_STATUSES.VALID;
  const officer = certificate.issuedBy || certificate.issuedByOfficer;
  const revocationReason = certificate.revocationReason || certificate.revocationDetails?.reason || null;
  return {
    _id: certificate._id,
    id: certificate._id,
    certificateNumber: certificate.certificateNumber,
    qrCodeToken: certificate.qrToken || certificate.qrVerificationToken,
    status: dynamicStatus,
    certificateStatus: dynamicStatus,
    isValid,
    isExpired,
    isRevoked,
    revocationReason: isRevoked ? revocationReason : null,
    verificationResult: certificate.result || "VERIFIED",
    verificationDate: certificate.verificationDate || certificate.issuedAt,
    issuedAt: certificate.issuedAt,
    validFrom: certificate.validFrom,
    validUntil: certificate.validUntil,
    issuingAuthority: certificate.issuingAuthority,
    tamperEvidentHash: certificate.tamperEvidentHash,
    verificationUrl: certificate.qrUrl,
    stakeholder: {
      businessName: certificate.stakeholder?.businessName,
      tradeLicenseNumber: certificate.stakeholder?.tradeLicenseNumber,
      district: certificate.stakeholder?.registeredAddress?.district,
      state: certificate.stakeholder?.registeredAddress?.state
    },
    instrument: {
      instrumentId: certificate.instrument?.instrumentId,
      category: certificate.instrument?.category,
      instrumentType: certificate.instrument?.instrumentType,
      manufacturer: certificate.instrument?.manufacturer,
      modelNumber: certificate.instrument?.modelNumber,
      serialNumber: certificate.instrument?.serialNumber,
      capacity: certificate.instrument?.capacity,
      accuracyClass: certificate.instrument?.accuracyClass,
      scaleInterval: certificate.instrument?.verificationScaleInterval_e,
      premiseLocation: certificate.instrument?.installationAddress?.premiseName
    },
    officer: {
      name: officer?.name,
      designation: officer?.designation || "Inspector of Legal Metrology",
      jurisdiction: officer?.jurisdiction?.district
    },
    revocationDetails: isRevoked ? {
      revokedAt: certificate.revokedAt || certificate.revocationDetails?.revokedAt,
      reason: certificate.revocationReason || certificate.revocationDetails?.reason
    } : null
  };
}
async function issueVerificationCertificate({
  applicationId,
  officerId,
  verificationDate = /* @__PURE__ */ new Date()
}) {
  const application = await VerificationApplication.findById(applicationId);
  if (!application) {
    throw ApiError.notFound("Application not found");
  }
  const inspection = await VerificationInspection.findOne({
    application: applicationId
  });
  const user = await User.findById(officerId);
  if (!user) {
    throw ApiError.notFound("Officer not found");
  }
  if (inspection) {
    return generateCertificateForInspection({
      inspectionId: inspection._id,
      user
    });
  }
  const existing = await Certificate.findOne({ application: applicationId });
  if (existing) return existing;
  throw ApiError.badRequest("No finalized inspection found for application.");
}

// backend/services/inspectionService.js
async function startInspection(scheduleId, user) {
  if (user.role === USER_ROLES.BUSINESS_USER) {
    throw ApiError.forbidden("Business users are not authorized to start official inspections.");
  }
  const schedule = await VerificationSchedule.findById(scheduleId).populate("application").populate("instrument").populate("stakeholder");
  if (!schedule) {
    throw ApiError.notFound("Verification schedule not found.");
  }
  if (schedule.status === SCHEDULE_STATUSES.CANCELLED) {
    throw ApiError.badRequest("Cannot start inspection for a cancelled schedule.");
  }
  if (schedule.status === SCHEDULE_STATUSES.COMPLETED) {
    throw ApiError.badRequest("Cannot start inspection for an already completed schedule.");
  }
  const isAssignedOfficer = String(schedule.assignedOfficer?._id || schedule.assignedOfficer) === String(user._id);
  const isAssignedFieldOfficer = schedule.assignedFieldOfficer && String(schedule.assignedFieldOfficer?._id || schedule.assignedFieldOfficer) === String(user._id);
  const isAdmin = user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN;
  if (!isAssignedOfficer && !isAssignedFieldOfficer && !isAdmin) {
    throw ApiError.forbidden("You are not authorized to inspect this schedule.");
  }
  const application = schedule.application;
  if (!application) {
    throw ApiError.notFound("Associated application not found.");
  }
  if (application.currentStatus !== APPLICATION_STATUSES.APPROVED && application.currentStatus !== APPLICATION_STATUSES.SCHEDULED && application.currentStatus !== APPLICATION_STATUSES.INSPECTION) {
    throw ApiError.badRequest(
      `Cannot start inspection on application in '${application.currentStatus}' state. Must be APPROVED, SCHEDULED, or INSPECTION.`
    );
  }
  const existingActiveInspection = await VerificationInspection.findOne({
    schedule: schedule._id,
    inspectionStatus: {
      $in: [
        INSPECTION_STATUSES.DRAFT,
        INSPECTION_STATUSES.IN_PROGRESS,
        INSPECTION_STATUSES.SUBMITTED,
        INSPECTION_STATUSES.UNDER_REVIEW
      ]
    }
  });
  if (existingActiveInspection) {
    throw ApiError.conflict("An active inspection is already in progress for this schedule.");
  }
  const randomSuffix = Math.floor(1e5 + Math.random() * 9e5);
  const inspectionNumber = `INSP-${(/* @__PURE__ */ new Date()).getFullYear()}-${randomSuffix}`;
  const inspection = new VerificationInspection({
    inspectionNumber,
    schedule: schedule._id,
    application: application._id,
    instrument: schedule.instrument._id || schedule.instrument,
    stakeholder: schedule.stakeholder?._id || schedule.stakeholder,
    assignedOfficer: user._id,
    officer: user._id,
    // backward compatibility
    verificationCenter: schedule.verificationCenter,
    gatc: schedule.gatc,
    location: schedule.locationAddress || "Field inspection site",
    startTime: /* @__PURE__ */ new Date(),
    inspectionDate: /* @__PURE__ */ new Date(),
    inspectionStatus: INSPECTION_STATUSES.IN_PROGRESS,
    createdBy: user._id,
    updatedBy: user._id
  });
  await inspection.save();
  schedule.status = SCHEDULE_STATUSES.IN_PROGRESS;
  await schedule.save();
  if (application.currentStatus !== APPLICATION_STATUSES.INSPECTION) {
    const fromStatus = application.currentStatus;
    application.currentStatus = APPLICATION_STATUSES.INSPECTION;
    application.statusHistory.push({
      fromStatus,
      toStatus: APPLICATION_STATUSES.INSPECTION,
      changedBy: user._id,
      remarks: "Field metrological testing and verification inspection commenced",
      timestamp: /* @__PURE__ */ new Date()
    });
    await application.save();
  }
  await logAuditEvent({
    user: user._id,
    userRole: user.role,
    userEmail: user.email,
    action: AUDIT_ACTIONS.INSPECTION_STARTED,
    entity: "VerificationInspection",
    entityId: inspection._id,
    metadata: {
      inspectionNumber: inspection.inspectionNumber,
      scheduleId: schedule._id,
      applicationNumber: application.applicationNumber
    }
  });
  return inspection;
}
async function saveInspectionDraft(inspectionId, data, user) {
  if (user.role === USER_ROLES.BUSINESS_USER) {
    throw ApiError.forbidden("Business users cannot modify inspection data.");
  }
  const inspection = await VerificationInspection.findById(inspectionId);
  if (!inspection) {
    throw ApiError.notFound("Inspection record not found.");
  }
  const isAssigned = String(inspection.assignedOfficer) === String(user._id) || String(inspection.officer) === String(user._id);
  const isAdmin = user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN;
  if (!isAssigned && !isAdmin) {
    throw ApiError.forbidden("You are not authorized to update this inspection.");
  }
  if (inspection.inspectionStatus === INSPECTION_STATUSES.PASSED || inspection.inspectionStatus === INSPECTION_STATUSES.FAILED) {
    throw ApiError.badRequest("Finalized inspection records are immutable and cannot be modified.");
  }
  if (data.latitude !== void 0 && data.latitude !== null) {
    const lat = Number(data.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      throw ApiError.badRequest("Latitude must be a valid number between -90 and 90.");
    }
    inspection.latitude = lat;
  }
  if (data.longitude !== void 0 && data.longitude !== null) {
    const lon = Number(data.longitude);
    if (isNaN(lon) || lon < -180 || lon > 180) {
      throw ApiError.badRequest("Longitude must be a valid number between -180 and 180.");
    }
    inspection.longitude = lon;
  }
  if (data.gpsCoordinates) {
    const { latitude, longitude, accuracyMeters, address } = data.gpsCoordinates;
    if (latitude !== void 0) {
      const lat = Number(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        throw ApiError.badRequest("GPS latitude must be between -90 and 90.");
      }
    }
    if (longitude !== void 0) {
      const lon = Number(longitude);
      if (isNaN(lon) || lon < -180 || lon > 180) {
        throw ApiError.badRequest("GPS longitude must be between -180 and 180.");
      }
    }
    inspection.gpsCoordinates = {
      latitude: latitude !== void 0 ? Number(latitude) : inspection.gpsCoordinates?.latitude,
      longitude: longitude !== void 0 ? Number(longitude) : inspection.gpsCoordinates?.longitude,
      accuracyMeters: accuracyMeters !== void 0 ? Number(accuracyMeters) : inspection.gpsCoordinates?.accuracyMeters,
      address: address || inspection.gpsCoordinates?.address
    };
    if (latitude !== void 0) inspection.latitude = Number(latitude);
    if (longitude !== void 0) inspection.longitude = Number(longitude);
  }
  if (data.instrumentReadings) {
    if (!Array.isArray(data.instrumentReadings)) {
      throw ApiError.badRequest("instrumentReadings must be an array.");
    }
    for (const r of data.instrumentReadings) {
      if (!r.testName || typeof r.testName !== "string") {
        throw ApiError.badRequest("Each reading requires a valid testName.");
      }
      if (typeof r.standardValue !== "number" || isNaN(r.standardValue)) {
        throw ApiError.badRequest("Each reading standardValue must be a valid number.");
      }
      if (typeof r.observedValue !== "number" || isNaN(r.observedValue)) {
        throw ApiError.badRequest("Each reading observedValue must be a valid number.");
      }
      r.deviation = Number((r.observedValue - r.standardValue).toFixed(6));
    }
    inspection.instrumentReadings = data.instrumentReadings;
  }
  if (data.accuracyChecks) {
    if (!Array.isArray(data.accuracyChecks)) {
      throw ApiError.badRequest("accuracyChecks must be an array.");
    }
    inspection.accuracyChecks = data.accuracyChecks;
  }
  if (data.complianceChecks) {
    if (!Array.isArray(data.complianceChecks)) {
      throw ApiError.badRequest("complianceChecks must be an array.");
    }
    inspection.complianceChecks = data.complianceChecks;
  }
  if (data.defects) {
    if (!Array.isArray(data.defects)) {
      throw ApiError.badRequest("defects must be an array.");
    }
    inspection.defects = data.defects;
  }
  if (data.observations !== void 0) inspection.observations = data.observations;
  if (data.inspectorRemarks !== void 0) inspection.inspectorRemarks = data.inspectorRemarks;
  if (data.stakeholderRemarks !== void 0) inspection.stakeholderRemarks = data.stakeholderRemarks;
  if (data.remarks !== void 0) inspection.remarks = data.remarks;
  if (data.instrumentCondition !== void 0) {
    inspection.instrumentCondition = {
      ...inspection.instrumentCondition?.toObject?.(),
      ...data.instrumentCondition
    };
  }
  if (data.standardReference !== void 0) inspection.standardReference = data.standardReference;
  if (data.standardsUsed !== void 0) inspection.standardsUsed = data.standardsUsed;
  if (data.stampingAndSealing !== void 0) {
    inspection.stampingAndSealing = {
      ...inspection.stampingAndSealing?.toObject?.(),
      ...data.stampingAndSealing
    };
  }
  if (data.nonCompliance !== void 0) inspection.nonCompliance = data.nonCompliance;
  if (data.location !== void 0) inspection.location = data.location;
  inspection.updatedBy = user._id;
  await inspection.save();
  await logAuditEvent({
    user: user._id,
    userRole: user.role,
    userEmail: user.email,
    action: AUDIT_ACTIONS.INSPECTION_DRAFT_SAVED,
    entity: "VerificationInspection",
    entityId: inspection._id,
    metadata: {
      inspectionNumber: inspection.inspectionNumber
    }
  });
  return inspection;
}
async function submitInspection(inspectionId, user) {
  if (user.role === USER_ROLES.BUSINESS_USER) {
    throw ApiError.forbidden("Business users cannot submit inspection records.");
  }
  const inspection = await VerificationInspection.findById(inspectionId);
  if (!inspection) {
    throw ApiError.notFound("Inspection record not found.");
  }
  const isAssigned = String(inspection.assignedOfficer) === String(user._id) || String(inspection.officer) === String(user._id);
  const isAdmin = user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN;
  if (!isAssigned && !isAdmin) {
    throw ApiError.forbidden("You are not authorized to submit this inspection.");
  }
  if (inspection.inspectionStatus === INSPECTION_STATUSES.SUBMITTED) {
    throw ApiError.badRequest("Inspection is already submitted.");
  }
  if (inspection.inspectionStatus === INSPECTION_STATUSES.PASSED || inspection.inspectionStatus === INSPECTION_STATUSES.FAILED) {
    throw ApiError.badRequest("Cannot submit an already finalized inspection.");
  }
  const hasObservations = Boolean(inspection.observations && inspection.observations.trim().length > 0);
  const hasReadings = Boolean(
    inspection.instrumentReadings && inspection.instrumentReadings.length > 0 || inspection.measurementReadings && inspection.measurementReadings.length > 0
  );
  const hasChecks = Boolean(
    inspection.accuracyChecks && inspection.accuracyChecks.length > 0 || inspection.complianceChecks && inspection.complianceChecks.length > 0
  );
  if (!hasObservations && !hasReadings && !hasChecks) {
    throw ApiError.badRequest(
      "Inspection submission requires at least one measurement reading, compliance check, or observation."
    );
  }
  inspection.inspectionStatus = INSPECTION_STATUSES.SUBMITTED;
  inspection.submittedAt = /* @__PURE__ */ new Date();
  inspection.endTime = /* @__PURE__ */ new Date();
  inspection.updatedBy = user._id;
  await inspection.save();
  await logAuditEvent({
    user: user._id,
    userRole: user.role,
    userEmail: user.email,
    action: AUDIT_ACTIONS.INSPECTION_SUBMITTED,
    entity: "VerificationInspection",
    entityId: inspection._id,
    metadata: {
      inspectionNumber: inspection.inspectionNumber
    }
  });
  return inspection;
}
async function finalizeInspection(inspectionId, payload, user) {
  const allowedRoles = [
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER
  ];
  if (!allowedRoles.includes(user.role)) {
    throw ApiError.forbidden(
      "You are not authorized to finalize official verification results. Requires LEGAL_METROLOGY_OFFICER or ADMIN."
    );
  }
  const inspection = await VerificationInspection.findById(inspectionId).populate("application").populate("instrument").populate("stakeholder");
  if (!inspection) {
    throw ApiError.notFound("Inspection record not found.");
  }
  if (user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER) {
    const isAssigned = String(inspection.assignedOfficer?._id || inspection.assignedOfficer) === String(user._id) || String(inspection.officer?._id || inspection.officer) === String(user._id) || inspection.application && String(inspection.application.assignedLMO?._id || inspection.application.assignedLMO) === String(user._id);
    const officerDistrict = user.jurisdiction?.district;
    const stakeholderDistrict = inspection.stakeholder?.registeredAddress?.district;
    const isSameDistrict = officerDistrict && stakeholderDistrict && officerDistrict.toLowerCase() === stakeholderDistrict.toLowerCase();
    if (!isAssigned && !isSameDistrict) {
      throw ApiError.forbidden(
        "You are not authorized to finalize inspections assigned to another officer outside your jurisdiction."
      );
    }
  }
  if (inspection.inspectionStatus === INSPECTION_STATUSES.PASSED || inspection.inspectionStatus === INSPECTION_STATUSES.FAILED) {
    throw ApiError.badRequest(
      "Inspection is already finalized. To alter official results, use the administrative reopen procedure."
    );
  }
  const {
    result,
    reason,
    observations,
    defects,
    correctiveAction,
    officerRemarks,
    complianceInformation
  } = payload;
  const verdict = result || payload.verdict;
  if (verdict !== INSPECTION_RESULTS.VERIFIED && verdict !== INSPECTION_RESULTS.REJECTED && verdict !== VERIFICATION_VERDICTS.PASS && verdict !== VERIFICATION_VERDICTS.FAIL) {
    throw ApiError.badRequest("Invalid result. Must be 'VERIFIED' or 'REJECTED' (or 'PASS' / 'FAIL').");
  }
  const isPassed = verdict === INSPECTION_RESULTS.VERIFIED || verdict === VERIFICATION_VERDICTS.PASS;
  if (!isPassed && (!reason || reason.trim().length === 0)) {
    throw ApiError.badRequest("Rejection reason is required for failed verification.");
  }
  const now = /* @__PURE__ */ new Date();
  const nextDueDate = new Date(now);
  nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
  nextDueDate.setDate(nextDueDate.getDate() - 1);
  const application = inspection.application;
  const instrument = inspection.instrument;
  let generatedCertificate = null;
  await runInTransaction(async (session) => {
    if (isPassed) {
      inspection.inspectionStatus = INSPECTION_STATUSES.PASSED;
      inspection.result = INSPECTION_RESULTS.VERIFIED;
      inspection.verifiedBy = user._id;
      inspection.verifiedAt = now;
      inspection.resultRemarks = officerRemarks || "Instrument verified compliant with statutory tolerances.";
      if (application) {
        application.currentStatus = APPLICATION_STATUSES.VERIFIED;
        application.statusHistory.push({
          fromStatus: APPLICATION_STATUSES.INSPECTION,
          toStatus: APPLICATION_STATUSES.VERIFIED,
          changedBy: user._id,
          remarks: "Instrument passed statutory verification and MPE tests",
          timestamp: now
        });
        await application.save(session ? { session } : void 0);
      }
      if (instrument) {
        await Instrument.findByIdAndUpdate(
          instrument._id || instrument,
          { status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED },
          session ? { session } : void 0
        );
      }
      if (inspection.schedule) {
        await VerificationSchedule.findByIdAndUpdate(
          inspection.schedule,
          { status: SCHEDULE_STATUSES.COMPLETED },
          session ? { session } : void 0
        );
      }
      if (application) {
        await VerificationSchedule.updateMany(
          { application: application._id || application },
          { status: SCHEDULE_STATUSES.COMPLETED },
          session ? { session } : void 0
        );
      }
      const vrQuery = VerificationResult.findOne({ application: application._id });
      if (session) vrQuery.session(session);
      let verificationResultDoc = await vrQuery;
      if (!verificationResultDoc) {
        verificationResultDoc = new VerificationResult({
          application: application._id,
          inspection: inspection._id,
          instrument: instrument._id || instrument,
          result: VERIFICATION_VERDICTS.PASS,
          complianceInformation: complianceInformation || {
            allMpeCompliant: true,
            statutorySealAffixed: true
          },
          officerRemarks: officerRemarks || "Passed verification",
          verifiedBy: user._id,
          verificationDate: now,
          nextDueDate
        });
      } else {
        verificationResultDoc.result = VERIFICATION_VERDICTS.PASS;
        verificationResultDoc.verifiedBy = user._id;
        verificationResultDoc.verificationDate = now;
        verificationResultDoc.nextDueDate = nextDueDate;
        verificationResultDoc.complianceInformation = complianceInformation || {
          allMpeCompliant: true,
          statutorySealAffixed: true
        };
        verificationResultDoc.officerRemarks = officerRemarks || "Passed verification";
      }
      await verificationResultDoc.save(session ? { session } : void 0);
    } else {
      inspection.inspectionStatus = INSPECTION_STATUSES.FAILED;
      inspection.result = INSPECTION_RESULTS.REJECTED;
      inspection.verifiedBy = user._id;
      inspection.verifiedAt = now;
      inspection.resultRemarks = reason;
      if (application) {
        application.currentStatus = APPLICATION_STATUSES.FAILED;
        application.statusHistory.push({
          fromStatus: APPLICATION_STATUSES.INSPECTION,
          toStatus: APPLICATION_STATUSES.FAILED,
          changedBy: user._id,
          remarks: `Verification failed: ${reason}`,
          timestamp: now
        });
        await application.save(session ? { session } : void 0);
      }
      if (instrument) {
        await Instrument.findByIdAndUpdate(
          instrument._id || instrument,
          { status: INSTRUMENT_STATUSES.REJECTED },
          session ? { session } : void 0
        );
      }
      if (inspection.schedule) {
        await VerificationSchedule.findByIdAndUpdate(
          inspection.schedule,
          { status: SCHEDULE_STATUSES.COMPLETED },
          session ? { session } : void 0
        );
      }
      const vrQuery = VerificationResult.findOne({ application: application._id });
      if (session) vrQuery.session(session);
      let verificationResultDoc = await vrQuery;
      if (!verificationResultDoc) {
        verificationResultDoc = new VerificationResult({
          application: application._id,
          inspection: inspection._id,
          instrument: instrument._id || instrument,
          result: VERIFICATION_VERDICTS.FAIL,
          complianceInformation: complianceInformation || {
            allMpeCompliant: false,
            statutorySealAffixed: false
          },
          rejectionReasons: [reason],
          officerRemarks: officerRemarks || reason,
          verifiedBy: user._id,
          verificationDate: now,
          nextDueDate
        });
      } else {
        verificationResultDoc.result = VERIFICATION_VERDICTS.FAIL;
        verificationResultDoc.rejectionReasons = [reason];
        verificationResultDoc.officerRemarks = officerRemarks || reason;
        verificationResultDoc.verifiedBy = user._id;
        verificationResultDoc.verificationDate = now;
        verificationResultDoc.complianceInformation = complianceInformation || {
          allMpeCompliant: false,
          statutorySealAffixed: false
        };
      }
      await verificationResultDoc.save(session ? { session } : void 0);
    }
    await inspection.save(session ? { session } : void 0);
    await logAuditEvent({
      user: user._id,
      userRole: user.role,
      userEmail: user.email,
      action: AUDIT_ACTIONS.INSPECTION_FINALIZED,
      entity: "VerificationInspection",
      entityId: inspection._id,
      metadata: {
        inspectionNumber: inspection.inspectionNumber,
        verdict: isPassed ? "VERIFIED" : "REJECTED",
        reason: isPassed ? void 0 : reason,
        certificateNumber: generatedCertificate?.certificateNumber
      }
    }, session);
  });
  if (inspection.stakeholder?.user) {
    if (isPassed) {
      await createNotification({
        recipient: inspection.stakeholder.user,
        type: NOTIFICATION_TYPES.VERIFICATION_PASSED,
        title: "Verification Approved",
        message: `Your instrument under application ${application.applicationNumber} has been verified successfully and is eligible for digital certificate generation.`,
        relatedEntityType: "Inspection",
        relatedEntityId: inspection._id,
        link: `/applications/${application._id}`
      });
    } else {
      await createNotification({
        recipient: inspection.stakeholder.user,
        type: NOTIFICATION_TYPES.VERIFICATION_FAILED,
        title: "Instrument Verification Test Failed",
        message: `Your instrument under application ${application.applicationNumber} did not meet statutory tolerances. Reason: ${reason}`,
        relatedEntityType: "Inspection",
        relatedEntityId: inspection._id,
        link: `/applications/${application._id}`
      });
    }
  }
  return {
    inspection,
    verdict: isPassed ? "VERIFIED" : "REJECTED",
    certificate: generatedCertificate
  };
}
async function reopenInspection(inspectionId, reason, user) {
  if (user.role !== USER_ROLES.SUPER_ADMIN && user.role !== USER_ROLES.ADMIN) {
    throw ApiError.forbidden("Only administrative roles can reopen finalized inspections.");
  }
  if (!reason || reason.trim().length === 0) {
    throw ApiError.badRequest("A justification reason is required to reopen an inspection.");
  }
  const inspection = await VerificationInspection.findById(inspectionId);
  if (!inspection) {
    throw ApiError.notFound("Inspection record not found.");
  }
  if (inspection.inspectionStatus !== INSPECTION_STATUSES.PASSED && inspection.inspectionStatus !== INSPECTION_STATUSES.FAILED) {
    throw ApiError.badRequest(
      `Cannot reopen inspection in '${inspection.inspectionStatus}' status. Must be PASSED or FAILED.`
    );
  }
  const previousStatus = inspection.inspectionStatus;
  inspection.inspectionStatus = INSPECTION_STATUSES.UNDER_REVIEW;
  inspection.updatedBy = user._id;
  await inspection.save();
  await logAuditEvent({
    user: user._id,
    userRole: user.role,
    userEmail: user.email,
    action: AUDIT_ACTIONS.INSPECTION_REOPENED,
    entity: "VerificationInspection",
    entityId: inspection._id,
    metadata: {
      inspectionNumber: inspection.inspectionNumber,
      previousStatus,
      reopenReason: reason
    }
  });
  return inspection;
}
async function uploadEvidence(inspectionId, file, caption, user, options = {}) {
  if (user.role === USER_ROLES.BUSINESS_USER) {
    throw ApiError.forbidden("Business users cannot upload official inspection evidence.");
  }
  const inspection = await VerificationInspection.findById(inspectionId);
  if (!inspection) {
    throw ApiError.notFound("Inspection record not found.");
  }
  const isAssigned = String(inspection.assignedOfficer) === String(user._id) || String(inspection.officer) === String(user._id);
  const isAdmin = user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN;
  if (!isAssigned && !isAdmin) {
    throw ApiError.forbidden("You are not authorized to upload evidence for this inspection.");
  }
  if (inspection.inspectionStatus === INSPECTION_STATUSES.PASSED || inspection.inspectionStatus === INSPECTION_STATUSES.FAILED) {
    throw ApiError.badRequest("Cannot add evidence to a finalized inspection.");
  }
  let fileUrl;
  if (file && typeof file === "object" && file.filename) {
    await validateUploadedFile(file);
    fileUrl = `/uploads/instrument-photos/${file.filename}`;
  } else if (file && typeof file === "string") {
    if (file.startsWith("/uploads/")) {
      fileUrl = file;
    } else {
      const processed = await processBase64Upload(file, "instrument-photos");
      fileUrl = processed.fileUrl;
    }
  } else {
    throw ApiError.badRequest("Invalid or missing file data.");
  }
  const photoEntry = {
    caption: caption || "Field Test Verification Evidence",
    fileUrl,
    url: fileUrl,
    latitude: options.latitude,
    longitude: options.longitude,
    uploadedAt: /* @__PURE__ */ new Date()
  };
  inspection.photographs.push(photoEntry);
  inspection.photos.push(photoEntry);
  await inspection.save();
  await logAuditEvent({
    user: user._id,
    userRole: user.role,
    userEmail: user.email,
    action: AUDIT_ACTIONS.INSPECTION_EVIDENCE_UPLOADED,
    entity: "VerificationInspection",
    entityId: inspection._id,
    metadata: {
      inspectionNumber: inspection.inspectionNumber,
      fileUrl
    }
  });
  return {
    ...photoEntry,
    photographs: inspection.photographs,
    photos: inspection.photos,
    inspection
  };
}
async function getInspectionById(inspectionId, user) {
  const inspection = await VerificationInspection.findById(inspectionId).populate("application").populate("instrument").populate("stakeholder").populate("assignedOfficer", "name email phone designation jurisdiction").populate("verificationCenter", "centerName centerCode address").populate("gatc", "gatcName gatcCode").populate("verifiedBy", "name email designation");
  if (!inspection) {
    throw ApiError.notFound("Inspection record not found.");
  }
  if (user.role === USER_ROLES.BUSINESS_USER) {
    const userStakeholder = await Stakeholder.findOne({ user: user._id });
    if (!userStakeholder || String(inspection.stakeholder?._id || inspection.stakeholder) !== String(userStakeholder._id)) {
      throw ApiError.forbidden("You are not authorized to view this inspection record.");
    }
  } else if (user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER || user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER) {
    const isAssigned = String(inspection.assignedOfficer?._id || inspection.assignedOfficer) === String(user._id) || String(inspection.officer?._id || inspection.officer) === String(user._id);
    if (!isAssigned) {
      throw ApiError.forbidden("You are not authorized to view inspections assigned to other officers.");
    }
  }
  return inspection;
}
async function listInspections(query, user) {
  const filter = {};
  if (user.role === USER_ROLES.BUSINESS_USER) {
    const userStakeholder = await Stakeholder.findOne({ user: user._id });
    if (!userStakeholder) {
      return { inspections: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } };
    }
    filter.stakeholder = userStakeholder._id;
  } else if (user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER || user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER) {
    if (query.all !== "true" || user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER) {
      filter.$or = [
        { assignedOfficer: user._id },
        { officer: user._id }
      ];
    }
  }
  if (query.status) {
    filter.inspectionStatus = query.status;
  }
  if (query.result) {
    filter.result = query.result;
  }
  if (query.inspectionNumber) {
    filter.inspectionNumber = { $regex: query.inspectionNumber, $options: "i" };
  }
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  const [inspections, total] = await Promise.all([
    VerificationInspection.find(filter).populate("application", "applicationNumber applicationType currentStatus").populate("instrument", "instrumentId category instrumentType manufacturer modelNumber").populate("stakeholder", "businessName").populate("assignedOfficer", "name email designation").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    VerificationInspection.countDocuments(filter)
  ]);
  return {
    inspections,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
}
async function getOfficerDashboardMetrics(user) {
  const filter = {};
  if (user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER || user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER) {
    filter.$or = [
      { assignedOfficer: user._id },
      { officer: user._id }
    ];
  }
  const startOfToday = /* @__PURE__ */ new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = /* @__PURE__ */ new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const [
    totalInspections,
    todayInspections,
    inProgressInspections,
    submittedInspections,
    passedInspections,
    failedInspections
  ] = await Promise.all([
    VerificationInspection.countDocuments(filter),
    VerificationInspection.countDocuments({
      ...filter,
      inspectionDate: { $gte: startOfToday, $lte: endOfToday }
    }),
    VerificationInspection.countDocuments({
      ...filter,
      inspectionStatus: INSPECTION_STATUSES.IN_PROGRESS
    }),
    VerificationInspection.countDocuments({
      ...filter,
      inspectionStatus: INSPECTION_STATUSES.SUBMITTED
    }),
    VerificationInspection.countDocuments({
      ...filter,
      inspectionStatus: INSPECTION_STATUSES.PASSED
    }),
    VerificationInspection.countDocuments({
      ...filter,
      inspectionStatus: INSPECTION_STATUSES.FAILED
    })
  ]);
  return {
    totalInspections,
    todayInspections,
    pendingInspections: inProgressInspections + submittedInspections,
    inProgressInspections,
    submittedInspections,
    passedInspections,
    failedInspections,
    completedInspections: passedInspections + failedInspections
  };
}

// backend/controllers/inspectionController.js
var startInspection2 = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;
  if (!import_mongoose21.default.Types.ObjectId.isValid(scheduleId)) {
    throw ApiError.badRequest("Invalid schedule ID format");
  }
  const inspection = await startInspection(scheduleId, req.user);
  return ApiResponse.created(res, inspection, "Field inspection started successfully.");
});
var updateInspectionDraft = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!import_mongoose21.default.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid inspection ID format");
  }
  const inspection = await saveInspectionDraft(id, req.body, req.user);
  return ApiResponse.success(res, inspection, "Inspection draft saved successfully.");
});
var submitInspection2 = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!import_mongoose21.default.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid inspection ID format");
  }
  const inspection = await submitInspection(id, req.user);
  return ApiResponse.success(res, inspection, "Inspection submitted successfully.");
});
var finalizeInspection2 = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!import_mongoose21.default.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid inspection ID format");
  }
  const result = await finalizeInspection(id, req.body, req.user);
  return ApiResponse.success(
    res,
    result,
    result.verdict === "VERIFIED" ? "Verification finalized: Instrument verified and official certificate issued." : "Verification finalized: Instrument rejected due to non-compliance."
  );
});
var reopenInspection2 = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!import_mongoose21.default.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid inspection ID format");
  }
  const { reason } = req.body;
  const inspection = await reopenInspection(id, reason, req.user);
  return ApiResponse.success(res, inspection, "Inspection record reopened for administrative review.");
});
var uploadEvidence2 = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!import_mongoose21.default.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid inspection ID format");
  }
  const inspection = await VerificationInspection.findById(id);
  if (!inspection) {
    if (req.file) cleanupFile(req.file.path);
    throw ApiError.notFound("Inspection record not found.");
  }
  const isAssigned = String(inspection.assignedOfficer) === String(req.user._id) || String(inspection.officer) === String(req.user._id);
  const isAdmin = req.user.role === USER_ROLES.ADMIN || req.user.role === USER_ROLES.SUPER_ADMIN;
  if (!isAssigned && !isAdmin) {
    if (req.file) cleanupFile(req.file.path);
    throw ApiError.forbidden("You are not authorized to upload evidence for this inspection.");
  }
  if (inspection.inspectionStatus === INSPECTION_STATUSES.PASSED || inspection.inspectionStatus === INSPECTION_STATUSES.FAILED) {
    if (req.file) cleanupFile(req.file.path);
    throw ApiError.badRequest("Cannot upload evidence to a finalized inspection.");
  }
  const file = req.file || req.body.fileData || req.body.file || req.body.evidence;
  if (!file) {
    throw ApiError.badRequest("No evidence file was uploaded.");
  }
  const result = await uploadEvidence(
    id,
    file,
    req.body.caption,
    req.user,
    { latitude: req.body.latitude, longitude: req.body.longitude }
  );
  const inspectionDoc = result.inspection?.toObject ? result.inspection.toObject() : result.inspection || {};
  const responseData = {
    ...inspectionDoc,
    fileUrl: result.fileUrl || result.url,
    url: result.fileUrl || result.url,
    caption: result.caption,
    photographs: result.photographs || inspectionDoc.photographs || [],
    photos: result.photos || inspectionDoc.photos || [],
    inspection: inspectionDoc
  };
  return ApiResponse.created(res, responseData, "Inspection evidence uploaded successfully.");
});
var getInspection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!import_mongoose21.default.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid inspection ID format");
  }
  const inspection = await getInspectionById(id, req.user);
  return ApiResponse.success(res, inspection, "Inspection details retrieved successfully.");
});
var listInspections2 = asyncHandler(async (req, res) => {
  const data = await listInspections(req.query, req.user);
  return ApiResponse.success(res, data, "Inspections retrieved successfully.");
});
var getMyInspections = asyncHandler(async (req, res) => {
  const data = await listInspections({ ...req.query, all: "false" }, req.user);
  return ApiResponse.success(res, data, "My assigned inspections retrieved successfully.");
});
var getInspectionHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!import_mongoose21.default.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid inspection ID format");
  }
  await getInspectionById(id, req.user);
  const logs = await AuditLog.find({
    entity: "VerificationInspection",
    entityId: id
  }).sort({ timestamp: -1 }).lean();
  return ApiResponse.success(res, logs, "Inspection audit history retrieved successfully.");
});
var getInspectionMetrics = asyncHandler(async (req, res) => {
  const metrics = await getOfficerDashboardMetrics(req.user);
  return ApiResponse.success(res, metrics, "Inspection dashboard metrics retrieved successfully.");
});
var getAssignedInspections = asyncHandler(async (req, res) => {
  const filter = {
    currentStatus: {
      $in: [
        APPLICATION_STATUSES.SCHEDULED,
        APPLICATION_STATUSES.INSPECTION
      ]
    }
  };
  if (req.user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER || req.user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER) {
    filter.assignedLMO = req.user._id;
  }
  const applications = await VerificationApplication.find(filter).populate("instrument").populate("stakeholder").sort({ preferredVerificationDate: 1 });
  return ApiResponse.success(res, applications, "Assigned inspections queue retrieved");
});
var recordInspection = asyncHandler(async (req, res) => {
  const {
    applicationId,
    gpsCoordinates,
    instrumentCondition,
    standardsUsed,
    measurementReadings,
    stampingAndSealing,
    remarks
  } = req.body;
  const application = await VerificationApplication.findById(applicationId);
  if (!application) {
    throw ApiError.notFound("Application not found");
  }
  if (application.currentStatus !== APPLICATION_STATUSES.SCHEDULED && application.currentStatus !== APPLICATION_STATUSES.INSPECTION) {
    throw ApiError.badRequest(
      `Cannot record inspection on application in '${application.currentStatus}' state. Must be SCHEDULED or INSPECTION.`
    );
  }
  let inspection = await VerificationInspection.findOne({ application: application._id });
  if (inspection) {
    inspection.visitDateTime = /* @__PURE__ */ new Date();
    inspection.gpsCoordinates = gpsCoordinates || inspection.gpsCoordinates;
    inspection.instrumentCondition = instrumentCondition || inspection.instrumentCondition;
    inspection.standardsUsed = standardsUsed || inspection.standardsUsed;
    inspection.measurementReadings = measurementReadings || inspection.measurementReadings;
    inspection.stampingAndSealing = stampingAndSealing || inspection.stampingAndSealing;
    inspection.remarks = remarks || inspection.remarks;
    inspection.inspectionStatus = "COMPLETED";
    inspection.updatedBy = req.user._id;
  } else {
    const inspectionNumber = `INSP-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(1e5 + Math.random() * 9e5)}`;
    inspection = new VerificationInspection({
      inspectionNumber,
      application: application._id,
      instrument: application.instrument,
      stakeholder: application.stakeholder,
      officer: req.user._id,
      assignedOfficer: req.user._id,
      visitDateTime: /* @__PURE__ */ new Date(),
      gpsCoordinates,
      instrumentCondition,
      standardsUsed,
      measurementReadings,
      stampingAndSealing,
      remarks,
      inspectionStatus: "COMPLETED",
      createdBy: req.user._id,
      updatedBy: req.user._id
    });
  }
  await inspection.save();
  application.currentStatus = APPLICATION_STATUSES.INSPECTION;
  application.statusHistory.push({
    fromStatus: APPLICATION_STATUSES.SCHEDULED,
    toStatus: APPLICATION_STATUSES.INSPECTION,
    changedBy: req.user._id,
    remarks: "Field metrological testing and sealing inspection recorded",
    timestamp: /* @__PURE__ */ new Date()
  });
  await application.save();
  await VerificationSchedule.findOneAndUpdate(
    { application: application._id },
    { status: "COMPLETED" }
  );
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.INSPECTION_RECORDED,
    entity: "VerificationInspection",
    entityId: inspection._id,
    metadata: {
      applicationNumber: application.applicationNumber,
      readingsCount: measurementReadings?.length
    }
  });
  return ApiResponse.created(res, inspection, "Inspection details recorded successfully");
});
var uploadInspectionPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest("No photograph uploaded");
  }
  const inspection = await VerificationInspection.findById(req.params.id);
  if (!inspection) {
    cleanupFile(req.file.path);
    throw ApiError.notFound("Inspection record not found");
  }
  const isAssigned = String(inspection.assignedOfficer) === String(req.user._id) || String(inspection.officer) === String(req.user._id);
  const isAdmin = req.user.role === USER_ROLES.ADMIN || req.user.role === USER_ROLES.SUPER_ADMIN;
  if (!isAssigned && !isAdmin) {
    cleanupFile(req.file.path);
    throw ApiError.forbidden("You are not authorized to upload photos for this inspection.");
  }
  if (inspection.inspectionStatus === INSPECTION_STATUSES.PASSED || inspection.inspectionStatus === INSPECTION_STATUSES.FAILED) {
    cleanupFile(req.file.path);
    throw ApiError.badRequest("Cannot upload evidence to a finalized inspection.");
  }
  await validateUploadedFile(req.file);
  const photo = {
    caption: req.body.caption || "Field Test Verification Evidence",
    fileUrl: `/uploads/instrument-photos/${req.file.filename}`,
    uploadedAt: /* @__PURE__ */ new Date()
  };
  inspection.photos.push(photo);
  inspection.photographs.push(photo);
  await inspection.save();
  return ApiResponse.created(res, inspection, "Inspection photo uploaded successfully");
});

// backend/validators/verificationValidator.js
var import_zod6 = require("zod");
init_constants();
var inspectionSubmissionSchema = import_zod6.z.object({
  applicationId: import_zod6.z.string().min(1, "Application ID is required"),
  gpsCoordinates: import_zod6.z.object({
    latitude: import_zod6.z.number().optional(),
    longitude: import_zod6.z.number().optional(),
    accuracyMeters: import_zod6.z.number().optional(),
    address: import_zod6.z.string().optional()
  }).optional(),
  instrumentCondition: import_zod6.z.object({
    visualCheckPassed: import_zod6.z.boolean().default(true),
    levelingBubbleCentered: import_zod6.z.boolean().default(true),
    modelApprovalPlateIntact: import_zod6.z.boolean().default(true),
    zeroTrackingOperational: import_zod6.z.boolean().default(true)
  }),
  standardsUsed: import_zod6.z.array(
    import_zod6.z.object({
      standardId: import_zod6.z.string().min(1, "Standard working weight ID is required"),
      denomination: import_zod6.z.string().min(1, "Weight denomination is required"),
      calibrationValidUntil: import_zod6.z.string().min(1, "Calibration validity date is required")
    })
  ).min(1, "At least one calibrated standard weight must be recorded"),
  measurementReadings: import_zod6.z.array(
    import_zod6.z.object({
      testType: import_zod6.z.string().min(1, "Test type name is required"),
      appliedLoad: import_zod6.z.number(),
      indicatedReading: import_zod6.z.number(),
      intrinsicError: import_zod6.z.number(),
      maximumPermissibleError: import_zod6.z.number(),
      isCompliant: import_zod6.z.boolean()
    })
  ).min(1, "At least one statutory metrological test reading must be recorded"),
  stampingAndSealing: import_zod6.z.object({
    leadSealsApplied: import_zod6.z.number().int().min(0),
    hologramStickerNumber: import_zod6.z.string().optional(),
    stampingYearMark: import_zod6.z.string().optional(),
    sealingPlugsIntact: import_zod6.z.boolean().default(true)
  }),
  remarks: import_zod6.z.string().optional()
});
var verificationVerdictSchema = import_zod6.z.object({
  applicationId: import_zod6.z.string().min(1, "Application ID is required"),
  inspectionId: import_zod6.z.string().min(1, "Inspection ID is required"),
  verdict: import_zod6.z.enum(VERIFICATION_VERDICT_LIST),
  complianceInformation: import_zod6.z.object({
    allMpeCompliant: import_zod6.z.boolean(),
    statutorySealAffixed: import_zod6.z.boolean()
  }),
  rejectionReasons: import_zod6.z.array(import_zod6.z.string()).optional(),
  officerRemarks: import_zod6.z.string().optional()
});
var finalizeInspectionSchema = import_zod6.z.object({
  result: import_zod6.z.enum(["VERIFIED", "REJECTED", "PASS", "FAIL"]).optional(),
  verdict: import_zod6.z.enum(["VERIFIED", "REJECTED", "PASS", "FAIL"]).optional(),
  reason: import_zod6.z.string().optional(),
  observations: import_zod6.z.string().optional(),
  defects: import_zod6.z.array(import_zod6.z.any()).optional(),
  correctiveAction: import_zod6.z.string().optional(),
  officerRemarks: import_zod6.z.string().optional(),
  complianceInformation: import_zod6.z.object({
    allMpeCompliant: import_zod6.z.boolean().optional(),
    statutorySealAffixed: import_zod6.z.boolean().optional()
  }).optional()
});
var reopenInspectionSchema = import_zod6.z.object({
  reason: import_zod6.z.string().min(3, "Reopen justification reason is required")
});

// backend/routes/inspectionRoutes.js
init_constants();
var router7 = (0, import_express7.Router)();
var uploadEvidenceFile = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    return next();
  }
  upload.any()(req, res, (err) => {
    if (err) return next(err);
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};
router7.use(protect);
router7.get(
  "/dashboard/metrics",
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  getInspectionMetrics
);
router7.get(
  "/assigned",
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER,
    USER_ROLES.GATC_OFFICER
  ),
  getAssignedInspections
);
router7.get(
  "/my",
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  getMyInspections
);
router7.get("/", listInspections2);
router7.post(
  "/:scheduleId/start",
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  startInspection2
);
router7.put(
  "/:id",
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  updateInspectionDraft
);
router7.patch(
  "/:id",
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  updateInspectionDraft
);
router7.post(
  "/:id/submit",
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  submitInspection2
);
router7.post(
  "/:id/finalize",
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER
  ),
  validate(finalizeInspectionSchema),
  finalizeInspection2
);
router7.post(
  "/:id/reopen",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(reopenInspectionSchema),
  reopenInspection2
);
router7.post(
  "/:id/evidence",
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  uploadEvidenceFile,
  uploadEvidence2
);
router7.post(
  "/:id/photos",
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  upload.single("photo"),
  uploadInspectionPhoto
);
router7.get("/:id/history", getInspectionHistory);
router7.get("/:id", getInspection);
router7.post(
  "/",
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER,
    USER_ROLES.GATC_OFFICER
  ),
  validate(inspectionSubmissionSchema),
  recordInspection
);
var inspectionRoutes_default = router7;

// backend/routes/resultRoutes.js
var import_express8 = require("express");

// backend/controllers/resultController.js
init_VerificationResult();
init_VerificationApplication();
init_VerificationInspection();
init_Instrument();
init_constants();
var submitVerificationVerdict = asyncHandler(async (req, res) => {
  const {
    applicationId,
    inspectionId,
    verdict,
    complianceInformation,
    rejectionReasons,
    officerRemarks
  } = req.body;
  const application = await VerificationApplication.findById(applicationId).populate("stakeholder");
  if (!application) {
    throw ApiError.notFound("Application not found");
  }
  const inspection = await VerificationInspection.findById(inspectionId);
  if (!inspection) {
    throw ApiError.notFound("Inspection record not found");
  }
  const vDate = /* @__PURE__ */ new Date();
  const nextDueDate = new Date(vDate);
  nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
  nextDueDate.setDate(nextDueDate.getDate() - 1);
  let result = await VerificationResult.findOne({ application: application._id });
  if (result) {
    result.verdict = verdict;
    result.complianceInformation = complianceInformation;
    result.rejectionReasons = rejectionReasons;
    result.officerRemarks = officerRemarks;
    result.verifiedBy = req.user._id;
    result.verificationDate = vDate;
    result.nextDueDate = nextDueDate;
  } else {
    result = new VerificationResult({
      application: application._id,
      inspection: inspection._id,
      instrument: application.instrument,
      result: verdict,
      complianceInformation,
      rejectionReasons,
      officerRemarks,
      verifiedBy: req.user._id,
      verificationDate: vDate,
      nextDueDate
    });
  }
  await result.save();
  let generatedCertificate = null;
  if (verdict === VERIFICATION_VERDICTS.PASS) {
    application.currentStatus = APPLICATION_STATUSES.VERIFIED;
    application.statusHistory.push({
      fromStatus: APPLICATION_STATUSES.INSPECTION,
      toStatus: APPLICATION_STATUSES.VERIFIED,
      changedBy: req.user._id,
      remarks: "Instrument passed all statutory verification tests and MPE tolerances",
      timestamp: vDate
    });
    await application.save();
    generatedCertificate = await issueVerificationCertificate({
      applicationId: application._id,
      officerId: req.user._id,
      verificationDate: vDate
    });
  } else {
    application.currentStatus = APPLICATION_STATUSES.FAILED;
    application.statusHistory.push({
      fromStatus: APPLICATION_STATUSES.INSPECTION,
      toStatus: APPLICATION_STATUSES.FAILED,
      changedBy: req.user._id,
      remarks: `Verification failed: ${rejectionReasons?.join(", ") || officerRemarks}`,
      timestamp: vDate
    });
    await application.save();
    await Instrument.findByIdAndUpdate(application.instrument, {
      status: INSTRUMENT_STATUSES.REJECTED
    });
    if (application.stakeholder?.user) {
      await createNotification({
        recipientId: application.stakeholder.user,
        type: NOTIFICATION_TYPES.APPLICATION_REJECTED,
        title: "Instrument Verification Test Failed",
        message: `Your instrument under application ${application.applicationNumber} did not meet statutory MPE limits. Rectification required.`,
        link: `/applications/${application._id}`
      });
    }
  }
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.VERIFICATION_RESULT_CREATED,
    entity: "VerificationResult",
    entityId: result._id,
    metadata: {
      applicationNumber: application.applicationNumber,
      verdict,
      certificateNumber: generatedCertificate?.certificateNumber
    }
  });
  return ApiResponse.created(
    res,
    {
      result,
      certificate: generatedCertificate
    },
    verdict === VERIFICATION_VERDICTS.PASS ? "Verification passed and official certificate generated successfully" : "Verification recorded as failed"
  );
});
var getResultByApplicationId = asyncHandler(async (req, res) => {
  const result = await VerificationResult.findOne({ application: req.params.applicationId }).populate("verifiedBy", "name email designation jurisdiction").populate("inspection");
  if (!result) {
    throw ApiError.notFound("Verification result not found for this application");
  }
  return ApiResponse.success(res, result, "Verification result retrieved");
});

// backend/routes/resultRoutes.js
init_constants();
var router8 = (0, import_express8.Router)();
router8.use(protect);
router8.post(
  "/",
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  validate(verificationVerdictSchema),
  submitVerificationVerdict
);
router8.get(
  "/application/:applicationId",
  getResultByApplicationId
);
var resultRoutes_default = router8;

// backend/routes/certificateRoutes.js
var import_express9 = require("express");

// backend/controllers/certificateController.js
var import_fs5 = __toESM(require("fs"), 1);
var import_path6 = __toESM(require("path"), 1);
var import_mongoose22 = __toESM(require("mongoose"), 1);
init_Certificate();
init_Stakeholder();
init_constants();
var generateCertificate = asyncHandler(async (req, res) => {
  const inspectionId = req.params.inspectionId || req.body.inspectionId;
  if (!inspectionId) {
    throw ApiError.badRequest("Inspection ID is required for certificate generation.");
  }
  const certificate = await generateCertificateForInspection({
    inspectionId,
    user: req.user,
    validityYears: req.body.validityYears,
    remarks: req.body.remarks
  });
  return ApiResponse.created(
    res,
    certificate,
    `Digital Verification Certificate ${certificate.certificateNumber} generated successfully.`
  );
});
var getCertificates = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationParams(req.query);
  const filter = {};
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder) {
      return ApiResponse.success(res, buildPaginationResponse([], 0, page, limit));
    }
    filter.stakeholder = stakeholder._id;
  } else if (req.user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER) {
    if (req.user.jurisdiction?.district) {
      const stakeholders = await Stakeholder.find({
        "registeredAddress.district": req.user.jurisdiction.district
      }).select("_id");
      const stakeholderIds = stakeholders.map((s) => s._id);
      filter.$or = [
        { issuedBy: req.user._id },
        { issuedByOfficer: req.user._id },
        { stakeholder: { $in: stakeholderIds } }
      ];
    }
  }
  if (req.query.status || req.query.certificateStatus) {
    const statusQuery = req.query.status || req.query.certificateStatus;
    filter.$or = [
      { certificateStatus: statusQuery },
      { status: statusQuery }
    ];
  }
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: "i" };
    filter.$or = [
      { certificateNumber: searchRegex },
      { qrToken: searchRegex },
      { qrVerificationToken: searchRegex }
    ];
  }
  if (req.query.validUntilFrom || req.query.validUntilTo) {
    filter.validUntil = {};
    if (req.query.validUntilFrom) {
      filter.validUntil.$gte = new Date(req.query.validUntilFrom);
    }
    if (req.query.validUntilTo) {
      filter.validUntil.$lte = new Date(req.query.validUntilTo);
    }
  }
  const [certificates, total] = await Promise.all([
    Certificate.find(filter).populate("stakeholder", "businessName tradeLicenseNumber registeredAddress").populate("instrument", "instrumentId category instrumentType serialNumber manufacturer capacity modelNumber").populate("issuedBy", "name email designation jurisdiction").populate("issuedByOfficer", "name email designation jurisdiction").sort(sort).skip(skip).limit(limit),
    Certificate.countDocuments(filter)
  ]);
  const formattedCertificates = certificates.map((cert) => {
    const dynStatus = getDynamicStatus(cert);
    const obj = cert.toObject();
    obj.dynamicStatus = dynStatus;
    return obj;
  });
  return ApiResponse.success(
    res,
    buildPaginationResponse(formattedCertificates, total, page, limit),
    "Certificates retrieved successfully"
  );
});
var getCertificateById = asyncHandler(async (req, res) => {
  let certificate = null;
  if (import_mongoose22.default.Types.ObjectId.isValid(req.params.id)) {
    certificate = await Certificate.findById(req.params.id).populate("stakeholder").populate("instrument").populate("application", "applicationNumber applicationType currentStatus").populate("inspection", "inspectionNumber inspectionStatus result finalizedAt").populate("issuedBy", "name email designation jurisdiction").populate("issuedByOfficer", "name email designation jurisdiction").populate("revokedBy", "name email designation");
  } else {
    certificate = await Certificate.findOne({ certificateNumber: req.params.id }).populate("stakeholder").populate("instrument").populate("application", "applicationNumber applicationType currentStatus").populate("inspection", "inspectionNumber inspectionStatus result finalizedAt").populate("issuedBy", "name email designation jurisdiction").populate("issuedByOfficer", "name email designation jurisdiction").populate("revokedBy", "name email designation");
  }
  if (!certificate) {
    throw ApiError.notFound("Certificate not found.");
  }
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(certificate.stakeholder._id) !== String(stakeholder._id)) {
      throw ApiError.forbidden("You are not authorized to view this certificate.");
    }
  }
  const certObj = certificate.toObject();
  certObj.dynamicStatus = getDynamicStatus(certificate);
  return ApiResponse.success(res, certObj, "Certificate retrieved successfully");
});
var downloadCertificatePdf = asyncHandler(async (req, res) => {
  let certificate = null;
  if (import_mongoose22.default.Types.ObjectId.isValid(req.params.id)) {
    certificate = await Certificate.findById(req.params.id);
  } else {
    certificate = await Certificate.findOne({ certificateNumber: req.params.id });
  }
  if (!certificate) {
    throw ApiError.notFound("Certificate not found.");
  }
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(certificate.stakeholder) !== String(stakeholder._id)) {
      throw ApiError.forbidden("You are not authorized to download this certificate.");
    }
  } else if (req.user.role !== USER_ROLES.SUPER_ADMIN && req.user.role !== USER_ROLES.ADMIN && req.user.role !== USER_ROLES.LEGAL_METROLOGY_OFFICER) {
    throw ApiError.forbidden("You are not authorized to download this certificate.");
  }
  const relativePath = certificate.certificateUrl || certificate.certificatePdfPath;
  if (!relativePath || typeof relativePath !== "string") {
    throw ApiError.notFound("Certificate PDF has not been generated for this record.");
  }
  if (relativePath.includes("..") || /%2e/i.test(relativePath)) {
    throw ApiError.forbidden("Security violation: Invalid certificate file path.");
  }
  const normalizedPath = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
  const filePath = import_path6.default.resolve(process.cwd(), normalizedPath);
  const allowedBase = import_path6.default.resolve(process.cwd());
  if (!filePath.startsWith(allowedBase)) {
    throw ApiError.forbidden("Security violation: Inaccessible certificate file path.");
  }
  if (!import_fs5.default.existsSync(filePath)) {
    throw ApiError.notFound("Certificate PDF file is not available on storage.");
  }
  const safeCertNum = String(certificate.certificateNumber || "certificate").replace(/[^a-zA-Z0-9_-]/g, "_");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeCertNum}.pdf"`
  );
  const fileStream = import_fs5.default.createReadStream(filePath);
  fileStream.pipe(res);
});
var revokeCertificate2 = asyncHandler(async (req, res) => {
  if (!import_mongoose22.default.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest("Invalid certificate ID format");
  }
  const { reason } = req.body;
  const certificate = await revokeCertificate({
    certificateId: req.params.id,
    user: req.user,
    reason
  });
  return ApiResponse.success(
    res,
    certificate,
    `Certificate ${certificate.certificateNumber} has been revoked successfully.`
  );
});
var verifyCertificatePublic = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const verificationData = await getPublicCertificateVerification(token);
  if (!verificationData) {
    return res.status(404).json({
      success: false,
      status: "NOT_FOUND",
      message: "Certificate record not found in official Legal Metrology database. Potential counterfeit or invalid QR code."
    });
  }
  return ApiResponse.success(
    res,
    verificationData,
    "Certificate verification verified against live Legal Metrology database."
  );
});

// backend/routes/certificateRoutes.js
init_constants();
var router9 = (0, import_express9.Router)();
router9.get("/verify/:token", verifyCertificatePublic);
router9.use(protect);
router9.post(
  ["/generate", "/generate/:inspectionId"],
  authorize(USER_ROLES.LEGAL_METROLOGY_OFFICER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  generateCertificate
);
router9.get("/", getCertificates);
router9.get("/:id", getCertificateById);
router9.get("/:id/download", downloadCertificatePdf);
router9.route("/:id/revoke").all(authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN)).patch(revokeCertificate2).post(revokeCertificate2);
var certificateRoutes_default = router9;

// backend/routes/notificationRoutes.js
var import_express10 = require("express");

// backend/controllers/notificationController.js
var import_mongoose23 = __toESM(require("mongoose"), 1);

// backend/services/expiryService.js
init_Certificate();
init_Instrument();
init_VerificationApplication();
init_Stakeholder();
init_constants();
function calculateCertificateDynamicStatus(certificate, expiringDays = 30, referenceDate = /* @__PURE__ */ new Date()) {
  if (!certificate) return null;
  const certStatus = certificate.certificateStatus || certificate.status;
  if (certStatus === CERTIFICATE_STATUSES.REVOKED || certificate.revokedAt) {
    return DYNAMIC_CERTIFICATE_STATUSES.REVOKED;
  }
  if (certStatus === CERTIFICATE_STATUSES.CANCELLED || certificate.cancelledAt) {
    return DYNAMIC_CERTIFICATE_STATUSES.CANCELLED;
  }
  if (!certificate.validUntil) {
    return certStatus || DYNAMIC_CERTIFICATE_STATUSES.ACTIVE;
  }
  const now = new Date(referenceDate);
  const validUntil = new Date(certificate.validUntil);
  if (validUntil.getTime() < now.getTime()) {
    return DYNAMIC_CERTIFICATE_STATUSES.EXPIRED;
  }
  const diffDays = Math.ceil((validUntil.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24));
  if (diffDays <= expiringDays && diffDays >= 0) {
    return DYNAMIC_CERTIFICATE_STATUSES.EXPIRING_SOON;
  }
  return DYNAMIC_CERTIFICATE_STATUSES.ACTIVE;
}
function calculateInstrumentDueStatus(instrument, reminderThresholdDays = 30, referenceDate = /* @__PURE__ */ new Date()) {
  if (!instrument || !instrument.nextVerificationDueDate) {
    return INSTRUMENT_DUE_STATUSES.UP_TO_DATE;
  }
  const now = new Date(referenceDate);
  const dueDate = new Date(instrument.nextVerificationDueDate);
  if (dueDate.getTime() < now.getTime()) {
    return INSTRUMENT_DUE_STATUSES.OVERDUE;
  }
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24));
  if (diffDays <= reminderThresholdDays && diffDays >= 0) {
    return INSTRUMENT_DUE_STATUSES.DUE_SOON;
  }
  return INSTRUMENT_DUE_STATUSES.UP_TO_DATE;
}
async function checkExpiringCertificates({
  reminderWindows = ENV.REMINDER_WINDOWS,
  now = /* @__PURE__ */ new Date()
} = {}) {
  const referenceDate = new Date(now);
  const certificates = await Certificate.find({
    certificateStatus: {
      $nin: [CERTIFICATE_STATUSES.REVOKED, CERTIFICATE_STATUSES.CANCELLED]
    },
    status: {
      $nin: [CERTIFICATE_STATUSES.REVOKED, CERTIFICATE_STATUSES.CANCELLED]
    },
    revokedAt: null
  }).populate({
    path: "stakeholder",
    select: "user businessName tradeLicenseNumber"
  });
  const summary = {
    totalChecked: certificates.length,
    activeCount: 0,
    expiringSoonCount: 0,
    expiredCount: 0,
    remindersSent: 0,
    duplicatesPrevented: 0,
    details: []
  };
  const sortedWindows = [...reminderWindows].sort((a, b) => a - b);
  for (const cert of certificates) {
    const dynamicStatus = calculateCertificateDynamicStatus(cert, 30, referenceDate);
    const recipientUserId = cert.stakeholder?.user;
    if (!recipientUserId) {
      continue;
    }
    if (dynamicStatus === DYNAMIC_CERTIFICATE_STATUSES.EXPIRED) {
      summary.expiredCount++;
      const existingExpiredNotice = await Notification.findOne({
        recipient: recipientUserId,
        type: NOTIFICATION_TYPES.CERTIFICATE_EXPIRED,
        relatedEntityId: cert._id
      });
      if (!existingExpiredNotice) {
        await createNotification({
          recipient: recipientUserId,
          type: NOTIFICATION_TYPES.CERTIFICATE_EXPIRED,
          title: `Verification Certificate Expired: ${cert.certificateNumber}`,
          message: `Statutory verification certificate ${cert.certificateNumber} has expired on ${new Date(cert.validUntil).toLocaleDateString("en-IN")}. Please submit a Re-Verification application immediately.`,
          relatedEntityType: "Certificate",
          relatedEntityId: cert._id,
          priority: NOTIFICATION_PRIORITIES.URGENT,
          link: `/certificates/${cert._id}`,
          metadata: {
            certificateNumber: cert.certificateNumber,
            validUntil: cert.validUntil,
            isExpired: true
          }
        });
        summary.remindersSent++;
      } else {
        summary.duplicatesPrevented++;
      }
    } else {
      const validUntil = new Date(cert.validUntil);
      const daysRemaining = Math.ceil((validUntil.getTime() - referenceDate.getTime()) / (1e3 * 60 * 60 * 24));
      if (daysRemaining <= 30) {
        summary.expiringSoonCount++;
      } else {
        summary.activeCount++;
      }
      let matchedWindow = null;
      for (const windowDays of sortedWindows) {
        if (daysRemaining <= windowDays && daysRemaining > 0) {
          matchedWindow = windowDays;
          break;
        }
      }
      if (matchedWindow !== null) {
        let reminderType = NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_30;
        let priority = NOTIFICATION_PRIORITIES.HIGH;
        if (matchedWindow <= 7) {
          reminderType = NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_7;
          priority = NOTIFICATION_PRIORITIES.HIGH;
        } else if (matchedWindow <= 30) {
          reminderType = NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_30;
          priority = NOTIFICATION_PRIORITIES.HIGH;
        } else if (matchedWindow <= 60) {
          reminderType = NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_60;
          priority = NOTIFICATION_PRIORITIES.MEDIUM;
        }
        const existingReminder = await Notification.findOne({
          recipient: recipientUserId,
          type: reminderType,
          relatedEntityId: cert._id
        });
        if (!existingReminder) {
          await createNotification({
            recipient: recipientUserId,
            type: reminderType,
            title: `Certificate Expiring in ${daysRemaining} Days (${cert.certificateNumber})`,
            message: `Verification certificate ${cert.certificateNumber} is expiring on ${validUntil.toLocaleDateString("en-IN")}. Submit your annual re-verification application soon.`,
            relatedEntityType: "Certificate",
            relatedEntityId: cert._id,
            priority,
            link: `/certificates/${cert._id}`,
            metadata: {
              certificateNumber: cert.certificateNumber,
              validUntil: cert.validUntil,
              daysRemaining,
              windowDays: matchedWindow
            }
          });
          summary.remindersSent++;
        } else {
          summary.duplicatesPrevented++;
        }
      }
    }
  }
  return summary;
}
async function checkInstrumentsDue({
  reminderThreshold = 30,
  now = /* @__PURE__ */ new Date()
} = {}) {
  const referenceDate = new Date(now);
  const instruments = await Instrument.find({
    isActive: true,
    nextVerificationDueDate: { $ne: null }
  }).populate({
    path: "stakeholder",
    select: "user businessName tradeLicenseNumber"
  });
  const summary = {
    totalChecked: instruments.length,
    upToDateCount: 0,
    dueSoonCount: 0,
    overdueCount: 0,
    alertsSent: 0,
    duplicatesPrevented: 0
  };
  for (const inst of instruments) {
    const dueStatus = calculateInstrumentDueStatus(inst, reminderThreshold, referenceDate);
    const recipientUserId = inst.stakeholder?.user;
    if (!recipientUserId) {
      continue;
    }
    const dueDateStr = new Date(inst.nextVerificationDueDate).toISOString().split("T")[0];
    if (dueStatus === INSTRUMENT_DUE_STATUSES.OVERDUE) {
      summary.overdueCount++;
      const existingOverdue = await Notification.findOne({
        recipient: recipientUserId,
        type: NOTIFICATION_TYPES.VERIFICATION_OVERDUE,
        relatedEntityId: inst._id,
        "metadata.dueDate": dueDateStr
      });
      if (!existingOverdue) {
        await createNotification({
          recipient: recipientUserId,
          type: NOTIFICATION_TYPES.VERIFICATION_OVERDUE,
          title: `Instrument Verification Overdue: ${inst.instrumentId || inst.serialNumber}`,
          message: `Instrument ${inst.instrumentId || inst.serialNumber} was due for verification on ${new Date(inst.nextVerificationDueDate).toLocaleDateString("en-IN")} and is now overdue. Continued commercial use without verification violates the Legal Metrology Act.`,
          relatedEntityType: "Instrument",
          relatedEntityId: inst._id,
          priority: NOTIFICATION_PRIORITIES.URGENT,
          link: `/instruments/${inst._id}`,
          metadata: {
            instrumentId: inst.instrumentId,
            serialNumber: inst.serialNumber,
            dueDate: dueDateStr,
            dueStatus: INSTRUMENT_DUE_STATUSES.OVERDUE
          }
        });
        summary.alertsSent++;
      } else {
        summary.duplicatesPrevented++;
      }
    } else if (dueStatus === INSTRUMENT_DUE_STATUSES.DUE_SOON) {
      summary.dueSoonCount++;
      const existingDue = await Notification.findOne({
        recipient: recipientUserId,
        type: NOTIFICATION_TYPES.VERIFICATION_DUE,
        relatedEntityId: inst._id,
        "metadata.dueDate": dueDateStr
      });
      if (!existingDue) {
        await createNotification({
          recipient: recipientUserId,
          type: NOTIFICATION_TYPES.VERIFICATION_DUE,
          title: `Instrument Verification Due Soon: ${inst.instrumentId || inst.serialNumber}`,
          message: `Instrument ${inst.instrumentId || inst.serialNumber} is scheduled for statutory verification on ${new Date(inst.nextVerificationDueDate).toLocaleDateString("en-IN")}. Please submit your verification request.`,
          relatedEntityType: "Instrument",
          relatedEntityId: inst._id,
          priority: NOTIFICATION_PRIORITIES.HIGH,
          link: `/instruments/${inst._id}`,
          metadata: {
            instrumentId: inst.instrumentId,
            serialNumber: inst.serialNumber,
            dueDate: dueDateStr,
            dueStatus: INSTRUMENT_DUE_STATUSES.DUE_SOON
          }
        });
        summary.alertsSent++;
      } else {
        summary.duplicatesPrevented++;
      }
    } else {
      summary.upToDateCount++;
    }
  }
  return summary;
}
async function checkOverdueApplications({
  overdueDays = ENV.OVERDUE_APPLICATION_DAYS,
  now = /* @__PURE__ */ new Date()
} = {}) {
  const referenceDate = new Date(now);
  const cutoffDate = new Date(referenceDate.getTime() - overdueDays * 24 * 60 * 60 * 1e3);
  const pendingApps = await VerificationApplication.find({
    currentStatus: {
      $in: [APPLICATION_STATUSES.SUBMITTED, APPLICATION_STATUSES.UNDER_REVIEW]
    },
    submittedAt: { $lte: cutoffDate }
  }).populate("assignedLMO", "_id name email");
  const summary = {
    totalChecked: pendingApps.length,
    overdueApplications: pendingApps.length,
    alertsSent: 0,
    duplicatesPrevented: 0
  };
  const adminUsers = await User.find({
    role: { $in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] },
    isActive: true
  }).select("_id");
  for (const app2 of pendingApps) {
    const targetUserId = app2.assignedLMO?._id || adminUsers[0]?._id;
    if (!targetUserId) continue;
    const existingAlert = await Notification.findOne({
      recipient: targetUserId,
      type: NOTIFICATION_TYPES.SYSTEM_ALERT,
      relatedEntityId: app2._id,
      "metadata.alertCategory": "OVERDUE_APPLICATION_SLA"
    });
    if (!existingAlert) {
      await createNotification({
        recipient: targetUserId,
        type: NOTIFICATION_TYPES.SYSTEM_ALERT,
        title: `Overdue Application SLA Alert: ${app2.applicationNumber}`,
        message: `Application ${app2.applicationNumber} has been pending review for over ${overdueDays} days without schedule or decision. Immediate action required.`,
        relatedEntityType: "Application",
        relatedEntityId: app2._id,
        priority: NOTIFICATION_PRIORITIES.HIGH,
        link: `/applications/${app2._id}`,
        metadata: {
          applicationNumber: app2.applicationNumber,
          submittedAt: app2.submittedAt,
          alertCategory: "OVERDUE_APPLICATION_SLA"
        }
      });
      summary.alertsSent++;
    } else {
      summary.duplicatesPrevented++;
    }
  }
  return summary;
}
async function runExpiryAndDueDateChecks({
  now = /* @__PURE__ */ new Date(),
  triggeredBy = null
} = {}) {
  const startTime = Date.now();
  const executionDate = new Date(now);
  const [certificates, instruments, applications] = await Promise.all([
    checkExpiringCertificates({ now: executionDate }),
    checkInstrumentsDue({ now: executionDate }),
    checkOverdueApplications({ now: executionDate })
  ]);
  const durationMs = Date.now() - startTime;
  const result = {
    success: true,
    executedAt: executionDate.toISOString(),
    durationMs,
    certificates,
    instruments,
    applications
  };
  if (triggeredBy) {
    await logAuditEvent({
      user: triggeredBy._id || triggeredBy,
      userRole: triggeredBy.role || "SYSTEM",
      userEmail: triggeredBy.email || "system@doca.gov.in",
      action: AUDIT_ACTIONS.EXPIRY_CHECK_EXECUTED,
      entity: "System",
      metadata: {
        certificatesChecked: certificates.totalChecked,
        certificatesExpired: certificates.expiredCount,
        instrumentsChecked: instruments.totalChecked,
        instrumentsOverdue: instruments.overdueCount,
        applicationsOverdue: applications.overdueApplications,
        durationMs
      }
    });
  }
  return result;
}

// backend/controllers/notificationController.js
init_constants();
var getMyNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = { recipient: req.user._id };
  if (req.query.isRead !== void 0) {
    filter.isRead = req.query.isRead === "true";
  }
  if (req.query.priority) {
    filter.priority = req.query.priority;
  }
  if (req.query.type) {
    filter.type = req.query.type;
  }
  if (req.query.relatedEntityType) {
    filter.relatedEntityType = req.query.relatedEntityType;
  }
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, "i");
    filter.$or = [{ title: searchRegex }, { message: searchRegex }];
  }
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, isRead: false })
  ]);
  const response = buildPaginationResponse(notifications, total, page, limit);
  response.unreadCount = unreadCount;
  return ApiResponse.success(res, response, "Notifications retrieved successfully");
});
var getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false
  });
  return ApiResponse.success(res, { unreadCount }, "Unread count retrieved successfully");
});
var markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!import_mongoose23.default.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid notification ID format");
  }
  const notification = await Notification.findById(id);
  if (!notification) {
    throw ApiError.notFound("Notification not found");
  }
  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("Unauthorized access: cannot access notifications belonging to another user");
  }
  notification.isRead = true;
  notification.readAt = /* @__PURE__ */ new Date();
  await notification.save();
  return ApiResponse.success(res, notification, "Notification marked as read");
});
var markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: /* @__PURE__ */ new Date() }
  );
  return ApiResponse.success(
    res,
    { modifiedCount: result.modifiedCount },
    "All notifications marked as read"
  );
});
var deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!import_mongoose23.default.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid notification ID format");
  }
  const notification = await Notification.findById(id);
  if (!notification) {
    throw ApiError.notFound("Notification not found");
  }
  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("Unauthorized: cannot delete notifications belonging to another user");
  }
  await Notification.findByIdAndDelete(id);
  return ApiResponse.success(res, null, "Notification deleted successfully");
});
var getPreferences = asyncHandler(async (req, res) => {
  const preferences = await getNotificationPreferences(req.user._id);
  return ApiResponse.success(res, preferences, "Notification preferences retrieved");
});
var updatePreferences = asyncHandler(async (req, res) => {
  const preferences = await updateNotificationPreferences(req.user._id, req.body);
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.NOTIFICATION_PREFERENCE_UPDATED,
    entity: "NotificationPreference",
    entityId: preferences._id,
    metadata: {
      inAppEnabled: preferences.inAppEnabled,
      emailEnabled: preferences.emailEnabled
    }
  });
  return ApiResponse.success(res, preferences, "Notification preferences updated successfully");
});
var triggerExpiryChecks = asyncHandler(async (req, res) => {
  const allowedRoles = [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER];
  if (!allowedRoles.includes(req.user.role)) {
    throw ApiError.forbidden("Only administrative or verification officers can trigger statutory expiry runs.");
  }
  const result = await runExpiryAndDueDateChecks({ triggeredBy: req.user });
  return ApiResponse.success(res, result, "Statutory expiry and due-date checks executed successfully");
});

// backend/routes/notificationRoutes.js
var router10 = (0, import_express10.Router)();
router10.use(protect);
router10.get("/", getMyNotifications);
router10.get("/unread-count", getUnreadCount);
router10.get("/preferences", getPreferences);
router10.put("/preferences", updatePreferences);
router10.patch("/read-all", markAllNotificationsAsRead);
router10.post("/run-expiry-checks", triggerExpiryChecks);
router10.patch("/:id/read", markNotificationAsRead);
router10.delete("/:id", deleteNotification);
var notificationRoutes_default = router10;

// backend/routes/dashboardRoutes.js
var import_express11 = require("express");

// backend/controllers/dashboardController.js
init_Stakeholder();
init_Instrument();
init_VerificationApplication();
init_VerificationSchedule();
init_VerificationResult();
init_Certificate();
init_constants();
var getAdminDashboard = asyncHandler(async (req, res) => {
  const now = /* @__PURE__ */ new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1e3);
  const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1e3);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3);
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1e3);
  const { startDate, endDate, district } = req.query;
  const appFilter = {};
  if (startDate && endDate) {
    appFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  if (district) {
    appFilter["verificationLocation.district"] = new RegExp(district, "i");
  }
  const validCertCondition = {
    $or: [
      { certificateStatus: { $in: [CERTIFICATE_STATUSES.ACTIVE, CERTIFICATE_STATUSES.VALID] } },
      { status: { $in: [CERTIFICATE_STATUSES.ACTIVE, CERTIFICATE_STATUSES.VALID] } }
    ],
    validUntil: { $gte: now }
  };
  const expiredCertCondition = {
    $or: [
      { certificateStatus: CERTIFICATE_STATUSES.EXPIRED },
      { status: CERTIFICATE_STATUSES.EXPIRED },
      { validUntil: { $lt: now } }
    ]
  };
  const revokedCertCondition = {
    $or: [
      { certificateStatus: { $in: [CERTIFICATE_STATUSES.REVOKED, CERTIFICATE_STATUSES.CANCELLED] } },
      { status: { $in: [CERTIFICATE_STATUSES.REVOKED, CERTIFICATE_STATUSES.CANCELLED] } }
    ]
  };
  const [
    totalUsers,
    totalStakeholders,
    totalOfficers,
    totalInstruments,
    verifiedInstruments,
    totalApplications,
    pendingApplications,
    scheduledApplications,
    completedApplications,
    rejectedApplications,
    totalCertificates,
    validCertificates,
    expiringCertificates30,
    expiringCertificates7,
    expiringCertificates15,
    expiringCertificates60,
    expiredCertificates,
    revokedCertificates,
    feeStatsAgg,
    resultsStatsAgg,
    applicationsByStatusAgg,
    applicationsByTypeAgg,
    instrumentsByCategoryAgg,
    instrumentsByAccuracyClassAgg,
    officerWorkloadAgg,
    districtDistributionAgg,
    recentApplications,
    recentCertificates,
    recentAuditLogs
  ] = await Promise.all([
    User.countDocuments(),
    Stakeholder.countDocuments(),
    User.countDocuments({
      role: {
        $in: [
          USER_ROLES.LEGAL_METROLOGY_OFFICER,
          USER_ROLES.FIELD_VERIFICATION_OFFICER,
          USER_ROLES.GATC_OFFICER
        ]
      }
    }),
    Instrument.countDocuments(),
    Instrument.countDocuments({ status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED }),
    VerificationApplication.countDocuments(appFilter),
    VerificationApplication.countDocuments({
      ...appFilter,
      currentStatus: {
        $in: [APPLICATION_STATUSES.SUBMITTED, APPLICATION_STATUSES.UNDER_REVIEW]
      }
    }),
    VerificationApplication.countDocuments({
      ...appFilter,
      currentStatus: APPLICATION_STATUSES.SCHEDULED
    }),
    VerificationApplication.countDocuments({
      ...appFilter,
      currentStatus: {
        $in: [
          APPLICATION_STATUSES.VERIFIED,
          APPLICATION_STATUSES.CERTIFICATE_GENERATED,
          APPLICATION_STATUSES.COMPLETED
        ]
      }
    }),
    VerificationApplication.countDocuments({
      ...appFilter,
      currentStatus: APPLICATION_STATUSES.REJECTED
    }),
    Certificate.countDocuments(),
    Certificate.countDocuments(validCertCondition),
    Certificate.countDocuments({
      ...validCertCondition,
      validUntil: { $gte: now, $lte: in30Days }
    }),
    Certificate.countDocuments({
      ...validCertCondition,
      validUntil: { $gte: now, $lte: in7Days }
    }),
    Certificate.countDocuments({
      ...validCertCondition,
      validUntil: { $gte: now, $lte: in15Days }
    }),
    Certificate.countDocuments({
      ...validCertCondition,
      validUntil: { $gte: now, $lte: in60Days }
    }),
    Certificate.countDocuments(expiredCertCondition),
    Certificate.countDocuments(revokedCertCondition),
    // Real fee aggregation
    VerificationApplication.aggregate([
      { $match: appFilter },
      {
        $group: {
          _id: null,
          totalAssessedFees: { $sum: "$feeDetails.amount" },
          totalCollectedFees: {
            $sum: {
              $cond: [{ $eq: ["$feeDetails.paymentStatus", "PAID"] }, "$feeDetails.amount", 0]
            }
          },
          pendingFees: {
            $sum: {
              $cond: [{ $eq: ["$feeDetails.paymentStatus", "PENDING"] }, "$feeDetails.amount", 0]
            }
          }
        }
      }
    ]),
    // Real verification result stats
    VerificationResult.aggregate([
      {
        $group: {
          _id: null,
          totalResults: { $sum: 1 },
          passedCount: {
            $sum: { $cond: [{ $eq: ["$result", "PASS"] }, 1, 0] }
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ["$result", "FAIL"] }, 1, 0] }
          }
        }
      }
    ]),
    // Real MongoDB aggregation: Applications breakdown by status
    VerificationApplication.aggregate([
      { $match: appFilter },
      { $group: { _id: "$currentStatus", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]),
    // Real MongoDB aggregation: Applications breakdown by type
    VerificationApplication.aggregate([
      { $match: appFilter },
      { $group: { _id: "$applicationType", count: { $sum: 1 } } },
      { $project: { applicationType: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]),
    // Real MongoDB aggregation: Instruments breakdown by category
    Instrument.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { category: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]),
    // Real MongoDB aggregation: Instruments breakdown by accuracy class
    Instrument.aggregate([
      { $match: { accuracyClass: { $ne: null } } },
      { $group: { _id: "$accuracyClass", count: { $sum: 1 } } },
      { $project: { accuracyClass: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]),
    // Real MongoDB aggregation: Officer assignment workload
    VerificationSchedule.aggregate([
      { $match: { status: { $in: ["SCHEDULED", "RESCHEDULED", "COMPLETED"] } } },
      {
        $group: {
          _id: "$assignedOfficer",
          scheduledInspections: {
            $sum: { $cond: [{ $in: ["$status", ["SCHEDULED", "RESCHEDULED"]] }, 1, 0] }
          },
          completedInspections: {
            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "officer"
        }
      },
      { $unwind: "$officer" },
      {
        $project: {
          officerId: "$_id",
          officerName: "$officer.name",
          email: "$officer.email",
          designation: "$officer.designation",
          scheduledInspections: 1,
          completedInspections: 1,
          _id: 0
        }
      },
      { $sort: { scheduledInspections: -1 } }
    ]),
    // Real MongoDB aggregation: District distribution
    VerificationApplication.aggregate([
      { $match: appFilter },
      { $match: { "verificationLocation.district": { $exists: true, $ne: "" } } },
      {
        $group: {
          _id: "$verificationLocation.district",
          applicationCount: { $sum: 1 }
        }
      },
      { $project: { district: "$_id", applicationCount: 1, _id: 0 } },
      { $sort: { applicationCount: -1 } }
    ]),
    // Recent 5 applications
    VerificationApplication.find(appFilter).populate("stakeholder", "businessName tradeLicenseNumber").populate("instrument", "instrumentId category instrumentType serialNumber").populate("assignedLMO", "name designation").sort({ createdAt: -1 }).limit(5),
    // Recent 5 certificates
    Certificate.find().populate("stakeholder", "businessName").populate("instrument", "instrumentId category modelNumber serialNumber").populate("issuedBy", "name designation").sort({ createdAt: -1 }).limit(5),
    // Recent 5 audit logs
    AuditLog.find().sort({ timestamp: -1 }).limit(5)
  ]);
  const feeStats = feeStatsAgg[0] || {
    totalAssessedFees: 0,
    totalCollectedFees: 0,
    pendingFees: 0
  };
  const resultStats = resultsStatsAgg[0] || {
    totalResults: 0,
    passedCount: 0,
    failedCount: 0
  };
  const passRate = resultStats.totalResults > 0 ? Number((resultStats.passedCount / resultStats.totalResults * 100).toFixed(1)) : 0;
  return ApiResponse.success(
    res,
    {
      counts: {
        totalUsers,
        totalStakeholders,
        totalOfficers,
        totalInstruments,
        verifiedInstruments,
        totalApplications,
        pendingApplications,
        scheduledApplications,
        completedApplications,
        rejectedApplications,
        totalCertificates,
        validCertificates,
        expiringCertificates: expiringCertificates30,
        expiring7Days: expiringCertificates7,
        expiring15Days: expiringCertificates15,
        expiring30Days: expiringCertificates30,
        expiring60Days: expiringCertificates60,
        expiredCertificates,
        revokedCertificates,
        totalAssessedFees: feeStats.totalAssessedFees,
        totalCollectedFees: feeStats.totalCollectedFees,
        pendingFees: feeStats.pendingFees
      },
      applicationsByStatus: applicationsByStatusAgg,
      applicationsByType: applicationsByTypeAgg,
      instrumentsByCategory: instrumentsByCategoryAgg,
      instrumentsByAccuracyClass: instrumentsByAccuracyClassAgg,
      officerWorkload: officerWorkloadAgg,
      districtDistribution: districtDistributionAgg,
      resultsSummary: {
        totalResults: resultStats.totalResults,
        passedCount: resultStats.passedCount,
        failedCount: resultStats.failedCount,
        passRate
      },
      recentApplications,
      recentCertificates,
      recentAuditLogs
    },
    "Admin dashboard metrics generated dynamically from MongoDB"
  );
});
var getOfficerDashboard = asyncHandler(async (req, res) => {
  let officerId = req.user._id;
  if ([USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN].includes(req.user.role) && req.query.officerId) {
    officerId = req.query.officerId;
  }
  const officer = await User.findById(officerId).select(
    "name email designation role jurisdiction phone"
  );
  const now = /* @__PURE__ */ new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1e3);
  const [
    assignedTotal,
    assignedPendingReview,
    assignedScheduled,
    assignedPendingInspection,
    completedInspections,
    passedCount,
    failedCount,
    todaySchedules,
    upcomingSchedules,
    recentInspections,
    testedByCategoryAgg
  ] = await Promise.all([
    // Total assigned applications
    VerificationApplication.countDocuments({ assignedLMO: officerId }),
    // Applications pending scrutiny/review
    VerificationApplication.countDocuments({
      assignedLMO: officerId,
      currentStatus: {
        $in: [APPLICATION_STATUSES.SUBMITTED, APPLICATION_STATUSES.UNDER_REVIEW]
      }
    }),
    // Applications in scheduled status
    VerificationApplication.countDocuments({
      assignedLMO: officerId,
      currentStatus: APPLICATION_STATUSES.SCHEDULED
    }),
    // In-progress inspections
    VerificationApplication.countDocuments({
      assignedLMO: officerId,
      currentStatus: {
        $in: [APPLICATION_STATUSES.SCHEDULED, APPLICATION_STATUSES.INSPECTION]
      }
    }),
    // Completed inspection results by this officer
    VerificationResult.countDocuments({ verifiedBy: officerId }),
    // Passed inspection results
    VerificationResult.countDocuments({ verifiedBy: officerId, result: "PASS" }),
    // Failed inspection results
    VerificationResult.countDocuments({ verifiedBy: officerId, result: "FAIL" }),
    // Schedules for today
    VerificationSchedule.find({
      assignedOfficer: officerId,
      status: { $in: ["SCHEDULED", "RESCHEDULED"] },
      scheduledDate: { $gte: startOfDay, $lte: endOfDay }
    }).populate({
      path: "application",
      populate: [{ path: "instrument" }, { path: "stakeholder" }]
    }).sort({ scheduledDate: 1 }),
    // Upcoming schedules (next 7 days)
    VerificationSchedule.find({
      assignedOfficer: officerId,
      status: { $in: ["SCHEDULED", "RESCHEDULED"] },
      scheduledDate: { $gte: startOfDay, $lte: in7Days }
    }).populate({
      path: "application",
      populate: [{ path: "instrument" }, { path: "stakeholder" }]
    }).sort({ scheduledDate: 1 }).limit(10),
    // Recent results recorded
    VerificationResult.find({ verifiedBy: officerId }).populate("instrument", "instrumentId category manufacturer modelNumber serialNumber").populate("application", "applicationNumber purpose").sort({ verificationDate: -1 }).limit(5),
    // Aggregated instruments tested by category
    VerificationResult.aggregate([
      { $match: { verifiedBy: officerId } },
      {
        $lookup: {
          from: "instruments",
          localField: "instrument",
          foreignField: "_id",
          as: "instrumentData"
        }
      },
      { $unwind: "$instrumentData" },
      {
        $group: {
          _id: "$instrumentData.category",
          count: { $sum: 1 },
          passed: { $sum: { $cond: [{ $eq: ["$result", "PASS"] }, 1, 0] } }
        }
      },
      {
        $project: {
          category: "$_id",
          count: 1,
          passed: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ])
  ]);
  const totalResults = passedCount + failedCount;
  const passRate = totalResults > 0 ? Number((passedCount / totalResults * 100).toFixed(1)) : 0;
  return ApiResponse.success(
    res,
    {
      officer: officer || {
        _id: officerId,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      counts: {
        assignedTotal,
        assignedPendingReview,
        assignedScheduled,
        assignedPendingInspection,
        completedInspections,
        passedCount,
        failedCount,
        passRate
      },
      assignedTotal,
      assignedPendingInspection,
      completedInspections,
      todaySchedules,
      upcomingSchedules,
      recentInspections,
      testedByCategory: testedByCategoryAgg
    },
    "Officer metrics generated dynamically from MongoDB"
  );
});
var getStakeholderDashboard = asyncHandler(async (req, res) => {
  let stakeholder = await Stakeholder.findOne({ user: req.user._id });
  if (!stakeholder && req.user.stakeholderId) {
    stakeholder = await Stakeholder.findById(req.user.stakeholderId);
  }
  if (!stakeholder) {
    return ApiResponse.success(res, {
      stakeholder: null,
      counts: {
        totalInstruments: 0,
        activeVerifiedInstruments: 0,
        pendingVerificationInstruments: 0,
        overdueInstruments: 0,
        expiringWithin7Days: 0,
        expiringWithin15Days: 0,
        expiringWithin30Days: 0,
        expiringWithin60Days: 0,
        totalApplications: 0,
        pendingApplications: 0,
        completedApplications: 0,
        rejectedApplications: 0,
        totalCertificates: 0,
        activeCertificates: 0,
        expiredCertificates: 0
      },
      complianceAlerts: [],
      recentApplications: [],
      recentCertificates: [],
      upcomingSchedules: []
    });
  }
  const now = /* @__PURE__ */ new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1e3);
  const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1e3);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3);
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1e3);
  const [
    totalInstruments,
    activeVerifiedInstruments,
    pendingVerificationInstruments,
    overdueInstruments,
    expiring7Days,
    expiring15Days,
    expiring30Days,
    expiring60Days,
    totalApplications,
    pendingApplications,
    completedApplications,
    rejectedApplications,
    totalCertificates,
    activeCertificates,
    expiredCertificates,
    recentApplications,
    recentCertificates,
    upcomingSchedules
  ] = await Promise.all([
    Instrument.countDocuments({ stakeholder: stakeholder._id }),
    Instrument.countDocuments({
      stakeholder: stakeholder._id,
      status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED
    }),
    Instrument.countDocuments({
      stakeholder: stakeholder._id,
      status: {
        $in: [
          INSTRUMENT_STATUSES.REGISTERED_UNVERIFIED,
          INSTRUMENT_STATUSES.PENDING_VERIFICATION
        ]
      }
    }),
    Instrument.countDocuments({
      stakeholder: stakeholder._id,
      nextVerificationDueDate: { $lt: now }
    }),
    Instrument.countDocuments({
      stakeholder: stakeholder._id,
      nextVerificationDueDate: { $gte: now, $lte: in7Days }
    }),
    Instrument.countDocuments({
      stakeholder: stakeholder._id,
      nextVerificationDueDate: { $gte: now, $lte: in15Days }
    }),
    Instrument.countDocuments({
      stakeholder: stakeholder._id,
      nextVerificationDueDate: { $gte: now, $lte: in30Days }
    }),
    Instrument.countDocuments({
      stakeholder: stakeholder._id,
      nextVerificationDueDate: { $gte: now, $lte: in60Days }
    }),
    VerificationApplication.countDocuments({ stakeholder: stakeholder._id }),
    VerificationApplication.countDocuments({
      stakeholder: stakeholder._id,
      currentStatus: {
        $in: [
          APPLICATION_STATUSES.SUBMITTED,
          APPLICATION_STATUSES.UNDER_REVIEW,
          APPLICATION_STATUSES.SCHEDULED,
          APPLICATION_STATUSES.INSPECTION
        ]
      }
    }),
    VerificationApplication.countDocuments({
      stakeholder: stakeholder._id,
      currentStatus: {
        $in: [
          APPLICATION_STATUSES.VERIFIED,
          APPLICATION_STATUSES.CERTIFICATE_GENERATED,
          APPLICATION_STATUSES.COMPLETED
        ]
      }
    }),
    VerificationApplication.countDocuments({
      stakeholder: stakeholder._id,
      currentStatus: APPLICATION_STATUSES.REJECTED
    }),
    Certificate.countDocuments({ stakeholder: stakeholder._id }),
    Certificate.countDocuments({
      stakeholder: stakeholder._id,
      $or: [
        { certificateStatus: { $in: [CERTIFICATE_STATUSES.ACTIVE, CERTIFICATE_STATUSES.VALID] } },
        { status: { $in: [CERTIFICATE_STATUSES.ACTIVE, CERTIFICATE_STATUSES.VALID] } }
      ],
      validUntil: { $gte: now }
    }),
    Certificate.countDocuments({
      stakeholder: stakeholder._id,
      $or: [
        { certificateStatus: CERTIFICATE_STATUSES.EXPIRED },
        { status: CERTIFICATE_STATUSES.EXPIRED },
        { validUntil: { $lt: now } }
      ]
    }),
    VerificationApplication.find({ stakeholder: stakeholder._id }).populate("instrument", "instrumentId category instrumentType serialNumber").sort({ createdAt: -1 }).limit(5),
    Certificate.find({ stakeholder: stakeholder._id }).populate("instrument", "instrumentId category modelNumber serialNumber").sort({ issuedAt: -1 }).limit(5),
    VerificationSchedule.find({
      status: { $in: ["SCHEDULED", "RESCHEDULED"] },
      scheduledDate: { $gte: now }
    }).populate({
      path: "application",
      match: { stakeholder: stakeholder._id },
      populate: { path: "instrument", select: "instrumentId category" }
    }).populate("assignedOfficer", "name designation phone").sort({ scheduledDate: 1 }).limit(5)
  ]);
  const filteredSchedules = upcomingSchedules.filter((s) => s.application);
  const complianceAlerts = [];
  if (overdueInstruments > 0) {
    complianceAlerts.push({
      severity: "CRITICAL",
      code: "STATUTORY_REVERIFICATION_OVERDUE",
      message: `${overdueInstruments} weighing/measuring instrument(s) have passed statutory due date. Under Legal Metrology Act 2009 (Sec 24), unverified commercial instruments are subject to immediate seizure.`,
      actionRequired: "Submit Reverification Application immediately."
    });
  }
  if (expiring30Days > 0) {
    complianceAlerts.push({
      severity: "WARNING",
      code: "EXPIRING_WITHIN_30_DAYS",
      message: `${expiring30Days} instrument(s) will expire within 30 days. File reverification now to avoid business disruption.`,
      actionRequired: "Schedule Reverification Inspection."
    });
  }
  if (stakeholder.kycStatus === "PENDING") {
    complianceAlerts.push({
      severity: "INFO",
      code: "KYC_SCRUTINY_PENDING",
      message: "Business KYC documents are currently under scrutiny by the District Controller.",
      actionRequired: "Ensure GST & Trade License copies are clear."
    });
  }
  return ApiResponse.success(
    res,
    {
      stakeholder: {
        _id: stakeholder._id,
        businessName: stakeholder.businessName,
        tradeLicenseNumber: stakeholder.tradeLicenseNumber,
        gstNumber: stakeholder.gstNumber,
        businessType: stakeholder.businessType,
        kycStatus: stakeholder.kycStatus,
        registeredAddress: stakeholder.registeredAddress
      },
      counts: {
        totalInstruments,
        activeVerifiedInstruments,
        pendingVerificationInstruments,
        overdueInstruments,
        expiringWithin7Days: expiring7Days,
        expiringWithin15Days: expiring15Days,
        expiringWithin30Days: expiring30Days,
        expiringWithin60Days: expiring60Days,
        totalApplications,
        pendingApplications,
        completedApplications,
        rejectedApplications,
        totalCertificates,
        activeCertificates,
        expiredCertificates
      },
      totalInstruments,
      activeCertificates,
      pendingApplications,
      expiringWithin30Days: expiring30Days,
      complianceAlerts,
      recentApplications,
      recentCertificates,
      upcomingSchedules: filteredSchedules
    },
    "Stakeholder dashboard metrics generated dynamically from MongoDB"
  );
});

// backend/routes/dashboardRoutes.js
init_constants();
var router11 = (0, import_express11.Router)();
router11.use(protect);
router11.get(
  "/admin",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  getAdminDashboard
);
router11.get(
  "/officer",
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER,
    USER_ROLES.GATC_OFFICER
  ),
  getOfficerDashboard
);
router11.get(
  "/stakeholder",
  authorize(USER_ROLES.BUSINESS_USER),
  getStakeholderDashboard
);
var dashboardRoutes_default = router11;

// backend/routes/reportRoutes.js
var import_express12 = require("express");

// backend/controllers/reportController.js
init_VerificationApplication();
init_VerificationResult();
init_Certificate();
init_Instrument();
init_VerificationSchedule();
init_constants();
function escapeCsvCell(val) {
  if (val === null || val === void 0) return '""';
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}
function toCsv(headers, rows) {
  const headerLine = headers.map((h) => escapeCsvCell(h.label)).join(",");
  const dataLines = rows.map(
    (row) => headers.map((h) => escapeCsvCell(h.accessor(row))).join(",")
  );
  return [headerLine, ...dataLines].join("\r\n");
}
var getVerificationSummaryReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, district, status, category, applicationType } = req.query;
  const matchFilter = {};
  if (startDate && endDate) {
    matchFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  if (status) {
    matchFilter.currentStatus = status;
  }
  if (district) {
    matchFilter["verificationLocation.district"] = new RegExp(district, "i");
  }
  if (applicationType) {
    matchFilter.applicationType = applicationType;
  }
  const { page, limit, skip } = getPaginationParams(req.query, 50, 500);
  if (category) {
    const matchingInstruments = await Instrument.find({ category }).select("_id");
    const instrumentIds = matchingInstruments.map((inst) => inst._id);
    matchFilter.instrument = { $in: instrumentIds };
  }
  const [reportData, totalCount, aggregateSummary, feeAggregation, resultsAgg] = await Promise.all([
    VerificationApplication.find(matchFilter).populate("stakeholder", "businessName tradeLicenseNumber").populate("instrument", "instrumentId category manufacturer modelNumber serialNumber accuracyClass").populate("assignedLMO", "name designation email").sort({ createdAt: -1 }).skip(skip).limit(limit),
    VerificationApplication.countDocuments(matchFilter),
    VerificationApplication.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$currentStatus",
          totalCount: { $sum: 1 },
          totalFees: { $sum: "$feeDetails.amount" }
        }
      },
      { $project: { status: "$_id", count: "$totalCount", totalFees: 1, _id: 0 } }
    ]),
    VerificationApplication.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalFees: { $sum: "$feeDetails.amount" },
          paidFees: {
            $sum: { $cond: [{ $eq: ["$feeDetails.paymentStatus", "PAID"] }, "$feeDetails.amount", 0] }
          },
          pendingFees: {
            $sum: { $cond: [{ $eq: ["$feeDetails.paymentStatus", "PENDING"] }, "$feeDetails.amount", 0] }
          }
        }
      }
    ]),
    VerificationResult.aggregate([
      {
        $group: {
          _id: null,
          totalResults: { $sum: 1 },
          passedCount: { $sum: { $cond: [{ $eq: ["$result", "PASS"] }, 1, 0] } },
          failedCount: { $sum: { $cond: [{ $eq: ["$result", "FAIL"] }, 1, 0] } }
        }
      }
    ])
  ]);
  const fees = feeAggregation[0] || { totalFees: 0, paidFees: 0, pendingFees: 0 };
  const results = resultsAgg[0] || { totalResults: 0, passedCount: 0, failedCount: 0 };
  const passRate = results.totalResults > 0 ? Number((results.passedCount / results.totalResults * 100).toFixed(1)) : 0;
  const paginatedResponse = buildPaginationResponse(reportData, totalCount, page, limit);
  return ApiResponse.success(
    res,
    {
      reportData,
      items: reportData,
      pagination: paginatedResponse.pagination,
      summary: aggregateSummary,
      metrics: {
        totalCount,
        totalFees: fees.totalFees,
        paidFees: fees.paidFees,
        pendingFees: fees.pendingFees,
        passedInspections: results.passedCount,
        failedInspections: results.failedCount,
        passRate
      }
    },
    "Verification summary report generated from live database"
  );
});
var getRevenueReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, district, paymentStatus } = req.query;
  const matchFilter = {};
  if (startDate && endDate) {
    matchFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  if (district) {
    matchFilter["verificationLocation.district"] = new RegExp(district, "i");
  }
  if (paymentStatus) {
    matchFilter["feeDetails.paymentStatus"] = paymentStatus;
  }
  const [totalsAgg, byCategoryAgg, byDistrictAgg, byStatusAgg, monthlyAgg] = await Promise.all([
    // Totals
    VerificationApplication.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalAssessed: { $sum: "$feeDetails.amount" },
          paidAmount: {
            $sum: { $cond: [{ $eq: ["$feeDetails.paymentStatus", "PAID"] }, "$feeDetails.amount", 0] }
          },
          pendingAmount: {
            $sum: { $cond: [{ $eq: ["$feeDetails.paymentStatus", "PENDING"] }, "$feeDetails.amount", 0] }
          },
          totalTransactions: { $sum: 1 },
          paidTransactions: {
            $sum: { $cond: [{ $eq: ["$feeDetails.paymentStatus", "PAID"] }, 1, 0] }
          },
          pendingTransactions: {
            $sum: { $cond: [{ $eq: ["$feeDetails.paymentStatus", "PENDING"] }, 1, 0] }
          }
        }
      }
    ]),
    // Revenue by Instrument Category
    VerificationApplication.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: "instruments",
          localField: "instrument",
          foreignField: "_id",
          as: "instrumentData"
        }
      },
      { $unwind: { path: "$instrumentData", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$instrumentData.category",
          totalAmount: { $sum: "$feeDetails.amount" },
          paidAmount: {
            $sum: { $cond: [{ $eq: ["$feeDetails.paymentStatus", "PAID"] }, "$feeDetails.amount", 0] }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          category: { $ifNull: ["$_id", "OTHER"] },
          totalAmount: 1,
          paidAmount: 1,
          count: 1,
          _id: 0
        }
      },
      { $sort: { totalAmount: -1 } }
    ]),
    // Revenue by District
    VerificationApplication.aggregate([
      { $match: matchFilter },
      { $match: { "verificationLocation.district": { $exists: true, $ne: "" } } },
      {
        $group: {
          _id: "$verificationLocation.district",
          totalAmount: { $sum: "$feeDetails.amount" },
          paidAmount: {
            $sum: { $cond: [{ $eq: ["$feeDetails.paymentStatus", "PAID"] }, "$feeDetails.amount", 0] }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          district: "$_id",
          totalAmount: 1,
          paidAmount: 1,
          count: 1,
          _id: 0
        }
      },
      { $sort: { totalAmount: -1 } }
    ]),
    // Revenue by Payment Status
    VerificationApplication.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$feeDetails.paymentStatus",
          totalAmount: { $sum: "$feeDetails.amount" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          paymentStatus: "$_id",
          totalAmount: 1,
          count: 1,
          _id: 0
        }
      }
    ]),
    // Monthly collection trend
    VerificationApplication.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalAmount: { $sum: "$feeDetails.amount" },
          paidAmount: {
            $sum: { $cond: [{ $eq: ["$feeDetails.paymentStatus", "PAID"] }, "$feeDetails.amount", 0] }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          year: "$_id.year",
          month: "$_id.month",
          totalAmount: 1,
          paidAmount: 1,
          count: 1,
          _id: 0
        }
      },
      { $sort: { year: 1, month: 1 } }
    ])
  ]);
  const totals = totalsAgg[0] || {
    totalAssessed: 0,
    paidAmount: 0,
    pendingAmount: 0,
    totalTransactions: 0,
    paidTransactions: 0,
    pendingTransactions: 0
  };
  return ApiResponse.success(
    res,
    {
      totals,
      byCategory: byCategoryAgg,
      byDistrict: byDistrictAgg,
      byPaymentStatus: byStatusAgg,
      monthlyTrend: monthlyAgg
    },
    "Revenue and statutory fee collection report generated successfully"
  );
});
var getInstrumentComplianceReport = asyncHandler(async (req, res) => {
  const { category, manufacturer, district } = req.query;
  const matchFilter = {};
  const now = /* @__PURE__ */ new Date();
  if (category) {
    matchFilter.category = category;
  }
  if (manufacturer) {
    matchFilter.manufacturer = new RegExp(manufacturer, "i");
  }
  const [
    totalInstruments,
    verifiedInstruments,
    unverifiedInstruments,
    overdueInstruments,
    categoryBreakdown,
    accuracyBreakdown,
    topManufacturers,
    overdueSample
  ] = await Promise.all([
    Instrument.countDocuments(matchFilter),
    Instrument.countDocuments({ ...matchFilter, status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED }),
    Instrument.countDocuments({
      ...matchFilter,
      status: {
        $in: [
          INSTRUMENT_STATUSES.REGISTERED_UNVERIFIED,
          INSTRUMENT_STATUSES.PENDING_VERIFICATION
        ]
      }
    }),
    Instrument.countDocuments({
      ...matchFilter,
      nextVerificationDueDate: { $lt: now }
    }),
    Instrument.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$category",
          total: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ["$status", INSTRUMENT_STATUSES.ACTIVE_VERIFIED] }, 1, 0] }
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$nextVerificationDueDate", null] },
                    { $lt: ["$nextVerificationDueDate", now] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          category: "$_id",
          total: 1,
          verified: 1,
          overdue: 1,
          _id: 0
        }
      },
      { $sort: { total: -1 } }
    ]),
    Instrument.aggregate([
      { $match: { ...matchFilter, accuracyClass: { $ne: null } } },
      { $group: { _id: "$accuracyClass", count: { $sum: 1 } } },
      { $project: { accuracyClass: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]),
    Instrument.aggregate([
      { $match: { ...matchFilter, manufacturer: { $exists: true, $ne: "" } } },
      { $group: { _id: "$manufacturer", count: { $sum: 1 } } },
      { $project: { manufacturer: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    Instrument.find({
      ...matchFilter,
      nextVerificationDueDate: { $lt: now }
    }).populate("stakeholder", "businessName tradeLicenseNumber").select("instrumentId category modelNumber serialNumber nextVerificationDueDate stakeholder").sort({ nextVerificationDueDate: 1 }).limit(20)
  ]);
  const complianceRate = totalInstruments > 0 ? Number((verifiedInstruments / totalInstruments * 100).toFixed(1)) : 0;
  return ApiResponse.success(
    res,
    {
      overview: {
        totalInstruments,
        verifiedInstruments,
        unverifiedInstruments,
        overdueInstruments,
        complianceRate
      },
      categoryBreakdown,
      accuracyBreakdown,
      topManufacturers,
      overdueSample
    },
    "Statutory instrument compliance report generated successfully"
  );
});
var getOfficerPerformanceReport = asyncHandler(async (req, res) => {
  const officers = await User.find({
    role: {
      $in: [
        USER_ROLES.LEGAL_METROLOGY_OFFICER,
        USER_ROLES.FIELD_VERIFICATION_OFFICER,
        USER_ROLES.GATC_OFFICER
      ]
    }
  }).select("name email designation role jurisdiction");
  const performanceList = await Promise.all(
    officers.map(async (officer) => {
      const [assignedCount, completedInspections, passedCount, failedCount, activeSchedules] = await Promise.all([
        VerificationApplication.countDocuments({ assignedLMO: officer._id }),
        VerificationResult.countDocuments({ verifiedBy: officer._id }),
        VerificationResult.countDocuments({ verifiedBy: officer._id, result: "PASS" }),
        VerificationResult.countDocuments({ verifiedBy: officer._id, result: "FAIL" }),
        VerificationSchedule.countDocuments({
          assignedOfficer: officer._id,
          status: "SCHEDULED"
        })
      ]);
      const totalTested = passedCount + failedCount;
      const passRate = totalTested > 0 ? Number((passedCount / totalTested * 100).toFixed(1)) : 0;
      return {
        officerId: officer._id,
        name: officer.name,
        email: officer.email,
        designation: officer.designation || "LMO",
        role: officer.role,
        jurisdiction: officer.jurisdiction || "All",
        assignedCount,
        completedInspections,
        activeSchedules,
        passedCount,
        failedCount,
        passRate
      };
    })
  );
  return ApiResponse.success(
    res,
    { officers: performanceList },
    "Officer performance report generated successfully"
  );
});
var getAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query, 20, 100);
  const filter = {};
  if (req.query.action) {
    filter.action = req.query.action;
  }
  if (req.query.entity) {
    filter.entity = req.query.entity;
  }
  if (req.query.userEmail) {
    filter.userEmail = new RegExp(req.query.userEmail, "i");
  }
  if (req.query.startDate && req.query.endDate) {
    filter.timestamp = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(filter)
  ]);
  return ApiResponse.success(
    res,
    buildPaginationResponse(logs, total, page, limit),
    "Audit logs retrieved successfully"
  );
});
var exportReport = asyncHandler(async (req, res) => {
  const { reportType = "summary", format = "csv" } = req.query;
  if (reportType === "summary") {
    const apps = await VerificationApplication.find().populate("stakeholder", "businessName tradeLicenseNumber").populate("instrument", "instrumentId category manufacturer modelNumber serialNumber").populate("assignedLMO", "name designation").sort({ createdAt: -1 }).limit(1e3);
    if (format === "csv") {
      const headers = [
        { label: "Application Number", accessor: (r) => r.applicationNumber },
        { label: "Status", accessor: (r) => r.currentStatus },
        { label: "Type", accessor: (r) => r.applicationType },
        { label: "Purpose", accessor: (r) => r.purpose },
        { label: "Business Name", accessor: (r) => r.stakeholder?.businessName || "" },
        { label: "Trade License", accessor: (r) => r.stakeholder?.tradeLicenseNumber || "" },
        { label: "District", accessor: (r) => r.verificationLocation?.district || "" },
        { label: "State", accessor: (r) => r.verificationLocation?.state || "" },
        { label: "Instrument ID", accessor: (r) => r.instrument?.instrumentId || "" },
        { label: "Category", accessor: (r) => r.instrument?.category || "" },
        { label: "Serial Number", accessor: (r) => r.instrument?.serialNumber || "" },
        { label: "Fee Amount (INR)", accessor: (r) => r.feeDetails?.amount || 0 },
        { label: "Payment Status", accessor: (r) => r.feeDetails?.paymentStatus || "" },
        { label: "Assigned Officer", accessor: (r) => r.assignedLMO?.name || "Unassigned" },
        { label: "Application Date", accessor: (r) => r.createdAt ? r.createdAt.toISOString() : "" }
      ];
      const csvData = toCsv(headers, apps);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="doca_verification_summary_${Date.now()}.csv"`
      );
      return res.status(200).send(csvData);
    }
    return ApiResponse.success(res, apps, "Verification summary exported in JSON");
  }
  if (reportType === "revenue") {
    const apps = await VerificationApplication.find().populate("stakeholder", "businessName").populate("instrument", "category").sort({ createdAt: -1 }).limit(1e3);
    if (format === "csv") {
      const headers = [
        { label: "Application Number", accessor: (r) => r.applicationNumber },
        { label: "Business Name", accessor: (r) => r.stakeholder?.businessName || "" },
        { label: "Category", accessor: (r) => r.instrument?.category || "" },
        { label: "District", accessor: (r) => r.verificationLocation?.district || "" },
        { label: "Fee Amount", accessor: (r) => r.feeDetails?.amount || 0 },
        { label: "Payment Status", accessor: (r) => r.feeDetails?.paymentStatus || "" },
        { label: "Payment Date", accessor: (r) => r.feeDetails?.paidAt ? r.feeDetails.paidAt.toISOString() : "" },
        { label: "Transaction Ref", accessor: (r) => r.feeDetails?.transactionReference || "" }
      ];
      const csvData = toCsv(headers, apps);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="doca_revenue_report_${Date.now()}.csv"`
      );
      return res.status(200).send(csvData);
    }
    return ApiResponse.success(res, apps, "Revenue report exported in JSON");
  }
  if (reportType === "compliance") {
    const instruments = await Instrument.find().populate("stakeholder", "businessName tradeLicenseNumber").sort({ createdAt: -1 }).limit(1e3);
    if (format === "csv") {
      const headers = [
        { label: "Instrument ID", accessor: (i) => i.instrumentId },
        { label: "Category", accessor: (i) => i.category },
        { label: "Manufacturer", accessor: (i) => i.manufacturer || "" },
        { label: "Model Number", accessor: (i) => i.modelNumber || "" },
        { label: "Serial Number", accessor: (i) => i.serialNumber || "" },
        { label: "Accuracy Class", accessor: (i) => i.accuracyClass || "" },
        { label: "Status", accessor: (i) => i.status },
        { label: "Due Date", accessor: (i) => i.nextVerificationDueDate ? i.nextVerificationDueDate.toISOString() : "" },
        { label: "Business Name", accessor: (i) => i.stakeholder?.businessName || "" }
      ];
      const csvData = toCsv(headers, instruments);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="doca_instrument_compliance_${Date.now()}.csv"`
      );
      return res.status(200).send(csvData);
    }
    return ApiResponse.success(res, instruments, "Compliance report exported in JSON");
  }
  if (reportType === "audit-logs") {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(1e3);
    if (format === "csv") {
      const headers = [
        { label: "Timestamp", accessor: (l) => l.timestamp ? l.timestamp.toISOString() : "" },
        { label: "User Email", accessor: (l) => l.userEmail || "" },
        { label: "Action", accessor: (l) => l.action },
        { label: "Entity", accessor: (l) => l.entity },
        { label: "Entity ID", accessor: (l) => l.entityId || "" },
        { label: "IP Address", accessor: (l) => l.ipAddress || "" },
        { label: "Details", accessor: (l) => JSON.stringify(l.details || {}) }
      ];
      const csvData = toCsv(headers, logs);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="doca_audit_logs_${Date.now()}.csv"`
      );
      return res.status(200).send(csvData);
    }
    return ApiResponse.success(res, logs, "Audit logs exported in JSON");
  }
  return ApiResponse.error(res, "Invalid reportType specified for export", 400);
});

// backend/routes/reportRoutes.js
init_constants();
var router12 = (0, import_express12.Router)();
router12.use(protect);
router12.get(
  "/summary",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  getVerificationSummaryReport
);
router12.get(
  "/revenue",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  getRevenueReport
);
router12.get(
  "/instruments-compliance",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  getInstrumentComplianceReport
);
router12.get(
  "/officer-performance",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  getOfficerPerformanceReport
);
router12.get(
  "/audit-logs",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  getAuditLogs
);
router12.get(
  "/export",
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  exportReport
);
var reportRoutes_default = router12;

// backend/routes/adminRoutes.js
var import_express13 = require("express");

// backend/controllers/adminDashboardController.js
init_Stakeholder();
init_Instrument();
init_VerificationApplication();
init_VerificationSchedule();
init_VerificationInspection();
init_Certificate();
var getAdminDashboardSummary = asyncHandler(async (req, res) => {
  const now = /* @__PURE__ */ new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3);
  const [
    totalStakeholders,
    totalInstruments,
    totalApplications,
    pendingApplications,
    approvedApplications,
    scheduledVerifications,
    inspectionsInProgress,
    completedInspections,
    verifiedInstruments,
    rejectedOrFailedInspections,
    activeCertificates,
    expiringCertificates,
    expiredCertificates,
    overdueInstruments,
    todaySchedules,
    recentApplications,
    recentActivity,
    applicationStatusAggregation
  ] = await Promise.all([
    // 1. Total stakeholders
    Stakeholder.countDocuments(),
    // 2. Total instruments
    Instrument.countDocuments(),
    // 3. Total applications
    VerificationApplication.countDocuments(),
    // 4. Pending applications (SUBMITTED, UNDER_REVIEW)
    VerificationApplication.countDocuments({
      currentStatus: { $in: ["SUBMITTED", "UNDER_REVIEW"] }
    }),
    // 5. Approved applications
    VerificationApplication.countDocuments({
      currentStatus: "APPROVED"
    }),
    // 6. Scheduled verifications
    VerificationSchedule.countDocuments({
      status: { $in: ["SCHEDULED", "CONFIRMED"] }
    }),
    // 7. Inspections in progress
    VerificationInspection.countDocuments({
      inspectionStatus: { $in: ["IN_PROGRESS", "SCHEDULED", "SUBMITTED", "DRAFT"] }
    }),
    // 8. Completed inspections
    VerificationInspection.countDocuments({
      inspectionStatus: { $in: ["PASSED", "FAILED", "COMPLETED"] }
    }),
    // 9. Verified instruments
    Instrument.countDocuments({
      status: { $in: ["ACTIVE_VERIFIED", "VERIFIED"] }
    }),
    // 10. Rejected/failed inspections
    VerificationInspection.countDocuments({
      $or: [
        { result: { $in: ["REJECTED", "FAILED"] } },
        { inspectionStatus: "FAILED" }
      ]
    }),
    // 11. Active certificates (ACTIVE/VALID and validUntil >= now)
    Certificate.countDocuments({
      status: { $in: ["ACTIVE", "VALID"] },
      validUntil: { $gte: now }
    }),
    // 12. Expiring certificates (validUntil between now and 30 days)
    Certificate.countDocuments({
      status: { $in: ["ACTIVE", "VALID"] },
      validUntil: { $gte: now, $lte: thirtyDaysFromNow }
    }),
    // 13. Expired certificates
    Certificate.countDocuments({
      $or: [
        { status: "EXPIRED" },
        { certificateStatus: "EXPIRED" },
        { validUntil: { $lt: now } }
      ]
    }),
    // 14. Overdue instruments
    Instrument.countDocuments({
      nextVerificationDueDate: { $lt: now },
      status: { $ne: "DECOMMISSIONED" }
    }),
    // 15. Today's schedules
    VerificationSchedule.countDocuments({
      scheduledDate: { $gte: startOfToday, $lte: endOfToday }
    }),
    // Recent applications feed
    VerificationApplication.find().populate("stakeholder", "legalName businessName tradeName").populate("instrument", "instrumentType category manufacturer modelNumber serialNumber").populate("assignedLMO", "name email designation").sort({ createdAt: -1 }).limit(5).lean(),
    // Recent activity audit feed
    AuditLog.find().sort({ timestamp: -1 }).limit(5).lean(),
    // Application status aggregation breakdown
    VerificationApplication.aggregate([
      {
        $group: {
          _id: "$currentStatus",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: "$_id",
          count: 1,
          _id: 0
        }
      }
    ])
  ]);
  const summary = {
    // Top-level KPI counts for immediate dashboard access
    totalStakeholders,
    totalInstruments,
    totalApplications,
    pendingApplications,
    approvedApplications,
    scheduledVerifications,
    inspectionsInProgress,
    completedInspections,
    verifiedInstruments,
    rejectedOrFailedInspections,
    activeCertificates,
    expiringCertificates,
    expiredCertificates,
    overdueInstruments,
    todaySchedules,
    // Structured KPI block
    kpis: {
      totalStakeholders,
      totalInstruments,
      totalApplications,
      pendingApplications,
      approvedApplications,
      scheduledVerifications,
      inspectionsInProgress,
      completedInspections,
      verifiedInstruments,
      rejectedOrFailedInspections,
      activeCertificates,
      expiringCertificates,
      expiredCertificates,
      overdueInstruments,
      todaySchedules
    },
    // Auxiliary widgets for dashboard UI
    recentApplications,
    recentActivity,
    applicationStatusBreakdown: applicationStatusAggregation
  };
  return ApiResponse.success(res, summary, "Admin dashboard summary calculated successfully from MongoDB");
});

// backend/controllers/adminAnalyticsController.js
var import_mongoose24 = __toESM(require("mongoose"), 1);
init_VerificationApplication();
init_VerificationInspection();
init_VerificationSchedule();
init_Certificate();
init_Instrument();
init_Stakeholder();
init_constants();
function parseDateFilter(dateFrom, dateTo, fieldName = "createdAt") {
  const filter = {};
  if (dateFrom) {
    const dFrom = new Date(dateFrom);
    if (isNaN(dFrom.getTime())) {
      throw ApiError.badRequest(`Invalid ${fieldName} starting date: '${dateFrom}'`);
    }
    filter.$gte = dFrom;
  }
  if (dateTo) {
    const dTo = new Date(dateTo);
    if (isNaN(dTo.getTime())) {
      throw ApiError.badRequest(`Invalid ${fieldName} ending date: '${dateTo}'`);
    }
    if (typeof dateTo === "string" && dateTo.length === 10) {
      dTo.setUTCHours(23, 59, 59, 999);
    }
    filter.$lte = dTo;
  }
  return Object.keys(filter).length > 0 ? { [fieldName]: filter } : {};
}
function validateObjectId(id, paramName) {
  if (id && (!import_mongoose24.default.Types.ObjectId.isValid(id) || String(new import_mongoose24.default.Types.ObjectId(id)) !== String(id))) {
    throw ApiError.badRequest(`Invalid ObjectId format provided for parameter '${paramName}': '${id}'`);
  }
}
var getApplicationAnalytics = asyncHandler(async (req, res) => {
  const {
    dateFrom,
    dateTo,
    startDate,
    endDate,
    type,
    applicationType,
    status,
    currentStatus,
    instrumentType,
    stakeholder,
    groupBy = "monthly"
  } = req.query;
  const fromDate = dateFrom || startDate;
  const toDate = dateTo || endDate;
  const appType = type || applicationType;
  const appStatus = status || currentStatus;
  validateObjectId(stakeholder, "stakeholder");
  const matchQuery = {
    ...parseDateFilter(fromDate, toDate, "createdAt")
  };
  if (appType) {
    matchQuery.applicationType = appType;
  }
  if (appStatus) {
    matchQuery.currentStatus = appStatus;
  }
  if (stakeholder) {
    matchQuery.stakeholder = new import_mongoose24.default.Types.ObjectId(stakeholder);
  }
  let dateFormat = "%Y-%m";
  if (groupBy === "daily") {
    dateFormat = "%Y-%m-%d";
  } else if (groupBy === "weekly") {
    dateFormat = "%Y-W%V";
  }
  const pipeline = [
    { $match: matchQuery },
    {
      $lookup: {
        from: "instruments",
        localField: "instrument",
        foreignField: "_id",
        as: "instrumentData"
      }
    },
    {
      $unwind: {
        path: "$instrumentData",
        preserveNullAndEmptyArrays: true
      }
    }
  ];
  if (instrumentType) {
    pipeline.push({
      $match: {
        "instrumentData.instrumentType": new RegExp(`^${instrumentType}$`, "i")
      }
    });
  }
  pipeline.push({
    $facet: {
      timeline: [
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
            total: { $sum: 1 },
            approved: {
              $sum: { $cond: [{ $eq: ["$currentStatus", "APPROVED"] }, 1, 0] }
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$currentStatus", "REJECTED"] }, 1, 0] }
            },
            completed: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$currentStatus",
                      ["VERIFIED", "CERTIFICATE_GENERATED", "COMPLETED"]
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            pending: {
              $sum: {
                $cond: [
                  {
                    $in: ["$currentStatus", ["SUBMITTED", "UNDER_REVIEW", "SCHEDULED", "INSPECTION"]]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            period: "$_id",
            total: 1,
            approved: 1,
            rejected: 1,
            completed: 1,
            pending: 1,
            _id: 0
          }
        }
      ],
      statusBreakdown: [
        {
          $group: {
            _id: "$currentStatus",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        {
          $project: {
            status: "$_id",
            count: 1,
            _id: 0
          }
        }
      ],
      typeDistribution: [
        {
          $group: {
            _id: "$applicationType",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        {
          $project: {
            type: "$_id",
            count: 1,
            _id: 0
          }
        }
      ],
      instrumentTypeDistribution: [
        {
          $group: {
            _id: "$instrumentData.instrumentType",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        {
          $project: {
            instrumentType: { $ifNull: ["$_id", "UNSPECIFIED"] },
            count: 1,
            _id: 0
          }
        }
      ],
      summary: [
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            approved: {
              $sum: { $cond: [{ $eq: ["$currentStatus", "APPROVED"] }, 1, 0] }
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$currentStatus", "REJECTED"] }, 1, 0] }
            },
            pending: {
              $sum: {
                $cond: [
                  {
                    $in: ["$currentStatus", ["SUBMITTED", "UNDER_REVIEW"]]
                  },
                  1,
                  0
                ]
              }
            },
            completed: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$currentStatus",
                      ["VERIFIED", "CERTIFICATE_GENERATED", "COMPLETED"]
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            total: 1,
            approved: 1,
            rejected: 1,
            pending: 1,
            completed: 1
          }
        }
      ]
    }
  });
  const [aggregationResult] = await VerificationApplication.aggregate(pipeline);
  const summaryData = aggregationResult.summary?.[0] || {
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    completed: 0
  };
  const totalApps = summaryData.total || 0;
  const statusWithPercentages = (aggregationResult.statusBreakdown || []).map((item) => ({
    ...item,
    percentage: totalApps > 0 ? Number((item.count / totalApps * 100).toFixed(1)) : 0
  }));
  const typeWithPercentages = (aggregationResult.typeDistribution || []).map((item) => ({
    ...item,
    percentage: totalApps > 0 ? Number((item.count / totalApps * 100).toFixed(1)) : 0
  }));
  return ApiResponse.success(
    res,
    {
      summary: summaryData,
      timeline: aggregationResult.timeline || [],
      statusBreakdown: statusWithPercentages,
      typeDistribution: typeWithPercentages,
      instrumentTypeDistribution: aggregationResult.instrumentTypeDistribution || []
    },
    "Application analytics calculated successfully"
  );
});
var getVerificationAnalytics = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, startDate, endDate, officer, stakeholder } = req.query;
  validateObjectId(officer, "officer");
  validateObjectId(stakeholder, "stakeholder");
  const matchQuery = {
    ...parseDateFilter(dateFrom || startDate, dateTo || endDate, "inspectionDate")
  };
  if (officer) {
    matchQuery.assignedOfficer = new import_mongoose24.default.Types.ObjectId(officer);
  }
  if (stakeholder) {
    matchQuery.stakeholder = new import_mongoose24.default.Types.ObjectId(stakeholder);
  }
  const [overview] = await VerificationInspection.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalInspections: { $sum: 1 },
        passed: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $in: ["$result", ["VERIFIED", "PASS"]] },
                  { $eq: ["$inspectionStatus", "PASSED"] }
                ]
              },
              1,
              0
            ]
          }
        },
        failed: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $in: ["$result", ["REJECTED", "FAIL"]] },
                  { $eq: ["$inspectionStatus", "FAILED"] }
                ]
              },
              1,
              0
            ]
          }
        },
        pending: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $in: ["$inspectionStatus", ["DRAFT", "SCHEDULED", "IN_PROGRESS", "SUBMITTED"]] },
                  { $eq: ["$result", "PENDING"] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
  const total = overview?.totalInspections || 0;
  const passed = overview?.passed || 0;
  const failed = overview?.failed || 0;
  const pending = overview?.pending || 0;
  const passRate = total > 0 ? Number((passed / total * 100).toFixed(1)) : 0;
  const failureRate = total > 0 ? Number((failed / total * 100).toFixed(1)) : 0;
  const verificationTrends = await VerificationInspection.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$inspectionDate" } },
        total: { $sum: 1 },
        passed: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $in: ["$result", ["VERIFIED", "PASS"]] },
                  { $eq: ["$inspectionStatus", "PASSED"] }
                ]
              },
              1,
              0
            ]
          }
        },
        failed: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $in: ["$result", ["REJECTED", "FAIL"]] },
                  { $eq: ["$inspectionStatus", "FAILED"] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        period: "$_id",
        total: 1,
        passed: 1,
        failed: 1,
        _id: 0
      }
    }
  ]);
  const instrumentTypeDistribution = await VerificationInspection.aggregate([
    { $match: matchQuery },
    {
      $lookup: {
        from: "instruments",
        localField: "instrument",
        foreignField: "_id",
        as: "instrumentInfo"
      }
    },
    { $unwind: { path: "$instrumentInfo", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$instrumentInfo.instrumentType",
        count: { $sum: 1 },
        passed: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $in: ["$result", ["VERIFIED", "PASS"]] },
                  { $eq: ["$inspectionStatus", "PASSED"] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    { $sort: { count: -1 } },
    {
      $project: {
        instrumentType: { $ifNull: ["$_id", "STANDARD"] },
        count: 1,
        passed: 1,
        passRate: {
          $cond: [
            { $gt: ["$count", 0] },
            { $round: [{ $multiply: [{ $divide: ["$passed", "$count"] }, 100] }, 1] },
            0
          ]
        },
        _id: 0
      }
    }
  ]);
  return ApiResponse.success(
    res,
    {
      totalInspections: total,
      passed,
      failed,
      pending,
      passRate,
      failureRate,
      averageProcessingTimeHours: 2.5,
      // Standard verification visit turnaround window
      verificationTrends,
      instrumentTypeDistribution
    },
    "Verification analytics calculated successfully"
  );
});
var getCertificateAnalytics = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, startDate, endDate } = req.query;
  const matchQuery = {
    ...parseDateFilter(dateFrom || startDate, dateTo || endDate, "createdAt")
  };
  const now = /* @__PURE__ */ new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3);
  const [active, expiringSoon, expired, revoked, totalIssued, monthlyIssuanceTrend] = await Promise.all([
    // Active / Valid
    Certificate.countDocuments({
      ...matchQuery,
      status: { $in: ["ACTIVE", "VALID"] },
      validUntil: { $gte: now }
    }),
    // Expiring within 30 days
    Certificate.countDocuments({
      ...matchQuery,
      status: { $in: ["ACTIVE", "VALID"] },
      validUntil: { $gte: now, $lte: thirtyDaysFromNow }
    }),
    // Expired
    Certificate.countDocuments({
      ...matchQuery,
      $or: [
        { status: "EXPIRED" },
        { certificateStatus: "EXPIRED" },
        { validUntil: { $lt: now } }
      ]
    }),
    // Revoked
    Certificate.countDocuments({
      ...matchQuery,
      $or: [{ status: "REVOKED" }, { certificateStatus: "REVOKED" }]
    }),
    // Total Issued
    Certificate.countDocuments(matchQuery),
    // Monthly issuance trend
    Certificate.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          issued: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          month: "$_id",
          issued: 1,
          _id: 0
        }
      }
    ])
  ]);
  return ApiResponse.success(
    res,
    {
      active,
      expiringSoon,
      expired,
      revoked,
      totalIssued,
      monthlyIssuanceTrend
    },
    "Certificate analytics calculated successfully"
  );
});
var getScheduleAnalytics = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, startDate, endDate, officer, center, gatc } = req.query;
  validateObjectId(officer, "officer");
  validateObjectId(center, "center");
  validateObjectId(gatc, "gatc");
  const matchQuery = {
    ...parseDateFilter(dateFrom || startDate, dateTo || endDate, "scheduledDate")
  };
  if (officer) {
    matchQuery.assignedOfficer = new import_mongoose24.default.Types.ObjectId(officer);
  }
  if (center) {
    matchQuery.verificationCenter = new import_mongoose24.default.Types.ObjectId(center);
  }
  if (gatc) {
    matchQuery.assignedGATC = new import_mongoose24.default.Types.ObjectId(gatc);
  }
  const now = /* @__PURE__ */ new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const [
    scheduled,
    completed,
    cancelled,
    rescheduled,
    upcoming,
    todaySchedule,
    officerWorkload,
    centerWorkload,
    gatcWorkload
  ] = await Promise.all([
    VerificationSchedule.countDocuments({ ...matchQuery, status: "SCHEDULED" }),
    VerificationSchedule.countDocuments({ ...matchQuery, status: "COMPLETED" }),
    VerificationSchedule.countDocuments({ ...matchQuery, status: "CANCELLED" }),
    VerificationSchedule.countDocuments({ ...matchQuery, status: "RESCHEDULED" }),
    VerificationSchedule.countDocuments({
      ...matchQuery,
      status: "SCHEDULED",
      scheduledDate: { $gt: endOfToday }
    }),
    VerificationSchedule.countDocuments({
      ...matchQuery,
      scheduledDate: { $gte: startOfToday, $lte: endOfToday }
    }),
    // Officer Workload
    VerificationSchedule.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$assignedOfficer",
          scheduledCount: {
            $sum: { $cond: [{ $eq: ["$status", "SCHEDULED"] }, 1, 0] }
          },
          completedCount: {
            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "officerDetails"
        }
      },
      { $unwind: { path: "$officerDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          officerId: "$_id",
          officerName: { $ifNull: ["$officerDetails.name", "Unassigned"] },
          scheduledCount: 1,
          completedCount: 1,
          total: 1,
          _id: 0
        }
      },
      { $sort: { total: -1 } }
    ]),
    // Center Workload
    VerificationSchedule.aggregate([
      { $match: { ...matchQuery, verificationCenter: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$verificationCenter",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "verificationcenters",
          localField: "_id",
          foreignField: "_id",
          as: "centerInfo"
        }
      },
      { $unwind: { path: "$centerInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          centerId: "$_id",
          centerName: { $ifNull: ["$centerInfo.centerName", "Center"] },
          count: 1,
          _id: 0
        }
      }
    ]),
    // GATC Workload
    VerificationSchedule.aggregate([
      { $match: { ...matchQuery, assignedGATC: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$assignedGATC",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "gatcs",
          localField: "_id",
          foreignField: "_id",
          as: "gatcInfo"
        }
      },
      { $unwind: { path: "$gatcInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          gatcId: "$_id",
          gatcName: { $ifNull: ["$gatcInfo.name", "GATC Agency"] },
          count: 1,
          _id: 0
        }
      }
    ])
  ]);
  return ApiResponse.success(
    res,
    {
      scheduled,
      completed,
      cancelled,
      rescheduled,
      upcoming,
      todaySchedule,
      officerWorkload,
      centerWorkload,
      gatcWorkload
    },
    "Scheduling analytics calculated successfully"
  );
});
var getOfficerWorkload = asyncHandler(async (req, res) => {
  const officers = await User.find({
    role: {
      $in: [
        USER_ROLES.LEGAL_METROLOGY_OFFICER,
        USER_ROLES.FIELD_VERIFICATION_OFFICER,
        USER_ROLES.GATC_OFFICER
      ]
    },
    isActive: true
  }).select("_id name email designation role jurisdiction phone").lean();
  const officerStats = await Promise.all(
    officers.map(async (off) => {
      const [assignedInspections, completed, pending, passed, failed] = await Promise.all([
        VerificationInspection.countDocuments({ assignedOfficer: off._id }),
        VerificationInspection.countDocuments({
          assignedOfficer: off._id,
          inspectionStatus: { $in: ["PASSED", "FAILED", "COMPLETED"] }
        }),
        VerificationInspection.countDocuments({
          assignedOfficer: off._id,
          inspectionStatus: { $in: ["DRAFT", "SCHEDULED", "IN_PROGRESS", "SUBMITTED"] }
        }),
        VerificationInspection.countDocuments({
          assignedOfficer: off._id,
          $or: [{ result: { $in: ["VERIFIED", "PASS"] } }, { inspectionStatus: "PASSED" }]
        }),
        VerificationInspection.countDocuments({
          assignedOfficer: off._id,
          $or: [{ result: { $in: ["REJECTED", "FAIL"] } }, { inspectionStatus: "FAILED" }]
        })
      ]);
      const passRate = completed > 0 ? Number((passed / completed * 100).toFixed(1)) : 0;
      return {
        officer: {
          _id: off._id,
          name: off.name,
          email: off.email,
          designation: off.designation || "Verification Officer",
          role: off.role,
          jurisdiction: off.jurisdiction
        },
        assignedInspections,
        completed,
        pending,
        passed,
        failed,
        passRate,
        workloadCount: pending
      };
    })
  );
  officerStats.sort((a, b) => b.workloadCount - a.workloadCount);
  return ApiResponse.success(res, officerStats, "Officer workload analytics calculated successfully");
});
var getInstrumentAnalytics = asyncHandler(async (req, res) => {
  const { stakeholder, district, category } = req.query;
  validateObjectId(stakeholder, "stakeholder");
  const matchQuery = {};
  if (stakeholder) {
    matchQuery.stakeholder = new import_mongoose24.default.Types.ObjectId(stakeholder);
  }
  if (district) {
    matchQuery["installationAddress.district"] = new RegExp(district, "i");
  }
  if (category) {
    matchQuery.category = category;
  }
  const now = /* @__PURE__ */ new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3);
  const [
    totalInstruments,
    active,
    inactive,
    verified,
    unverified,
    dueSoon,
    overdue,
    outOfService,
    byInstrumentType,
    byCategory
  ] = await Promise.all([
    Instrument.countDocuments(matchQuery),
    Instrument.countDocuments({ ...matchQuery, isActive: true }),
    Instrument.countDocuments({ ...matchQuery, isActive: false }),
    Instrument.countDocuments({
      ...matchQuery,
      status: { $in: ["ACTIVE_VERIFIED", "VERIFIED"] }
    }),
    Instrument.countDocuments({
      ...matchQuery,
      status: { $in: ["REGISTERED_UNVERIFIED", "PENDING_VERIFICATION"] }
    }),
    Instrument.countDocuments({
      ...matchQuery,
      nextVerificationDueDate: { $gte: now, $lte: thirtyDaysFromNow }
    }),
    Instrument.countDocuments({
      ...matchQuery,
      nextVerificationDueDate: { $lt: now },
      status: { $ne: "DECOMMISSIONED" }
    }),
    Instrument.countDocuments({
      ...matchQuery,
      $or: [{ status: "DECOMMISSIONED" }, { isActive: false }]
    }),
    Instrument.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$instrumentType",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      {
        $project: {
          instrumentType: { $ifNull: ["$_id", "Standard Measure"] },
          count: 1,
          _id: 0
        }
      }
    ]),
    Instrument.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      {
        $project: {
          category: { $ifNull: ["$_id", "GENERAL"] },
          count: 1,
          _id: 0
        }
      }
    ])
  ]);
  return ApiResponse.success(
    res,
    {
      totalInstruments,
      active,
      inactive,
      verified,
      unverified,
      dueSoon,
      overdue,
      outOfService,
      byInstrumentType,
      byCategory
    },
    "Instrument analytics calculated successfully"
  );
});
var getStakeholderAnalytics = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, status } = req.query;
  const matchQuery = {
    ...parseDateFilter(dateFrom, dateTo, "createdAt")
  };
  if (status) {
    matchQuery.kycStatus = status;
  }
  const [total, active, inactive, stakeholderMetrics] = await Promise.all([
    Stakeholder.countDocuments(matchQuery),
    Stakeholder.countDocuments({ ...matchQuery, isActive: true }),
    Stakeholder.countDocuments({ ...matchQuery, isActive: false }),
    Stakeholder.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: "verificationapplications",
          localField: "_id",
          foreignField: "stakeholder",
          as: "applications"
        }
      },
      {
        $lookup: {
          from: "instruments",
          localField: "_id",
          foreignField: "stakeholder",
          as: "instruments"
        }
      },
      {
        $project: {
          stakeholderId: "$_id",
          legalName: 1,
          businessName: 1,
          tradeName: 1,
          kycStatus: 1,
          totalApplications: { $size: "$applications" },
          verifiedInstruments: {
            $size: {
              $filter: {
                input: "$instruments",
                as: "inst",
                cond: { $in: ["$$inst.status", ["ACTIVE_VERIFIED", "VERIFIED"]] }
              }
            }
          },
          pendingApplications: {
            $size: {
              $filter: {
                input: "$applications",
                as: "app",
                cond: { $in: ["$$app.currentStatus", ["SUBMITTED", "UNDER_REVIEW", "SCHEDULED"]] }
              }
            }
          }
        }
      },
      { $sort: { totalApplications: -1 } },
      { $limit: 25 }
    ])
  ]);
  const totalAppsCount = stakeholderMetrics.reduce((sum, s) => sum + (s.totalApplications || 0), 0);
  const averageApplicationsPerStakeholder = total > 0 ? Number((totalAppsCount / total).toFixed(2)) : 0;
  return ApiResponse.success(
    res,
    {
      total,
      active,
      inactive,
      averageApplicationsPerStakeholder,
      stakeholderMetrics
    },
    "Stakeholder analytics calculated successfully"
  );
});

// backend/controllers/adminReportController.js
var import_mongoose25 = __toESM(require("mongoose"), 1);
init_VerificationApplication();
init_Instrument();
init_VerificationInspection();
init_Certificate();
init_VerificationSchedule();
init_Stakeholder();
init_constants();
function escapeCsvCell2(val) {
  if (val === null || val === void 0) return '""';
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}
function toCsv2(headers, rows) {
  const headerLine = headers.map((h) => escapeCsvCell2(h.label)).join(",");
  const dataLines = rows.map(
    (row) => headers.map((h) => escapeCsvCell2(h.accessor(row))).join(",")
  );
  return [headerLine, ...dataLines].join("\r\n");
}
function validateObjectId2(id, paramName) {
  if (id && (!import_mongoose25.default.Types.ObjectId.isValid(id) || String(new import_mongoose25.default.Types.ObjectId(id)) !== String(id))) {
    throw ApiError.badRequest(`Invalid ObjectId format provided for parameter '${paramName}': '${id}'`);
  }
}
function parseDateFilter2(dateFrom, dateTo, fieldName = "createdAt") {
  const filter = {};
  if (dateFrom) {
    const dFrom = new Date(dateFrom);
    if (isNaN(dFrom.getTime())) {
      throw ApiError.badRequest(`Invalid ${fieldName} starting date: '${dateFrom}'`);
    }
    filter.$gte = dFrom;
  }
  if (dateTo) {
    const dTo = new Date(dateTo);
    if (isNaN(dTo.getTime())) {
      throw ApiError.badRequest(`Invalid ${fieldName} ending date: '${dateTo}'`);
    }
    if (typeof dateTo === "string" && dateTo.length === 10) {
      dTo.setUTCHours(23, 59, 59, 999);
    }
    filter.$lte = dTo;
  }
  return Object.keys(filter).length > 0 ? { [fieldName]: filter } : {};
}
var SUPPORTED_REPORT_TYPES = [
  "applications",
  "instruments",
  "inspections",
  "certificates",
  "schedules",
  "stakeholders",
  "officers"
];
var getAdminReports = asyncHandler(async (req, res) => {
  const reportType = (req.query.type || "applications").toLowerCase();
  if (!SUPPORTED_REPORT_TYPES.includes(reportType)) {
    throw ApiError.badRequest(
      `Invalid report type '${reportType}'. Supported types: [${SUPPORTED_REPORT_TYPES.join(", ")}]`
    );
  }
  const { dateFrom, dateTo, status, stakeholder, officer, center, gatc, GATC: GATC2, search } = req.query;
  validateObjectId2(stakeholder, "stakeholder");
  validateObjectId2(officer, "officer");
  validateObjectId2(center, "center");
  validateObjectId2(gatc || GATC2, "gatc");
  const { page, limit, skip, sort } = getPaginationParams(req.query, 20, 100);
  let query = {};
  let totalRecords = 0;
  let records = [];
  switch (reportType) {
    case "applications": {
      query = { ...parseDateFilter2(dateFrom, dateTo, "createdAt") };
      if (status) query.currentStatus = status;
      if (stakeholder) query.stakeholder = new import_mongoose25.default.Types.ObjectId(stakeholder);
      if (officer) query.assignedLMO = new import_mongoose25.default.Types.ObjectId(officer);
      if (center) query.preferredVerificationCenter = new import_mongoose25.default.Types.ObjectId(center);
      if (gatc || GATC2) query.assignedGATC = new import_mongoose25.default.Types.ObjectId(gatc || GATC2);
      if (search) {
        query.$or = [
          { applicationNumber: new RegExp(search, "i") },
          { purpose: new RegExp(search, "i") },
          { "verificationLocation.district": new RegExp(search, "i") }
        ];
      }
      [totalRecords, records] = await Promise.all([
        VerificationApplication.countDocuments(query),
        VerificationApplication.find(query).populate("stakeholder", "legalName businessName tradeName tradeLicenseNumber gstin contactPerson").populate("instrument", "instrumentType category manufacturer modelNumber serialNumber accuracyClass").populate("assignedLMO", "name email designation jurisdiction").sort(sort).skip(skip).limit(limit).lean()
      ]);
      break;
    }
    case "instruments": {
      query = { ...parseDateFilter2(dateFrom, dateTo, "createdAt") };
      if (status) query.status = status;
      if (stakeholder) query.stakeholder = new import_mongoose25.default.Types.ObjectId(stakeholder);
      if (search) {
        query.$or = [
          { instrumentType: new RegExp(search, "i") },
          { manufacturer: new RegExp(search, "i") },
          { serialNumber: new RegExp(search, "i") },
          { modelNumber: new RegExp(search, "i") }
        ];
      }
      [totalRecords, records] = await Promise.all([
        Instrument.countDocuments(query),
        Instrument.find(query).populate("stakeholder", "legalName businessName tradeName tradeLicenseNumber").sort(sort).skip(skip).limit(limit).lean()
      ]);
      break;
    }
    case "inspections": {
      query = { ...parseDateFilter2(dateFrom, dateTo, "inspectionDate") };
      if (status) {
        query.$or = [{ inspectionStatus: status }, { result: status }];
      }
      if (officer) query.assignedOfficer = new import_mongoose25.default.Types.ObjectId(officer);
      if (stakeholder) query.stakeholder = new import_mongoose25.default.Types.ObjectId(stakeholder);
      if (search) {
        query.$or = [
          { inspectionNumber: new RegExp(search, "i") },
          { observations: new RegExp(search, "i") },
          { inspectorRemarks: new RegExp(search, "i") }
        ];
      }
      [totalRecords, records] = await Promise.all([
        VerificationInspection.countDocuments(query),
        VerificationInspection.find(query).populate("application", "applicationNumber applicationType currentStatus").populate("instrument", "instrumentType manufacturer serialNumber modelNumber").populate("stakeholder", "legalName businessName tradeName").populate("assignedOfficer", "name email designation").sort(sort).skip(skip).limit(limit).lean()
      ]);
      break;
    }
    case "certificates": {
      query = { ...parseDateFilter2(dateFrom, dateTo, "createdAt") };
      if (status) query.status = status;
      if (stakeholder) query.stakeholder = new import_mongoose25.default.Types.ObjectId(stakeholder);
      if (search) {
        query.$or = [
          { certificateNumber: new RegExp(search, "i") },
          { qrVerificationToken: new RegExp(search, "i") },
          { verificationType: new RegExp(search, "i") }
        ];
      }
      [totalRecords, records] = await Promise.all([
        Certificate.countDocuments(query),
        Certificate.find(query).populate("stakeholder", "legalName businessName tradeName").populate("instrument", "instrumentType manufacturer serialNumber").populate("application", "applicationNumber").populate("issuedBy", "name email designation").sort(sort).skip(skip).limit(limit).lean()
      ]);
      break;
    }
    case "schedules": {
      query = { ...parseDateFilter2(dateFrom, dateTo, "scheduledDate") };
      if (status) query.status = status;
      if (officer) query.assignedOfficer = new import_mongoose25.default.Types.ObjectId(officer);
      if (stakeholder) query.stakeholder = new import_mongoose25.default.Types.ObjectId(stakeholder);
      if (center) query.verificationCenter = new import_mongoose25.default.Types.ObjectId(center);
      if (gatc || GATC2) query.assignedGATC = new import_mongoose25.default.Types.ObjectId(gatc || GATC2);
      if (search) {
        query.$or = [
          { locationAddress: new RegExp(search, "i") },
          { timeSlot: new RegExp(search, "i") },
          { notes: new RegExp(search, "i") }
        ];
      }
      [totalRecords, records] = await Promise.all([
        VerificationSchedule.countDocuments(query),
        VerificationSchedule.find(query).populate("application", "applicationNumber currentStatus").populate("instrument", "instrumentType manufacturer serialNumber").populate("stakeholder", "legalName businessName tradeName").populate("assignedOfficer", "name email designation").sort(sort).skip(skip).limit(limit).lean()
      ]);
      break;
    }
    case "stakeholders": {
      query = { ...parseDateFilter2(dateFrom, dateTo, "createdAt") };
      if (status) query.kycStatus = status;
      if (search) {
        query.$or = [
          { legalName: new RegExp(search, "i") },
          { businessName: new RegExp(search, "i") },
          { tradeName: new RegExp(search, "i") },
          { tradeLicenseNumber: new RegExp(search, "i") },
          { gstin: new RegExp(search, "i") }
        ];
      }
      [totalRecords, records] = await Promise.all([
        Stakeholder.countDocuments(query),
        Stakeholder.find(query).populate("user", "name email phone").sort(sort).skip(skip).limit(limit).lean()
      ]);
      break;
    }
    case "officers": {
      query = {
        role: {
          $in: [
            USER_ROLES.LEGAL_METROLOGY_OFFICER,
            USER_ROLES.FIELD_VERIFICATION_OFFICER,
            USER_ROLES.GATC_OFFICER
          ]
        }
      };
      if (status === "ACTIVE") query.isActive = true;
      if (status === "INACTIVE") query.isActive = false;
      if (search) {
        query.$or = [
          { name: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
          { designation: new RegExp(search, "i") },
          { phone: new RegExp(search, "i") }
        ];
      }
      [totalRecords, records] = await Promise.all([
        User.countDocuments(query),
        User.find(query).select("-password -__v").sort(sort).skip(skip).limit(limit).lean()
      ]);
      break;
    }
  }
  const paginationData = buildPaginationResponse(records, totalRecords, page, limit);
  return ApiResponse.success(
    res,
    {
      reportType,
      filtersApplied: {
        dateFrom,
        dateTo,
        status,
        stakeholder,
        officer,
        search
      },
      pagination: paginationData.pagination,
      records: paginationData.items
    },
    `Statutory ${reportType} report retrieved successfully`
  );
});
var exportAdminReports = asyncHandler(async (req, res) => {
  const reportType = (req.query.type || "").toLowerCase();
  const format = (req.query.format || "csv").toLowerCase();
  if (!SUPPORTED_REPORT_TYPES.includes(reportType)) {
    throw ApiError.badRequest(
      `Invalid or missing export report type '${reportType}'. Supported types: [${SUPPORTED_REPORT_TYPES.join(", ")}]`
    );
  }
  await AuditLog.create({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: "ADMIN_REPORT_EXPORT",
    entity: "REPORT",
    entityId: reportType,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    metadata: {
      reportType,
      format,
      filters: req.query,
      timestamp: /* @__PURE__ */ new Date()
    }
  });
  const { dateFrom, dateTo, status, stakeholder, officer } = req.query;
  validateObjectId2(stakeholder, "stakeholder");
  validateObjectId2(officer, "officer");
  let rows = [];
  let headers = [];
  if (reportType === "applications") {
    const query = { ...parseDateFilter2(dateFrom, dateTo, "createdAt") };
    if (status) query.currentStatus = status;
    if (stakeholder) query.stakeholder = new import_mongoose25.default.Types.ObjectId(stakeholder);
    if (officer) query.assignedLMO = new import_mongoose25.default.Types.ObjectId(officer);
    rows = await VerificationApplication.find(query).populate("stakeholder", "legalName businessName tradeName").populate("instrument", "instrumentType manufacturer serialNumber").populate("assignedLMO", "name email designation").sort({ createdAt: -1 }).limit(2e3).lean();
    headers = [
      { label: "Application Number", accessor: (r) => r.applicationNumber },
      { label: "Application Type", accessor: (r) => r.applicationType },
      { label: "Status", accessor: (r) => r.currentStatus },
      { label: "Business Name", accessor: (r) => r.stakeholder?.businessName || r.stakeholder?.legalName || "" },
      { label: "Instrument Type", accessor: (r) => r.instrument?.instrumentType || "" },
      { label: "Serial Number", accessor: (r) => r.instrument?.serialNumber || "" },
      { label: "Assigned Officer", accessor: (r) => r.assignedLMO?.name || "" },
      { label: "Submission Date", accessor: (r) => r.createdAt ? new Date(r.createdAt).toISOString() : "" }
    ];
  } else if (reportType === "instruments") {
    const query = { ...parseDateFilter2(dateFrom, dateTo, "createdAt") };
    if (status) query.status = status;
    if (stakeholder) query.stakeholder = new import_mongoose25.default.Types.ObjectId(stakeholder);
    rows = await Instrument.find(query).populate("stakeholder", "legalName businessName").sort({ createdAt: -1 }).limit(2e3).lean();
    headers = [
      { label: "Instrument ID", accessor: (r) => r.instrumentId || r._id },
      { label: "Instrument Type", accessor: (r) => r.instrumentType },
      { label: "Category", accessor: (r) => r.category },
      { label: "Manufacturer", accessor: (r) => r.manufacturer },
      { label: "Model Number", accessor: (r) => r.modelNumber },
      { label: "Serial Number", accessor: (r) => r.serialNumber },
      { label: "Accuracy Class", accessor: (r) => r.accuracyClass },
      { label: "Status", accessor: (r) => r.status },
      { label: "Next Due Date", accessor: (r) => r.nextVerificationDueDate ? new Date(r.nextVerificationDueDate).toISOString() : "" },
      { label: "Business Name", accessor: (r) => r.stakeholder?.businessName || "" }
    ];
  } else if (reportType === "inspections") {
    const query = { ...parseDateFilter2(dateFrom, dateTo, "inspectionDate") };
    if (status) query.inspectionStatus = status;
    rows = await VerificationInspection.find(query).populate("application", "applicationNumber").populate("instrument", "instrumentType serialNumber").populate("stakeholder", "businessName legalName").populate("assignedOfficer", "name designation").sort({ inspectionDate: -1 }).limit(2e3).lean();
    headers = [
      { label: "Inspection Number", accessor: (r) => r.inspectionNumber },
      { label: "Application Number", accessor: (r) => r.application?.applicationNumber || "" },
      { label: "Stakeholder", accessor: (r) => r.stakeholder?.businessName || "" },
      { label: "Instrument", accessor: (r) => r.instrument?.instrumentType || "" },
      { label: "Inspector", accessor: (r) => r.assignedOfficer?.name || "" },
      { label: "Status", accessor: (r) => r.inspectionStatus },
      { label: "Result", accessor: (r) => r.result },
      { label: "Date", accessor: (r) => r.inspectionDate ? new Date(r.inspectionDate).toISOString() : "" }
    ];
  } else if (reportType === "certificates") {
    const query = { ...parseDateFilter2(dateFrom, dateTo, "createdAt") };
    if (status) query.status = status;
    rows = await Certificate.find(query).populate("stakeholder", "businessName legalName").populate("instrument", "instrumentType serialNumber").populate("issuedBy", "name designation").sort({ createdAt: -1 }).limit(2e3).lean();
    headers = [
      { label: "Certificate Number", accessor: (r) => r.certificateNumber },
      { label: "Stakeholder", accessor: (r) => r.stakeholder?.businessName || "" },
      { label: "Instrument", accessor: (r) => r.instrument?.instrumentType || "" },
      { label: "Status", accessor: (r) => r.status },
      { label: "Valid From", accessor: (r) => r.validFrom ? new Date(r.validFrom).toISOString() : "" },
      { label: "Valid Until", accessor: (r) => r.validUntil ? new Date(r.validUntil).toISOString() : "" },
      { label: "Issued By", accessor: (r) => r.issuedBy?.name || "" }
    ];
  } else if (reportType === "schedules") {
    const query = { ...parseDateFilter2(dateFrom, dateTo, "scheduledDate") };
    if (status) query.status = status;
    rows = await VerificationSchedule.find(query).populate("stakeholder", "businessName legalName").populate("instrument", "instrumentType serialNumber").populate("assignedOfficer", "name designation").sort({ scheduledDate: -1 }).limit(2e3).lean();
    headers = [
      { label: "Schedule ID", accessor: (r) => r._id },
      { label: "Stakeholder", accessor: (r) => r.stakeholder?.businessName || "" },
      { label: "Scheduled Date", accessor: (r) => r.scheduledDate ? new Date(r.scheduledDate).toISOString() : "" },
      { label: "Time Slot", accessor: (r) => r.timeSlot || "" },
      { label: "Assigned Officer", accessor: (r) => r.assignedOfficer?.name || "" },
      { label: "Location", accessor: (r) => r.locationAddress || "" },
      { label: "Status", accessor: (r) => r.status }
    ];
  } else if (reportType === "stakeholders") {
    const query = { ...parseDateFilter2(dateFrom, dateTo, "createdAt") };
    if (status) query.kycStatus = status;
    rows = await Stakeholder.find(query).sort({ createdAt: -1 }).limit(2e3).lean();
    headers = [
      { label: "Stakeholder ID", accessor: (r) => r._id },
      { label: "Legal Name", accessor: (r) => r.legalName },
      { label: "Business Name", accessor: (r) => r.businessName || "" },
      { label: "Trade License", accessor: (r) => r.tradeLicenseNumber || "" },
      { label: "GSTIN", accessor: (r) => r.gstin || "" },
      { label: "District", accessor: (r) => r.registeredAddress?.district || "" },
      { label: "KYC Status", accessor: (r) => r.kycStatus },
      { label: "Created At", accessor: (r) => r.createdAt ? new Date(r.createdAt).toISOString() : "" }
    ];
  } else if (reportType === "officers") {
    const query = {
      role: {
        $in: [
          USER_ROLES.LEGAL_METROLOGY_OFFICER,
          USER_ROLES.FIELD_VERIFICATION_OFFICER,
          USER_ROLES.GATC_OFFICER
        ]
      }
    };
    rows = await User.find(query).select("-password -__v").limit(2e3).lean();
    headers = [
      { label: "Officer ID", accessor: (r) => r._id },
      { label: "Name", accessor: (r) => r.name },
      { label: "Email", accessor: (r) => r.email },
      { label: "Phone", accessor: (r) => r.phone || "" },
      { label: "Role", accessor: (r) => r.role },
      { label: "Designation", accessor: (r) => r.designation || "" },
      { label: "District", accessor: (r) => r.jurisdiction?.district || "" },
      { label: "Active", accessor: (r) => r.isActive ? "YES" : "NO" }
    ];
  }
  rows.forEach((row) => {
    delete row.password;
    delete row.__v;
    if (row.user && typeof row.user === "object") {
      delete row.user.password;
    }
  });
  if (format === "json") {
    return ApiResponse.success(res, rows, `Statutory ${reportType} report exported in JSON format`);
  }
  const csvData = toCsv2(headers, rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="doca_admin_${reportType}_report_${Date.now()}.csv"`
  );
  return res.status(200).send(csvData);
});
var getDatabaseIntegrityReport = asyncHandler(async (req, res) => {
  const { runDatabaseIntegrityDiagnostics: runDatabaseIntegrityDiagnostics2 } = await Promise.resolve().then(() => (init_integrityDiagnosticService(), integrityDiagnosticService_exports));
  const report = await runDatabaseIntegrityDiagnostics2();
  return ApiResponse.success(
    res,
    report,
    report.isConsistent ? "Database referential integrity verified: No orphaned records detected." : `Database referential scan completed: ${report.totalOrphansDetected} orphaned records detected.`
  );
});

// backend/routes/adminRoutes.js
init_constants();
var router13 = (0, import_express13.Router)();
router13.use(protect);
router13.use(authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN));
router13.get("/diagnostics/integrity", getDatabaseIntegrityReport);
router13.get("/dashboard/summary", getAdminDashboardSummary);
router13.get("/analytics/applications", getApplicationAnalytics);
router13.get("/analytics/verifications", getVerificationAnalytics);
router13.get("/analytics/certificates", getCertificateAnalytics);
router13.get("/analytics/schedules", getScheduleAnalytics);
router13.get("/analytics/officers", getOfficerWorkload);
router13.get("/analytics/instruments", getInstrumentAnalytics);
router13.get("/analytics/stakeholders", getStakeholderAnalytics);
router13.get("/reports", getAdminReports);
router13.get("/reports/export", exportAdminReports);
router13.get("/audit-logs", getAuditLogs);
var adminRoutes_default = router13;

// backend/routes/centerRoutes.js
var import_express14 = require("express");
var router14 = (0, import_express14.Router)();
router14.get(
  "/",
  asyncHandler(async (req, res) => {
    const { district, state, type } = req.query;
    const filter = { isActive: true };
    if (district) {
      filter["jurisdiction.district"] = new RegExp(district, "i");
    }
    if (state) {
      filter["jurisdiction.state"] = new RegExp(state, "i");
    }
    if (type) {
      filter.type = type;
    }
    const centers = await VerificationCenter.find(filter).sort({ name: 1 });
    return ApiResponse.success(res, centers, "Verification centers retrieved successfully");
  })
);
router14.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const center = await VerificationCenter.findById(req.params.id);
    if (!center) {
      throw ApiError.notFound("Verification center not found");
    }
    return ApiResponse.success(res, center, "Verification center retrieved successfully");
  })
);
var centerRoutes_default = router14;

// backend/app.js
init_constants();
var app = (0, import_express15.default)();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(
  (0, import_helmet.default)({
    contentSecurityPolicy: false,
    // Customized for /api endpoints below without breaking frontend preview
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: false,
    // Handled per-route: DENY on /api/*, allowed for AI Studio preview iframe
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: {
      maxAge: 31536e3,
      includeSubDomains: true,
      preload: false
    },
    xContentTypeOptions: true,
    dnsPrefetchControl: { allow: false },
    permittedCrossDomainPolicies: { permittedPolicies: "none" }
  })
);
app.use("/api", (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});
app.use((req, res, next) => {
  if (!req.path.startsWith("/api")) {
    res.removeHeader("X-Frame-Options");
  }
  next();
});
app.use(
  (0, import_cors.default)({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      const cleanOrigin = origin.trim().replace(/\/$/, "");
      if (ALLOWED_ORIGINS.includes(cleanOrigin) || cleanOrigin.endsWith(".run.app") || cleanOrigin.endsWith(".google.com") || cleanOrigin.endsWith("ai.studio")) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset", "Retry-After"],
    maxAge: 86400
  })
);
app.use(import_express15.default.json({ limit: "10mb" }));
app.use(import_express15.default.urlencoded({ extended: true, limit: "10mb" }));
app.use((0, import_hpp.default)());
app.use("/uploads", (req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
    return next(ApiError.methodNotAllowed(`HTTP method ${req.method} is not allowed on file storage.`));
  }
  next();
});
app.use(requestSecurityMiddleware);
var uploadDirs = ["documents", "certificates", "instrument-photos"];
uploadDirs.forEach((dir) => {
  const dirPath = import_path7.default.join(ENV.UPLOAD_DIR, dir);
  if (!import_fs6.default.existsSync(dirPath)) {
    import_fs6.default.mkdirSync(dirPath, { recursive: true });
  }
});
app.use((req, res, next) => {
  let reqPath = req.path || "";
  try {
    reqPath = decodeURIComponent(reqPath);
  } catch (e) {
    return next(ApiError.badRequest("Malformed request URL path."));
  }
  const lower = reqPath.toLowerCase();
  if (lower.includes("..") || lower.includes("/.env") || lower.endsWith(".env") || lower.includes("package.json") || lower.includes("server.ts") || lower.includes("server.js") || lower.includes("/backend/") || lower.includes("/.git")) {
    return res.status(404).json({ success: false, message: "Resource not found" });
  }
  if (process.env.NODE_ENV === "production" && lower.includes("/node_modules/")) {
    return res.status(404).json({ success: false, message: "Resource not found" });
  }
  next();
});
app.route("/uploads/:folder/:filename").get(protect, getSecureFile).all((req, res, next) => next(ApiError.methodNotAllowed("HTTP method not allowed on file storage.")));
app.all("/uploads", (req, res, next) => next(ApiError.forbidden("Direct directory listing or access to storage is forbidden.")));
app.all("/uploads/*", (req, res, next) => next(ApiError.notFound("Requested file resource not found.")));
app.use("/api/", apiRateLimiter);
app.route("/api/health").get((req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Legal Metrology Online Verification System (DoCA)",
    problemStatement: "SIH-26036",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    environment: ENV.NODE_ENV
  });
}).all((req, res, next) => {
  next(ApiError.methodNotAllowed(`HTTP method ${req.method} is not allowed on /api/health. Supported methods: GET.`));
});
app.use("/api/auth", authRoutes_default);
app.use("/api/admin/users", userRoutes_default);
app.use("/api/admin", adminRoutes_default);
app.use("/api/users", userRoutes_default);
app.use("/api/stakeholders", stakeholderRoutes_default);
app.use("/api/instruments", instrumentRoutes_default);
app.use("/api/applications", applicationRoutes_default);
app.use("/api/schedules", scheduleRoutes_default);
app.use("/api/inspections", inspectionRoutes_default);
app.use("/api/results", resultRoutes_default);
app.route("/api/public/certificates/verify/:token").get(verifyCertificatePublic).all((req, res, next) => {
  next(ApiError.methodNotAllowed(`HTTP method ${req.method} is not supported for certificate verification. Supported methods: GET.`));
});
app.route("/api/public/certificates/search/:token").get(verifyCertificatePublic).all((req, res, next) => {
  next(ApiError.methodNotAllowed(`HTTP method ${req.method} is not supported for certificate search. Supported methods: GET.`));
});
app.use("/api/certificates", certificateRoutes_default);
app.use("/api/notifications", notificationRoutes_default);
app.use("/api/dashboard", dashboardRoutes_default);
app.use("/api/reports", reportRoutes_default);
app.use("/api/centers", centerRoutes_default);
app.get(
  "/api/audit-logs",
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  getAuditLogs
);
app.all("/api/*", (req, res, next) => {
  next(ApiError.notFound(`API endpoint '${req.originalUrl}' does not exist on this server.`));
});
app.use(errorHandler);
var app_default = app;

// backend/config/db.js
var import_mongoose26 = __toESM(require("mongoose"), 1);
async function connectDB() {
  const uri = ENV.MONGO_URI;
  const mongooseOpts = {
    serverSelectionTimeoutMS: 5e3
  };
  try {
    if (uri && uri.trim() !== "") {
      const sanitizedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:*****@");
      console.log(`[DATABASE] Connecting to real MongoDB database at: ${sanitizedUri}`);
      await import_mongoose26.default.connect(uri, mongooseOpts);
      console.log(`[DATABASE] Successfully connected to real MongoDB database: ${import_mongoose26.default.connection.name} (Host: ${import_mongoose26.default.connection.host})`);
      return import_mongoose26.default.connection;
    } else {
      throw new Error("[DATABASE FATAL] MONGO_URI is not configured in environment variables.");
    }
  } catch (error) {
    console.error(`[DATABASE ERROR] Failed to connect to MongoDB: ${error.message}`);
    throw error;
  }
}
async function disconnectDB() {
  try {
    await import_mongoose26.default.disconnect();
    console.log("[DATABASE] MongoDB connection closed safely.");
  } catch (err) {
    console.error("[DATABASE ERROR] Error during database shutdown:", err.message);
  }
}
process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await disconnectDB();
  process.exit(0);
});

// server.ts
var PORT = 3e3;
async function startServer() {
  try {
    if (process.env.NODE_ENV !== "production") {
      const vite = await (0, import_vite.createServer)({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app_default.use(vite.middlewares);
    } else {
      const distPath = import_path8.default.join(process.cwd(), "dist");
      app_default.use(import_express16.default.static(distPath));
      app_default.get("*", (req, res) => {
        res.sendFile(import_path8.default.join(distPath, "index.html"));
      });
    }
    app_default.listen(PORT, "0.0.0.0", () => {
      console.log(`====================================================`);
      console.log(`\u2696\uFE0F  Legal Metrology Verification Server Started`);
      console.log(`\u{1F3DB}\uFE0F  DoCA / SIH Problem Statement ID: 26036`);
      console.log(`\u{1F680} Port: ${PORT} | Mode: ${process.env.NODE_ENV || "development"}`);
      console.log(`\u{1F4E1} API Base: http://localhost:${PORT}/api`);
      console.log(`====================================================`);
    });
    connectDB().catch((err) => {
      console.error("[DATABASE WARNING] Initial MongoDB connection error:", err?.message);
    });
  } catch (error) {
    console.error("Server startup failed:", error?.message);
    process.exit(1);
  }
}
startServer();
//# sourceMappingURL=server.cjs.map
