"use client";

import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: Record<string, unknown>
          ) => GoogleAutocomplete;
        };
        event: {
          clearInstanceListeners: (instance: unknown) => void;
        };
      };
    };
  }
}

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GooglePlaceResult {
  address_components?: GoogleAddressComponent[];
  formatted_address?: string;
  name?: string;
}

interface GoogleAutocomplete {
  addListener: (event: string, handler: () => void) => void;
  getPlace: () => GooglePlaceResult;
}

export interface ParsedAddress {
  address_line1: string;
  city: string;
  state: string;
  zip: string;
}

export interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: ParsedAddress) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve();
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      reject(new Error("Missing NEXT_PUBLIC_GOOGLE_PLACES_API_KEY"));
      return;
    }

    const existing = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    if (existing) {
      if (window.google?.maps?.places) {
        resolve();
      } else {
        existing.addEventListener("load", () => resolve(), { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
}

function parsePlace(place: GooglePlaceResult): ParsedAddress {
  const result: ParsedAddress = {
    address_line1: "",
    city: "",
    state: "",
    zip: "",
  };

  if (!place.address_components) return result;

  let streetNumber = "";
  let route = "";

  for (const c of place.address_components) {
    const t = c.types;
    if (t.includes("street_number")) streetNumber = c.long_name;
    if (t.includes("route")) route = c.long_name;
    if (t.includes("locality")) result.city = c.long_name;
    if (t.includes("sublocality_level_1") && !result.city)
      result.city = c.long_name;
    if (t.includes("administrative_area_level_1"))
      result.state = c.short_name;
    if (t.includes("postal_code")) result.zip = c.long_name;
  }

  result.address_line1 = streetNumber
    ? `${streetNumber} ${route}`
    : route;

  return result;
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Start typing an address...",
  className,
  disabled,
  id,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<GoogleAutocomplete | null>(null);
  const initedRef = useRef(false);

  // Keep refs to latest callbacks so the place_changed listener never goes stale
  const onChangeRef = useRef(onChange);
  const onAddressSelectRef = useRef(onAddressSelect);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onAddressSelectRef.current = onAddressSelect; }, [onAddressSelect]);

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;
    if (autocompleteRef.current) return;

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
      fields: ["address_components", "formatted_address"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const parsed = parsePlace(place);

      if (parsed.address_line1) {
        onChangeRef.current(parsed.address_line1);
        onAddressSelectRef.current(parsed);
      } else {
        const fallback =
          place.formatted_address ||
          place.name ||
          inputRef.current?.value ||
          "";
        onChangeRef.current(fallback);
      }
    });

    autocompleteRef.current = ac;
  }, []);

  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;

    loadGoogleMapsScript()
      .then(() => {
        setTimeout(() => initAutocomplete(), 50);
      })
      .catch(() => {
        // Graceful fallback: input works as a plain text field
      });

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      autocompleteRef.current = null;
    };
  }, [initAutocomplete]);

  // Re-init if the input remounts (e.g., dialog open/close)
  useEffect(() => {
    if (!autocompleteRef.current && window.google?.maps?.places) {
      const t = setTimeout(() => initAutocomplete(), 100);
      return () => clearTimeout(t);
    }
  }, [initAutocomplete]);

  // Prevent Radix Dialog (shadcn) from intercepting clicks on the pac-container.
  // Google Places renders its dropdown to document.body, which Radix treats as
  // "outside" the dialog and swallows pointer events before Google sees them.
  // We also force pointer-events/z-index via CSS to defeat Radix's scroll-lock overlay.
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e.target as HTMLElement).closest(".pac-container")) {
        e.stopImmediatePropagation();
      }
    };
    const events = ["pointerdown", "mousedown", "touchstart", "click"] as const;
    events.forEach((evt) => document.addEventListener(evt, handler, true));

    const style = document.createElement("style");
    style.textContent = `.pac-container { pointer-events: auto !important; z-index: 100000 !important; }`;
    document.head.appendChild(style);

    return () => {
      events.forEach((evt) => document.removeEventListener(evt, handler, true));
      style.remove();
    };
  }, []);

  // Strip Google branding icons from the pac-container dropdown
  useEffect(() => {
    const observer = new MutationObserver(() => {
      document
        .querySelectorAll(
          ".pac-container .pac-icon, .pac-container .pac-icon-marker"
        )
        .forEach((icon) => icon.remove());
      document.querySelectorAll(".pac-container .pac-logo").forEach((logo) => {
        (logo as HTMLElement).style.setProperty(
          "background-image",
          "none",
          "important"
        );
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      autoComplete="off"
    />
  );
}
