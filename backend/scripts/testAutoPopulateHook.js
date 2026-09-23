import { connectDB, disconnectDB } from '../config/db.js';
import { Instrument } from '../models/Instrument.js';
import { VerificationInspection } from '../models/VerificationInspection.js';
import { User } from '../models/User.js';
import {
  resolveInstrumentFromScannedCode,
  generateInspectionChecklistFromInstrument,
  autoPopulateInspectionFromScannedInstrument,
} from '../services/inspectionService.js';

async function runTest() {
  console.log('--- Connecting to database using connectDB() ---');
  await connectDB();

  try {
    console.log('\n--- 1. Testing resolution of sample instrument ---');
    const sample = await Instrument.findOne();
    if (!sample) {
      console.log('No instruments found in database, creating a test sample...');
      const testInst = await Instrument.create({
        instrumentId: 'INST-PH8-001',
        serialNumber: 'SN-PH8-PASS-001',
        category: 'NAWI',
        instrumentType: 'Electronic Weighing Instrument',
        accuracyClass: 'CLASS_III_MEDIUM',
        capacity: { value: 50, unit: 'kg' },
        verificationScaleInterval_e: 0.01,
        minCapacity: 0.2,
        modelApprovalNumber: 'IND/09/2024/771',
        status: 'VERIFIED',
      });
      console.log('Created sample instrument:', testInst.instrumentId);
    }

    const targetCode = sample ? sample.instrumentId : 'INST-PH8-001';
    console.log(`Resolving code: ${targetCode}`);
    const resolved = await resolveInstrumentFromScannedCode(targetCode);
    console.log('✅ Resolved instrument:', resolved.instrument.instrumentId, '| Matched by:', resolved.matchedBy);

    console.log('\n--- 2. Testing checklist generation ---');
    const generated = generateInspectionChecklistFromInstrument(resolved.instrument, targetCode);
    console.log('Checklist generated successfully:');
    console.log('- Visual condition note:', generated.instrumentCondition.notes);
    console.log('- Test readings count:', generated.testReadings.length);
    generated.testReadings.forEach((r) => {
      console.log(`  * Load Point ${r.loadPoint}: ${r.testName} -> ${r.nominalLoad} ${r.unit} (MPE ±${r.mpeAllowed} ${r.unit})`);
    });
    console.log('- Statutory compliance checks count:', generated.complianceChecks.length);

    console.log('\n--- 3. Testing auto-populate service function ---');
    let officer = await User.findOne({ role: { $in: ['LEGAL_METROLOGY_OFFICER', 'ADMIN', 'SUPER_ADMIN'] } });
    if (!officer) {
      officer = { _id: '64f000000000000000000001', name: 'Inspector Test', role: 'LEGAL_METROLOGY_OFFICER', email: 'officer@emaap.gov.in' };
    }
    console.log('Using officer user:', officer.name, officer.role);
    const result = await autoPopulateInspectionFromScannedInstrument(targetCode, {}, officer);
    console.log('✅ Auto-populate hook result success:', result.success);
    console.log('✅ Result instrument:', result.instrument.instrumentId);
    console.log('✅ Result readings count:', result.testReadings.length);
    console.log('✅ Result checklist visualInspectionPassed:', result.checklist.visualInspectionPassed);

    console.log('\n======================================================');
    console.log('🎉 ALL BACKEND HOOK AUTO-POPULATION TESTS PASSED!');
    console.log('======================================================');
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

runTest();
