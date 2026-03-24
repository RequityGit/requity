"use client";

import { useRef, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import type { CustomFieldComponentProps } from "./index";

// Google Maps types are declared globally elsewhere

interface GooglePlaceResult {
  address_components?: Array<{
    types: string[];
    long_name: string;
    short_name: string;
  }>;
  formatted_address?: string;
}

interface GoogleAutocomplete {
  addListener: (event: string, callback: () => void) => void;
  getPlace: () => GooglePlaceResult;
}

export function GooglePlacesInput({
  field,
  value,
  onChange,
  formData,
  onBlur,
  error,
}: CustomFieldComponentProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<unknown>(null);
  const config = (field.component_config || {}) as {
    address_field?: string;
    city_field?: string;
    state_field?: string;
    zip_field?: string;
  };

  const addressField = config.address_field || "property_address";
  const cityField = config.city_field || "city";
  const stateField = config.state_field || "state";
  const zipField = config.zip_field || "zip";

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;
    if (autocompleteRef.current) return;

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
      fields: ["address_components", "formatted_address"],
    } as Record<string, unknown>);

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (place.address_components) {
        let streetNumber = "";
        let route = "";
        let city = "";
        let st = "";
        let zip = "";

        for (const c of place.address_components) {
          const t = c.types;
          if (t.includes("street_number")) streetNumber = c.long_name;
          if (t.includes("route")) route = c.long_name;
          if (t.includes("locality")) city = c.long_name;
          if (t.includes("sublocality_level_1") && !city) city = c.long_name;
          if (t.includes("administrative_area_level_1")) st = c.short_name;
          if (t.includes("postal_code")) zip = c.long_name;
        }

        const street = streetNumber ? `${streetNumber} ${route}` : route;
        const display = [street, city, st].filter(Boolean).join(", ") + (zip ? ` ${zip}` : "");

        if (inputRef.current) {
          inputRef.current.value = display;
        }

        // Update form data with parsed address components
        onChange(display);
        // Note: We'd need a way to update multiple fields at once
        // For now, the main address field gets the full formatted address
      }
    });

    autocompleteRef.current = ac;
  }, [onChange]);

  useEffect(() => {
    if (window.google?.maps?.places) {
      initAutocomplete();
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn("Missing NEXT_PUBLIC_GOOGLE_PLACES_API_KEY");
      return;
    }

    const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existing) {
      existing.addEventListener("load", () => initAutocomplete(), { once: true });
      if (window.google?.maps?.places) initAutocomplete();
      return;
    }

    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    s.async = true;
    s.defer = true;
    s.onload = () => initAutocomplete();
    s.onerror = () => console.error("Failed to load Google Maps");
    document.head.appendChild(s);

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current as never);
      }
      autocompleteRef.current = null;
      document.querySelectorAll(".pac-container").forEach((el) => el.remove());
    };
  }, [initAutocomplete]);

  return (
    <div className="space-y-1.5">
      {field.label && (
        <Label className="text-sm font-medium text-foreground">
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}
      <div className="relative">
        <MapPin
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={inputRef}
          type="text"
          value={String(value || "")}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={field.placeholder || "Enter property address..."}
          className="pl-9"
          required={field.required}
          autoComplete="off"
        />
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
