import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

export function MergeFieldView({ node }: NodeViewProps) {
  const { sourceTable, sourceColumn } = node.attrs;

  return (
    <NodeViewWrapper
      as="span"
      className="inline-flex items-center px-1.5 py-px rounded-[3px] border text-xs font-mono leading-snug cursor-default select-none align-baseline"
      style={{
        background: "rgba(46,110,166,0.10)",
        borderColor: "rgba(46,110,166,0.22)",
        color: "#4A9AD9",
        display: "inline",
      }}
    >
      <span style={{ opacity: 0.35 }}>{sourceTable}.</span>
      {sourceColumn}
    </NodeViewWrapper>
  );
}
