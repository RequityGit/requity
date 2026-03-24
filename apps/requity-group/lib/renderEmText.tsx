import React from "react";

/**
 * Converts text with *word* patterns into <em> elements.
 * Falls back to matching known brand phrases if no asterisk syntax is found.
 */
const BRAND_PHRASES = [
  "Value-Add",
  "Requity Group",
  "value-add",
  "Real Operators",
  "Deal",
  "Investor-First",
  "Vertically Integrated",
  "determined",
  "bridge loan",
];

export function renderEmText(text: string | null | undefined): React.ReactNode {
  if (!text) return null;

  // First try asterisk syntax: *word*
  const parts = text.split(/\*(.*?)\*/g);
  if (parts.length > 1) {
    return parts.map((part, i) =>
      i % 2 === 1 ? <em key={i}>{part}</em> : part
    );
  }

  // Fall back to known brand phrases
  for (const phrase of BRAND_PHRASES) {
    const idx = text.indexOf(phrase);
    if (idx !== -1) {
      const before = text.slice(0, idx);
      const match = text.slice(idx, idx + phrase.length);
      const after = text.slice(idx + phrase.length);
      return (
        <>
          {before}
          <em>{match}</em>
          {after}
        </>
      );
    }
  }

  return text;
}
