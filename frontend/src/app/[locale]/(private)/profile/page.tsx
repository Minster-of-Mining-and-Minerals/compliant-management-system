"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Camera, Mail, Phone, User as UserIcon, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUploadAttachmentsMutation } from "@/redux/api/attachementApi";
import { useGetProfileQuery, useUpdateProfileMutation } from "@/redux/api/profileApi";
// jsngfs dg sdgnjsdng


const profileFormSchema = z
  .object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    phoneNumber: z.string().min(10),
    password: z.string().min(6).optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
    profile_image_id: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return data.confirmPassword === data.password;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { data: profileResponse, isLoading: isLoadingProfile } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [uploadAttachments, { isLoading: isUploadingImage }] = useUploadAttachmentsMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      profile_image_id: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (profileResponse?.data) {
      const { full_name, email, phone_number, profile_image_id } = profileResponse.data;
      const names = full_name.split(" ");
      const firstName = names[0] || "";
      const lastName = names.slice(1).join(" ") || "";

      form.reset({
        firstName,
        lastName,
        email,
        phoneNumber: phone_number || "",
        password: "",
        confirmPassword: "",
        profile_image_id: profile_image_id || "",
      });
    }
  }, [profileResponse, form]);

  async function onSubmit(data: ProfileFormValues) {
    try {
      const payload: any = {};

      if (data.password) {
        payload.password = data.password;
        payload.confirm_password = data.confirmPassword;
      }

      // No need to send profile_image_id if it wasn't changed via the avatar click
      // but it's safe to send if we store it in the form.

      const response = await updateProfile(payload).unwrap();

      if (response.success) {
        toast.success("Profile updated successfully");
        form.setValue("password", "");
        form.setValue("confirmPassword", "");
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update profile");
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadAttachments({ files: [file] }).unwrap();
      if (result.success && result.attachments.length > 0) {
        const attachmentId = result.attachments[0].attachment_id;
        
        // Immediately update profile with new image
        await updateProfile({ profile_image_id: attachmentId }).unwrap();
        toast.success("Profile picture updated");
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to upload image");
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const profile = profileResponse?.data;
  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const profileImageUrl = profile?.profileImage?.file_path 
    ? `${process.env.NEXT_PUBLIC_FILE_URL}/${profile.profileImage.file_path.replace(/\\/g, "/")}` 
    : "";

  return (
    <main className="flex flex-col w-full space-y-6 max-w-5xl mx-auto py-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and update your security information.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <div className="space-y-6">
          <Card className="flex flex-col items-center justify-center p-6 space-y-4 h-fit border-none shadow-md">
            <div 
              className="relative group cursor-pointer"
              onClick={handleAvatarClick}
            >
              <Avatar className="w-32 h-32 border-4 border-background shadow-sm transition-opacity group-hover:opacity-80">
                <AvatarImage src={profileImageUrl} className="object-cover" />
                <AvatarFallback className="text-4xl text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/40 rounded-full p-3 text-white">
                  {isUploadingImage ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6" />
                  )}
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <div className="text-center space-y-1 w-full">
              <h3 className="font-semibold text-lg truncate px-2">{profile?.full_name}</h3>
              <p className="text-sm text-muted-foreground">{profile?.userType?.name || "User"}</p>
              {profile?.sectorNode && (
                <p className="text-xs text-muted-foreground truncate px-2">
                  {profile.sectorNode.name}
                </p>
              )}
            </div>
          </Card>
        </div>

        <Card className="shadow-md border-none h-fit">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Your personal identity is managed by the administrator. Update your profile picture by clicking on the avatar and manage security settings below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input disabled className="pl-9 bg-muted/50 cursor-not-allowed" {...field} />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input disabled className="pl-9 bg-muted/50 cursor-not-allowed" {...field} />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              disabled
                              className="pl-9 bg-muted/50 text-muted-foreground cursor-not-allowed"
                              {...field}
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input disabled className="pl-9 bg-muted/50 cursor-not-allowed" {...field} />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4 border-t space-y-6">
                  <h3 className="text-lg font-medium">Security</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t mt-6">
                  <Button type="submit" className="px-8" disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Update Profile"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
