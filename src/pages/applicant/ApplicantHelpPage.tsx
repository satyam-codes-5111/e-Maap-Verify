import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  HelpCircle,
  FileText,
  PhoneCall,
  Scale,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export const ApplicantHelpPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Why is registration and periodic reverification mandatory?',
      a: 'Under Section 24 of the Legal Metrology Act, 2009, no person shall use any weight or measure in any transaction or for protection unless it has been verified and stamped by an authorized Legal Metrology Officer. Using unstamped or unverified instruments is a punishable offense attracting penalties and seizure under Section 33 & 34.',
    },
    {
      q: 'What is the standard reverification period for commercial instruments?',
      a: 'Most non-automatic weighing instruments (such as electronic counter scales, platform scales, weighbridges) require mandatory annual verification (every 12 months). Storage tanks, flow meters, and fuel dispensing units have specific inspection intervals defined under State Legal Metrology Enforcement Rules.',
    },
    {
      q: 'What documents are required for first-time instrument registration?',
      a: 'You need the manufacturer invoice / purchase bill, model approval certificate number (issued by DoCA), registered business premises proof or trade license, and high-resolution photographs showing the manufacturer nameplate, capacity, and serial number.',
    },
    {
      q: 'What happens during a scheduled field verification visit?',
      a: 'An authorized Legal Metrology Officer will arrive at your registered installation premise. They will test the instrument using verified secondary or working standards (test weights). If the device conforms to statutory Maximum Permissible Error (MPE) tolerances, a digital seal is stamped and an official Verification Certificate is digitally generated.',
    },
    {
      q: 'How do customers or enforcement officers verify my certificate?',
      a: 'Every certificate generated on e-Maap Verify carries a cryptographically signed QR code. Anyone can scan this QR code or visit the public portal at /verify-certificate to authenticate validity in real time.',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Help & Statutory Guidance"
        description="Comprehensive guidelines, legal requirements, and helpline for commercial establishments"
        breadcrumbs={[
          { label: 'Dashboard', to: '/applicant/dashboard' },
          { label: 'Help & Guidance' },
        ]}
      />

      {/* Official Contacts Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#123B6D] text-amber-300 flex items-center justify-center font-bold shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">National Consumer Helpline (NCH)</h2>
              <p className="text-xs text-slate-500">Department of Consumer Affairs, Government of India</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="tel:1915"
              className="px-4 py-2 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition shadow-xs flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-300" />
              <span>Toll Free: 1915</span>
            </a>
          </div>
        </div>
      </div>

      {/* Statutory Rules Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-[#123B6D] font-bold text-xs mb-1">
            <Scale className="w-4 h-4 text-[#FF9933]" />
            <span>The Act, 2009</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Legal Metrology Act, 2009 regulates standards of weights, measures and commerce.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-[#123B6D] font-bold text-xs mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Section 24 Rules</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Mandates mandatory verification and stamping before commercial utilization.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-[#123B6D] font-bold text-xs mb-1">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Digital Certificates</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tamper-evident QR-verified digital certificates with instant online verification.
          </p>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#123B6D]" />
          <span>Statutory Compliance FAQ</span>
        </h2>

        <div className="divide-y divide-slate-100">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="py-3">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-semibold text-xs text-slate-800 hover:text-[#123B6D] transition"
                  aria-expanded={isOpen}
                >
                  <span className="pr-4">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
