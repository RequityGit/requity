"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LogOut, User } from "lucide-react";

interface TopbarProps {
  userName: string;
  role: string;
  email: string;
}

const roleBadgeColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  investor: "bg-teal-100 text-teal-800",
  borrower: "bg-blue-100 text-blue-800",
};

export function Topbar({ userName, role, email }: TopbarProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-white flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <Badge variant="outline" className={roleBadgeColors[role]}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:bg-slate-100 rounded-md px-3 py-2 transition-colors">
              <div className="h-8 w-8 rounded-full bg-[#1a2b4a] flex items-center justify-center text-white text-sm font-medium">
                {userName
                  ? userName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "U"}
              </div>
              <span className="text-sm font-medium hidden md:inline">
                {userName || email}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userName || "User"}</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push(`/${role}/account`)}
              className="cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
