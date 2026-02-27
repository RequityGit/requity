import type { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { useState } from "react";

import Sidebar from "~/components/Sidebar";
import { requireAdmin } from "~/utils/auth.server";
import type { Profile } from "~/types/database";

const ADMIN_NAV = [
  {
    label: "Pipeline",
    href: "/admin",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
  {
    label: "New Loan",
    href: "/admin/loans/new",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    label: "Borrowers",
    href: "/admin/borrowers",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { profile } = await requireAdmin(request);
  return Response.json({ profile });
}

export default function AdminLayout() {
  const { profile } = useLoaderData<{ profile: Profile }>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        navItems={ADMIN_NAV}
      />
      <div className="md:ml-64">
        <header className="flex items-center justify-between px-4 py-4 md:px-8 border-b border-slate-200 bg-white">
          <button
            className="flex items-center justify-center w-8 h-8 transition rounded-md cursor-pointer md:hidden text-navy hover:bg-slate-100"
            onClick={() => setIsSidebarOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-xs text-muted hidden md:block font-medium uppercase tracking-wider">Admin Panel</span>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-sm font-medium">
              {profile.full_name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <span className="text-sm text-navy font-medium hidden sm:block">
              {profile.full_name || profile.email}
            </span>
          </div>
        </header>
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
