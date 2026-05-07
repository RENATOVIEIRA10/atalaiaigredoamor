/**
 * Unified WhatsApp phone normalization and link builder.
 * Used by ALL modules: Recomeço, Central, Líder de Célula, Supervisor.
 */

/**
 * Normalize a Brazilian phone number to pure digits with DDI 55.
 * Returns null if invalid.
 *
 * Rules:
 * - Strip all non-digit chars
 * - Ensure DDI 55
 * - Ensure DDD (2 digits)
 * - Mobile must have 9 digits (after DDD) for numbers with DDD >= 10
 * - Landline 8 digits accepted
 * - Minimum result: 12 digits (55 + DDD + 8-digit landline)
 * - Maximum result: 13 digits (55 + DDD + 9-digit mobile)
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits || digits.length < 10) return null;

  let normalized: string;

  if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) {
    normalized = digits;
  } else if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
    // Bug fix: check 0DDD branch BEFORE the bare-length branch so that a
    // leading trunk-prefix zero is stripped and not treated as part of the DDD.
    normalized = `55${digits.slice(1)}`;
  } else if (digits.startsWith('55') && (digits.length < 12 || digits.length > 13)) {
    // Has DDI 55 but wrong length — reject before the bare-length branch would
    // re-prefix it (e.g. '55912345678' → 11 digits → would become '5555912345678').
    return null;
  } else if (digits.length === 10 || digits.length === 11) {
    // DDD + number without DDI
    normalized = `55${digits}`;
  } else if (digits.startsWith('55') && digits.length > 13) {
    // Too many digits
    return null;
  } else {
    return null;
  }

  // Final validation: must be 12 or 13 digits
  if (normalized.length < 12 || normalized.length > 13) return null;

  // Validate DDD against the explicit Anatel allowlist.
  // A range check (>= 11) accepts gaps like 20, 30, 60, 90 that are unassigned.
  const VALID_DDDS = new Set([
    11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
    21, 22, 24,                           // RJ
    27, 28,                               // ES
    31, 32, 33, 34, 35, 37, 38,          // MG
    41, 42, 43, 44, 45, 46,              // PR
    47, 48, 49,                           // SC
    51, 53, 54, 55,                       // RS
    61,                                   // DF
    62, 64,                               // GO
    63,                                   // TO
    65, 66,                               // MT
    67,                                   // MS
    68,                                   // AC
    69,                                   // RO
    71, 73, 74, 75, 77,                  // BA
    79,                                   // SE
    81, 87,                               // PE
    82,                                   // AL
    83,                                   // PB
    84,                                   // RN
    85, 88,                               // CE
    86, 89,                               // PI
    91, 93, 94,                           // PA
    92, 97,                               // AM
    95,                                   // RR
    96,                                   // AP
    98, 99,                               // MA
  ]);
  const ddd = parseInt(normalized.slice(2, 4), 10);
  if (!VALID_DDDS.has(ddd)) return null;

  return normalized;
}

/**
 * Build a WhatsApp link (wa.me) with properly encoded text.
 * Returns null if phone is invalid.
 */
export function buildWhatsAppLink(phone: string | null | undefined, text?: string): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  let url = `https://wa.me/${normalized}`;
  if (text) {
    url += `?text=${encodeURIComponent(text)}`;
  }
  return url;
}

/**
 * Open WhatsApp link with PWA-aware navigation.
 * In PWA standalone mode, uses location.href to avoid blank page on return.
 * In browser, uses window.open.
 */
export function openWhatsApp(phone: string | null | undefined, text?: string): boolean {
  const url = buildWhatsAppLink(phone, text);
  if (!url) return false;

  const isPWA =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  if (isPWA) {
    window.location.href = url;
  } else {
    window.open(url, '_blank');
  }

  return true;
}

/**
 * Format phone for display: +55 (DD) 9XXXX-XXXX
 */
export function formatPhoneDisplay(raw: string | null | undefined): string {
  const normalized = normalizePhone(raw);
  if (!normalized) return raw || '';

  const ddd = normalized.slice(2, 4);
  const number = normalized.slice(4);

  if (number.length === 9) {
    return `+55 (${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
  }
  return `+55 (${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
}
