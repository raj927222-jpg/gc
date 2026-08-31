import { RegisteredUser, UserAccount } from '../types';
import { safeStorage } from './storage';
import { insertUserToSupabase, fetchUsersFromSupabase } from './supabaseDb';

const REGISTERED_USERS_KEY = 'gc_registered_users';

// Pre-seeded default atelier patrons for out-of-the-box demo convenience
const SEED_USERS: RegisteredUser[] = [
  {
    id: 'user-seed-1',
    firstName: 'Arjun',
    lastName: 'Patel',
    email: 'arjun.patel@luxurycouture.com',
    phone: '+91 9725917116',
    password: 'password123',
    createdAt: Date.now() - 86400000 * 30,
  },
];

/**
 * Normalizes phone numbers (removes whitespace, hyphens, parentheses)
 * for reliable comparison across various country formats.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '').trim();
}

/**
 * Normalizes email address to lowercase and trimmed string.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Retrieves all registered users from storage or initial seed list.
 */
export function getRegisteredUsers(): RegisteredUser[] {
  const raw = safeStorage.getItem(REGISTERED_USERS_KEY);
  if (!raw) {
    // Seed initial users into storage
    safeStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(SEED_USERS));
    return SEED_USERS;
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return SEED_USERS;
  } catch (err) {
    console.error('Failed to parse registered users from storage:', err);
    return SEED_USERS;
  }
}

/**
 * Saves the full registered users list into persistent safe storage.
 */
export function saveRegisteredUsers(users: RegisteredUser[]): boolean {
  return safeStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

/**
 * Finds a registered user by email or phone number.
 */
export function findRegisteredUser(identifier: string): RegisteredUser | undefined {
  const cleanId = identifier.trim();
  if (!cleanId) return undefined;

  const users = getRegisteredUsers();
  const lowerEmail = normalizeEmail(cleanId);
  const normPhone = normalizePhone(cleanId);

  return users.find((u) => {
    const userEmailMatch = normalizeEmail(u.email) === lowerEmail;
    const userPhoneMatch = normalizePhone(u.phone) === normPhone;
    return userEmailMatch || userPhoneMatch;
  });
}

/**
 * Registers a new user.
 * Returns an error if the user is already registered with the given email or phone.
 */
export function registerUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}): { success: boolean; error?: string; user?: RegisteredUser } {
  const users = getRegisteredUsers();
  const cleanEmail = normalizeEmail(data.email);
  const cleanPhone = normalizePhone(data.phone);

  if (!cleanEmail) {
    return { success: false, error: 'Valid email address is required.' };
  }
  if (!cleanPhone) {
    return { success: false, error: 'Mobile number is required.' };
  }
  if (!data.password || data.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  // Check if an account already exists with the same email
  const existingByEmail = users.find((u) => normalizeEmail(u.email) === cleanEmail);
  if (existingByEmail) {
    return {
      success: false,
      error: `An account with email "${data.email}" is already registered. Please login instead.`,
    };
  }

  // Check if an account already exists with the same phone
  const existingByPhone = users.find((u) => normalizePhone(u.phone) === cleanPhone);
  if (existingByPhone) {
    return {
      success: false,
      error: `An account with mobile number "${data.phone}" is already registered. Please login instead.`,
    };
  }

  const newUser: RegisteredUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    firstName: data.firstName.trim() || 'Valued',
    lastName: data.lastName.trim() || 'Patron',
    email: data.email.trim(),
    phone: data.phone.trim(),
    password: data.password,
    createdAt: Date.now(),
  };

  const updatedList = [...users, newUser];
  saveRegisteredUsers(updatedList);

  // Background sync to Supabase database
  insertUserToSupabase(newUser).catch((err) => {
    console.warn('[Supabase Sync] User save warning:', err);
  });

  return { success: true, user: newUser };
}

/**
 * Authenticates a user by identifier (Email or Mobile Number) and Password.
 * Blocks login if not registered or password doesn't match.
 */
export function authenticateUser(
  identifier: string,
  password: string
): { success: boolean; error?: string; user?: RegisteredUser } {
  const cleanId = identifier.trim();
  if (!cleanId) {
    return {
      success: false,
      error: 'Please enter your registered email address or mobile number.',
    };
  }
  if (!password) {
    return {
      success: false,
      error: 'Please enter your account password.',
    };
  }

  const user = findRegisteredUser(cleanId);

  // If user is not registered, DO NOT allow login
  if (!user) {
    return {
      success: false,
      error: 'No account found with these credentials. Please REGISTER first.',
    };
  }

  // Check password
  if (user.password !== password) {
    return {
      success: false,
      error: 'Incorrect password. Please verify your credentials or reset your password.',
    };
  }

  return { success: true, user };
}

