import { describe, it, expect } from "vitest";
import { normalizePhone, buildWhatsAppLink } from "@/lib/whatsapp";

describe("normalizePhone", () => {
  // --- null / undefined / empty ---
  it("returns null for null", () => {
    expect(normalizePhone(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(normalizePhone(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(normalizePhone("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    // strip non-digits → "" → length < 10 → null
    expect(normalizePhone("   ")).toBeNull();
  });

  // --- formatting characters stripped ---
  it("strips spaces, dashes and parentheses from a valid mobile", () => {
    // (11) 91234-5678
    expect(normalizePhone("(11) 91234-5678")).toBe("5511912345678");
  });

  it("strips dots from a valid landline", () => {
    expect(normalizePhone("11.3456.7890")).toBe("551134567890");
  });

  // --- valid Brazilian mobile (DDD 11-99, 9-digit after DDD) ---
  it("normalizes a valid 11-digit mobile (DDD + 9 digits)", () => {
    // 11 (São Paulo) + 912345678
    expect(normalizePhone("11912345678")).toBe("5511912345678");
  });

  it("normalizes a valid 11-digit mobile with leading 0 (trunk prefix)", () => {
    // 0DDD format: 0 + 11 + 912345678 = 13 chars
    expect(normalizePhone("011912345678")).toBe("5511912345678");
  });

  // --- valid Brazilian landline (DDD + 8 digits) ---
  it("normalizes a valid 10-digit landline (DDD + 8 digits)", () => {
    expect(normalizePhone("1134567890")).toBe("55" + "1134567890");
  });

  it("normalizes a valid 10-digit landline with leading 0", () => {
    // 0 + 11 + 34567890 = 12 chars
    expect(normalizePhone("01134567890")).toBe("551134567890");
  });

  // --- already has country code +55 ---
  it("accepts a 12-digit number already containing DDI 55 (landline)", () => {
    expect(normalizePhone("551134567890")).toBe("551134567890");
  });

  it("accepts a 13-digit number already containing DDI 55 (mobile)", () => {
    expect(normalizePhone("5511912345678")).toBe("5511912345678");
  });

  it("accepts DDI 55 with formatting characters", () => {
    expect(normalizePhone("+55 (11) 91234-5678")).toBe("5511912345678");
  });

  // --- invalid DDD (00, 01 — no valid Brazilian DDD is < 11) ---
  it("returns null for DDD 00", () => {
    // 0 + 00 + 87654321 → after strip leading 0 → 0087654321 → DDI 55 + 0087654321 → DDD 00
    expect(normalizePhone("00087654321")).toBeNull();
  });

  it("returns null for DDD 01", () => {
    // 01 + 87654321 (10 digits, no trunk prefix) → DDI 55 + DDD 01 → invalid
    expect(normalizePhone("0187654321")).toBeNull();
  });

  it("returns null for DDD 09", () => {
    // 09 + 12345678 (10 digits, no trunk prefix) → normalized DDD 09 → invalid
    expect(normalizePhone("0912345678")).toBeNull();
  });

  // --- too short ---
  it("returns null for a 9-digit number (no DDD)", () => {
    expect(normalizePhone("912345678")).toBeNull();
  });

  it("returns null for a 7-digit number", () => {
    expect(normalizePhone("1234567")).toBeNull();
  });

  // --- DDI 55 present but number too short (would be double-prefixed without guard) ---
  it("returns null for +55 with only 9 subscriber digits (no DDD)", () => {
    // '+55 91234-5678' → digits '55912345678' (11) → starts with 55, length < 12
    expect(normalizePhone("+55 91234-5678")).toBeNull();
  });

  it("returns null for '55912345678' (11 digits, starts with 55, missing DDD)", () => {
    expect(normalizePhone("55912345678")).toBeNull();
  });

  it("returns null for '5534567890' (10 digits, starts with 55, missing DDD)", () => {
    expect(normalizePhone("5534567890")).toBeNull();
  });

  // --- too long ---
  it("returns null for a number with 14+ digits after DDI 55", () => {
    // 55 + 14 extra digits → > 13 digits
    expect(normalizePhone("5511912345678900")).toBeNull();
  });

  it("returns null for arbitrary 15-digit string", () => {
    expect(normalizePhone("123456789012345")).toBeNull();
  });
});

describe("buildWhatsAppLink", () => {
  it("returns null for null phone", () => {
    expect(buildWhatsAppLink(null)).toBeNull();
  });

  it("returns null for invalid phone", () => {
    expect(buildWhatsAppLink("123")).toBeNull();
  });

  it("builds a valid wa.me link without text", () => {
    expect(buildWhatsAppLink("11912345678")).toBe(
      "https://wa.me/5511912345678"
    );
  });

  it("builds a valid wa.me link with text encoded", () => {
    const link = buildWhatsAppLink("11912345678", "Olá, tudo bem?");
    expect(link).toBe(
      "https://wa.me/5511912345678?text=Ol%C3%A1%2C%20tudo%20bem%3F"
    );
  });

  it("builds link without query string when text is empty string", () => {
    // empty text is falsy → no ?text= appended
    const link = buildWhatsAppLink("11912345678", "");
    expect(link).toBe("https://wa.me/5511912345678");
  });

  it("accepts phone already with DDI 55", () => {
    expect(buildWhatsAppLink("5511912345678")).toBe(
      "https://wa.me/5511912345678"
    );
  });

  it("accepts formatted phone with parentheses and dash", () => {
    expect(buildWhatsAppLink("(11) 91234-5678")).toBe(
      "https://wa.me/5511912345678"
    );
  });
});
