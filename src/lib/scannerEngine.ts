// Hardware USB Barcode Scanner Wedge & Disambiguation Engine
// Compliant with PRD §6.3 (Format Barcode) & §16 (Implementasi Scanner Keyboard Wedge)

export type BarcodeType = 'member' | 'copy' | 'isbn' | 'unknown';

export interface ScanDiagnosticLog {
  key: string;
  timestamp: number;
  gapMs: number;
  isFastStreak: boolean;
}

export interface BarcodeResolution {
  raw: string;
  clean: string;
  type: BarcodeType;
  identifiedPrefix?: string;
}

/**
 * Normalizes scanned barcode strings (trims whitespace, carriage returns, etc.)
 */
export function cleanBarcode(raw: string): string {
  if (!raw) return '';
  return raw.trim().replace(/[\r\n\t]/g, '');
}

/**
 * Disambiguates barcode type based on PRD §6.3:
 * 1. Starts with AG- -> Member card
 * 2. Starts with PS- -> Book copy/item
 * 3. 13 digits starting with 978/979 or standard ISBN -> ISBN
 * 4. Short numbers or others -> Fallback check
 */
export function resolveBarcodeType(raw: string): BarcodeResolution {
  const clean = cleanBarcode(raw);
  const upper = clean.toUpperCase();

  // 1. Kartu Anggota (AG-...)
  if (upper.startsWith('AG-') || upper.startsWith('MBR-') || upper.startsWith('AGT-')) {
    return { raw, clean, type: 'member', identifiedPrefix: 'AG-' };
  }

  // 2. Barcode Eksemplar Buku (PS-...)
  if (upper.startsWith('PS-') || upper.startsWith('EKS-') || upper.startsWith('CPY-')) {
    return { raw, clean, type: 'copy', identifiedPrefix: 'PS-' };
  }

  // 3. ISBN (10 or 13 digits, especially 978/979)
  const numericOnly = clean.replace(/[^0-9X]/gi, '');
  if ((numericOnly.length === 13 && (numericOnly.startsWith('978') || numericOnly.startsWith('979'))) || numericOnly.length === 10) {
    return { raw, clean, type: 'isbn', identifiedPrefix: 'ISBN' };
  }

  // 4. Pure numeric: could be member ID or copy ID
  if (/^\d{1,8}$/.test(clean)) {
    return { raw, clean, type: 'unknown' };
  }

  return { raw, clean, type: 'unknown' };
}

/**
 * Global Keyboard Wedge Listener Factory
 * PRD §16.1 algorithm:
 * CHAR_GAP_MS = 50ms, RESET_MS = 500ms, MIN_LENGTH = 3.
 */
export function attachKeyboardWedgeListener(
  onScan: (scannedText: string, resolution: BarcodeResolution) => void,
  onDiagnostic?: (log: ScanDiagnosticLog) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const CHAR_GAP_MS = 85; // max gap between keys from hardware scanner (tolerant to wireless 2.4GHz / Bluetooth)
  const RESET_MS = 600;   // buffer reset timeout
  const MIN_LENGTH = 3;

  let buffer = '';
  let lastKeyTime = 0;
  let resetTimer: ReturnType<typeof setTimeout> | null = null;

  const handleKeyDown = (e: KeyboardEvent) => {
    // If active element explicitly asks to ignore scanner or user is inside a normal form input
    const target = e.target as HTMLElement | null;
    const isInsideInput =
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

    // If target has data-ignore-scanner, completely bypass
    if (target?.getAttribute('data-ignore-scanner') === 'true') {
      return;
    }

    const now = performance.now();
    const gap = lastKeyTime > 0 ? Math.round(now - lastKeyTime) : 0;
    const isFast = gap <= CHAR_GAP_MS && lastKeyTime > 0;

    if (onDiagnostic) {
      onDiagnostic({
        key: e.key,
        timestamp: now,
        gapMs: gap,
        isFastStreak: isFast,
      });
    }

    if (e.key === 'Enter') {
      // If buffer has sufficient length
      if (buffer.length >= MIN_LENGTH) {
        // Only prevent default if it came rapidly (scanner) OR if not typing in a textarea
        if (target?.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
        const finalCode = buffer.trim();
        buffer = '';
        if (finalCode.length >= MIN_LENGTH) {
          const resolution = resolveBarcodeType(finalCode);
          onScan(finalCode, resolution);
        }
      }
      buffer = '';
      lastKeyTime = 0;
      return;
    }

    // Ignore modifier keys like Shift, Control, Alt, Meta, CapsLock, Function keys
    if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) {
      return;
    }

    // If gap is too long, assume human typing or new scan session
    if (now - lastKeyTime > CHAR_GAP_MS && lastKeyTime !== 0) {
      buffer = '';
    }

    buffer += e.key;
    lastKeyTime = now;

    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      buffer = '';
      lastKeyTime = 0;
    }, RESET_MS);
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    if (resetTimer) clearTimeout(resetTimer);
  };
}
