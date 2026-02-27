import { Form, NavLink } from "@remix-run/react";
import React from "react";

import CloseIcon from "./icons/Close";

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  navItems: NavItem[];
};

export default function Sidebar({ isOpen, setIsOpen, navItems }: Props) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-20 flex h-full w-64 transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col w-full bg-navy text-white">
          <div className="flex items-center justify-between gap-4 px-5 py-5 border-b border-white/10">
            <div className="flex flex-col">
              <span className="text-lg tracking-tight">
                <span className="font-bold text-white">Requity</span>{" "}
                <span className="font-light text-white/80">Lending</span>
              </span>
              <span className="text-[9px] text-white/50 tracking-widest uppercase -mt-0.5">
                A Requity Group Company
              </span>
            </div>
            <button
              className="flex items-center justify-center w-8 h-8 transition rounded-md cursor-pointer md:hidden text-white/70 hover:bg-white/10"
              onClick={() => setIsOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.label}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                        isActive
                          ? "bg-white/15 text-white font-medium"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`
                    }
                    end={item.href === "/dashboard" || item.href === "/admin"}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="px-3 py-4 border-t border-white/10">
            <Form method="POST" action="/logout">
              <button
                type="submit"
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log Out
              </button>
            </Form>
          </div>
        </div>
      </aside>
    </>
  );
}
