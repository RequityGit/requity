"use client";

import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Table,
  SeparatorHorizontal,
  Image as ImageIcon,
  Undo,
  Redo,
  Search,
  Minus,
  Plus,
  ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { type DividerStyle } from "../extensions/styled-divider";

interface EditorToolbarProps {
  editor: Editor;
  mode: "document" | "template";
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showFindReplace: boolean;
  onToggleFindReplace: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

function ToolButton({
  active,
  onClick,
  children,
  title,
  disabled,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", active && "bg-accent text-accent-foreground")}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}

const DIVIDER_STYLES: { value: DividerStyle; label: string; preview: React.ReactNode }[] = [
  {
    value: "thin",
    label: "Thin Line",
    preview: <div className="w-full border-t border-gray-300" />,
  },
  {
    value: "thick",
    label: "Thick Line",
    preview: <div className="w-full" style={{ borderTop: "2.5px solid #1A1A1A" }} />,
  },
  {
    value: "accent",
    label: "Accent",
    preview: (
      <div className="w-full flex flex-col gap-0.5">
        <div style={{ borderTop: "4px solid #1A1A1A" }} />
        <div className="border-t border-gray-200" />
      </div>
    ),
  },
  {
    value: "double",
    label: "Double",
    preview: (
      <div className="w-full flex flex-col gap-[3px]">
        <div style={{ borderTop: "1.5px solid #1A1A1A" }} />
        <div style={{ borderTop: "0.5px solid #1A1A1A" }} />
      </div>
    ),
  },
  {
    value: "dots",
    label: "Dots",
    preview: (
      <div className="text-center text-gray-400 text-xs tracking-[8px]">• • •</div>
    ),
  },
  {
    value: "ornament",
    label: "Ornament",
    preview: (
      <div className="text-center text-gray-400 text-[10px]">——— ◆ ———</div>
    ),
  },
];

export function EditorToolbar({
  editor,
  mode,
  zoom,
  onZoomChange,
  showFindReplace,
  onToggleFindReplace,
  sidebarOpen,
  onToggleSidebar,
}: EditorToolbarProps) {
  function handleHeadingChange(value: string) {
    if (value === "paragraph") {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(value.replace("h", "")) as 1 | 2 | 3;
      editor.chain().focus().toggleHeading({ level }).run();
    }
  }

  function handleImageUrl() {
    const url = window.prompt("Image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }

  const currentHeading = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : "paragraph";

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-card flex-wrap">
      {/* Paragraph/Heading */}
      <Select value={currentHeading} onValueChange={handleHeadingChange}>
        <SelectTrigger className="h-7 w-[110px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">Paragraph</SelectItem>
          <SelectItem value="h1">Heading 1</SelectItem>
          <SelectItem value="h2">Heading 2</SelectItem>
          <SelectItem value="h3">Heading 3</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Text formatting */}
      <ToolButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold size={14} />
      </ToolButton>
      <ToolButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic size={14} />
      </ToolButton>
      <ToolButton
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <Underline size={14} />
      </ToolButton>
      <ToolButton
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <Strikethrough size={14} />
      </ToolButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Alignment */}
      <ToolButton
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        title="Align Left"
      >
        <AlignLeft size={14} />
      </ToolButton>
      <ToolButton
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        title="Align Center"
      >
        <AlignCenter size={14} />
      </ToolButton>
      <ToolButton
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        title="Align Right"
      >
        <AlignRight size={14} />
      </ToolButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Lists */}
      <ToolButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <List size={14} />
      </ToolButton>
      <ToolButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
      >
        <ListOrdered size={14} />
      </ToolButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Table */}
      <ToolButton
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        title="Insert Table"
      >
        <Table size={14} />
      </ToolButton>

      {/* Page Break */}
      <ToolButton
        onClick={() => editor.chain().focus().insertPageBreak().run()}
        title="Page Break"
      >
        <SeparatorHorizontal size={14} />
      </ToolButton>

      {/* Image */}
      <ToolButton onClick={handleImageUrl} title="Insert Image">
        <ImageIcon size={14} />
      </ToolButton>

      {/* Divider */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2">
            <Minus size={14} />
            <ChevronsUpDown size={10} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-2" align="start">
          <div className="space-y-1">
            {DIVIDER_STYLES.map((ds) => (
              <button
                key={ds.value}
                className="w-full flex flex-col gap-1.5 px-2.5 py-2 rounded hover:bg-muted transition-colors text-left"
                onClick={() => {
                  editor.chain().focus().insertStyledDivider(ds.value).run();
                }}
              >
                <span className="text-[11px] text-muted-foreground">{ds.label}</span>
                <div className="w-full">{ds.preview}</div>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Merge Field button (template mode only) */}
      {mode === "template" && (
        <>
          <Separator orientation="vertical" className="h-5 mx-1" />
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 px-2 border-blue-300 text-blue-600 hover:bg-blue-50"
            onClick={() => onToggleSidebar()}
            title="Insert Merge Field from sidebar"
          >
            <Plus size={12} />
            Merge Field
          </Button>
        </>
      )}

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Find & Replace */}
      <ToolButton
        active={showFindReplace}
        onClick={onToggleFindReplace}
        title="Find & Replace"
      >
        <Search size={14} />
      </ToolButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Undo/Redo */}
      <ToolButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo size={14} />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo size={14} />
      </ToolButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Zoom */}
      <div className="flex items-center gap-0.5">
        <ToolButton
          onClick={() => onZoomChange(Math.max(50, zoom - 10))}
          title="Zoom Out"
        >
          <Minus size={12} />
        </ToolButton>
        <span className="text-[11px] text-muted-foreground w-8 text-center num">
          {zoom}%
        </span>
        <ToolButton
          onClick={() => onZoomChange(Math.min(200, zoom + 10))}
          title="Zoom In"
        >
          <Plus size={12} />
        </ToolButton>
      </div>

      {/* Sidebar toggle */}
      <div className="ml-auto">
        <ToolButton
          active={sidebarOpen}
          onClick={onToggleSidebar}
          title="Toggle Sidebar"
        >
          <ChevronsUpDown size={14} />
        </ToolButton>
      </div>
    </div>
  );
}
