import { Node, mergeAttributes } from "@tiptap/core";
import { MERGE_VARIABLES } from "@/app/(authenticated)/(admin)/email-templates/types";

/**
 * Returns the display label for a merge variable key.
 * Falls back to the raw key if not found in MERGE_VARIABLES.
 */
export function getVariableLabel(key: string): string {
  const found = MERGE_VARIABLES.find((v) => v.key === key);
  return found?.label ?? key;
}

/**
 * Custom Tiptap Node that renders {{variable}} merge tags as styled pills.
 *
 * In the editor they appear as non-editable badges.
 * When serialised to HTML they output the `{{key}}` placeholder text.
 */
export const MergeVariable = Node.create({
  name: "mergeVariable",
  group: "inline",
  inline: true,
  atom: true, // non-editable single unit

  addAttributes() {
    return {
      key: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-variable-key"),
        renderHTML: (attributes) => ({
          "data-variable-key": attributes.key,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-variable-key]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const key = HTMLAttributes["data-variable-key"] ?? "";
    const label = getVariableLabel(key);
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-variable-key": key,
        class:
          "inline-flex items-center gap-0.5 rounded-md bg-blue-100 text-blue-800 px-1.5 py-0.5 text-xs font-medium select-all cursor-default",
        contenteditable: "false",
      }),
      label,
    ];
  },

  /**
   * When the editor content is exported to HTML for storage we replace the
   * node with the raw `{{key}}` placeholder so the email renderer works.
   */
  renderText({ node }) {
    return `{{${node.attrs.key}}}`;
  },

});

/**
 * Pre-processes stored HTML so that raw `{{key}}` text is converted into
 * `<span data-variable-key="key">Label</span>` nodes that Tiptap can parse.
 */
export function htmlToTiptap(html: string): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const label = getVariableLabel(key);
    return `<span data-variable-key="${key}">${label}</span>`;
  });
}

/**
 * Post-processes Tiptap HTML output to convert
 * `<span data-variable-key="key">…</span>` nodes back to `{{key}}`.
 */
export function tiptapToHtml(html: string): string {
  return html.replace(
    /<span[^>]*data-variable-key="(\w+)"[^>]*>[^<]*<\/span>/g,
    (_match, key: string) => `{{${key}}}`
  );
}
