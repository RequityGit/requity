"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Shield, Landmark, Building2 } from "lucide-react";

type Role = "admin" | "investor" | "borrower";

interface RoleSwitcherProps {
  activeRole: string;
  allowedRoles: string[];
}

const roleConfig: Record<
  Role,
  { label: string; icon: React.ElementType; badgeClass: string }
> = {
  admin: {
    label: "Admin",
    icon: Shield,
    badgeClass: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  },
  investor: {
    label: "Investor",
    icon: Landmark,
    badgeClass: "bg-teal-100 text-teal-800 hover:bg-teal-200",
  },
  borrower: {
    label: "Borrower",
    icon: Building2,
    badgeClass: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  },
};

export function RoleSwitcher({ activeRole, allowedRoles }: RoleSwitcherProps) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  const canSwitch = allowedRoles.length > 1;
  const current = roleConfig[activeRole as Role];

  async function handleSwitch(newRole: string) {
    if (newRole === activeRole || switching) return;

    setSwitching(true);
    try {
      const res = await fetch("/api/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        const { redirect } = await res.json();
        router.push(redirect);
        router.refresh();
      }
    } finally {
      setSwitching(false);
    }
  }

  if (!canSwitch) {
    return (
      <Badge variant="outline" className={current?.badgeClass}>
        {current?.label}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors focus:outline-none disabled:opacity-50"
          disabled={switching}
        >
          <Badge variant="outline" className={`${current?.badgeClass} cursor-pointer`}>
            <span className="flex items-center gap-1.5">
              {current?.label}
              <ChevronsUpDown className="h-3 w-3 opacity-60" />
            </span>
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch view
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(["admin", "investor", "borrower"] as Role[])
          .filter((r) => allowedRoles.includes(r))
          .map((role) => {
            const config = roleConfig[role];
            const Icon = config.icon;
            const isActive = role === activeRole;
            return (
              <DropdownMenuItem
                key={role}
                onClick={() => handleSwitch(role)}
                className="cursor-pointer flex items-center justify-between"
                disabled={switching}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {config.label}
                </span>
                {isActive && <Check className="h-4 w-4 text-green-600" />}
              </DropdownMenuItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
