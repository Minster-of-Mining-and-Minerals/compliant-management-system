"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { useChangePasswordMutation } from "@/redux/api/userApi";
import { useRouter } from "@/i18n/navigation";
import { getSession, useSession } from "next-auth/react";
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, AlertCircle } from "lucide-react";
import { performLogout } from "@/utils/logout";
import Loading01 from "@/features/template/component/Loading/Loading01";

const firstLoginSchema = z
  .object({
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type FirstLoginFormValues = z.infer<typeof firstLoginSchema>;
type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

function ChangePasswordForm({ isFirstLogin }: { isFirstLogin: boolean }) {
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [showPasswords, setShowPasswords] = useState(false);

  const form = useForm<FirstLoginFormValues | ChangePasswordFormValues>({
    resolver: zodResolver(
      isFirstLogin ? firstLoginSchema : changePasswordSchema,
    ),
    defaultValues: isFirstLogin
      ? { new_password: "", confirm_password: "" }
      : { current_password: "", new_password: "", confirm_password: "" },
  });

  const onSubmit = async (
    values: FirstLoginFormValues | ChangePasswordFormValues,
  ) => {
    const session = await getSession();
    if (!session?.accessToken) {
      toast.error("Session expired. Please log in again.");
      await performLogout();
      return;
    }

    try {
      await changePassword({
        current_password:
          "current_password" in values ? values.current_password : undefined,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
        confirm_change: true,
      }).unwrap();

      toast.success(
        "Password changed successfully! Please log in with your new password.",
      );
      await performLogout();
    } catch (error: unknown) {
      const err = error as {
        data?: { message?: string };
        status?: number | string;
        error?: string;
      };

      if (err?.status === "FETCH_ERROR" || err?.error === "FETCH_ERROR") {
        toast.error(
          "Could not reach the server. If you use the private IP, ensure the app was rebuilt with the latest update.",
        );
        return;
      }

      if (err?.status === 401 || err?.status === 403) {
        toast.error(
          err?.data?.message || "Session expired. Please log in again.",
        );
        return;
      }
      toast.error(err?.data?.message || "Failed to change password");
    }
  };

  const onInvalid = () => {
    const firstError = Object.values(form.formState.errors)[0]?.message;
    if (firstError) {
      toast.error(String(firstError));
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="space-y-5"
      >
        {!isFirstLogin && (
          <FormField
            control={form.control}
            name="current_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-golden-dark">
                  Current Password
                </FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPasswords ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
                      className="w-full h-14 mt-1 px-3 py-2 border-golden-dark focus:ring-0 focus:outline-none focus:border-none pr-10"
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showPasswords ? (
                      <EyeIcon className="h-5 w-5 text-golden-dark" />
                    ) : (
                      <EyeOffIcon className="h-5 w-5 text-golden-dark" />
                    )}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="new_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-golden-dark">New Password</FormLabel>
              <FormControl>
                <Input
                  type={showPasswords ? "text" : "password"}
                  placeholder="••••••••"
                  {...field}
                  className="w-full h-14 mt-1 px-3 py-2 border-golden-dark focus:ring-0 focus:outline-none focus:border-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirm_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-golden-dark">
                Confirm New Password
              </FormLabel>
              <FormControl>
                <Input
                  type={showPasswords ? "text" : "password"}
                  placeholder="••••••••"
                  {...field}
                  className="w-full h-14 mt-1 px-3 py-2 border-golden-dark focus:ring-0 focus:outline-none focus:border-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 h-14 text-xl text-white font-semibold rounded-md shadow-md transition-all duration-200 mt-6"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Update & Log Out"}
        </Button>
      </form>
    </Form>
  );
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Loading01 />;
  }

  if (status === "unauthenticated") {
    performLogout();
    return <Loading01 />;
  }

  const isFirstLogin = Boolean(session?.user?.is_first_logged_in);

  return (
    <div className="min-h-screen bg-[#F9FBFC] flex items-center justify-center px-4 py-12">
      <div className="w-full relative max-w-6xl min-h-[80vh] shadow-2xl rounded-2xl border border-[#DCE7F1] overflow-hidden flex flex-col lg:flex-row bg-white">
        {isFirstLogin ? (
          <Button
            onClick={() => performLogout()}
            className="cursor-pointer shadow-none z-50 bg-transparent hover:bg-red-50 p-2 top-4 left-4 absolute flex items-center gap-1 text-red-600 hover:text-red-700"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </Button>
        ) : (
          <Button
            onClick={() => router.push("/dashboard")}
            className="cursor-pointer shadow-none z-50 bg-transparent hover:bg-slate-100 p-2 top-4 left-4 absolute flex items-center gap-1"
          >
            <ArrowLeftIcon className="w-5 h-5 text-golden-dark" />
            <span className="text-sm text-golden-dark font-medium">Back</span>
          </Button>
        )}

        <div className="w-full bg-[#F9FBFC] p-8 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-[#DCE7F1]">
          <div className="text-center">
            <img
              src="/logo-mom.png"
              alt="Organization Logo"
              className="h-64 lg:h-96 mx-auto mb-6 p-2"
            />
          </div>
        </div>

        <div className="w-full px-8 lg:px-16 py-12 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-golden-dark mb-2">
                {isFirstLogin ? "Security Update" : "Change Password"}
              </h1>
              <p className="text-sm text-golden-dark/70">
                {isFirstLogin
                  ? "Set a new password to continue. Your temporary password will be replaced."
                  : "Update your password to keep your account secure."}
              </p>
            </div>

            {isFirstLogin && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  You only need to enter a new password. After updating, you
                  will be logged out and must sign in again with your new
                  credentials.
                </p>
              </div>
            )}

            <ChangePasswordForm
              key={isFirstLogin ? "first-login" : "change-password"}
              isFirstLogin={isFirstLogin}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
