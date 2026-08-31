/**
 * Client API layer communicating directly with the backend OTP service.
 */

export interface SendOtpResponse {
  success: boolean;
  message: string;
  identifier?: string;
  expiresInSeconds?: number;
  cooldownSeconds?: number;
  devOtp?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  verified: boolean;
  message: string;
  token?: string;
}

/**
 * Dispatches an OTP request to the backend server.
 */
export async function sendBackendOtp(
  identifier: string,
  type: string = 'LOGIN'
): Promise<SendOtpResponse> {
  try {
    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, type }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Failed to request backend OTP:', err);
    return {
      success: false,
      message: 'Network error communicating with OTP service.',
    };
  }
}

/**
 * Verifies an OTP code with the backend server.
 */
export async function verifyBackendOtp(
  identifier: string,
  otp: string,
  type?: string
): Promise<VerifyOtpResponse> {
  try {
    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, otp, type }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Failed to verify OTP with backend:', err);
    return {
      success: false,
      verified: false,
      message: 'Network error validating OTP code.',
    };
  }
}

/**
 * Resends an OTP request with rate-limit respect.
 */
export async function resendBackendOtp(
  identifier: string,
  type: string = 'LOGIN'
): Promise<SendOtpResponse> {
  try {
    const res = await fetch('/api/otp/resend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, type }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Failed to resend backend OTP:', err);
    return {
      success: false,
      message: 'Network error resending OTP.',
    };
  }
}
