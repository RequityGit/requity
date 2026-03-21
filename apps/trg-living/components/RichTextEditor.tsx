'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;    
}

const MenuButton = ({ onClick, isActive, children }: any) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
            isActive
            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
        }`}
    >
        {children}
    </button>
);

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [StarterKit, Underline],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4 text-slate-900',                
            },
        },
    });

    if (!editor) return null;

    return (
        <div className="border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-blue-50 transition-all">
            {/* TOOLBAR */}
            <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap gap-2">
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    >B</MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                >I</MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                >U</MenuButton>
                <div className="w-px h-6 bg-slate-200 mx-1" />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                >H2</MenuButton>
            <MenuButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
            >List</MenuButton>
            </div>

            {/* EDITOR AREA */}
            <EditorContent editor={editor} />
        </div>
    );
}