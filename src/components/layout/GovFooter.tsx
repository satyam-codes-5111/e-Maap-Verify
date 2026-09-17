import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, ShieldCheck, Phone, Mail, ExternalLink, HelpCircle } from 'lucide-react';

export const GovFooter: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white text-slate-600 text-xs">
      {/* Top tricolor ribbon */}
      <div className="h-1.5 w-full flex">
        <div className="h-full flex-1 bg-[#FF9933]" title="Saffron" />
        <div className="h-full flex-1 bg-white border-y border-slate-200" title="White" />
        <div className="h-full flex-1 bg-[#138808]" title="India Green" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Main Grid: 4 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Col 1: Government Authority & Seal */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <div className="w-7 h-7 rounded-md bg-teal-800 text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
                <Scale className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <span className="block text-[13px]">ई-माप सत्यापन पोर्टल</span>
                <span className="text-[11px] text-teal-800 font-bold uppercase tracking-wider">e-Maap Verify</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Legal Metrology Online Verification & Digital Stamping Portal, Department of Consumer Affairs, Ministry of Consumer Affairs, Food & Public Distribution, Government of India.
            </p>
            <div className="pt-1 text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>SIH Problem Statement ID: 26036</span>
            </div>
          </div>

          {/* Col 2: Statutory Compliance */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5">
              Statutory Authority
            </h4>
            <ul className="space-y-1.5 text-[11px] text-slate-600">
              <li className="leading-relaxed">
                <strong className="text-slate-700">The Legal Metrology Act, 2009</strong>
                <span className="block text-slate-500">Act No. 1 of 2010 of the Parliament of India</span>
              </li>
              <li className="leading-relaxed">
                <strong className="text-slate-700">Legal Metrology (General) Rules, 2011</strong>
                <span className="block text-slate-500">Standards of weights & measures verification</span>
              </li>
              <li className="leading-relaxed">
                <strong className="text-slate-700">Section 24 Mandatory Stamping</strong>
                <span className="block text-slate-500">Compulsory annual verification of commercial instruments</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Public Services & Citizen Assistance */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5">
              Citizen & Trader Services
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link
                  to="/verify-certificate"
                  className="text-teal-800 hover:text-teal-950 font-semibold inline-flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                  <span>Public QR Certificate Verification</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-600 hover:text-teal-800 transition">
                  National Single Sign-On / User Login
                </Link>
              </li>
              <li>
                <a
                  href="https://consumeraffairs.nic.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-teal-800 transition inline-flex items-center gap-1"
                >
                  <span>DoCA Official Website</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://consumerhelpline.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-teal-800 transition inline-flex items-center gap-1"
                >
                  <span>National Consumer Helpline</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: National Helpline & Support */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5">
              National Helpline
            </h4>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Toll-Free NCH</div>
                  <div className="text-sm font-black text-teal-800">1915</div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 leading-snug">
                Operational 08:00 AM to 08:00 PM (All days except National Holidays)
              </div>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">support-doca@nic.in</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Hosting & Disclaimer */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            <span>© {new Date().getFullYear()} Department of Consumer Affairs, Government of India. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 flex-wrap justify-center">
            <span className="hover:text-slate-800">Website Policies</span>
            <span>•</span>
            <span className="hover:text-slate-800">Hyperlinking Policy</span>
            <span>•</span>
            <span className="hover:text-slate-800">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-800">NIC Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
