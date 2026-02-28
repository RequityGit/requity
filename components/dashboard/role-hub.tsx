"use client";

import { useRoles, type AppRole } from "@/providers/role-provider";
import { useRouter } from "next/navigation";
import {
  Shield,
  ShieldCheck,
  Landmark,
  Home,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleCardConfig {
  label: string;
  description: string;
  icon: LucideIcon;
  path: string;
  stat?: string;
}

const ROLE_CONFIGS: Record<AppRole, RoleCardConfig> = {
  super_admin: {
    label: "Admin",
    description: "Manage loans, borrowers, investors, and system settings",
    icon: ShieldCheck,
    path: "/admin",
  },
  admin: {
    label: "Admin",
    description: "Manage loans, borrowers, and investors",
    icon: Shield,
    path: "/admin",
  },
  investor: {
    label: "Investor",
    description: "View investments, distributions, and portfolio performance",
    icon: Landmark,
    path: "/investor",
  },
  borrower: {
    label: "Borrower",
    description: "Track loans, upload documents, and view payment schedules",
    icon: Home,
    path: "/borrower",
  },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface RoleHubProps {
  userName?: string;
}

export function RoleHub({ userName }: RoleHubProps) {
  const { roles, setActiveRole } = useRoles();
  const router = useRouter();

  const firstName = userName?.split(" ")[0] || "there";

  const handleSelectRole = (role: AppRole) => {
    setActiveRole(role);
    const config = ROLE_CONFIGS[role];
    router.push(config.path);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
      <div className="max-w-3xl w-full text-center mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-light text-surface-white mb-3">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-surface-gray font-body text-base">{formatDate()}</p>
      </div>

      <div
        className={cn(
          "grid gap-6 w-full max-w-3xl",
          roles.length <= 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {roles.map((userRole) => {
          const config = ROLE_CONFIGS[userRole.role];
          if (!config) return null;
          const Icon = config.icon;

          return (
            <button
              key={userRole.role}
              onClick={() => handleSelectRole(userRole.role)}
              className="group card-cinematic text-left transition-all duration-200 hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5 focus:outline-none focus:ring-2 focus:ring-gold/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-gold" />
                </div>
                <h2 className="font-display text-xl font-medium text-surface-white">
                  {config.label}
                </h2>
              </div>
              <p className="text-sm text-surface-gray font-body mb-6 leading-relaxed">
                {config.description}
              </p>
              <div className="flex items-center gap-2 text-gold text-sm font-body font-semibold group-hover:gap-3 transition-all">
                Enter {config.label} Portal
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
