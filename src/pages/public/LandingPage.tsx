import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GovFooter } from '../../components/layout/GovFooter';
import { LoginModal } from '../../components/auth/LoginModal';
import heroImage from './images/legal-metrology-hero.webp';
import {
  Scale,
  Search,
  ShieldCheck,
  FileCheck2,
  Building2,
  QrCode,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Download,
  Smartphone,
  Users,
  Home,
  Landmark,
  Phone,
  Menu,
  X,
  ChevronDown,
  Megaphone,
} from 'lucide-react';

type Language = 'en' | 'hi';
type FontSize = 'small' | 'normal' | 'large';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const [language, setLanguage] = useState<Language>('en');
  const [fontSize, setFontSize] = useState<FontSize>('normal');
  const [tokenInput, setTokenInput] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [downloadToast, setDownloadToast] = useState(false);

  const handleDownloadApk = () => {
    setDownloadToast(true);
    setTimeout(() => {
      setDownloadToast(false);
    }, 4500);
  };

  /* =========================================================
     TRANSLATIONS
  ========================================================= */

  const translations = {
    en: {
      government: 'Government of India',
      department: 'Department of Consumer Affairs',
      indiaGov: 'Government of India',
      act: 'Legal Metrology Act, 2009',

      portalTitle: 'e-Maap Verify',
      portalSubtitle:
        'Online Verification System for Weighing & Measuring Instruments',
      legalMetrology: 'Legal Metrology | GoI',

      helpline: 'Helpline / Admission Enquiry',
      phone: '+91 7708001234',
      login: 'Login',
      installApp: 'Install App',
      downloadApp: 'Download Android App',

      home: 'Home',
      about: 'About Us',
      services: 'Services',
      actsRules: 'Act & Rules',
      downloads: 'Downloads',
      faqs: 'FAQs',
      contact: 'Contact Us',

      heroTitle: 'Ensuring Accuracy,',
      heroTitle2: 'Building Trust',
      heroText:
        'e-Maap Verify is an online platform for verification of weighing and measuring instruments under the Legal Metrology Act, 2009 and Rules, 2011.',

      apply: 'Apply for Verification',
      knowMore: 'Know More',

      updates: 'Latest Updates & Notices',
      viewAll: 'View All',

      latest1Title: '10 Sep 2025',
      latest1:
        'New guidelines for online verification of weighing instruments issued.',

      latest2Title: '05 Sep 2025',
      latest2:
        'Implementation of revised fee structure under Legal Metrology Rules, 2011.',

      latest3Title: '28 Aug 2025',
      latest3:
        'System maintenance scheduled for 14 Sep 2025 (10:00 AM – 12:00 PM).',

      latest4Title: '20 Aug 2025',
      latest4:
        'General awareness campaign on legal metrology compliance.',

      servicesTitle: 'Our Services',
      servicesSubtitle:
        'Citizen-centric services for transparent and accurate measurements.',
      viewServices: 'View All Services',

      applyVerification: 'Apply for Verification',
      applyDescription:
        'Submit application for verification of weighing & measuring instruments.',

      verifyCertificate: 'Verify Certificate',
      verifyDescription:
        'Scan QR code or enter certificate details to verify authenticity.',

      checkStatus: 'Check Application Status',
      statusDescription:
        'Track your application and verification status.',

      registered: 'Registered LMOs / GATCs',
      registeredDescription:
        'View list of approved Legal Metrology Officers and GATCs.',

      actRules: 'Act & Rules',
      actDescription:
        'Read Legal Metrology Act, 2009 and Rules, 2011.',

      download: 'Downloads',
      downloadDescription:
        'Get forms, guidelines, manuals and other useful documents.',

      legalTitle: 'Legal Metrology',
      legalText:
        'Legal Metrology ensures fairness in trade and protects the rights of consumers by regulating weights and measures.',

      fairTrade: 'Fair Trade Practices',
      consumerProtection: 'Consumer Protection',
      accurate: 'Accurate Measurements',
      quality: 'Quality & Trust',
      learnMore: 'Learn More',

      quickVerifyTitle: 'Verify Certificate',
      quickVerifyText:
        'Enter certificate number or QR verification token to verify authenticity.',

      searchPlaceholder:
        'Enter Certificate No. or QR Verification Token...',
      verifyNow: 'Verify Now',

      bottomConsumer: 'Consumer Protection',
      bottomConsumerText:
        'Ensuring accurate weights and measures for a fair marketplace.',

      bottomCompliance: 'Legal Compliance',
      bottomComplianceText:
        'As per Legal Metrology Act, 2009 and Rules, 2011.',

      bottomCitizen: 'Service to Citizens',
      bottomCitizenText:
        'Transparent, efficient and technology-driven services.',

      footerGovernment: 'Government of India',
      footerDepartment: 'Department of Consumer Affairs',

      quickLinks: 'Quick Links',
      importantLinks: 'Important Links',
      followUs: 'Follow Us',

      ministry: 'Ministry of Consumer Affairs',
      rules: 'Rules 2011',
      rti: 'RTI',

      lastUpdated: 'Last Updated: 10 Sep 2025',
      copyright:
        '© 2025 Department of Consumer Affairs, Government of India. All rights reserved.',
    },

    hi: {
      government: 'भारत सरकार',
      department: 'उपभोक्ता मामले विभाग',
      indiaGov: 'भारत सरकार',
      act: 'विधिक मापविज्ञान अधिनियम, 2009',

      portalTitle: 'ई-माप वेरिफाई',
      portalSubtitle:
        'तौल एवं माप उपकरणों के लिए ऑनलाइन सत्यापन प्रणाली',
      legalMetrology: 'विधिक मापविज्ञान | भारत सरकार',

      helpline: 'हेल्पलाइन / प्रवेश पूछताछ',
      phone: '+91 7708001234',
      login: 'लॉगिन',
      installApp: 'ऐप इंस्टॉल करें',
      downloadApp: 'एंड्रॉइड ऐप डाउनलोड करें',

      home: 'होम',
      about: 'हमारे बारे में',
      services: 'सेवाएँ',
      actsRules: 'अधिनियम एवं नियम',
      downloads: 'डाउनलोड',
      faqs: 'अक्सर पूछे जाने वाले प्रश्न',
      contact: 'संपर्क करें',

      heroTitle: 'सटीकता सुनिश्चित करें,',
      heroTitle2: 'विश्वास का निर्माण करें',
      heroText:
        'ई-माप वेरिफाई, विधिक मापविज्ञान अधिनियम, 2009 एवं नियम, 2011 के अंतर्गत तौल एवं माप उपकरणों के सत्यापन के लिए एक ऑनलाइन प्लेटफॉर्म है।',

      apply: 'सत्यापन के लिए आवेदन करें',
      knowMore: 'अधिक जानकारी',

      updates: 'नवीनतम अपडेट एवं सूचनाएँ',
      viewAll: 'सभी देखें',

      latest1Title: '10 सितम्बर 2025',
      latest1:
        'तौल उपकरणों के ऑनलाइन सत्यापन के लिए नए दिशा-निर्देश जारी।',

      latest2Title: '05 सितम्बर 2025',
      latest2:
        'विधिक मापविज्ञान नियम, 2011 के अंतर्गत संशोधित शुल्क संरचना लागू।',

      latest3Title: '28 अगस्त 2025',
      latest3:
        '14 सितम्बर 2025 को सिस्टम रखरखाव निर्धारित है (10:00 AM – 12:00 PM)।',

      latest4Title: '20 अगस्त 2025',
      latest4:
        'विधिक मापविज्ञान अनुपालन पर सामान्य जागरूकता अभियान।',

      servicesTitle: 'हमारी सेवाएँ',
      servicesSubtitle:
        'पारदर्शी एवं सटीक माप के लिए नागरिक-केंद्रित सेवाएँ।',
      viewServices: 'सभी सेवाएँ देखें',

      applyVerification: 'सत्यापन के लिए आवेदन',
      applyDescription:
        'तौल एवं माप उपकरणों के सत्यापन के लिए आवेदन जमा करें।',

      verifyCertificate: 'प्रमाणपत्र सत्यापित करें',
      verifyDescription:
        'प्रामाणिकता सत्यापित करने के लिए QR कोड स्कैन करें या प्रमाणपत्र विवरण दर्ज करें।',

      checkStatus: 'आवेदन की स्थिति देखें',
      statusDescription:
        'अपने आवेदन एवं सत्यापन की स्थिति को ट्रैक करें।',

      registered: 'पंजीकृत LMO / GATC',
      registeredDescription:
        'अनुमोदित विधिक मापविज्ञान अधिकारियों एवं GATC की सूची देखें।',

      actRules: 'अधिनियम एवं नियम',
      actDescription:
        'विधिक मापविज्ञान अधिनियम, 2009 एवं नियम, 2011 पढ़ें।',

      download: 'डाउनलोड',
      downloadDescription:
        'फॉर्म, दिशा-निर्देश, मैनुअल एवं अन्य उपयोगी दस्तावेज प्राप्त करें।',

      legalTitle: 'विधिक मापविज्ञान',
      legalText:
        'विधिक मापविज्ञान व्यापार में निष्पक्षता सुनिश्चित करता है और तौल एवं माप को नियंत्रित करके उपभोक्ताओं के अधिकारों की रक्षा करता है।',

      fairTrade: 'निष्पक्ष व्यापार प्रथाएँ',
      consumerProtection: 'उपभोक्ता संरक्षण',
      accurate: 'सटीक माप',
      quality: 'गुणवत्ता एवं विश्वास',
      learnMore: 'अधिक जानें',

      quickVerifyTitle: 'प्रमाणपत्र सत्यापित करें',
      quickVerifyText:
        'प्रामाणिकता सत्यापित करने के लिए प्रमाणपत्र संख्या या QR सत्यापन टोकन दर्ज करें।',

      searchPlaceholder:
        'प्रमाणपत्र संख्या या QR सत्यापन टोकन दर्ज करें...',
      verifyNow: 'अभी सत्यापित करें',

      bottomConsumer: 'उपभोक्ता संरक्षण',
      bottomConsumerText:
        'निष्पक्ष बाजार के लिए सटीक तौल एवं माप सुनिश्चित करना।',

      bottomCompliance: 'कानूनी अनुपालन',
      bottomComplianceText:
        'विधिक मापविज्ञान अधिनियम, 2009 एवं नियम, 2011 के अनुसार।',

      bottomCitizen: 'नागरिकों के लिए सेवा',
      bottomCitizenText:
        'पारदर्शी, प्रभावी एवं तकनीक आधारित सेवाएँ।',

      footerGovernment: 'भारत सरकार',
      footerDepartment: 'उपभोक्ता मामले विभाग',

      quickLinks: 'त्वरित लिंक',
      importantLinks: 'महत्वपूर्ण लिंक',
      followUs: 'हमें फॉलो करें',

      ministry: 'उपभोक्ता मामले मंत्रालय',
      rules: 'नियम 2011',
      rti: 'RTI',

      lastUpdated: 'अंतिम अपडेट: 10 सितम्बर 2025',
      copyright:
        '© 2025 उपभोक्ता मामले विभाग, भारत सरकार। सर्वाधिकार सुरक्षित।',
    },
  };

  const t = translations[language];

  /* =========================================================
     FONT SIZE
  ========================================================= */

  const fontScale =
    fontSize === 'small'
      ? 0.90
      : fontSize === 'large'
        ? 1.12
        : 1;

  const increaseFont = () => {
    setFontSize((current) => {
      if (current === 'small') return 'normal';
      if (current === 'normal') return 'large';
      return 'large';
    });
  };

  const decreaseFont = () => {
    setFontSize((current) => {
      if (current === 'large') return 'normal';
      if (current === 'normal') return 'small';
      return 'small';
    });
  };

  const resetFont = () => {
    setFontSize('normal');
  };

  /* =========================================================
     QUICK VERIFY
  ========================================================= */

  const handleQuickVerify = (e: React.FormEvent) => {
    e.preventDefault();

    const value = tokenInput.trim();

    if (!value) return;

    navigate(
      `/verify-certificate?token=${encodeURIComponent(value)}`
    );
  };

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const scrollToSection = (id: string) => {
    setMobileMenu(false);

    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  /* =========================================================
     RETURN
  ========================================================= */

  return (
    <div
      className={`landing-page ${
        language === 'hi' ? 'landing-hindi' : ''
      }`}
      style={{
        ['--landing-scale' as string]: fontScale,
      }}
    >
      {/* =====================================================
          ACCESSIBILITY / FONT CSS
      ===================================================== */}

      <style>
        {`
          .landing-page {
            --primary: #123b6d;
            --primary-dark: #0d2d53;
            --accent: #07549a;
            --border: #d8e6f3;
            --text: #17365d;
            --muted: #5d6b7a;

            min-height: 100vh;
            background: #ffffff;
            color: #243447;
            overflow-x: hidden;

            font-family:
              Inter,
              "Noto Sans",
              "Noto Sans Devanagari",
              Arial,
              sans-serif;

            font-size: calc(16px * var(--landing-scale));
          }

          .landing-hindi {
            font-family:
              "Noto Sans Devanagari",
              "Noto Sans",
              Arial,
              sans-serif;
          }

          /*
            Font accessibility:
            All normal text uses em/rem-independent inherited
            sizing where possible. The scale is also applied
            to Tailwind generated text elements.
          */

          .landing-page .landing-text {
            font-size: 1em;
          }

          .landing-page .landing-small {
            font-size: 0.82em;
          }

          .landing-page .landing-xs {
            font-size: 0.75em;
          }

          .landing-page .landing-title {
            font-size: 2.7em;
          }

          .landing-page .landing-section-title {
            font-size: 1.55em;
          }

          .landing-page .landing-card-title {
            font-size: 1em;
          }

          .landing-page button,
          .landing-page a,
          .landing-page input {
            font-family: inherit;
          }

          .landing-page input::placeholder {
            color: #718096;
            opacity: 1;
          }

          .landing-page .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }

          .landing-page .hide-scrollbar {
            scrollbar-width: none;
          }

          @media (max-width: 640px) {
            .landing-page {
              font-size: calc(15px * var(--landing-scale));
            }

            .landing-page .landing-title {
              font-size: 2.15em;
            }

            .landing-page .landing-section-title {
              font-size: 1.35em;
            }
          }

          @media (max-width: 380px) {
            .landing-page {
              font-size: calc(14px * var(--landing-scale));
            }

            .landing-page .landing-title {
              font-size: 1.8em;
            }
          }
        `}
      </style>

      {/* =====================================================
          TOP GOVERNMENT BAR
      ===================================================== */}

      <div className="bg-[#123b6d] text-white border-b border-blue-900">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
          <div className="min-h-[32px] py-1.5 flex flex-wrap items-center justify-between gap-2">

            <div className="flex items-center gap-2 landing-small min-w-0">
              <span className="text-base shrink-0">🇮🇳</span>

              <span className="font-bold whitespace-nowrap">
                {t.government}
              </span>

              <span className="opacity-60">|</span>

              <span className="hidden sm:inline truncate">
                {t.department}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">

 {/* LANGUAGE + FONT SIZE CONTROLS */}
<div className="flex items-center gap-2 sm:gap-3">

  {/* LANGUAGE DROPDOWN */}
  <div className="relative">
    <select
      value={language}
      onChange={(e) =>
        setLanguage(e.target.value as Language)
      }
      className="appearance-none bg-white/10 border border-white/25
                 text-white rounded-md pl-3 pr-8 py-1.5
                 text-xs font-semibold cursor-pointer
                 focus:outline-none focus:ring-2 focus:ring-white/40"
      aria-label="Select Language"
    >
      <option value="en" className="text-slate-800">
        English
      </option>

      <option value="hi" className="text-slate-800">
        हिन्दी
      </option>
    </select>

    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs">
      ▾
    </span>
  </div>

  {/* FONT SIZE DROPDOWN */}
  <div className="relative">
    <select
      value={fontSize}
      onChange={(e) =>
        setFontSize(e.target.value as FontSize)
      }
      className="appearance-none bg-white/10 border border-white/25
                 text-white rounded-md pl-3 pr-8 py-1.5
                 text-xs font-semibold cursor-pointer
                 focus:outline-none focus:ring-2 focus:ring-white/40"
      aria-label="Select Font Size"
    >
      <option value="small" className="text-slate-800">
        A-
      </option>

      <option value="normal" className="text-slate-800">
        A 
      </option>

      <option value="large" className="text-slate-800">
        A+
      </option>
    </select>

    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs">
      ▾
    </span>
  </div>

</div>
            </div>
          </div>
        </div>
      </div>

    
      {/* =====================================================
          MAIN HEADER
      ===================================================== */}

      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4">

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">

            {/* BRAND */}

            <div className="flex items-center gap-3 sm:gap-4 min-w-0">

              <div className="hidden sm:flex w-16 md:w-20 h-16 md:h-20 items-center justify-center shrink-0">
                <Landmark className="w-12 md:w-16 h-12 md:h-16 text-slate-700" />
              </div>

              <div className="hidden sm:block h-14 w-px bg-[#c9d8e8]" />

              <div className="min-w-0">

                <p className="font-extrabold text-[#123b6d] landing-text leading-tight">
                  {t.department}
                </p>

                <p className="font-bold text-[#123b6d] landing-small mt-1">
                  {t.indiaGov}
                </p>

              </div>

              <div className="hidden md:block h-16 w-px bg-slate-300 ml-2" />

              <div className="min-w-0">

                <div className="flex items-center gap-1.5 sm:gap-2">

                  <Scale className="w-6 h-6 sm:w-7 sm:h-7 text-[#2d9b49] shrink-0" />

                  <span className="font-extrabold text-[#2d9b49] text-[1.5em] leading-none">
                    e-Maap
                  </span>

                  <span className="font-extrabold text-[#123b6d] text-[1.6em] leading-none">
                    Verify
                  </span>


                </div>

                <p className="font-bold text-[#123b6d] landing-small mt-1 max-w-[520px]">
                  {t.portalSubtitle}
                </p>

                <p className="text-slate-600 landing-xs mt-1">
                  {t.legalMetrology}
                </p>

              </div>
            </div>

            {/* RIGHT SIDE */}

            <div className="flex items-center justify-between xl:justify-end gap-3 sm:gap-6">

              <div className="hidden lg:flex items-center gap-2 sm:gap-3">

                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#123b6d] shrink-0">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                <div>
                  <p className="text-slate-600 font-medium landing-xs">
                    {t.helpline}
                  </p>

                  <p className="text-[#123b6d] font-extrabold landing-text">
                    {t.phone}
                  </p>
                </div>

              </div>

              {/* ACTION AREA: [ 📱 Install App ] [ Login ] */}
              <div className="flex items-center gap-2 sm:gap-3">
                <a
                  href="/downloads/e-Maap-Verify.apk"
                  download="e-Maap-Verify.apk"
                  onClick={handleDownloadApk}
                  aria-label="Download e-Maap Verify Android App"
                  className="inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-white hover:bg-slate-50 text-[#123b6d] border border-[#123b6d]/30 hover:border-[#123b6d] font-bold rounded-md px-3 sm:px-4 py-2 sm:py-2.5 transition shadow-xs whitespace-nowrap landing-small focus:outline-none focus:ring-2 focus:ring-[#123b6d]/30"
                >
                  <Smartphone className="w-4 h-4 shrink-0 text-[#123b6d]" />
                  <span className="sm:hidden">{t.installApp}</span>
                  <span className="hidden sm:inline">{t.downloadApp}</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-[#123b6d] hover:bg-[#0d2d53] text-white font-bold rounded-md px-3.5 sm:px-5 py-2 sm:py-2.5 transition shadow-sm whitespace-nowrap landing-small cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#123b6d]/30"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  {t.login}
                </button>
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="flex-1">

        {/* ===================================================
            HERO
        =================================================== */}

       <section
  id="about"
  className="relative overflow-hidden border-b border-slate-200"
>
  {/* =====================================================
      BACKGROUND IMAGE
  ====================================================== */}

  <img
    src={heroImage}
    alt="Legal-Metrology"
    aria-hidden="true"
    className="
      absolute
      inset-0
      w-full
      h-full
      object-cover
      object-center
      pointer-events-none
    "
  />

  {/* =====================================================
      IMAGE OVERLAY
      Left side text ko readable rakhne ke liye
  ====================================================== */}

  <div
    className="
      absolute
      inset-0
      bg-gradient-to-r
      from-white/95
      via-white/75
      to-white/10
    "
  />

  {/* =====================================================
      HERO CONTENT
  ====================================================== */}

  <div
    className="
      relative
      max-w-7xl
      mx-auto
      px-4
      sm:px-6
      lg:px-8
      py-10
      sm:py-14
      lg:py-20
    "
  >
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

      {/* ================= LEFT CONTENT ================= */}

      <div className="max-w-2xl">

        {/* ACT / RULE */}

        <div
          className="
            inline-flex
            items-center
            gap-2
            bg-white/95
            backdrop-blur-sm
            border
            border-blue-200
            rounded-full
            px-3
            sm:px-4
            py-2
            text-[#123b6d]
            font-semibold
            mb-5
            shadow-sm
            landing-small
          "
        >
          <Scale className="w-4 h-4 shrink-0" />

          <span>
            {t.act}
          </span>
        </div>

        {/* TITLE */}

        <h1
          className="
            landing-title
            font-extrabold
            text-[#123b6d]
            leading-[1.08]
            tracking-tight
          "
        >
          {t.heroTitle}
          <br />
          {t.heroTitle2}
        </h1>

        {/* DESCRIPTION */}

        <p
          className="
            text-slate-700
            max-w-xl
            mt-5
            leading-relaxed
            landing-text
          "
        >
          {t.heroText}
        </p>

        {/* BUTTONS */}

        <div
          className="
            flex
            flex-col
            sm:flex-row
            flex-wrap
            gap-3
            mt-7
          "
        >

          {/* APPLY */}

          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              bg-[#07549a]
              hover:bg-[#063f73]
              text-white
              font-bold
              rounded-md
              px-5
              py-3
              shadow-sm
              transition
              landing-small
              cursor-pointer
            "
          >
            {t.apply}

            <ArrowRight className="w-4 h-4" />
          </button>

          {/* KNOW MORE */}

          <button
            type="button"
            onClick={() => scrollToSection('services')}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              bg-white/90
              hover:bg-blue-50
              border-2
              border-[#07549a]
              text-[#07549a]
              font-bold
              rounded-md
              px-5
              py-3
              transition
              landing-small
            "
          >
            {t.knowMore}

            <ArrowRight className="w-4 h-4" />
          </button>

        </div>

      </div>

      {/* ================= RIGHT SIDE ================= */}

      <div
        className="
          hidden
          lg:block
          min-h-[280px]
        "
      />

    </div>
  </div>
</section>
        {/* ===================================================
            LATEST UPDATES
        =================================================== */}

        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-5">

          <div className="border border-blue-100 rounded-xl bg-white shadow-sm overflow-hidden">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white">

              <div className="flex items-center gap-3">

                <div className="w-9 h-9 rounded-lg bg-[#123b6d] text-white flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4" />
                </div>

                <h2 className="font-bold text-[#123b6d] landing-text">
                  {t.updates}
                </h2>

              </div>

              <button
                type="button"
                className="text-[#07549a] font-semibold landing-small sm:self-auto self-end"
              >
                {t.viewAll} →
              </button>

            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4">

              {[
                [t.latest1Title, t.latest1, '#1769aa'],
                [t.latest2Title, t.latest2, '#138808'],
                [t.latest3Title, t.latest3, '#f28c18'],
                [t.latest4Title, t.latest4, '#1769aa'],
              ].map(([date, text, dot], index) => (
                <div
                  key={date}
                  className={`p-5 ${
                    index > 0
                      ? 'border-t sm:border-t lg:border-t-0 lg:border-l border-blue-100'
                      : ''
                  }`}
                >

                  <div className="flex gap-3">

                    <span
                      className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                      style={{
                        backgroundColor: dot,
                      }}
                    />

                    <div>

                      <p className="font-semibold text-[#123b6d] landing-small">
                        {date}
                      </p>

                      <p className="text-slate-600 mt-1 leading-relaxed landing-small">
                        {text}
                      </p>

                    </div>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </section>

        {/* ===================================================
            SERVICES
        =================================================== */}

        <section
          id="services"
          className="max-w-7xl mx-auto px-4 sm:px-6 py-8"
        >

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">

            <div>

              <h2 className="landing-section-title font-extrabold text-[#123b6d]">
                {t.servicesTitle}
              </h2>

              <p className="text-slate-600 mt-1 landing-small">
                {t.servicesSubtitle}
              </p>

            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 text-[#07549a] font-bold landing-small"
            >
              {t.viewServices}
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-5">

            {/* SERVICE GRID */}

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">

              {/* 1 */}

              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="group border border-blue-100 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition bg-white text-left cursor-pointer"
              >

                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-4">
                  <FileCheck2 className="w-5 h-5" />
                </div>

                <h3 className="font-bold text-[#123b6d] landing-card-title">
                  {t.applyVerification}
                </h3>

                <p className="text-slate-600 mt-2 leading-relaxed landing-small">
                  {t.applyDescription}
                </p>

                <div className="mt-4 text-[#07549a] font-bold">
                  →
                </div>

              </button>

              {/* 2 */}

              <Link
                to="/verify-certificate"
                className="group border border-blue-100 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition bg-white"
              >

                <div className="w-10 h-10 rounded-lg bg-green-600 text-white flex items-center justify-center mb-4">
                  <Search className="w-5 h-5" />
                </div>

                <h3 className="font-bold text-[#123b6d] landing-card-title">
                  {t.verifyCertificate}
                </h3>

                <p className="text-slate-600 mt-2 leading-relaxed landing-small">
                  {t.verifyDescription}
                </p>

                <div className="mt-4 text-[#07549a] font-bold">
                  →
                </div>

              </Link>

              {/* 3 */}

              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="group border border-blue-100 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition bg-white text-left cursor-pointer"
              >

                <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-4">
                  <QrCode className="w-5 h-5" />
                </div>

                <h3 className="font-bold text-[#123b6d] landing-card-title">
                  {t.checkStatus}
                </h3>

                <p className="text-slate-600 mt-2 leading-relaxed landing-small">
                  {t.statusDescription}
                </p>

                <div className="mt-4 text-[#07549a] font-bold">
                  →
                </div>

              </button>

              {/* 4 */}

              <button
                type="button"
                className="text-left group border border-blue-100 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition bg-white"
              >

                <div className="w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5" />
                </div>

                <h3 className="font-bold text-[#123b6d] landing-card-title">
                  {t.registered}
                </h3>

                <p className="text-slate-600 mt-2 leading-relaxed landing-small">
                  {t.registeredDescription}
                </p>

                <div className="mt-4 text-[#07549a] font-bold">
                  →
                </div>

              </button>

              {/* 5 */}

              <button
                id="act-rules"
                type="button"
                className="text-left group border border-blue-100 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition bg-white"
              >

                <div className="w-10 h-10 rounded-lg bg-cyan-600 text-white flex items-center justify-center mb-4">
                  <BookOpen className="w-5 h-5" />
                </div>

                <h3 className="font-bold text-[#123b6d] landing-card-title">
                  {t.actRules}
                </h3>

                <p className="text-slate-600 mt-2 leading-relaxed landing-small">
                  {t.actDescription}
                </p>

                <div className="mt-4 text-[#07549a] font-bold">
                  →
                </div>

              </button>

              {/* 6 */}

              <button
                id="downloads"
                type="button"
                className="text-left group border border-blue-100 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition bg-white"
              >

                <div className="w-10 h-10 rounded-lg bg-pink-600 text-white flex items-center justify-center mb-4">
                  <Download className="w-5 h-5" />
                </div>

                <h3 className="font-bold text-[#123b6d] landing-card-title">
                  {t.download}
                </h3>

                <p className="text-slate-600 mt-2 leading-relaxed landing-small">
                  {t.downloadDescription}
                </p>

                <div className="mt-4 text-[#07549a] font-bold">
                  →
                </div>

              </button>

            </div>

            {/* LEGAL METROLOGY */}

            <div className="rounded-xl bg-gradient-to-b from-[#edf6ff] to-[#f5faff] border border-blue-100 p-6">

              <div className="w-12 h-12 rounded-full bg-white border border-blue-200 flex items-center justify-center text-[#123b6d] mb-4">
                <Scale className="w-6 h-6" />
              </div>

              <h3 className="font-extrabold text-[#123b6d] landing-text">
                {t.legalTitle}
              </h3>

              <p className="text-slate-700 leading-relaxed mt-4 landing-small">
                {t.legalText}
              </p>

              <div className="space-y-3 mt-5">

                {[
                  t.fairTrade,
                  t.consumerProtection,
                  t.accurate,
                  t.quality,
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-slate-700 landing-small"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    {item}
                  </div>
                ))}

              </div>

              <Link
                to="/verify-certificate"
                className="mt-6 w-full inline-flex justify-center items-center gap-2 bg-[#07549a] hover:bg-[#063f73] text-white font-bold rounded-md py-3 transition landing-small"
              >
                {t.learnMore}
                <ArrowRight className="w-4 h-4" />
              </Link>

            </div>
          </div>
        </section>

        {/* ===================================================
            QUICK VERIFY
        =================================================== */}

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">

          <div className="rounded-xl bg-[#f5f9fd] border border-blue-100 p-4 sm:p-5">

            <div className="flex flex-col lg:flex-row lg:items-center gap-4">

              <div className="flex items-center gap-3 lg:w-[35%]">

                <div className="w-11 h-11 rounded-lg bg-[#123b6d] text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>

                <div>

                  <h3 className="font-bold text-[#123b6d] landing-text">
                    {t.quickVerifyTitle}
                  </h3>

                  <p className="text-slate-600 landing-small">
                    {t.quickVerifyText}
                  </p>

                </div>
              </div>

              <form
                onSubmit={handleQuickVerify}
                className="flex-1 flex flex-col sm:flex-row gap-2"
              >

                <div className="relative flex-1">

                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />

                  <input
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    type="text"
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 text-slate-800 landing-small"
                  />

                </div>

                <button
                  type="submit"
                  className="bg-[#07549a] hover:bg-[#063f73] text-white font-bold rounded-md px-6 py-3 flex items-center justify-center gap-2 transition landing-small"
                >
                  <QrCode className="w-4 h-4" />
                  {t.verifyNow}
                </button>

              </form>
            </div>
          </div>
        </section>

        {/* ===================================================
            TRUST STRIP
        =================================================== */}

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">

          <div className="grid md:grid-cols-3 border border-blue-100 rounded-xl overflow-hidden bg-[#f4f9ff]">

            <div className="p-5 flex items-center gap-4 border-b md:border-b-0 md:border-r border-blue-100">

              <ShieldCheck className="w-9 h-9 text-[#123b6d] shrink-0" />

              <div>

                <h4 className="font-bold text-[#123b6d] landing-small">
                  {t.bottomConsumer}
                </h4>

                <p className="text-slate-600 mt-1 landing-xs">
                  {t.bottomConsumerText}
                </p>

              </div>
            </div>

            <div className="p-5 flex items-center gap-4 border-b md:border-b-0 md:border-r border-blue-100">

              <Scale className="w-9 h-9 text-[#123b6d] shrink-0" />

              <div>

                <h4 className="font-bold text-[#123b6d] landing-small">
                  {t.bottomCompliance}
                </h4>

                <p className="text-slate-600 mt-1 landing-xs">
                  {t.bottomComplianceText}
                </p>

              </div>
            </div>

            <div className="p-5 flex items-center gap-4">

              <Users className="w-9 h-9 text-[#123b6d] shrink-0" />

              <div>

                <h4 className="font-bold text-[#123b6d] landing-small">
                  {t.bottomCitizen}
                </h4>

                <p className="text-slate-600 mt-1 landing-xs">
                  {t.bottomCitizenText}
                </p>

              </div>
            </div>

          </div>
        </section>

        {/* Hidden anchors for navigation */}

        <div id="faqs" className="h-0" />
        <div id="contact" className="h-0" />

      </main>

      {/* =====================================================
          EXISTING GOVERNMENT FOOTER
      ===================================================== */}

      {/* DOWNLOAD NOTIFICATION TOAST */}
      {downloadToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-[#123b6d] text-white px-4 py-3 rounded-lg shadow-xl border border-blue-400/30 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <p className="font-semibold text-white">
              e-Maap Verify Android app download started.
            </p>
            <p className="text-[11px] text-blue-100">
              Check your browser downloads to complete installation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDownloadToast(false)}
            className="ml-2 p-1 text-blue-200 hover:text-white rounded transition cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <GovFooter />
    </div>
  );
};

export default LandingPage;