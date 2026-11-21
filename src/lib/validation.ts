import type { CheckoutInput } from "@/lib/types";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^[6-9]\d{9}$/;
export const PINCODE_RE = /^[1-9]\d{5}$/;

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function validateCheckout(input: CheckoutInput): FieldErrors<CheckoutInput> {
  const e: FieldErrors<CheckoutInput> = {};
  if (input.fullName.trim().length < 2) e.fullName = "Enter your full name";
  if (!EMAIL_RE.test(input.email.trim())) e.email = "Enter a valid email address";
  if (!PHONE_RE.test(input.phone.replace(/\s|-/g, ""))) e.phone = "Enter a valid 10-digit Indian mobile number";
  if (input.address.trim().length < 8) e.address = "Enter your full street address";
  if (input.city.trim().length < 2) e.city = "Enter your city";
  if (input.state.trim().length < 2) e.state = "Select your state";
  if (!PINCODE_RE.test(input.pincode.trim())) e.pincode = "Enter a valid 6-digit PIN code";
  return e;
}

export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Use at least 8 characters";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Include at least one letter and one number";
  return null;
}

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];
