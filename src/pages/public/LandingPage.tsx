import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GovFooter } from '../../components/layout/GovFooter';
import { LoginModal } from '../../components/auth/LoginModal';

import heroImage1 from './images/legal-metrology-hero-1.webp';
import heroImage2 from './images/legal-metrology-hero-2.webp';
import heroImage3 from './images/legal-metrology-hero-3.webp';
import appImage from './images/image3.webp';

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
  Phone,
  MapPin,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type Language = 'en' | 'hi';
type FontSize = 'small' | 'normal' | 'large';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  /* =========================================================
     HERO IMAGE MARQUEE / SLIDER
  ========================================================= */

  const heroImages = [
    {
      src: heroImage1,
      alt: 'Legal Metrology Verification Portal',
      title: 'Legal Metrology Verification',
      tag: 'Act, 2009',
    },
    {
      src: heroImage2,
      alt: 'Weighing and Measuring Instrument Verification',
      title: 'Instrument Stamping & Certification',
      tag: 'Standard Weights',
    },
    {
      src: heroImage3,
      alt: 'Consumer Protection & Field Verification',
      title: 'Official Field Verification & Standards',
      tag: 'Consumer Protection',
    },
  ];

  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroImages.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, [heroImages.length]);

  const nextHero = () => {
    setHeroIndex((current) => (current + 1) % heroImages.length);
  };

  const previousHero = () => {
    setHeroIndex(
      (current) => (current - 1 + heroImages.length) % heroImages.length
    );
  };

  const [language, setLanguage] = useState<Language>('en');
  const [fontSize, setFontSize] = useState<FontSize>('normal');
  const [tokenInput, setTokenInput] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [downloadToast, setDownloadToast] = useState(false);

  /* =========================================================
     APK DOWNLOAD
  ========================================================= */

  const handleDownloadApk = () => {
    setDownloadToast(true);

    window.setTimeout(() => {
      setDownloadToast(false);
    }, 4500);
  };

  /* =========================================================
     TRANSLATIONS
  ========================================================= */

  const translations = {
    en: {
      govIndia: 'Government of India',
      doca: 'Department of Consumer Affairs',
      ministry:
        'Ministry of Consumer Affairs, Food & Public Distribution',

      portalTitle: 'e-Maap Verify',
      portalSubtitle:
        'Online Verification System for Weighing & Measuring Instruments',

      legalMetrologyBadge: 'Legal Metrology Act, 2009',

      helpline: 'Helpline / Enquiry',
      phone: '+91 7708001234',

      login: 'Login',
      installApp: 'Install App',
      downloadApp: 'Download Android App',

      heroTitle1: 'Ensuring Accuracy,',
      heroTitle2: 'Building Trust',

      heroText:
        'e-Maap Verify is an online platform for verification of weighing and measuring instruments under the Legal Metrology Act, 2009 and Rules, 2011.',

      applyVerification: 'Apply for Verification',
      verifyCertificate: 'Verify Certificate',

      service1Title: 'Apply for Verification',
      service1Desc:
        'Submit application for weighing & measuring instruments verification.',

      service2Title: 'Verify Certificate',
      service2Desc:
        'Scan QR code or enter certificate details to verify authenticity.',

      service3Title: 'Check Application Status',
      service3Desc:
        'Track your inspection schedule and application status.',

      service4Title: 'Registered LMO / GATC',
      service4Desc:
        'Access authorized Legal Metrology Officers and test centers.',

      aboutTitle: 'About e-Maap Verify',

      aboutDesc:
        'A digital platform for transparent and efficient legal metrology services, supporting verification of weighing and measuring instruments and protecting consumer interests.',

      feat1Title: 'Digital Verification',
      feat1Desc:
        'End-to-end online workflow under Legal Metrology Act, 2009.',

      feat2Title: 'QR Certificate',
      feat2Desc:
        'Tamper-evident digital certificates with instant scan validation.',

      feat3Title: 'GPS-based Inspection Evidence',
      feat3Desc:
        'Geo-tagged and timestamped verification records by officers.',

      feat4Title: 'Transparent Workflow',
      feat4Desc:
        'Seamless multi-role tracking across traders, officers and labs.',

      quickVerifyTitle: 'Quick Certificate Verification',

      quickVerifyDesc:
        'Enter Certificate No. or QR Verification Token to verify authenticity.',

      searchPlaceholder:
        'Enter Certificate No. or QR Verification Token...',

      verifyNow: 'Verify Now',

      frameworkTitle: 'Legal Metrology Framework',
      frameworkSubtitle: 'Key Acts, Rules and Services',

      rule1Title: 'Legal Metrology Act, 2009',
      rule1Desc:
        'Statutory standards of weights and measures, regulation of trade and commerce.',

      rule2Title: 'General Rules, 2011',
      rule2Desc:
        'Standard specifications, testing procedures, permissible errors and fees.',

      rule3Title: 'Verification & Stamping',
      rule3Desc:
        'Mandatory periodic inspection, accuracy calibration and official stamping.',

      rule4Title: 'Consumer Protection',
      rule4Desc:
        'Protects consumer rights and ensures correct quantity across all commercial goods.',

      appBannerTitle: 'e-Maap Verify Android App',

      appBannerDesc:
        'Access verification services, inspect instruments, and scan QR certificates from your mobile.',

      appDownloadBtn: 'Download Android App',

      trust1Title: 'Consumer Protection',
      trust1Desc:
        'Accurate weights and measures for a fair marketplace.',

      trust2Title: 'Legal Compliance',
      trust2Desc:
        'Services aligned with the Legal Metrology framework.',

      trust3Title: 'Transparent Digital Service',
      trust3Desc:
        'Simple, secure and technology-driven services.',
    },

    hi: {
      govIndia: 'भारत सरकार',
      doca: 'उपभोक्ता मामले विभाग',
      ministry:
        'उपभोक्ता मामले, खाद्य एवं सार्वजनिक वितरण मंत्रालय',

      portalTitle: 'ई-माप वेरिफाई',
      portalSubtitle:
        'तौल एवं माप उपकरणों के लिए ऑनलाइन सत्यापन प्रणाली',

      legalMetrologyBadge:
        'विधिक मापविज्ञान अधिनियम, 2009',

      helpline: 'हेल्पलाइन / पूछताछ',
      phone: '+91 7708001234',

      login: 'लॉगिन',
      installApp: 'ऐप इंस्टॉल करें',
      downloadApp: 'एंड्रॉइड ऐप डाउनलोड करें',

      heroTitle1: 'सटीकता सुनिश्चित करें,',
      heroTitle2: 'विश्वास का निर्माण करें',

      heroText:
        'ई-माप वेरिफाई, विधिक मापविज्ञान अधिनियम, 2009 एवं नियम, 2011 के अंतर्गत तौल एवं माप उपकरणों के सत्यापन के लिए एक ऑनलाइन प्लेटफॉर्म है।',

      applyVerification:
        'सत्यापन के लिए आवेदन करें',

      verifyCertificate:
        'प्रमाणपत्र सत्यापित करें',

      service1Title:
        'सत्यापन के लिए आवेदन',

      service1Desc:
        'तौल एवं माप उपकरणों के सत्यापन के लिए ऑनलाइन आवेदन जमा करें।',

      service2Title:
        'प्रमाणपत्र सत्यापित करें',

      service2Desc:
        'प्रामाणिकता जांचने के लिए QR कोड स्कैन करें या विवरण दर्ज करें।',

      service3Title:
        'आवेदन की स्थिति देखें',

      service3Desc:
        'अपने सत्यापन आवेदन एवं निरीक्षण शेड्यूल की स्थिति को ट्रैक करें।',

      service4Title:
        'पंजीकृत LMO / GATC',

      service4Desc:
        'अधिकृत विधिक मापविज्ञान अधिकारियों एवं टेस्ट सेंटरों की जानकारी।',

      aboutTitle:
        'ई-माप वेरिफाई के बारे में',

      aboutDesc:
        'विधिक मापविज्ञान सेवाओं के लिए पारदर्शी एवं कुशल डिजिटल प्लेटफॉर्म, जो तौल व माप उपकरणों के सत्यापन और उपभोक्ता हितों की रक्षा करता है।',

      feat1Title:
        'डिजिटल सत्यापन',

      feat1Desc:
        'अधिनियम, 2009 के अंतर्गत संपूर्ण ऑनलाइन सत्यापन प्रक्रिया।',

      feat2Title:
        'QR प्रमाणपत्र',

      feat2Desc:
        'त्वरित स्कैन सत्यापन के साथ छेड़छाड़-मुक्त डिजिटल प्रमाणपत्र।',

      feat3Title:
        'जीपीएस आधारित साक्ष्य',

      feat3Desc:
        'अधिकारियों द्वारा जियो-टैग एवं समय-अंकित निरीक्षण रिकॉर्ड।',

      feat4Title:
        'पारदर्शी कार्यप्रणाली',

      feat4Desc:
        'व्यापारियों, अधिकारियों और परीक्षण केंद्रों के बीच पारदर्शी ट्रैकिंग।',

      quickVerifyTitle:
        'त्वरित प्रमाणपत्र सत्यापन',

      quickVerifyDesc:
        'प्रामाणिकता सत्यापित करने के लिए प्रमाणपत्र संख्या या QR टोकन दर्ज करें।',

      searchPlaceholder:
        'प्रमाणपत्र संख्या या QR टोकन दर्ज करें...',

      verifyNow:
        'अभी सत्यापित करें',

      frameworkTitle:
        'विधिक मापविज्ञान रूपरेखा',

      frameworkSubtitle:
        'प्रमुख अधिनियम, नियम एवं सेवाएँ',

      rule1Title:
        'विधिक मापविज्ञान अधिनियम, 2009',

      rule1Desc:
        'व्यापार और वाणिज्य में तौल एवं माप के वैधानिक मानकों का नियमन।',

      rule2Title:
        'सामान्य नियम, 2011',

      rule2Desc:
        'सत्यापन प्रक्रिया, तकनीकी मानक, अनुमेय त्रुटियां और शुल्क संरचना।',

      rule3Title:
        'सत्यापन एवं स्टाम्पिंग',

      rule3Desc:
        'आवधिक निरीक्षण, उपकरण परीक्षण एवं अधिकृत सरकारी स्टाम्पिंग।',

      rule4Title:
        'उपभोक्ता संरक्षण',

      rule4Desc:
        'सटीक माप सुनिश्चित कर उपभोक्ताओं एवं व्यापारियों के अधिकारों की सुरक्षा।',

      appBannerTitle:
        'ई-माप वेरिफाई एंड्रॉइड ऐप',

      appBannerDesc:
        'सत्यापन सेवाओं, स्थल निरीक्षण एवं QR प्रमाणपत्र स्कैनिंग का उपयोग अपने मोबाइल से करें।',

      appDownloadBtn:
        'एंड्रॉइड ऐप डाउनलोड करें',

      trust1Title:
        'उपभोक्ता संरक्षण',

      trust1Desc:
        'निष्पक्ष बाजार के लिए सटीक तौल एवं माप।',

      trust2Title:
        'विधिक अनुपालन',

      trust2Desc:
        'विधिक मापविज्ञान अधिनियम एवं नियमों के अनुरूप सेवाएँ।',

      trust3Title:
        'पारदर्शी डिजिटल सेवा',

      trust3Desc:
        'सरल, सुरक्षित एवं तकनीक-आधारित सरकारी सेवाएँ।',
    },
  };

  const t = translations[language];

  /* =========================================================
     FONT ACCESSIBILITY
  ========================================================= */

  const fontScale =
    fontSize === 'small'
      ? 0.9
      : fontSize === 'large'
        ? 1.12
        : 1;

  const increaseFont = () => {
    setFontSize((current) =>
      current === 'small' ? 'normal' : 'large'
    );
  };

  const decreaseFont = () => {
    setFontSize((current) =>
      current === 'large' ? 'normal' : 'small'
    );
  };

  const resetFont = () => {
    setFontSize('normal');
  };

  /* =========================================================
     QUICK CERTIFICATE VERIFICATION
  ========================================================= */

  const handleQuickVerify = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const value = tokenInput.trim();

    if (!value) return;

    navigate(
      `/verify-certificate?token=${encodeURIComponent(value)}`
    );
  };

  return (
    <div className="landing-page-root w-full min-h-screen bg-white overflow-x-hidden">
      <style>{`
        .landing-page-root {
          min-height: 100vh;
          background: #ffffff;
          color: #17365d;
          overflow-x: hidden;
          width: 100%;
          max-width: 100%;
        }

        .landing-page-scale-wrapper {
          --primary: #123b6d;
          --primary-dark: #0d2d53;
          --accent: #07549a;
          --light-blue: #edf6ff;
          --border: #d8e6f3;
          --text: #17365d;
          --muted: #5d6b7a;

          width: 100%;
          max-width: 100%;
          min-height: 100vh;
          background: #ffffff;
          color: #17365d;
          zoom: var(--landing-scale, 1);
          transform-origin: top center;
          transition: zoom 0.15s ease-out;

          font-family:
            Inter,
            "Noto Sans",
            "Noto Sans Devanagari",
            Arial,
            sans-serif;
        }

        @supports not (zoom: 1) {
          .landing-page-scale-wrapper {
            transform: scale(var(--landing-scale, 1));
            transform-origin: top center;
            width: calc(100% / var(--landing-scale, 1));
          }
        }

        .landing-hindi {
          font-family:
            "Noto Sans Devanagari",
            "Noto Sans",
            Arial,
            sans-serif;
        }

        .hero-marquee-image {
          animation: heroFadeIn 0.7s ease-in-out;
        }

        @keyframes heroFadeIn {
          from {
            opacity: 0;
            transform: scale(1.025);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .hero-progress {
          animation: heroProgress 4.5s linear infinite;
        }

        @keyframes heroProgress {
          from {
            width: 0%;
          }

          to {
            width: 100%;
          }
        }

        .hero-dot {
          transition: all 0.25s ease;
        }
      `}</style>

      <div
        className={`landing-page-scale-wrapper ${
          language === 'hi' ? 'landing-hindi' : ''
        }`}
        style={
          {
            '--landing-scale': fontScale,
            zoom: fontScale,
          } as React.CSSProperties
        }
      >

      {/* =====================================================
          1. GOVERNMENT TOP BAR
      ===================================================== */}

      <div className="bg-[#123b6d] text-white border-b border-blue-900/50">
        <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 2xl:px-12 py-1.5 flex flex-wrap items-center justify-between gap-y-1.5 gap-x-2 text-xs sm:text-sm">

          <div className="flex items-center gap-1.5 sm:gap-2 font-medium min-w-0">
            <span className="text-sm sm:text-base select-none shrink-0" aria-hidden="true">🇮🇳</span>
            <span className="font-semibold text-[11px] xs:text-xs sm:text-sm truncate sm:overflow-visible">
              {t.govIndia}
            </span>
            <span className="hidden md:inline opacity-70">|</span>
            <span className="hidden md:inline text-blue-100 text-xs sm:text-sm">
              {t.doca}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-auto sm:ml-0">

            <div
              className="flex items-center bg-[#0d2d53] rounded px-1 sm:px-1.5 py-0.5 border border-blue-400/20 text-[11px] sm:text-xs"
              aria-label="Font Size Controls"
            >
              <button
                type="button"
                onClick={() => setFontSize('small')}
                aria-pressed={fontSize === 'small'}
                title="Decrease font size (A-)"
                className={`px-1.5 py-0.5 rounded transition ${
                  fontSize === 'small'
                    ? 'bg-blue-600 font-bold text-white shadow-xs'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                A-
              </button>

              <button
                type="button"
                onClick={() => setFontSize('normal')}
                aria-pressed={fontSize === 'normal'}
                title="Normal font size (A)"
                className={`px-1.5 py-0.5 rounded transition ${
                  fontSize === 'normal'
                    ? 'bg-blue-600 font-bold text-white shadow-xs'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                A
              </button>

              <button
                type="button"
                onClick={() => setFontSize('large')}
                aria-pressed={fontSize === 'large'}
                title="Increase font size (A+)"
                className={`px-1.5 py-0.5 rounded transition ${
                  fontSize === 'large'
                    ? 'bg-blue-600 font-bold text-white shadow-xs'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                A+
              </button>
            </div>

            <div className="flex items-center text-[11px] sm:text-xs font-semibold bg-[#0d2d53] rounded border border-blue-400/20 overflow-hidden">

              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 sm:px-2.5 py-0.5 sm:py-1 transition ${
                  language === 'en'
                    ? 'bg-[#07549a] text-white'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                English
              </button>

              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2 sm:px-2.5 py-0.5 sm:py-1 transition ${
                  language === 'hi'
                    ? 'bg-[#07549a] text-white'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                हिन्दी
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          2. MAIN GOVERNMENT HEADER
      ===================================================== */}

      <header className="bg-white border-b border-[#d8e6f3] sticky top-0 z-40 shadow-sm w-full">

        <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 2xl:px-12 py-2.5 sm:py-3.5">

          <div className="flex items-center justify-between gap-2.5 sm:gap-4">

            <div className="flex items-center gap-2.5 sm:gap-3.5 md:gap-4 min-w-0">

              <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl bg-[#123b6d] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Scale className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <div className="min-w-0">

                <div className="flex items-center gap-2">

                  <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-[#123b6d] tracking-tight truncate sm:overflow-visible">
                    {t.portalTitle}
                  </h1>

                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#07549a] border border-blue-200 rounded shrink-0">
                    {t.legalMetrologyBadge}
                  </span>

                </div>

                <p className="text-[11px] sm:text-xs md:text-[13px] text-slate-700 font-medium leading-tight truncate sm:overflow-visible">
                  {t.doca}
                </p>

                <p className="text-[10px] sm:text-xs text-slate-500 hidden md:block truncate">
                  {t.ministry} • {t.govIndia}
                </p>

              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">

              <div className="hidden xl:flex items-center gap-2 text-right pr-2 border-r border-slate-200">

                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-[#07549a]" />
                </div>

                <div>

                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    {t.helpline}
                  </p>

                  <p className="text-xs font-bold text-[#123b6d]">
                    {t.phone}
                  </p>

                </div>
              </div>

              <a
  href="https://github.com/satyam-codes-5111/e-Maap-Verify/releases/download/v1.0.0/e-Maap-Verify-v1.0.0.apk"
                download="e-Maap-Verify.apk"
                onClick={handleDownloadApk}
                className="inline-flex items-center justify-center gap-1 sm:gap-2 bg-white hover:bg-slate-50 text-[#123b6d] border border-[#123b6d]/30 hover:border-[#123b6d] font-bold rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 transition shadow-sm text-xs sm:text-sm whitespace-nowrap min-h-[38px] sm:min-h-[42px]"
              >
                <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />

                <span className="sm:hidden">
                  {t.installApp}
                </span>

                <span className="hidden sm:inline">
                  {t.downloadApp}
                </span>
              </a>

              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="inline-flex items-center justify-center gap-1 sm:gap-2 bg-[#123b6d] hover:bg-[#0d2d53] text-white font-bold rounded-lg px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 transition shadow-sm text-xs sm:text-sm whitespace-nowrap min-h-[38px] sm:min-h-[42px]"
              >
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>{t.login}</span>
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          3. HERO SECTION
      ===================================================== */}

      <section className="relative bg-gradient-to-b from-[#edf6ff] via-white to-white border-b border-[#d8e6f3] overflow-hidden w-full">

        {/* Dynamic Background Image */}

        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.06] bg-cover bg-center pointer-events-none transition-all duration-700"
          style={{
            backgroundImage: `url(${heroImages[heroIndex].src})`,
          }}
        />

        <div className="relative w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 2xl:px-12 py-8 sm:py-12 md:py-14 lg:py-16 2xl:py-20">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-12 items-center">

            {/* =================================================
                LEFT HERO CONTENT
            ================================================= */}

            <div className="lg:col-span-7 w-full min-w-0">

              <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white border border-[#d8e6f3] text-[#07549a] rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold shadow-sm mb-3 sm:mb-4">

                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />

                <span className="truncate">
                  {t.legalMetrologyBadge}
                </span>

              </div>

              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-extrabold text-[#123b6d] tracking-tight leading-[1.18] mb-3 sm:mb-4 break-words">

                {t.heroTitle1}{' '}

                <span className="text-[#07549a] block sm:inline">
                  {t.heroTitle2}
                </span>

              </h1>

              <p className="text-xs sm:text-sm md:text-base text-slate-700 leading-relaxed max-w-2xl mb-6 sm:mb-8">
                {t.heroText}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">

                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#123b6d] hover:bg-[#0d2d53] text-white font-bold rounded-xl px-5 sm:px-6 py-2.5 sm:py-3 transition shadow-sm text-sm sm:text-base"
                >
                  <FileCheck2 className="w-5 h-5 shrink-0" />

                  <span>
                    {t.applyVerification}
                  </span>
                </button>

                <Link
                  to="/verify-certificate"
                  className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-[#123b6d] border border-[#d8e6f3] hover:border-[#123b6d] font-bold rounded-xl px-5 sm:px-6 py-2.5 sm:py-3 transition shadow-sm text-sm sm:text-base"
                >
                  <Search className="w-5 h-5 text-[#07549a] shrink-0" />

                  <span>
                    {t.verifyCertificate}
                  </span>
                </Link>

              </div>

              {/* Government Assurance */}

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6 sm:mt-8 text-xs text-slate-600">

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Government Digital Service</span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#07549a] shrink-0" />
                  <span>Secure Verification</span>
                </div>

              </div>

            </div>

            {/* =================================================
                RIGHT HERO IMAGE MARQUEE
            ================================================= */}

            <div className="lg:col-span-5 w-full flex justify-center mt-4 lg:mt-0">

              <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-md xl:max-w-lg 2xl:max-w-xl mx-auto">

                {/* Image Card */}

                <div className="relative bg-white border border-[#d8e6f3] rounded-2xl p-2 sm:p-2.5 shadow-lg overflow-hidden w-full">

                  <div className="relative overflow-hidden rounded-xl bg-slate-100 w-full">

                    <img
                      key={heroImages[heroIndex].src}
                      src={heroImages[heroIndex].src}
                      alt={heroImages[heroIndex].alt}
                      className="hero-marquee-image w-full h-[210px] xs:h-[250px] sm:h-[290px] md:h-[330px] lg:h-[310px] xl:h-[350px] 2xl:h-[390px] object-cover object-center"
                    />

                    {/* Gradient Overlay */}

                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none" />

                    {/* Image Label */}

                    <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between gap-2">

                      <div className="flex items-center gap-1.5 sm:gap-2 bg-white/95 backdrop-blur-sm rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-sm min-w-0">

                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />

                        <span className="text-[11px] sm:text-xs font-bold text-[#123b6d] truncate">
                          Official Verification
                        </span>

                      </div>

                      <div className="bg-[#123b6d]/95 text-white rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold shrink-0">
                        {heroIndex + 1} / {heroImages.length}
                      </div>

                    </div>

                    {/* Previous */}

                    <button
                      type="button"
                      onClick={previousHero}
                      aria-label="Previous hero image"
                      className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-[#123b6d] flex items-center justify-center shadow-md transition"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    {/* Next */}

                    <button
                      type="button"
                      onClick={nextHero}
                      aria-label="Next hero image"
                      className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-[#123b6d] flex items-center justify-center shadow-md transition"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                  </div>

                  {/* Image Information */}

                  <div className="mt-2.5 sm:mt-3 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-[#edf6ff] border border-blue-100 rounded-lg flex items-center justify-between gap-2">

                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">

                      <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#07549a] shrink-0" />

                      <span className="font-semibold text-[#123b6d] text-xs sm:text-sm truncate">
                        {heroImages[heroIndex].title}
                      </span>

                    </div>

                    <span className="text-[#07549a] font-bold text-[11px] sm:text-xs shrink-0">
                      {heroImages[heroIndex].tag}
                    </span>

                  </div>

                  {/* Progress */}

                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200 overflow-hidden">

                    <div
                      key={heroIndex}
                      className="hero-progress h-full bg-[#07549a]"
                    />

                  </div>

                </div>

                {/* Dots */}

                <div className="flex justify-center items-center gap-2 mt-3.5 sm:mt-4">

                  {heroImages.map((image, index) => (
                    <button
                      key={image.src}
                      type="button"
                      onClick={() => setHeroIndex(index)}
                      aria-label={`Show hero image ${index + 1}`}
                      className={`hero-dot rounded-full transition-all ${
                        heroIndex === index
                          ? 'w-6 sm:w-7 h-2 bg-[#123b6d]'
                          : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                    />
                  ))}

                </div>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          4. QUICK SERVICE CARDS
      ===================================================== */}

      <section className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 2xl:px-12 -mt-5 sm:-mt-8 md:-mt-10 relative z-20">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">

          {/* Card 1 */}

          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="bg-white border border-blue-100 rounded-xl p-4 sm:p-5 hover:border-blue-300 hover:shadow-md transition text-left cursor-pointer group shadow-sm flex flex-col justify-between h-full min-w-0"
          >

            <div>

              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-blue-50 text-[#07549a] group-hover:bg-[#07549a] group-hover:text-white transition flex items-center justify-center mb-3">
                <FileCheck2 className="w-5 h-5 shrink-0" />
              </div>

              <h3 className="font-bold text-[#123b6d] text-sm sm:text-base mb-1.5 group-hover:text-[#07549a] break-words">
                {t.service1Title}
              </h3>

              <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed">
                {t.service1Desc}
              </p>

            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-[#07549a]">
              <span>Proceed Online</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </div>

          </button>

          {/* Card 2 */}

          <Link
            to="/verify-certificate"
            className="bg-white border border-blue-100 rounded-xl p-4 sm:p-5 hover:border-blue-300 hover:shadow-md transition text-left group shadow-sm flex flex-col justify-between h-full min-w-0"
          >

            <div>

              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition flex items-center justify-center mb-3">
                <Search className="w-5 h-5 shrink-0" />
              </div>

              <h3 className="font-bold text-[#123b6d] text-sm sm:text-base mb-1.5 group-hover:text-emerald-700 break-words">
                {t.service2Title}
              </h3>

              <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed">
                {t.service2Desc}
              </p>

            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-emerald-700">
              <span>Verify QR / ID</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </div>

          </Link>

          {/* Card 3 */}

          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="bg-white border border-blue-100 rounded-xl p-4 sm:p-5 hover:border-blue-300 hover:shadow-md transition text-left cursor-pointer group shadow-sm flex flex-col justify-between h-full min-w-0"
          >

            <div>

              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 shrink-0" />
              </div>

              <h3 className="font-bold text-[#123b6d] text-sm sm:text-base mb-1.5 group-hover:text-indigo-700 break-words">
                {t.service3Title}
              </h3>

              <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed">
                {t.service3Desc}
              </p>

            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-indigo-700">
              <span>Track Schedule</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </div>

          </button>

          {/* Card 4 */}

          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="bg-white border border-blue-100 rounded-xl p-4 sm:p-5 hover:border-blue-300 hover:shadow-md transition text-left cursor-pointer group shadow-sm flex flex-col justify-between h-full min-w-0"
          >

            <div>

              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5 shrink-0" />
              </div>

              <h3 className="font-bold text-[#123b6d] text-sm sm:text-base mb-1.5 group-hover:text-amber-700 break-words">
                {t.service4Title}
              </h3>

              <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed">
                {t.service4Desc}
              </p>

            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-amber-700">
              <span>Officer Portal</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </div>

          </button>

        </div>
      </section>

      {/* =====================================================
          5. ABOUT
      ===================================================== */}

      <section className="bg-[#edf6ff] border-y border-[#d8e6f3] mt-10 sm:mt-14 md:mt-16 py-10 sm:py-14 md:py-16 2xl:py-20 w-full">

        <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 2xl:px-12">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-12 items-center">

            <div className="lg:col-span-7 w-full min-w-0">

              <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white border border-blue-200 text-[#07549a] rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold shadow-sm mb-3">

                <Scale className="w-3.5 h-3.5 shrink-0" />

                <span className="truncate">
                  {t.portalTitle}
                </span>

              </div>

              <h2 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-[#123b6d] tracking-tight mb-3 break-words">
                {t.aboutTitle}
              </h2>

              <p className="text-slate-700 text-xs sm:text-sm md:text-base leading-relaxed mb-6 sm:mb-8">
                {t.aboutDesc}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

                {/* Feature 1 */}

                <div className="bg-white border border-blue-100 rounded-xl p-3.5 sm:p-4 shadow-sm min-w-0 h-full">

                  <div className="flex items-center gap-2.5 sm:gap-3 mb-2">

                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-50 text-[#07549a] flex items-center justify-center shrink-0">
                      <FileCheck2 className="w-4 h-4" />
                    </div>

                    <h3 className="font-bold text-[#123b6d] text-xs sm:text-sm truncate">
                      {t.feat1Title}
                    </h3>

                  </div>

                  <p className="text-slate-600 text-xs leading-relaxed">
                    {t.feat1Desc}
                  </p>

                </div>

                {/* Feature 2 */}

                <div className="bg-white border border-blue-100 rounded-xl p-3.5 sm:p-4 shadow-sm min-w-0 h-full">

                  <div className="flex items-center gap-2.5 sm:gap-3 mb-2">

                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <QrCode className="w-4 h-4" />
                    </div>

                    <h3 className="font-bold text-[#123b6d] text-xs sm:text-sm truncate">
                      {t.feat2Title}
                    </h3>

                  </div>

                  <p className="text-slate-600 text-xs leading-relaxed">
                    {t.feat2Desc}
                  </p>

                </div>

                {/* Feature 3 */}

                <div className="bg-white border border-blue-100 rounded-xl p-3.5 sm:p-4 shadow-sm min-w-0 h-full">

                  <div className="flex items-center gap-2.5 sm:gap-3 mb-2">

                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>

                    <h3 className="font-bold text-[#123b6d] text-xs sm:text-sm truncate">
                      {t.feat3Title}
                    </h3>

                  </div>

                  <p className="text-slate-600 text-xs leading-relaxed">
                    {t.feat3Desc}
                  </p>

                </div>

                {/* Feature 4 */}

                <div className="bg-white border border-blue-100 rounded-xl p-3.5 sm:p-4 shadow-sm min-w-0 h-full">

                  <div className="flex items-center gap-2.5 sm:gap-3 mb-2">

                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>

                    <h3 className="font-bold text-[#123b6d] text-xs sm:text-sm truncate">
                      {t.feat4Title}
                    </h3>

                  </div>

                  <p className="text-slate-600 text-xs leading-relaxed">
                    {t.feat4Desc}
                  </p>

                </div>

              </div>

            </div>

            {/* App Image */}

            <div className="lg:col-span-5 flex justify-center w-full mt-4 lg:mt-0">

              <div className="relative max-w-xs sm:max-w-sm md:max-w-md w-full bg-white border border-[#d8e6f3] rounded-2xl p-3.5 sm:p-4 shadow-md text-center mx-auto">

                <img
                  src={appImage}
                  alt="e-Maap Verify Mobile System"
                  className="w-full h-auto object-contain max-h-[260px] sm:max-h-[300px] md:max-h-[340px] mx-auto rounded-lg"
                />

                <div className="mt-3 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] sm:text-xs font-semibold text-[#123b6d]">
                  Integrated Portal & Mobile Stamping System
                </div>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          6. QUICK CERTIFICATE VERIFICATION
      ===================================================== */}

      <section className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 2xl:px-12 py-10 sm:py-14 md:py-16 2xl:py-20">

        <div className="bg-gradient-to-r from-[#edf6ff] via-white to-[#edf6ff] border border-[#d8e6f3] rounded-2xl p-5 sm:p-8 md:p-10 shadow-sm text-center max-w-3xl lg:max-w-4xl mx-auto w-full min-w-0">

          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#123b6d] text-white flex items-center justify-center mx-auto mb-3 sm:mb-4 shrink-0 shadow-sm">
            <Search className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <h2 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-[#123b6d] mb-2 tracking-tight break-words">
            {t.quickVerifyTitle}
          </h2>

          <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto mb-5 sm:mb-6">
            {t.quickVerifyDesc}
          </p>

          <form
            onSubmit={handleQuickVerify}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-2xl mx-auto w-full"
          >

            <div className="relative w-full min-w-0">

              <QrCode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />

              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full min-w-0 h-11 sm:h-12 pl-10 sm:pl-11 pr-3 sm:pr-4 bg-white border border-[#d8e6f3] rounded-xl text-xs sm:text-sm text-[#17365d] placeholder-slate-400 focus:outline-none focus:border-[#123b6d] focus:ring-2 focus:ring-[#123b6d]/15 shadow-sm"
              />

            </div>

            <button
              type="submit"
              className="w-full sm:w-auto min-h-[44px] h-11 sm:h-12 px-6 sm:px-7 bg-[#123b6d] hover:bg-[#0d2d53] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-sm whitespace-nowrap shrink-0"
            >
              <Search className="w-4 h-4 shrink-0" />

              <span>
                {t.verifyNow}
              </span>
            </button>

          </form>

          <p className="text-[11px] sm:text-xs text-slate-500 mt-3 sm:mt-4">
            Supports Certificate Numbers and cryptographic verification tokens.
          </p>

        </div>
      </section>

      {/* =====================================================
          7. LEGAL METROLOGY FRAMEWORK
      ===================================================== */}

      <section className="bg-slate-50 border-y border-[#d8e6f3] py-10 sm:py-14 md:py-16 2xl:py-20 w-full">

        <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 2xl:px-12">

          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">

            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white border border-slate-200 text-[#07549a] rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold shadow-sm mb-2">

              <BookOpen className="w-3.5 h-3.5 shrink-0" />

              <span className="truncate">
                {t.frameworkSubtitle}
              </span>

            </div>

            <h2 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-[#123b6d] tracking-tight break-words">
              {t.frameworkTitle}
            </h2>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">

            {/* Rule 1 */}

            <div className="bg-white border border-[#d8e6f3] rounded-xl p-4 sm:p-5 shadow-sm h-full flex flex-col justify-start min-w-0">

              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-50 text-[#07549a] flex items-center justify-center mb-3 shrink-0">
                <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              <h3 className="font-bold text-[#123b6d] text-sm sm:text-base mb-2 break-words">
                {t.rule1Title}
              </h3>

              <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed">
                {t.rule1Desc}
              </p>

            </div>

            {/* Rule 2 */}

            <div className="bg-white border border-[#d8e6f3] rounded-xl p-4 sm:p-5 shadow-sm h-full flex flex-col justify-start min-w-0">

              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 shrink-0">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              <h3 className="font-bold text-[#123b6d] text-sm sm:text-base mb-2 break-words">
                {t.rule2Title}
              </h3>

              <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed">
                {t.rule2Desc}
              </p>

            </div>

            {/* Rule 3 */}

            <div className="bg-white border border-[#d8e6f3] rounded-xl p-4 sm:p-5 shadow-sm h-full flex flex-col justify-start min-w-0">

              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shrink-0">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              <h3 className="font-bold text-[#123b6d] text-sm sm:text-base mb-2 break-words">
                {t.rule3Title}
              </h3>

              <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed">
                {t.rule3Desc}
              </p>

            </div>

            {/* Rule 4 */}

            <div className="bg-white border border-[#d8e6f3] rounded-xl p-4 sm:p-5 shadow-sm h-full flex flex-col justify-start min-w-0">

              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-3 shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              <h3 className="font-bold text-[#123b6d] text-sm sm:text-base mb-2 break-words">
                {t.rule4Title}
              </h3>

              <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed">
                {t.rule4Desc}
              </p>

            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          8. ANDROID APP
      ===================================================== */}

      <section className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 2xl:px-12 py-10 sm:py-14 md:py-16 2xl:py-20">

        <div className="bg-gradient-to-r from-[#123b6d] via-[#0d2d53] to-[#07549a] text-white rounded-2xl p-5 sm:p-8 md:p-10 shadow-lg relative overflow-hidden">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center relative z-10">

            <div className="lg:col-span-8 w-full min-w-0">

              <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/10 text-blue-200 border border-white/20 rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold mb-3">

                <Smartphone className="w-3.5 h-3.5 shrink-0" />

                <span className="truncate">
                  e-Maap Verify Mobile
                </span>

              </div>

              <h2 className="text-xl xs:text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-white break-words">
                {t.appBannerTitle}
              </h2>

              <p className="text-blue-100 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl mb-5 sm:mb-6">
                {t.appBannerDesc}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

               <a
  href="https://github.com/satyam-codes-5111/e-Maap-Verify/releases/download/v1.0.0/e-Maap-Verify-v1.0.0.apk"
  onClick={handleDownloadApk}
  className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-[#123b6d] font-bold rounded-xl px-5 sm:px-6 py-2.5 sm:py-3 transition shadow-sm text-sm sm:text-base"
>
  <Download className="w-5 h-5 text-[#123b6d] shrink-0" />

  <span>
    {t.appDownloadBtn}
  </span>
</a>

                <span className="text-xs text-blue-200 text-center sm:text-left">
                  Android APK • Version 1.0
                </span>

              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center lg:justify-end w-full mt-4 lg:mt-0">

              <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center text-center p-3.5 sm:p-4 backdrop-blur-sm mx-auto lg:mr-0">

                <Smartphone className="w-10 h-10 sm:w-12 sm:h-12 text-white mb-2 shrink-0" />

                <span className="text-xs font-bold text-white tracking-wide">
                  Direct APK Install
                </span>

                <span className="text-[10px] text-blue-200 mt-1">
                  DoCA Official Portal
                </span>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          9. TRUST / BENEFITS
      ===================================================== */}

      <section className="bg-white border-t border-[#d8e6f3] py-10 sm:py-12 md:py-14 w-full">

        <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 2xl:px-12">

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">

            <div className="flex items-start gap-3 sm:gap-4 min-w-0">

              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-[#07549a] border border-blue-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <div className="min-w-0">

                <h3 className="font-bold text-[#123b6d] text-sm sm:text-base mb-1 break-words">
                  {t.trust1Title}
                </h3>

                <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed">
                  {t.trust1Desc}
                </p>

              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4 min-w-0">

              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <div className="min-w-0">

                <h3 className="font-bold text-[#123b6d] text-sm sm:text-base mb-1 break-words">
                  {t.trust2Title}
                </h3>

                <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed">
                  {t.trust2Desc}
                </p>

              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4 min-w-0 sm:col-span-2 md:col-span-1">

              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <div className="min-w-0">

                <h3 className="font-bold text-[#123b6d] text-sm sm:text-base mb-1 break-words">
                  {t.trust3Title}
                </h3>

                <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed">
                  {t.trust3Desc}
                </p>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          10. GOVERNMENT FOOTER
      ===================================================== */}

      <GovFooter />

      </div>

      {/* =====================================================
          DOWNLOAD TOAST
      ===================================================== */}

      {downloadToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 flex items-center gap-3 bg-[#123b6d] text-white px-3.5 sm:px-4 py-3 rounded-xl shadow-2xl border border-blue-400/30 text-xs sm:text-sm"
        >

          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-emerald-300" />
          </div>

          <div className="min-w-0 flex-1">

            <p className="font-semibold text-white truncate sm:overflow-visible">
              e-Maap Verify Android app download started.
            </p>

            <p className="text-[11px] text-blue-100">
              Check your browser downloads to complete installation.
            </p>

          </div>

          <button
            type="button"
            onClick={() => setDownloadToast(false)}
            className="ml-2 p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition shrink-0"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>

        </div>
      )}

      {/* =====================================================
          LOGIN MODAL
      ===================================================== */}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

    </div>
  );
};

export default LandingPage;