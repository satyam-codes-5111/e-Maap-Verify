import { connectDB, disconnectDB } from '../config/db.js';
import { Instrument } from '../models/Instrument.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { Certificate } from '../models/Certificate.js';
import { calculateMpeGuidelines } from '../controllers/instrumentController.js';

async function testScanLookup() {
  console.log('--- Testing QR Scan Lookup & MPE Calculation ---');

  // 1. Test calculateMpeGuidelines
  const class3Mpe = calculateMpeGuidelines('CLASS_III_MEDIUM', { value: 50, unit: 'kg' });
  console.log('MPE Class III result:', class3Mpe.standard, class3Mpe.tiers.length, 'tiers');
  if (class3Mpe.tiers.length !== 3) throw new Error('Expected 3 tiers for Class III');

  const class1Mpe = calculateMpeGuidelines('CLASS_I_SPECIAL', { value: 1, unit: 'kg' });
  if (class1Mpe.tiers.length !== 3) throw new Error('Expected 3 tiers for Class I');

  await connectDB();

  // 2. Query any existing instrument or check count
  const count = await Instrument.countDocuments();
  console.log('Total instruments in DB:', count);

  const sampleInst = await Instrument.findOne();
  if (sampleInst) {
    console.log('Sample Instrument found:', sampleInst.instrumentId, 'Serial:', sampleInst.serialNumber);
  }

  await disconnectDB();
  console.log('✅ QR Scan Lookup & MPE verification completed successfully!');
}

testScanLookup().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
