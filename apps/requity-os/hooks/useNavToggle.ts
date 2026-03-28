"use client";

import { useEffect } from "react";

export function useNavToggle() {
  useEffect(() => {
    const mobileToggle = document.getElementById("mobileToggle");
    const navLinks = document.getElementById("navLinks");

    const handleToggle = () => navLinks?.classList.toggle("open");
    const handleLinkClick = () => navLinks?.classList.remove("open");

    mobileToggle?.addEventListener("click", handleToggle);

    const links = navLinks?.querySelectorAll("a") ?? [];
    links.forEach((l) => l.addEventListener("click", handleLinkClick));

    return () => {
      mobileToggle?.removeEventListener("click", handleToggle);
      links.forEach((l) => l.removeEventListener("click", handleLinkClick));
    };
  }, []);
}
