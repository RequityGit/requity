import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MergeFieldView } from "./merge-field-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mergeField: {
      insertMergeField: (attrs: {
        fieldKey: string;
        sourceTable: string;
        sourceColumn: string;
      }) => ReturnType;
    };
  }
}

export const MergeField = Node.create({
  name: "mergeField",
  group: "inline",
  inline: true,
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      fieldKey: { default: "" },
      sourceTable: { default: "" },
      sourceColumn: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-merge-field]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-merge-field": HTMLAttributes.fieldKey,
        class: "merge-field-node",
      }),
      `{${HTMLAttributes.sourceTable}.${HTMLAttributes.sourceColumn}}`,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MergeFieldView);
  },

  addCommands() {
    return {
      insertMergeField:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});
