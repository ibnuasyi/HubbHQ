import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// Rate limiting configuration
const LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// In-memory rate limiting store (use Redis in production)
interface LoginAttempt {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}

const loginAttempts = new Map<string, LoginAttempt>();

/**
 * Check if IP/email is rate limited
 * @param key - IP address or email
 * @returns Object with isLocked status and remaining attempts
 */
function checkRateLimit(key: string): { isLocked: boolean; remainingAttempts: number; lockoutRemaining?: number } {
  const attempt = loginAttempts.get(key);

  if (!attempt) {
    return { isLocked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }

  // Check if currently locked
  if (attempt.lockedUntil && attempt.lockedUntil > Date.now()) {
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockoutRemaining: Math.ceil((attempt.lockedUntil - Date.now()) / 1000),
    };
  }

  // Reset if window expired
  if (Date.now() - attempt.firstAttempt > LOGIN_ATTEMPT_WINDOW) {
    loginAttempts.delete(key);
    return { isLocked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }

  // Check if max attempts exceeded
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    // Set lockout
    attempt.lockedUntil = Date.now() + LOCKOUT_DURATION;
    loginAttempts.set(key, attempt);
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockoutRemaining: LOCKOUT_DURATION / 1000,
    };
  }

  return {
    isLocked: false,
    remainingAttempts: MAX_LOGIN_ATTEMPTS - attempt.count,
  };
}

/**
 * Record failed login attempt
 * @param key - IP address or email
 */
function recordFailedAttempt(key: string): void {
  const attempt = loginAttempts.get(key);

  if (!attempt || Date.now() - attempt.firstAttempt > LOGIN_ATTEMPT_WINDOW) {
    // Start new window
    loginAttempts.set(key, {
      count: 1,
      firstAttempt: Date.now(),
    });
  } else {
    attempt.count++;
    loginAttempts.set(key, attempt);
  }
}

/**
 * Clear login attempts on successful login
 * @param key - IP address or email
 */
function clearAttempts(key: string): void {
  loginAttempts.delete(key);
}

// Clean up old entries periodically (every hour)
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      const entries = Array.from(loginAttempts.entries());
      for (const [key, attempt] of entries) {
        // Remove entries older than 1 hour
        if (now - attempt.firstAttempt > 60 * 60 * 1000) {
          loginAttempts.delete(key);
        }
      }
    },
    60 * 60 * 1000,
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // Encrypted JWE session token strategy
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          console.error("Missing credentials");
          return null;
        }

        const email = credentials.email as string;
        const ip = request?.headers?.get("x-forwarded-for")?.split(",")[0] || request?.headers?.get("x-real-ip") || "unknown";

        // Check rate limit for email
        const emailLimit = checkRateLimit(`email:${email}`);
        if (emailLimit.isLocked) {
          console.warn(`[SECURITY] Login locked for email: ${email}`);
          throw new Error(`Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil((emailLimit.lockoutRemaining || 0) / 60)} menit.`);
        }

        // Check rate limit for IP
        const ipLimit = checkRateLimit(`ip:${ip}`);
        if (ipLimit.isLocked) {
          console.warn(`[SECURITY] Login locked for IP: ${ip}`);
          throw new Error(`Terlalu banyak percobaan login dari IP ini. Coba lagi nanti.`);
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email },
            include: { role: true },
          });

          if (!user || !user.password) {
            // Record failed attempt even for non-existent user (prevent enumeration)
            recordFailedAttempt(`email:${email}`);
            recordFailedAttempt(`ip:${ip}`);
            console.error("User not found or no password");
            return null;
          }

          if (!user.isActive) {
            throw new Error("Akun tidak aktif");
          }

          // Check if user must change password (forced reset)
          if (user.mustChangePassword) {
            // Allow login but flag that password change is required
            // This will be checked in session callback
          }

          const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password);

          if (!isPasswordValid) {
            // Record failed attempt
            recordFailedAttempt(`email:${email}`);
            recordFailedAttempt(`ip:${ip}`);
            console.error("Invalid password");

            // Check if now locked
            const newEmailLimit = checkRateLimit(`email:${email}`);
            if (newEmailLimit.isLocked) {
              throw new Error(`Akun terkunci sementara. Coba lagi dalam ${Math.ceil((newEmailLimit.lockoutRemaining || 0) / 60)} menit.`);
            }

            return null;
          }

          // Clear attempts on success
          clearAttempts(`email:${email}`);
          clearAttempts(`ip:${ip}`);
          console.log(`[SECURITY] Successful login for: ${email}`);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.avatar,
            mustChangePassword: user.mustChangePassword,
          };
        } catch (error) {
          // Record failed attempt on any error
          recordFailedAttempt(`email:${email}`);
          recordFailedAttempt(`ip:${ip}`);
          console.error("Auth error:", error);
          throw error; // Re-throw to show message to user
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.mustChangePassword = (user as any).mustChangePassword || false;
        token.isActive = (user as any).isActive ?? true;
      }

      // Security: Revalidasi dinamis status akun & perubahan role dari database
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { isActive: true, role: true, mustChangePassword: true },
          });

          if (!dbUser || !dbUser.isActive) {
            token.isActive = false;
            token.role = null;
          } else {
            token.isActive = true;
            token.role = dbUser.role as any;
            token.mustChangePassword = dbUser.mustChangePassword;
          }
        } catch (dbErr) {
          console.error("JWT revalidation error:", dbErr);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.isActive === false || !token.id) {
          return {
            ...session,
            user: {
              ...session.user,
              id: "",
              role: null,
              isAdmin: false,
              isActive: false,
            },
          } as any;
        }

        session.user.id = token.id as string;
        session.user.role = token.role as
          | {
              id: string;
              name: string;
              displayName: string;
              color: string;
            }
          | null
          | undefined;
        // Pass mustChangePassword to client
        (session.user as any).mustChangePassword = token.mustChangePassword as boolean;
        (session.user as any).isAdmin = isSuperAdminRole(token.role as any);
        (session.user as any).isActive = true;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`[AUDIT] User signed in: ${user.email}`);
    },
    async signOut() {
      console.log(`[AUDIT] User signed out`);
    },
  },
});

