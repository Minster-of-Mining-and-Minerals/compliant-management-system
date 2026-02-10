import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { JWT } from "next-auth/jwt";
import { SectorNode } from "./redux/types/sectorNode";
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 3 * 60 * 60, // 3 hours
    updateAge: 25 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          phone_number: user.phone_number,
          profile_image: user.profile_image,
          is_first_logged_in: user.is_first_logged_in,
          sector: user.sector,
          department: user.department,
          roles: user.roles,
          permissions: user.permissions,
          accessToken: user.accessToken,
        };
      }
      if (token.exp && token.exp < Date.now() / 1000) {
        console.log("Token expired");
        return null;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken, // <-- ADD THIS LINE
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role,
          phone_number: token.phone_number,
          profile_image: token.profile_image,
          is_first_logged_in: token.is_first_logged_in,
          sector: token.sector,
          department: token.department,
          roles: token.roles,
          permissions: token.permissions,
        },
      };
    },
  },
});

// Type augmentations
declare module "next-auth" {
  interface User {
    accessToken?: string;
    id: string;
    role?: string | null;
    phone_number?: string | null;
    profile_image?: string | null;
    is_first_logged_in?: boolean;
    roles?: Array<{
      role_id: string;
      name: string;
      permissions: Array<{
        permission_id: string;
        name: string;
        key: string;
      }>;
    }>;
    sector?: SectorNode;
    department?: SectorNode;
    permissions?: string[] | null;
  }

  interface Session {
    accessToken?: string;
    message?: string;
    error?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
      phone_number?: string | null;
      profile_image?: string | null;
      is_first_logged_in?: boolean;
      sector?: SectorNode;
      department?: SectorNode;
      roles?: Array<{
        role_id: string;
        name: string;
        permissions: Array<{
          permission_id: string;
          name: string;
          key: string;
        }>;
      }>;
      permissions?: string[] | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    accessToken?: string;
    role?: string | null;
    phone_number?: string | null;
    profile_image?: string | null;
    is_first_logged_in?: boolean;
    sector?: SectorNode;
    department?: SectorNode;
    roles?: Array<{
      role_id: string;
      name: string;
      permissions: Array<{
        permission_id: string;
        name: string;
        key: string;
      }>;
    }>;
    permissions?: string[] | null;
  }
}
