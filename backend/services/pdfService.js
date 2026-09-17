import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { ENV } from '../config/env.js';

/**
 * Generates an official Legal Metrology Verification Certificate PDF
 */
export async function generateCertificatePDF({
  certificateNumber,
  applicationNumber,
  stakeholder,
  instrument,
  verificationDate,
  validUntil,
  verificationResult = 'VERIFIED (PASS)',
  officer,
  qrDataUrl,
  qrToken,
  verificationUrl,
  tamperEvidentHash,
}) {
  return new Promise((resolve, reject) => {
    try {
      const certsDir = path.join(ENV.UPLOAD_DIR, 'certificates');
      if (!fs.existsSync(certsDir)) {
        fs.mkdirSync(certsDir, { recursive: true });
      }

      const fileName = `${certificateNumber}.pdf`;
      const filePath = path.join(certsDir, fileName);
      const writeStream = fs.createWriteStream(filePath);

      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `e-Maap Verify Certificate - ${certificateNumber}`,
          Author: 'Department of Consumer Affairs, Government of India (e-Maap Verify)',
          Subject: 'Verification and Stamping Certificate under Legal Metrology Act, 2009',
        },
      });

      doc.pipe(writeStream);

      // Certificate Ornamental Border
      doc
        .lineWidth(3)
        .strokeColor('#1e3a8a')
        .rect(20, 20, 555, 802)
        .stroke();

      doc
        .lineWidth(1)
        .strokeColor('#b45309')
        .rect(26, 26, 543, 790)
        .stroke();

      // Top e-Maap Verify Branding Badge
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#0284c7')
        .text('e-Maap Verify — National Digital Legal Metrology Portal', { align: 'center' });

      doc.moveDown(0.3);

      // Header: Emblem & National Title
      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor('#0f172a')
        .text('GOVERNMENT OF INDIA', { align: 'center' });

      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#334155')
        .text('MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION', { align: 'center' });

      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#0369a1')
        .text('DEPARTMENT OF CONSUMER AFFAIRS (DoCA)', { align: 'center' });

      doc
        .font('Helvetica-Oblique')
        .fontSize(9.5)
        .fillColor('#64748b')
        .text('LEGAL METROLOGY DIVISION — e-Maap Verify Certification Authority', { align: 'center' });

      doc.moveDown(0.6);

      // Certificate Title
      doc
        .font('Helvetica-Bold')
        .fontSize(15)
        .fillColor('#b45309')
        .text('CERTIFICATE OF VERIFICATION', { align: 'center' });

      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor('#475569')
        .text('[Under Section 24 of Legal Metrology Act, 2009 & Rule 14 of Legal Metrology (General) Rules]', {
          align: 'center',
        });

      doc.moveDown(0.8);

      // Certificate & Application Number Bar
      const startY = doc.y;
      doc
        .rect(40, startY, 515, 30)
        .fillAndStroke('#f8fafc', '#cbd5e1');

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#0f172a')
        .text(`Certificate No: ${certificateNumber}`, 50, startY + 9);

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#475569')
        .text(`Application Ref: ${applicationNumber}`, 320, startY + 9, { align: 'right', width: 220 });

      doc.moveDown(1.8);

      // Statutory Text
      doc
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor('#1e293b')
        .text(
          'This is to certify that the weighing / measuring instrument described below has been verified and stamped in accordance with the specifications, test tolerances, and guidelines prescribed under the Legal Metrology Act, 2009 and Rules framed thereunder.',
          { align: 'justify', lineGap: 3 }
        );

      doc.moveDown(0.8);

      // Section 1: Stakeholder Information
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#0369a1')
        .text('1. STAKEHOLDER & PREMISES DETAILS');

      doc.lineWidth(0.5).strokeColor('#e2e8f0').moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(0.4);

      const stY = doc.y;
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#334155').text('Business Name:', 45, stY);
      doc.font('Helvetica').fontSize(9).fillColor('#0f172a').text(stakeholder.businessName || 'N/A', 160, stY);

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#334155').text('Trade License / Reg:', 45, stY + 16);
      doc.font('Helvetica').fontSize(9).fillColor('#0f172a').text(stakeholder.tradeLicenseNumber || 'N/A', 160, stY + 16);

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#334155').text('GST Number:', 330, stY + 16);
      doc.font('Helvetica').fontSize(9).fillColor('#0f172a').text(stakeholder.gstNumber || 'N/A', 410, stY + 16);

      const addressStr = `${stakeholder.registeredAddress?.street || ''}, ${stakeholder.registeredAddress?.district || ''}, ${stakeholder.registeredAddress?.state || ''} - ${stakeholder.registeredAddress?.pincode || ''}`;
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#334155').text('Premises Address:', 45, stY + 32);
      doc.font('Helvetica').fontSize(9).fillColor('#0f172a').text(addressStr, 160, stY + 32, { width: 380 });

      doc.y = stY + 54;
      doc.moveDown(0.5);

      // Section 2: Instrument Metrological Specifications
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#0369a1')
        .text('2. INSTRUMENT SPECIFICATIONS');

      doc.lineWidth(0.5).strokeColor('#e2e8f0').moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(0.4);

      const insY = doc.y;
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#334155').text('Instrument ID:', 45, insY);
      doc.font('Helvetica').fontSize(9).fillColor('#0f172a').text(instrument.instrumentId, 160, insY);

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#334155').text('Instrument Category:', 330, insY);
      doc.font('Helvetica').fontSize(9).fillColor('#0f172a').text(instrument.category, 435, insY);

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#334155').text('Make / Manufacturer:', 45, insY + 16);
      doc.font('Helvetica').fontSize(9).fillColor('#0f172a').text(instrument.manufacturer, 160, insY + 16);

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#334155').text('Model & Serial No:', 330, insY + 16);
      doc.font('Helvetica').fontSize(9).fillColor('#0f172a').text(`${instrument.modelNumber} / S.No: ${instrument.serialNumber}`, 435, insY + 16);

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#334155').text('Capacity / Range:', 45, insY + 32);
      const capacityText = typeof instrument.capacity === 'object' && instrument.capacity !== null
        ? `${instrument.capacity.value ?? ''} ${instrument.capacity.unit ?? ''}`.trim()
        : String(instrument.capacity || 'N/A');
      doc.font('Helvetica').fontSize(9).fillColor('#0f172a').text(capacityText || 'N/A', 160, insY + 32);

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#334155').text('Accuracy Class:', 330, insY + 32);
      doc.font('Helvetica').fontSize(9).fillColor('#0f172a').text(instrument.accuracyClass, 435, insY + 32);

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#334155').text('Scale Interval (e):', 45, insY + 48);
      doc.font('Helvetica').fontSize(9).fillColor('#0f172a').text(instrument.verificationScaleInterval_e || 'N/A', 160, insY + 48);

      doc.y = insY + 68;
      doc.moveDown(0.5);

      // Section 3: Verification, Result & Validity
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#0369a1')
        .text('3. VERIFICATION RESULT & STATUTORY VALIDITY');

      doc.lineWidth(0.5).strokeColor('#e2e8f0').moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(0.4);

      const valY = doc.y;
      doc
        .rect(40, valY, 515, 42)
        .fillAndStroke('#ecfdf5', '#a7f3d0');

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#065f46').text('Verification Date:', 50, valY + 8);
      doc.font('Helvetica').fontSize(9).fillColor('#0f172a').text(new Date(verificationDate).toLocaleDateString('en-IN', { dateStyle: 'long' }), 160, valY + 8);

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#065f46').text('Verification Result:', 310, valY + 8);
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#047857').text(String(verificationResult), 425, valY + 8);

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#065f46').text('Valid From:', 50, valY + 24);
      doc.font('Helvetica').fontSize(9).fillColor('#0f172a').text(new Date(verificationDate).toLocaleDateString('en-IN'), 160, valY + 24);

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#065f46').text('Valid Until (Mandatory Due):', 310, valY + 24);
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#b91c1c').text(new Date(validUntil).toLocaleDateString('en-IN', { dateStyle: 'long' }), 455, valY + 24);

      doc.y = valY + 52;
      doc.moveDown(0.5);

      // Section 4: QR Code & Verification Signature Block
      const qrBoxY = doc.y;

      // Embed QR code image if data URL is provided
      if (qrDataUrl) {
        const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
        const qrBuffer = Buffer.from(base64Data, 'base64');
        doc.image(qrBuffer, 45, qrBoxY, { width: 90, height: 90 });
      }

      const verifyUrl = verificationUrl || `${ENV.SERVER_URL || 'http://localhost:3000'}/api/public/certificates/verify/${qrToken || certificateNumber}`;

      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#0f172a')
        .text('SCAN QR CODE TO VERIFY AUTHENTICITY', 145, qrBoxY + 5);

      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#475569')
        .text('Official digital verification certificate under DoCA Legal Metrology e-Maap Verify initiative.', 145, qrBoxY + 18, { width: 220 });

      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor('#0369a1')
        .text(`Verification URL: ${verifyUrl}`, 145, qrBoxY + 32, { width: 220 });

      doc
        .font('Courier')
        .fontSize(6.5)
        .fillColor('#64748b')
        .text(`Tamper Digest: ${tamperEvidentHash.substring(0, 32)}...`, 145, qrBoxY + 68);

      // Officer Signature block on right
      doc
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor('#0f172a')
        .text(officer.name || 'Legal Metrology Officer', 380, qrBoxY + 25, { align: 'center', width: 170 });

      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor('#475569')
        .text(`LMO / Inspector of Legal Metrology`, 380, qrBoxY + 39, { align: 'center', width: 170 });

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#64748b')
        .text(`Jurisdiction: ${officer.jurisdiction?.district || 'Central District'}`, 380, qrBoxY + 53, { align: 'center', width: 170 });

      // Footer
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#94a3b8')
        .text('This is an electronically generated statutory certificate under the IT Act, 2000 & Legal Metrology Act, 2009. e-Maap Verify.', 40, 790, {
          align: 'center',
          width: 515,
        });

      doc.end();

      writeStream.on('finish', () => {
        resolve({
          fileName,
          filePath,
          relativeUrl: `/uploads/certificates/${fileName}`,
        });
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

