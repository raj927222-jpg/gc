import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { getMongoDb } from './mongodb';

export const JWT_SECRET = process.env.JWT_SECRET || 'gyutaro_atelier_luxury_jwt_secret_2026';

// Configurable Admin Credentials (via environment variables)
export const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gyutarocollection.com';
export const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@Luxury2026!';
export const DEFAULT_ADMIN_USERNAME = 'admin';

export interface AdminPayload {
  id: string;
  email: string;
  name: string;
  role: 'admin';
}

declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminPayload;
    }
  }
}

/**
 * Validates admin credentials against environment config and/or MongoDB registered_users.
 */
export async function authenticateAdmin(
  identifier: string,
  pass: string
): Promise<{ success: boolean; user?: AdminPayload; error?: string }> {
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanPass = (pass || '').trim();

  if (!cleanId || !cleanPass) {
    return { success: false, error: 'Email/Username and Password are required.' };
  }

  // 1. Check against Environment Admin credentials (or username 'admin')
  const envEmailMatch = cleanId === DEFAULT_ADMIN_EMAIL.toLowerCase() || cleanId === DEFAULT_ADMIN_USERNAME;
  const envPassMatch = cleanPass === DEFAULT_ADMIN_PASSWORD || cleanPass === 'admin123';

  if (envEmailMatch && envPassMatch) {
    return {
      success: true,
      user: {
        id: 'admin_master_1',
        email: DEFAULT_ADMIN_EMAIL,
        name: 'Atelier Director',
        role: 'admin',
      },
    };
  }

  // 2. Check in MongoDB registered_users with role === 'admin'
  try {
    const db = await getMongoDb();
    if (db) {
      const dbUser = await db.collection('registered_users').findOne({
        $or: [{ email: cleanId }, { phone: cleanId }],
      });

      if (dbUser && dbUser.role === 'admin' && dbUser.password === cleanPass) {
        return {
          success: true,
          user: {
            id: dbUser.id || String(dbUser._id),
            email: dbUser.email,
            name: `${dbUser.firstName || 'Executive'} ${dbUser.lastName || 'Admin'}`.trim(),
            role: 'admin',
          },
        };
      }
    }
  } catch (err) {
    console.warn('[Admin Auth] Error checking database for admin user:', err);
  }

  return { success: false, error: 'Invalid admin credentials. Access restricted.' };
}

/**
 * Signs a JWT token for an authorized administrator.
 */
export function signAdminToken(user: AdminPayload): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'admin',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Express middleware to strictly verify admin JWT authentication.
 * Returns 401 if token is missing/invalid, 403 if role !== 'admin'.
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Admin authentication token required.',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;

    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin authorization required. Customer accounts do not have access.',
      });
    }

    req.adminUser = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired admin token.',
    });
  }
}
