import { Node } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageBreak: {
      insertPageBreak: () => ReturnType;
    };
  }
}

export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,

  parseHTML() {
    return [{ tag: 'div[data-page-break]' }];
  },

  renderHTML() {
    return [
      "div",
      {
        "data-page-break": "true",
        style:
          "border-top: 2px dashed #D1D5DB; margin: 32px 0; text-align: center; position: relative;",
        contenteditable: "false",
      },
      [
        "span",
        {
          style:
            "background: white; padding: 0 12px; color: #9CA3AF; font-size: 11px; position: relative; top: -9px;",
        },
        "Page Break",
      ],
    ];
  },

  addCommands() {
    return {
      insertPageBreak:
        () =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name });
        },
    };
  },
});
