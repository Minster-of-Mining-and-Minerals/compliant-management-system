"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "react-toastify";
import { useChangePasswordMutation } from "@/redux/api/userApi";
import { useRouter } from "@/i18n/navigation";
import { getSession, useSession } from "next-auth/react";
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, Info, KeyRound, Lock, LogOut, ShieldCheck } from "lucide-react";
import { performLogout } from "@/utils/logout";
import Loading01 from "@/features/template/component/Loading/Loading01";
import {
  AuthIconBadge,
  AuthInputIcon,
  AuthShell,
  AuthSubmitButton,
  AuthTopButton,
  authErrorTextClass,
  authInputClass,
  authLabelClass,
} from "@/components/layout/AuthShell";
import { cn } from "@/lib/utils";

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

  const passwordField = (
    name: "current_password" | "new_password" | "confirm_password",
    label: string,
    autoComplete: string,
    withToggle = false,
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-0">
          <FormLabel className={authLabelClass}>{label}</FormLabel>
          <div className="relative">
            <AuthInputIcon><Lock /></AuthInputIcon>
            <FormControl>
              <input
                type={showPasswords ? "text" : "password"}
                autoComplete={autoComplete}
                placeholder="••••••••"
                {...field}
                value={field.value ?? ""}
                className={cn(authInputClass, withToggle && "pr-12")}
              />
            </FormControl>
            {withToggle && (
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#B6CBD8] transition-colors hover:text-white"
              >
                {showPasswords ? <EyeIcon className="h-5 w-5" /> : <EyeOffIcon className="h-5 w-5" />}
              </button>
            )}
          </div>
          <FormMessage className={authErrorTextClass} />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="space-y-4"
      >
        {!isFirstLogin && passwordField("current_password", "Current password", "current-password", true)}
        {passwordField("new_password", "New password", "new-password", isFirstLogin)}
        {passwordField("confirm_password", "Confirm new password", "new-password")}

        <AuthSubmitButton loading={isLoading} loadingText="Processing..." className="!mt-6">
          Update &amp; log out
        </AuthSubmitButton>
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
    <AuthShell
      topAction={
        isFirstLogin ? (
          <AuthTopButton onClick={() => performLogout()} icon={<LogOut />} tone="danger">
            Log out
          </AuthTopButton>
        ) : (
          <AuthTopButton onClick={() => router.push("/dashboard")} icon={<ArrowLeftIcon />}>
            Back
          </AuthTopButton>
        )
      }
    >
      <div className="mb-6">
        <AuthIconBadge>{isFirstLogin ? <ShieldCheck /> : <KeyRound />}</AuthIconBadge>
        <h1 className="mt-4 text-3xl font-bold">
          {isFirstLogin ? "Set your password" : "Change password"}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-[#B6CBD8]">
          {isFirstLogin
            ? "Welcome! Replace your temporary password to continue."
            : "Update your password to keep your account secure."}
        </p>
      </div>

      {isFirstLogin && (
        <div className="mb-6 flex gap-3 rounded-xl border border-golden-bright/35 bg-golden-bright/10 p-4">
          <Info className="h-5 w-5 shrink-0 text-golden-bright" />
          <p className="text-xs font-medium leading-relaxed text-[#F3E3B5]">
            You only need to enter a new password. After updating, you will be
            logged out and must sign in again with your new password.
          </p>
        </div>
      )}

      <ChangePasswordForm
        key={isFirstLogin ? "first-login" : "change-password"}
        isFirstLogin={isFirstLogin}
      />
    </AuthShell>
  );
}
