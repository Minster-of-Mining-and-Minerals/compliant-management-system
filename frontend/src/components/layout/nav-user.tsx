"use client";

import { LogOut, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

import { LogoutConfirmModal } from "@/components/common/modals/LogoutConfirmModal";
import { getFileUrl } from "@/utils/fileUrl";
import { useGetProfileQuery } from "@/redux/api/profileApi";

interface NavUserProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export function NavUser({ user }: NavUserProps) {
  const router = useRouter();
  const initials = getInitials(user.name);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleProfile = () => {
    router.push("/profile");
  }
  const profileImageUrl = user.avatar ? getFileUrl(user.avatar) : "";
  return (
    <>
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg p-2 hover:bg-accent focus:outline-none  ">
          <Avatar className="h-8 w-8 rounded-full">
            <AvatarImage src={profileImageUrl} alt={user.name} />
            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
          </Avatar>
          {/* Hide name/email on mobile, show on md and up */}
          <div className="hidden md:grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfile}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setConfirmLogout(true)}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <LogoutConfirmModal open={confirmLogout} onOpenChange={setConfirmLogout} />
    </>
  );
}

/**
 * Profile card at the bottom of the navy admin sidebar (layout A4).
 * Expanded sidebar: avatar, name, email + Profile / Log out buttons.
 * Collapsed (icon) sidebar: just the avatar, which opens the same two actions.
 */
export function SidebarUserCard() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: profileResponse } = useGetProfileQuery();

  const name = session?.user?.name ?? "User";
  const email = session?.user?.email ?? "";
  const imagePath = profileResponse?.data?.profileImage?.file_path;
  const imageUrl = imagePath ? getFileUrl(imagePath) : "";
  const initials = getInitials(name);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const avatar = (size: string) => (
    <span className="relative shrink-0">
      <Avatar className={`${size} rounded-full ring-2 ring-white/25`}>
        <AvatarImage src={imageUrl} alt={name} className="object-cover" />
        <AvatarFallback className="rounded-full bg-golden-bright text-sm font-bold text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span
        aria-hidden
        className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-primary"
      />
    </span>
  );

  return (
    <>
      {/* Expanded sidebar */}
      <section
        aria-label="Your account"
        className="overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.04] text-white group-data-[collapsible=icon]:hidden"
      >
        <div className="flex items-center gap-3 p-3">
          {/* Avatar + name open the profile page (no separate Profile button) */}
          <button
            type="button"
            onClick={() => router.push("/profile")}
            title="View profile"
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-golden-bright"
          >
            {avatar("h-11 w-11")}
            <span className="min-w-0 flex-1 leading-snug">
              <span className="block truncate text-sm font-bold" title={name}>{name}</span>
              <span className="block truncate text-xs text-slate-400" title={email}>{email}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            aria-label="Log out"
            title="Log out"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-300 transition-colors hover:bg-red-500/15 hover:text-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </section>

      {/* Collapsed (icon) sidebar */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className="mx-auto hidden rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-golden-bright group-data-[collapsible=icon]:flex"
          >
            {avatar("h-8 w-8")}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="end" sideOffset={12} className="min-w-56 rounded-lg">
          <DropdownMenuLabel className="font-normal">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setConfirmLogout(true)} className="text-red-600 focus:text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LogoutConfirmModal open={confirmLogout} onOpenChange={setConfirmLogout} />
    </>
  );
}
