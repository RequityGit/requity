import { Node, mergeAttributes } from "@tiptap/core";

export type DividerStyle =
  | "thin"
  | "thick"
  | "accent"
  | "double"
  | "dots"
  | "ornament";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    styledDivider: {
      insertStyledDivider: (style: DividerStyle) => ReturnType;
    };
  }
}

export const StyledDivider = Node.create({
  name: "styledDivider",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      style: { default: "thin" as DividerStyle },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-divider-style]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const style = HTMLAttributes.style as DividerStyle;
    const styleMap: Record<DividerStyle, string> = {
      thin: "border-top: 1px solid #E0E0E0; margin: 20px 0;",
      thick: "border-top: 2.5px solid #1A1A1A; margin: 22px 0;",
      accent:
        "border-top: 4px solid #1A1A1A; margin: 22px 0; position: relative;",
      double:
        "border-top: 1.5px solid #1A1A1A; border-bottom: 0.5px solid #1A1A1A; height: 3px; margin: 22px 0;",
      dots: "text-align: center; margin: 20px 0; letter-spacing: 8px; color: #CCC; font-size: 12px;",
      ornament:
        "text-align: center; margin: 20px 0; color: #CCC; font-size: 10px;",
    };

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-divider-style": style,
        style: styleMap[style] ?? styleMap.thin,
        contenteditable: "false",
      }),
      style === "dots"
        ? "• • •"
        : style === "ornament"
          ? "——— ◆ ———"
          : "",
    ];
  },

  addCommands() {
    return {
      insertStyledDivider:
        (style) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { style },
          });
        },
    };
  },
});
