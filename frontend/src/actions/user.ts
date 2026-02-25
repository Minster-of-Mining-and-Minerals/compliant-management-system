"use server";

import { signIn, signOut, auth } from "@/auth";
import { AuthError } from "next-auth";

export const login = async (email: string, password: string) => {
  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    // This is the key change - use the exact same pattern as the working curl command
    await signIn("credentials", {
      email,
      password,
      redirect: false, // Keep redirect false to handle it manually
    });

    // If we get here, signIn succeeded
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      console.error("Auth error type:", error.type);
      console.error("Auth error cause:", error.cause);

      // The error type might be different from what you expect
      // Let's check all possible auth errors
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        case "CallbackRouteError":
          // This often means the credentials provider rejected the login
          return { error: "Invalid email or password." };
        default:
          console.error("Unhandled auth error:", error);
          return { error: "Something went wrong. Please try again." };
      }
    }

    // For non-AuthError errors
    console.error("Non-auth error:", error);
    return { error: "An unexpected error occurred." };
  }
};

export const logout = async () => {
  await signOut({ redirectTo: "/login" });
};

export const getSession = async () => {
  return await auth();
};

export const getCurrentUser = async () => {
  const session = await auth();
  return session?.user ?? null;
};

export const checkPermission = async (permissionKey: string) => {
  const session = await auth();
  if (!session?.user?.permissions) return false;
  return session.user.permissions.includes(permissionKey);
};

export const hasRole = async (roleName: string) => {
  const session = await auth();
  if (!session?.user?.roles) return false;
  return session.user.roles.some((role) => role.name === roleName);
};