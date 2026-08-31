import crypto from 'crypto';

export interface OtpRecord {
  identifier: string; // phone or email (normalized)
  otp: string; // 6-digit numeric string
  type: string; // 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD' | 'CHECKOUT' | 'CONCIERGE'
  expiresAt: number; // timestamp in ms
  attempts: number; // failed verification attempts
  createdAt: number;
  lastSentAt: number;
  verified: boolean;
}

// In-memory OTP storage
const otpStore = new Map<string, OtpRecord>();

// Cooldown and validity configuration
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes validity
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds resend cooldown
const MAX_ATTEMPTS = 5; // Max allowed failed attempts before lockout

/**
 * Normalizes identifier (email to lower case, phone to standard E.164 digits)
 */
export function normalizeIdentifier(raw: string): string {
  const trimmed = (raw || '').trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  // Remove spaces, hyphens, parentheses
  return trimmed.replace(/[\s\-()]/g, '');
}

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 */
export function generateSecureOtp(): string {
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
}

/**
 * Sends/Generates an OTP for a given identifier.
 */
export function createAndSendOtp(
  rawIdentifier: string,
  type: string = 'LOGIN'
): {
  success: boolean;
  message: string;
  identifier: string;
  expiresInSeconds: number;
  cooldownSeconds?: number;
  devOtp?: string;
} {
  const identifier = normalizeIdentifier(rawIdentifier);

  if (!identifier || identifier.length < 3) {
    return {
      success: false,
      message: 'Invalid email or mobile number provided.',
      identifier,
      expiresInSeconds: 0,
    };
  }

  const existing = otpStore.get(identifier);
  const now = Date.now();

  // Check resend cooldown
  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const remainingCooldown = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
    return {
      success: false,
      message: `Please wait ${remainingCooldown}s before requesting a new OTP.`,
      identifier,
      expiresInSeconds: Math.max(0, Math.ceil((existing.expiresAt - now) / 1000)),
      cooldownSeconds: remainingCooldown,
      devOtp: existing.otp,
    };
  }

  // Generate new OTP
  const otp = generateSecureOtp();
  const expiresAt = now + OTP_EXPIRY_MS;

  const record: OtpRecord = {
    identifier,
    otp,
    type,
    expiresAt,
    attempts: 0,
    createdAt: now,
    lastSentAt: now,
    verified: false,
  };

  otpStore.set(identifier, record);

  // Simulated SMS / Email Gateway delivery logging
  const isEmail = identifier.includes('@');
  const channel = isEmail ? 'EMAIL GATEWAY' : 'ATELIER SMS / WHATSAPP GATEWAY';
  console.log(
    `[GYUTARO OTP ${channel}] 📩 Passcode [${otp}] generated for ${identifier} (Type: ${type}, Expires in 5 mins)`
  );

  return {
    success: true,
    message: `6-digit verification passcode dispatched to ${identifier}.`,
    identifier,
    expiresInSeconds: Math.ceil(OTP_EXPIRY_MS / 1000),
    devOtp: otp, // Returned for dev & seamless testability
  };
}

/**
 * Verifies a submitted OTP against the stored record.
 */
export function verifyOtpCode(
  rawIdentifier: string,
  submittedOtp: string,
  type?: string
): {
  success: boolean;
  verified: boolean;
  message: string;
  token?: string;
} {
  const identifier = normalizeIdentifier(rawIdentifier);
  const cleanOtp = (submittedOtp || '').trim();

  if (!identifier || !cleanOtp) {
    return {
      success: false,
      verified: false,
      message: 'Both identifier and OTP passcode are required.',
    };
  }

  const record = otpStore.get(identifier);
  const now = Date.now();

  if (!record) {
    return {
      success: false,
      verified: false,
      message: 'No active OTP request found. Please request a new verification code.',
    };
  }

  // Check if expired
  if (now > record.expiresAt) {
    otpStore.delete(identifier);
    return {
      success: false,
      verified: false,
      message: 'This OTP passcode has expired. Please request a new one.',
    };
  }

  // Check if max attempts exceeded
  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(identifier);
    return {
      success: false,
      verified: false,
      message: 'Too many incorrect attempts. This OTP has been invalidated for security.',
    };
  }

  // Match OTP
  if (record.otp !== cleanOtp) {
    record.attempts += 1;
    const remaining = MAX_ATTEMPTS - record.attempts;
    return {
      success: false,
      verified: false,
      message: `Invalid OTP passcode. ${remaining} attempt(s) remaining.`,
    };
  }

  // Success: mark as verified and burn the OTP
  record.verified = true;
  otpStore.delete(identifier); // One-time use

  // Create mock verified auth token
  const token = `gyutaro_auth_${crypto.randomBytes(16).toString('hex')}_${Date.now()}`;

  console.log(`[GYUTARO OTP VERIFY] ✅ Successfully verified OTP for ${identifier}`);

  return {
    success: true,
    verified: true,
    message: 'Verification successful.',
    token,
  };
}

/**
 * Periodically purge expired records (every 5 minutes)
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of otpStore.entries()) {
    if (now > val.expiresAt) {
      otpStore.delete(key);
    }
  }
}, 5 * 60 * 1000);
