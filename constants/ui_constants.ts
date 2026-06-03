// UI Constants — all hard-coded strings and values used across the application UI

// ── App identity ──────────────────────────────────────────────────────────────
export const APP_NAME = 'MediNotes Pro';
export const APP_TAGLINE = 'Transform Your\nConsultation Notes';
export const APP_DESCRIPTION =
    'AI-powered assistant that generates professional summaries, action items, and patient communications from your consultation notes';

// ── Page metadata ─────────────────────────────────────────────────────────────
export const PRODUCT_PAGE_TITLE = 'Consultation Assistant | consultationAI';
export const PRODUCT_PAGE_META_DESCRIPTION =
    'AI-powered consultation summaries, next steps, and patient-ready communication drafts.';

// ── Navigation / CTA labels ───────────────────────────────────────────────────
export const LABEL_SIGN_IN = 'Sign In';
export const LABEL_GO_TO_APP = 'Go to App';
export const LABEL_START_FREE_TRIAL = 'Start Free Trial';
export const LABEL_OPEN_CONSULTATION_ASSISTANT = 'Open Consultation Assistant';

// ── Routes ────────────────────────────────────────────────────────────────────
export const ROUTE_PRODUCT = '/product';

// ── Notices & disclaimers ─────────────────────────────────────────────────────
export const NOTICE_DEMO_TITLE = 'Professional Notice: Demonstration System';
export const NOTICE_DEMO_BODY =
    'This portfolio application is for demonstration purposes only and must not be used with real patient, personal, or otherwise regulated data.';
export const NOTICE_PHI_WARNING =
    'For demonstration purposes only. Do not enter real PHI (Protected Health Information) or PII (Personally Identifiable Information) in this application.';
export const FOOTER_TRUST_LINE =
    'Demo-Only • Security-Conscious Architecture • Professional Engineering Showcase';

// ── Feature cards (landing page) ─────────────────────────────────────────────
export const FEATURES = [
    {
        icon: '📋',
        title: 'Professional Summaries',
        description: 'Generate comprehensive medical record summaries from your notes',
    },
    {
        icon: '✅',
        title: 'Action Items',
        description: 'Clear next steps and follow-up actions for every consultation',
    },
    {
        icon: '📧',
        title: 'Patient Emails',
        description: 'Draft clear, patient-friendly email communications automatically',
    },
] as const;

// ── Subscription / pricing ────────────────────────────────────────────────────
export const CLERK_PLAN_PREMIUM = 'premium_subscription';
export const PRICING_HEADER_TITLE = 'Healthcare Professional Plan';
export const PRICING_HEADER_SUBTITLE =
    'Streamline your patient consultations with AI-powered summaries';

// ── Consultation form ─────────────────────────────────────────────────────────
export const FORM_HEADING = 'Consultation Notes';
export const LABEL_PATIENT_NAME = 'Patient Name';
export const PLACEHOLDER_PATIENT_NAME = "Enter patient's full name";
export const LABEL_DATE_OF_VISIT = 'Date of Visit';
export const PLACEHOLDER_DATE = 'Select date';
export const DATE_FORMAT = 'yyyy-MM-dd';
export const LABEL_CONSULTATION_NOTES = 'Consultation Notes';
export const PLACEHOLDER_NOTES = 'Enter detailed consultation notes...';
export const TEXTAREA_ROWS = 8;

// ── Button / status labels ────────────────────────────────────────────────────
export const BTN_GENERATE_SUMMARY = 'Generate Summary';
export const BTN_GENERATING_SUMMARY = 'Generating Summary...';

// ── Error / status messages ───────────────────────────────────────────────────
export const MSG_AUTH_REQUIRED = 'Authentication required';
export const MSG_CONNECTION_ERROR =
    'Unable to connect to the consultation service. Please try again.';
