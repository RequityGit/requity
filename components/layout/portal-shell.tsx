"use client";

import { useState } from "react";
import { PortalSidebar } from "./portal-sidebar";
import { Header } from "./header";

interface PortalShellProps {
  children: React.ReactNode;
  userName: string;
  email: string;
}

export function PortalShell({ children, userName, email }: PortalShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-navy-deep">
      <PortalSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        userName={userName}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          userName={userName}
          email={email}
          onMenuToggle={() => setMobileOpen(true)}
        />

        <main className="flex-1 overflow-y-auto bg-navy">
          <div className="max-w-[1280px] mx-auto p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
