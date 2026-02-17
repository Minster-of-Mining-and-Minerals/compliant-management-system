import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

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
          // 🔥 FIX: Use the correct backend URL for Docker
          // In Docker, backend service is accessible via service name
          // For external access, use the IP/domain
          const backendUrl =
            process.env.NODE_ENV === "production"
              ? `${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`
              : `${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`;

          console.log("Auth attempt to:", backendUrl);

          const res = await fetch(backendUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          console.log("Authorize response status:", res.status);

          if (!res.ok) {
            console.log("Auth failed with status:", res.status);
            return null;
          }

          const data = await res.json();
          console.log("Auth response data:", data);

          if (!data?.success) {
            console.log("Auth response not successful");
            return null;
          }

          const user = data.data.user;
          const roles = data.data?.roles ?? [];
          const permissions = data.data?.permissions ?? [];
          const token = data.token || data.data?.token;

          if (!token) {
            console.log("No token in response");
            return null;
          }

          return {
            accessToken: token,
            id: user.user_id,
            email: user.email,
            name: user.full_name,
            phone_number: user.phone_number,
            profile_image: user.profile_image,
            is_first_logged_in: user.is_first_logged_in,
            sector: user.sector,
            department: user.department,
            role: roles?.[0]?.name ?? null,
            roles: roles ?? [],
            permissions: permissions,
          };
        } catch (err) {
          console.error("Authorize error:", err);
          return null;
        }
      },
    }),
  ],

  // 🔥 ADD BASE PATH FOR DOCKER
  basePath: "/api/auth",
} satisfies NextAuthConfig;
