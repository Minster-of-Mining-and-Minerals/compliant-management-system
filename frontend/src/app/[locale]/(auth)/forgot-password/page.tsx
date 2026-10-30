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
import { Link, useRouter } from "@/i18n/navigation";
import { ArrowLeftIcon, ArrowRightIcon, Mail, ShieldCheck, Lock, KeyRound, EyeIcon, EyeOffIcon } from "lucide-react";
import { useRequestOTPMutation, useVerifyOTPMutation, useResetPasswordMutation } from "@/redux/api/authApi";
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

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const otpSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
});

const resetSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailValues = z.infer<typeof emailSchema>;
type OtpValues = z.infer<typeof otpSchema>;
type ResetValues = z.infer<typeof resetSchema>;

const STEPS = ["Email", "Verify", "New password"];

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol className="mb-7 flex items-center gap-2" aria-label={`Step ${step} of 3`}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <li key={label} className="flex flex-1 flex-col gap-1.5">
            <span
              className={cn(
                "h-1.5 rounded-full transition-colors",
                done || active ? "bg-golden-bright" : "bg-white/15"
              )}
            />
            <span
              className={cn(
                "text-[11px] font-semibold",
                active ? "text-golden-bright" : done ? "text-[#DCE7EE]" : "text-[#8FB0C4]"
              )}
            >
              {n}. {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function StepHeading({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <AuthIconBadge>{icon}</AuthIconBadge>
      <h1 className="mt-4 text-3xl font-bold">{title}</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-[#B6CBD8]">{children}</p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [requestOTPMutation, { isLoading: requesting }] = useRequestOTPMutation();
  const [verifyOTPMutation, { isLoading: verifying }] = useVerifyOTPMutation();
  const [resetPasswordMutation, { isLoading: resetting }] = useResetPasswordMutation();

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onEmailSubmit = async (values: EmailValues) => {
    try {
      await requestOTPMutation({ email: values.email }).unwrap();
      setEmail(values.email);
      setStep(2);
      toast.success("OTP sent to your email");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to send OTP");
    }
  };

  const onOtpSubmit = async (values: OtpValues) => {
    try {
      await verifyOTPMutation({ email, otp: values.otp }).unwrap();
      setOtp(values.otp);
      setStep(3);
      toast.success("OTP verified");
    } catch (error: any) {
      toast.error(error?.data?.message || "Invalid or expired OTP");
    }
  };

  const onResetSubmit = async (values: ResetValues) => {
    try {
      await resetPasswordMutation({
        email,
        otp,
        newPassword: values.newPassword
      }).unwrap();
      toast.success("Password reset successfully! Please login.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to reset password");
    }
  };

  const eyeToggle = (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#B6CBD8] transition-colors hover:text-white"
    >
      {showPassword ? <EyeIcon className="h-5 w-5" /> : <EyeOffIcon className="h-5 w-5" />}
    </button>
  );

  return (
    <AuthShell
      topAction={
        <AuthTopButton
          onClick={() => step === 1 ? router.push("/login") : setStep((prev) => (prev - 1) as 1 | 2)}
          icon={<ArrowLeftIcon />}
        >
          Back
        </AuthTopButton>
      }
    >
      <StepIndicator step={step} />

      {/* Step 1: Request OTP */}
      {step === 1 && (
        <>
          <StepHeading icon={<Mail />} title="Forgot password?">
            Enter your email and we&apos;ll send you a 6-digit code to reset your password.
          </StepHeading>

          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel className={authLabelClass}>Email address</FormLabel>
                    <div className="relative">
                      <AuthInputIcon><Mail /></AuthInputIcon>
                      <FormControl>
                        <input type="email" autoComplete="email" placeholder="example.xx@gov.et" {...field} className={authInputClass} />
                      </FormControl>
                    </div>
                    <FormMessage className={authErrorTextClass} />
                  </FormItem>
                )}
              />
              <AuthSubmitButton loading={requesting} loadingText="Sending code...">
                Send code
                <ArrowRightIcon />
              </AuthSubmitButton>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-[#8FB0C4]">
            Remembered it?{" "}
            <Link href="/login" className="font-semibold text-golden-bright hover:underline">
              Back to sign in
            </Link>
          </p>
        </>
      )}

      {/* Step 2: Verify OTP */}
      {step === 2 && (
        <>
          <StepHeading icon={<ShieldCheck />} title="Check your email">
            Enter the 6-digit code sent to <span className="font-semibold text-white">{email}</span>
          </StepHeading>

          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-5">
              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel className={authLabelClass}>6-digit code</FormLabel>
                    <FormControl>
                      <input
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="••••••"
                        maxLength={6}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                        className={cn(authInputClass, "h-16 px-4 text-center font-mono text-2xl tracking-[0.6em] placeholder:tracking-[0.6em]")}
                      />
                    </FormControl>
                    <FormMessage className={authErrorTextClass} />
                  </FormItem>
                )}
              />
              <AuthSubmitButton loading={verifying} loadingText="Verifying...">
                Verify code
                <ArrowRightIcon />
              </AuthSubmitButton>
              <p className="text-center text-sm text-[#8FB0C4]">
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  disabled={requesting}
                  onClick={() => onEmailSubmit({ email })}
                  className="font-semibold text-golden-bright hover:underline disabled:opacity-60"
                >
                  {requesting ? "Sending..." : "Resend"}
                </button>
              </p>
            </form>
          </Form>
        </>
      )}

      {/* Step 3: Reset Password */}
      {step === 3 && (
        <>
          <StepHeading icon={<KeyRound />} title="New password">
            Set a strong password of at least 8 characters to secure your account.
          </StepHeading>

          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
              <FormField
                control={resetForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel className={authLabelClass}>New password</FormLabel>
                    <div className="relative">
                      <AuthInputIcon><Lock /></AuthInputIcon>
                      <FormControl>
                        <input
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          {...field}
                          className={cn(authInputClass, "pr-12")}
                        />
                      </FormControl>
                      {eyeToggle}
                    </div>
                    <FormMessage className={authErrorTextClass} />
                  </FormItem>
                )}
              />
              <FormField
                control={resetForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel className={authLabelClass}>Confirm password</FormLabel>
                    <div className="relative">
                      <AuthInputIcon><Lock /></AuthInputIcon>
                      <FormControl>
                        <input
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          {...field}
                          className={authInputClass}
                        />
                      </FormControl>
                    </div>
                    <FormMessage className={authErrorTextClass} />
                  </FormItem>
                )}
              />
              <AuthSubmitButton loading={resetting} loadingText="Resetting..." className="!mt-6">
                Reset password
              </AuthSubmitButton>
            </form>
          </Form>
        </>
      )}
    </AuthShell>
  );
}
