import { InstrumentItem } from '../types';

/**
 * Safely formats instrument capacity whether it is an object { value, unit },
 * a number, a string, or uses maxCapacity + unit.
 */
export const formatInstrumentCapacity = (
  capacity?: string | { value?: number | string; unit?: string } | null,
  unit?: string,
  maxCapacity?: number | string
): string => {
  if (capacity && typeof capacity === 'object') {
    const val = capacity.value !== undefined && capacity.value !== null ? capacity.value : '';
    const u = capacity.unit || unit || '';
    return `${val} ${u}`.trim() || 'N/A';
  }
  if (maxCapacity !== undefined && maxCapacity !== null && maxCapacity !== '') {
    return `${maxCapacity} ${unit || 'kg'}`.trim();
  }
  if (capacity !== undefined && capacity !== null && capacity !== '') {
    return `${capacity} ${unit || ''}`.trim();
  }
  return 'N/A';
};

/**
 * Safely returns the verification scale interval (e.g., '1g', '2g', '10mg').
 */
export const formatScaleInterval = (inst?: Partial<InstrumentItem> | null): string => {
  if (!inst) return '1g';
  return String(inst.verificationScaleInterval_e || inst.verificationScaleInterval || '1g');
};
