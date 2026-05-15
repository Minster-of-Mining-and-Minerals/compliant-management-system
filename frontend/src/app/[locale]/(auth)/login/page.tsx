"use client";

import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { ArrowLeftIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/auth";
import { login } from "@/actions/user";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { set } from "react-hook-form";

export default function ExternalLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
    }
  }, [status, callbackUrl, router]);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const onSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
    e.preventDefault();
    // console.log(formData.email, formData.password, "formData");
    const result = await login(formData.email as string, formData.password as string);
    // console.log(result, "result");
    if (result?.error) {
      setAuthError(result.error);
    }

    if (result?.success) {
      const newSession: any = await update(); // Force session refresh
      const isFirstLogin = newSession?.user?.is_first_logged_in;

      if (isFirstLogin) {
        router.push("/change-password");
      } else {
        router.push(callbackUrl || "/dashboard");
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F9FBFC]  flex items-center justify-center px-4">
      <div className="w-full relative max-w-6xl min-h-[80vh] shadow-2xl rounded-2xl border border-[#DCE7F1] overflow-hidden flex flex-col lg:flex-row">

        {/* Back Button */}
        <Button
          onClick={() => router.push("/")}
          className="cursor-pointer shadow-none z-50 bg-transparent hover:bg-slate-100 p-2 top-4 left-4 absolute flex items-center gap-1"
        >
          <ArrowLeftIcon className="w-5 h-5 text-golden-dark" />
          <span className="text-sm text-golden-dark font-medium">Back</span>
        </Button>

        {/* Left Section */}
        <div className="w-full bg-cover bg-center p-8 flex items-center justify-center">
          <div className="backdrop-blur-md p-6 rounded-xl text-center">
            <img
              src="/logo-mom.png"
              alt="Organization Logo"
              className="h-96 mx-auto mb-3 rounded-xl p-2"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="w-full px-16 py-8 flex items-center justify-center">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold  font-semibold text-center text-golden-dark mb-6">
              Login
            </h1>

            {authError && (
              <div className="rounded-md w-full text-center bg-red-50 border border-red-200 px-3 py-2 mb-4">
                <div className="text-sm text-red-700">{authError}</div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">

              {/* Email */}
              <div>
                <Label className="text-golden-dark">Email</Label>
                <Input
                  placeholder="example.xx@gov.et"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full h-14 mt-1 px-3 py-2   rounded-md text-sm border-golden-dark focus:ring-0 focus:outline-none focus:border-none"
                />
              </div>

              {/* Password */}
              <div>
                <Label className="text-golden-dark">Password</Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full h-14 px-3 py-2 pr-10 border rounded-md text-sm border-golden-dark focus:ring-0 focus:outline-none focus:border-none"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="h-5 w-5 text-golden-dark" />
                    ) : (
                      <EyeOffIcon className="h-5 w-5 text-golden-dark" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="w-full text-right">
                <Link href="/forgot-password" data-test="forgot-password-link" className="text-sm text-[#0C4A6E] hover:underline font-medium">
                  Forgot Password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-golden-dark hover:bg-golden-darkHover h-14  text-xl text-white py-2 rounded-md shadow-md"
              >
                {isLoading ? "Logging In..." : "Log In"}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
