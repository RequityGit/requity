import { useLayoutEffect, type RefObject } from "react";

/** Auto-expand a textarea to fit its content (no scroll). */
export function useAutoExpand(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [ref, value]);
}
