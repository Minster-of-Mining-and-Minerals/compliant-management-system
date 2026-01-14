import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { Role } from "./redux/types/auth";

export default {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const { email, password } = credentials;

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email, password }),
            }
          );

          console.log("Authorize response status:", res.status);
          const data = await res.json();

          if (!data?.success) {
            throw new Error("Invalid credentials");
          }

          const user = data.data.user;
          const roles = data.data?.roles ?? [];
          return {
            accessToken: data.token,
            id: user.user_id,
            email: user.email,
            name: user.full_name,
            phone_number: user.phone_number,
            profile_image: user.profile_image,
            is_first_logged_in: user.is_first_logged_in,
            role: roles?.[0]?.name ?? null,
            roles: roles ?? [],
            permissions: data.roles?.flatMap((r: Role) =>
              r.permissions.map((p: any) => p.name)
            ),
          };
        } catch (err) {
          console.error("Authorize error:", err);
          return null;
        }
      },
    }),
  ],
} satisfies NextAuthConfig;
