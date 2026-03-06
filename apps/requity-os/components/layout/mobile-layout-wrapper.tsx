"use client";

import { useState, createContext, useContext } from "react";
import { MobileSidebar } from "./mobile-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";

interface MobileNavContextType {
  openMobileSidebar: () => void;
}

const MobileNavContext = createContext<MobileNavContextType>({
  openMobileSidebar: () => {},
});

export function useMobileNav() {
  return useContext(MobileNavContext);
}

interface MobileLayoutWrapperProps {
  children: React.ReactNode;
  role: string;
  isSuperAdmin: boolean;
  userId: string;
  accessibleModules?: string[];
}

export function MobileLayoutWrapper({
  children,
  role,
  isSuperAdmin,
  userId,
  accessibleModules,
}: MobileLayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <MobileNavContext.Provider
      value={{ openMobileSidebar: () => setSidebarOpen(true) }}
    >
      {children}
      <MobileSidebar
        role={role}
        isSuperAdmin={isSuperAdmin}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userId={userId}
        accessibleModules={accessibleModules}
      />
      <MobileBottomNav role={role} userId={userId} />
    </MobileNavContext.Provider>
  );
}