/**
 * Updates a registered user's password (e.g. through the forgot password recovery flow).
 */
export function resetUserPassword(
  identifier: string,
  newPassword: string
): { success: boolean; error?: string } {
  const users = getRegisteredUsers();
  const lowerEmail = normalizeEmail(identifier);
  const normPhone = normalizePhone(identifier);

  const idx = users.findIndex(
    (u) => normalizeEmail(u.email) === lowerEmail || normalizePhone(u.phone) === normPhone
  );

  if (idx === -1) {
    return {
      success: false,
      error: 'No registered account found matching this mobile number or email.',
    };
  }

  users[idx] = {
    ...users[idx],
    password: newPassword,
  };

  saveRegisteredUsers(users);
  return { success: true };
}

/**
 * Converts a RegisteredUser record to a UserAccount state object for the app.
 */
export function toUserAccount(user: RegisteredUser): UserAccount {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    isLoggedIn: true,
    authProvider: user.authProvider || 'password',
    avatarUrl: user.avatarUrl,
  };
}

/**
 * Registers or logs in a user authenticated via Google.
 * If user exists by email, returns the existing record and updates provider.
 * If user doesn't exist, creates a new VIP patron account and saves it to storage & Supabase.
 */
export function registerOrLoginGoogleUser(profile: {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  phone?: string;
}): { success: boolean; user: RegisteredUser } {
  const users = getRegisteredUsers();
  const cleanEmail = normalizeEmail(profile.email);

  const existingIdx = users.findIndex((u) => normalizeEmail(u.email) === cleanEmail);

  if (existingIdx !== -1) {
    const existing = users[existingIdx];
    const updatedUser: RegisteredUser = {
      ...existing,
      authProvider: 'google',
      avatarUrl: profile.avatarUrl || existing.avatarUrl,
      firstName: existing.firstName || profile.firstName || 'Valued',
      lastName: existing.lastName || profile.lastName || 'Patron',
    };
    users[existingIdx] = updatedUser;
    saveRegisteredUsers(users);

    // Sync to Supabase in background
    insertUserToSupabase(updatedUser).catch((err) => {
      console.warn('[Supabase Sync] Google user update warning:', err);
    });

    return { success: true, user: updatedUser };
  }

  // Derive names cleanly
  let first = profile.firstName || '';
  let last = profile.lastName || '';
  if (!first && profile.name) {
    const parts = profile.name.trim().split(' ');
    first = parts[0] || 'Valued';
    last = parts.slice(1).join(' ') || 'Patron';
  }
  if (!first) {
    first = cleanEmail.split('@')[0] || 'Valued';
    last = 'Patron';
  }

  const newUser: RegisteredUser = {
    id: `usr_google_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    firstName: first,
    lastName: last,
    email: cleanEmail,
    phone: profile.phone || '+91 9725917116',
    password: `google_oauth_${Math.random().toString(36).slice(-8)}`,
    createdAt: Date.now(),
    authProvider: 'google',
    avatarUrl: profile.avatarUrl,
  };

  const updatedList = [...users, newUser];
  saveRegisteredUsers(updatedList);

  // Sync to Supabase in background
  insertUserToSupabase(newUser).catch((err) => {
    console.warn('[Supabase Sync] New Google user save warning:', err);
  });

  return { success: true, user: newUser };
}

/**
 * Fetches all registered users from Supabase and merges them with local storage.
 */
export async function syncRegisteredUsersFromSupabase(): Promise<RegisteredUser[]> {
  try {
    const cloudUsers = await fetchUsersFromSupabase();
    if (cloudUsers && cloudUsers.length > 0) {
      const localUsers = getRegisteredUsers();
      const userMap = new Map<string, RegisteredUser>();

      for (const u of localUsers) {
        userMap.set(normalizeEmail(u.email), u);
      }
      for (const u of cloudUsers) {
        userMap.set(normalizeEmail(u.email), u);
      }

      const merged = Array.from(userMap.values());
      saveRegisteredUsers(merged);
      return merged;
    }
  } catch (err) {
    console.warn('[Supabase Sync] Users sync exception:', err);
  }
  return getRegisteredUsers();
}

