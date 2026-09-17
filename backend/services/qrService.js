import QRCode from 'qrcode';
import { ENV } from '../config/env.js';

/**
 * Generates QR code pointing to public verification endpoint
 */
export async function generateVerificationQR(qrVerificationToken) {
  // Public verification endpoint URL pointing to server's public verification API
  const baseUrl = ENV.SERVER_URL || 'http://localhost:3000';
  const publicVerificationUrl = `${baseUrl}/api/public/certificates/verify/${qrVerificationToken}`;

  try {
    // Generate base64 Data URL for embedding in PDF and web UI
    const qrDataUrl = await QRCode.toDataURL(publicVerificationUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      width: 280,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return {
      publicVerificationUrl,
      qrDataUrl,
    };
  } catch (error) {
    console.error('[QR GENERATION ERROR] Failed to generate QR code:', error.message);
    throw error;
  }
}
