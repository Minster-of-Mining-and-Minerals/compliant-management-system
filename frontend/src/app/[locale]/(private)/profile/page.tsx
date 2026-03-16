"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Camera, Mail, Phone, User as UserIcon } from "lucide-react";

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

const profileFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email(),
  phoneNumber: z.string().min(10, {
    message: "Phone number must be at least 10 characters.",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Mock default data matching expected user profile format
const defaultValues: Partial<ProfileFormValues> = {
  firstName: "Abebe",
  lastName: "Bikila",
  email: "abebe@mom.gov.et",
  phoneNumber: "+251911234567",
};

export default function ProfilePage() {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  function onSubmit(data: ProfileFormValues) {
    console.log(data);
    // Add API call here to persist updates later
  }

  return (
    <main className="flex flex-col w-full space-y-6 max-w-5xl mx-auto py-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and update your allowed personal information.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        <Card className="flex flex-col items-center justify-center p-6 space-y-4 h-fit border-none shadow-md">
          <div className="relative group cursor-pointer">
            <Avatar className="w-32 h-32 border-4 border-background shadow-sm">
              {/* first name + last name letter */}
              <AvatarFallback className="text-4xl  text-primary">AB</AvatarFallback>
            </Avatar>

          </div>
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-lg">Abebe Bikila</h3>
            <p className="text-sm text-muted-foreground">System Administrator</p>
          </div>
        </Card>

        <Card className="shadow-md border-none">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details. Some fields may be restricted by the administrator.
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
                            <Input placeholder="Abebe" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
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
                            <Input placeholder="Bikila" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
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
                              placeholder="abebe@mom.gov.et"
                              className="pl-9 bg-muted/50 text-muted-foreground cursor-not-allowed"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Your email is tied to the organization and cannot be edited.
                        </FormDescription>
                        <FormMessage />
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
                            <Input placeholder="+251911..." className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end pt-6 border-t mt-6">
                  <Button type="submit" className="px-8">Save Changes</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