/**
 * Helper to identify if a role or role name represents Super Admin / Administrator
 * Case-insensitive match on 'admin', 'superadmin', 'super_admin', 'super admin', 'administrator', or display names containing 'admin'
 */
export function isSuperAdminRole(
  role?: { name?: string | null; displayName?: string | null } | string | null
): boolean {
  if (!role) return false;
  if (typeof role === "string") {
    const r = role.toLowerCase().trim();
    return (
      r === "admin" ||
      r === "superadmin" ||
      r === "super_admin" ||
      r === "super admin" ||
      r === "administrator" ||
      r === "administrator utama"
    );
  }
  const name = role.name?.toLowerCase().trim() || "";
  const display = role.displayName?.toLowerCase().trim() || "";
  return (
    name === "admin" ||
    name === "superadmin" ||
    name === "super_admin" ||
    name === "super admin" ||
    name === "administrator" ||
    display === "super admin" ||
    display === "administrator" ||
    display === "administrator utama" ||
    display.toLowerCase().includes("super admin") ||
    display.toLowerCase().includes("administrator utama")
  );
}

// Helper untuk check permission (Super Admin selalu memiliki akses penuh tanpa batas)
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: { permissions: true },
      },
    },
  });

  if (!user?.role) return false;

  // Super Admin punya akses tanpa batas ke seluruh izin sistem
  if (isSuperAdminRole(user.role)) return true;

  return user.role.permissions.some((p: { name: string }) => p.name === permission);
}

// Helper untuk check multiple permissions
export async function hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: { permissions: true },
      },
    },
  });

  if (!user?.role) return false;
  if (isSuperAdminRole(user.role)) return true;

  const userPermNames = new Set(user.role.permissions.map((p: { name: string }) => p.name));
  return permissions.some((p) => userPermNames.has(p));
}

// Helper untuk check semua permissions
export async function hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: { permissions: true },
      },
    },
  });

  if (!user?.role) return false;
  if (isSuperAdminRole(user.role)) return true;

  const userPermNames = new Set(user.role.permissions.map((p: { name: string }) => p.name));
  return permissions.every((p) => userPermNames.has(p));
}

// Helper untuk check role admin / super admin
export async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  return isSuperAdminRole(user?.role);
}
