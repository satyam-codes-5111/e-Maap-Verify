import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

/**
 * Handles Android hardware and gesture back button navigation according to
 * official Government and Android Material guidelines:
 * 1. Closes open navigation drawers and active modals first.
 * 2. Navigates back in history when deep in page navigation.
 * 3. Requires double-tap to exit on root dashboard / login screens to prevent accidental app close.
 */
export const AndroidBackButtonHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showExitToast, setShowExitToast] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let lastBackPressTime = 0;
    let toastTimeout: ReturnType<typeof setTimeout> | null = null;

    const backListenerPromise = App.addListener('backButton', () => {
      // 1. Check if mobile sidebar drawer is currently open
      const isMobileMenuOpen =
        document.body.getAttribute('data-mobile-menu-open') === 'true' ||
        Boolean(document.querySelector('[data-mobile-drawer="open"]'));

      if (isMobileMenuOpen) {
        window.dispatchEvent(new CustomEvent('emaap:close-mobile-drawer'));
        return;
      }

      // 2. Check if any modal / dialog or full-screen preview is open
      const openModal = document.querySelector<HTMLElement>(
        '[role="dialog"], [data-modal="true"], [data-dialog="true"], .fixed.inset-0:not(.pointer-events-none)'
      );

      const modalCloseBtn = openModal?.querySelector<HTMLElement>(
        'button[aria-label="Close"], button[aria-label="close"], [data-modal-close="true"], .modal-close-btn'
      );

      if (modalCloseBtn) {
        modalCloseBtn.click();
        return;
      }

      if (openModal) {
        window.dispatchEvent(new CustomEvent('emaap:close-modal'));
        return;
      }

      // 3. Check if currently on a root dashboard/login/portal path
      const currentPath = location.pathname.replace(/\/$/, '') || '/';
      const rootPaths = [
        '',
        '/',
        '/login',
        '/portal',
        '/applicant',
        '/applicant/dashboard',
        '/officer',
        '/officer/dashboard',
        '/admin',
        '/admin/dashboard',
      ];

      const isRootPath = rootPaths.includes(currentPath);

      if (!isRootPath && window.history.length > 1) {
        navigate(-1);
        return;
      }

      // 4. On root screen: require double tap within 2 seconds to exit
      const now = Date.now();
      if (now - lastBackPressTime < 2000) {
        App.exitApp();
      } else {
        lastBackPressTime = now;
        setShowExitToast(true);
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
          setShowExitToast(false);
        }, 2000);
      }
    });

    return () => {
      backListenerPromise.then((sub) => sub.remove()).catch(() => {});
      if (toastTimeout) clearTimeout(toastTimeout);
    };
  }, [location.pathname, navigate]);

  if (!showExitToast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[99999] px-4 py-2.5 bg-[#0A192F]/95 text-white text-xs font-medium rounded-full shadow-2xl border border-slate-700/80 backdrop-blur-md flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-none"
    >
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
      <span className="tracking-wide">Press back again to exit e-Maap Verify</span>
    </div>
  );
};
