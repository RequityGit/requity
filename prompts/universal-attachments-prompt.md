# Prompt: Universal Attachment Component + Note Attachments

## Objective

Build a reusable `AttachmentList` component and `AttachmentUploader` component that can be used anywhere in the platform (notes, tasks, deals, CRM). Then wire note attachments into the UnifiedNotes system so users can attach files to any note/message.

## Context

Attachments currently exist in **tasks only** (inline in `task-sheet.tsx`). The task attachment pattern is solid but not reusable. We need to extract it into universal shared components, then add attachment support to notes.

### Current Task Attachment Pattern (Reference)
- **Table:** `ops_task_attachments` with columns: `id`, `task_id`, `file_name`, `file_type`, `storage_path`, `created_at`, `uploaded_by`
- **Storage bucket:** `loan-documents` with path `tasks/{taskId}/{filename}`
- **Upload:** Direct to Supabase storage via `supabase.storage.from("loan-documents").upload(path, file)`
- **Download/Preview:** Signed URLs with 1-hour expiry
- **Image preview:** Full-screen overlay with backdrop blur, download button, close
- **Non-image files:** Open signed URL in new tab

### Existing Utilities
- `lib/document-upload-utils.ts` has: `sanitizeStorageName()`, `formatFileSize()`, `validateFile()`, `buildStoragePath()`
- Signed URL pattern used across pipeline documents, company files, task attachments

---

## Part 1: Database Schema

### New Table: `note_attachments`

```sql
CREATE TABLE note_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,              -- MIME type
  file_size_bytes BIGINT,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fetching attachments by note
CREATE INDEX idx_note_attachments_note_id ON note_attachments(note_id);

-- RLS: match notes table policies
ALTER TABLE note_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read all note attachments
-- (note-level visibility is enforced by the notes query, not attachment-level)
CREATE POLICY "Authenticated users can read note attachments"
  ON note_attachments FOR SELECT
  TO authenticated
  USING (true);

-- Policy: users can insert their own attachments
CREATE POLICY "Users can insert own note attachments"
  ON note_attachments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- Policy: users can delete their own attachments
CREATE POLICY "Users can delete own note attachments"
  ON note_attachments FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);
```

Run this migration via Supabase MCP or `npx supabase db push`.

After schema change, regenerate types: `npx supabase gen types typescript --project-id edhlkknvlczhbowasjna > packages/db/src/types.ts`

---

## Part 2: Universal Shared Components

### 2A. `components/shared/attachments/AttachmentPreview.tsx`

A single attachment display chip/row. This is the universal "one file" display used everywhere.

**Props:**
```typescript
interface AttachmentPreviewProps {
  fileName: string;
  fileType?: string | null;    // MIME type
  fileSize?: number | null;    // bytes
  storagePath: string;
  onRemove?: () => void;       // If present, shows X button (for editing/staged files)
  compact?: boolean;           // Smaller variant for inline note display
}
```

**Behavior:**
- Click the attachment to preview/download:
  - If image (`fileType?.startsWith("image/")`): open image preview overlay (see ImagePreviewOverlay below)
  - If PDF: open signed URL in new tab
  - Otherwise: trigger download via signed URL with `download` option
- Show file icon based on type (use lucide icons: `FileImage`, `FileText`, `File`, `FileSpreadsheet`, etc.)
- Show file name (truncated with ellipsis if too long) and file size via `formatFileSize()`
- If `onRemove` is provided, show a small X button on hover to remove
- Use `getDocumentSignedUrl` or equivalent to get signed URL on click

**Visual (non-compact):**
```
┌─ rounded-lg border border-border bg-muted/30 px-3 py-2 ──────────┐
│  [FileIcon]  filename.pdf  ·  2.4 MB                    [X]      │
└───────────────────────────────────────────────────────────────────┘
```

**Visual (compact, for inside note cards):**
```
┌─ rounded-md bg-muted/20 px-2 py-1.5 ─────────────┐
│  [Icon]  filename.pdf  ·  2.4 MB                   │
└────────────────────────────────────────────────────┘
```

**Styling:**
- Hover: `hover:bg-muted/50 cursor-pointer transition-colors`
- File icon: `h-4 w-4 text-muted-foreground` (compact: `h-3.5 w-3.5`)
- File name: `text-xs font-medium text-foreground truncate`
- File size: `text-[11px] text-muted-foreground`
- Remove button: `h-5 w-5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors` with X icon `h-3 w-3`

### 2B. `components/shared/attachments/AttachmentList.tsx`

Renders a list of AttachmentPreview items. Simple wrapper.

**Props:**
```typescript
interface AttachmentListProps {
  attachments: Array<{
    id: string;
    fileName: string;
    fileType?: string | null;
    fileSize?: number | null;
    storagePath: string;
  }>;
  onRemove?: (id: string) => void;
  compact?: boolean;
}
```

**Render:**
```tsx
<div className={compact ? "flex flex-wrap gap-1.5 mt-2" : "flex flex-col gap-1.5"}>
  {attachments.map(a => (
    <AttachmentPreview
      key={a.id}
      fileName={a.fileName}
      fileType={a.fileType}
      fileSize={a.fileSize}
      storagePath={a.storagePath}
      onRemove={onRemove ? () => onRemove(a.id) : undefined}
      compact={compact}
    />
  ))}
</div>
```

### 2C. `components/shared/attachments/ImagePreviewOverlay.tsx`

Full-screen image preview modal. Extracted from the inline implementation in task-sheet.tsx.

**Props:**
```typescript
interface ImagePreviewOverlayProps {
  src: string;            // Signed URL
  fileName: string;
  onClose: () => void;
}
```

**Render:**
- Fixed overlay: `fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center`
- Click backdrop to close
- Image: `max-w-[90vw] max-h-[85vh] object-contain rounded-lg`
- Top-right controls: Download button + Close (X) button
- Download button: fetches the image and triggers `a.download`
- Close button: `h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 text-white`
- File name shown below image: `text-sm text-white/70 mt-3 text-center`

### 2D. `components/shared/attachments/useAttachmentUpload.ts`

A hook that encapsulates the upload logic so it can be reused in notes, tasks, or anywhere.

```typescript
interface UseAttachmentUploadOptions {
  bucket?: string;              // Default: "loan-documents"
  pathPrefix: string;           // e.g., "notes/{noteId}" or "tasks/{taskId}"
  maxFileSize?: number;         // bytes, default 25MB
  allowedTypes?: string[];      // MIME types, default: all
  onUploadComplete?: (attachment: UploadedAttachment) => void;
  onError?: (error: string) => void;
}

interface UploadedAttachment {
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  storagePath: string;
}

interface StagedFile {
  id: string;          // Temp client-side ID
  file: File;
  preview?: string;    // Data URL for images
}

function useAttachmentUpload(options: UseAttachmentUploadOptions) {
  return {
    stagedFiles: StagedFile[];
    uploading: boolean;
    addFiles: (files: FileList | File[]) => void;    // Stage files locally
    removeStaged: (id: string) => void;               // Remove from staged
    uploadAll: () => Promise<UploadedAttachment[]>;    // Upload all staged files
    clearStaged: () => void;
  };
}
```

**Upload logic:**
1. `addFiles`: validate each file (size, type), create preview for images, add to `stagedFiles` state
2. `uploadAll`: for each staged file:
   - Build storage path: `${pathPrefix}/${Date.now()}_${sanitizeStorageName(file.name)}`
   - Upload: `supabase.storage.from(bucket).upload(storagePath, file)`
   - Return `UploadedAttachment` array
3. Error handling: toast on failure, skip failed files, return successful ones

---

## Part 3: Wire Attachments into UnifiedNotes

### 3A. Update `NoteData` type in `types.ts`

Add to `NoteData` interface:
```typescript
note_attachments?: Array<{
  id: string;
  file_name: string;
  file_type: string | null;
  file_size_bytes: number | null;
  storage_path: string;
}>;
```

### 3B. Update `UnifiedNotes/index.tsx` — Fetch

Update the fetch query to include attachments:
```typescript
// Change select to include note_attachments
.select("*, note_likes(user_id, profiles(full_name)), note_attachments(id, file_name, file_type, file_size_bytes, storage_path)")
```

### 3C. Update `UnifiedNotes/index.tsx` — Post

Update `handlePost` to accept attachments:
```typescript
async function handlePost(
  body: string,
  isInternal: boolean,
  mentionIds: string[],
  attachments?: UploadedAttachment[]   // NEW
) {
  // ... existing insert logic ...

  // After note is created and we have noteId:
  if (data && attachments && attachments.length > 0) {
    const noteId = (data as unknown as NoteData).id;
    await supabase.from("note_attachments").insert(
      attachments.map(a => ({
        note_id: noteId,
        file_name: a.fileName,
        file_type: a.fileType,
        file_size_bytes: a.fileSizeBytes,
        storage_path: a.storagePath,
        uploaded_by: currentUserId,
      }))
    );
  }
}
```

### 3D. Update `NoteComposer.tsx`

Add file staging to the composer:

```typescript
// Add to NoteComposer props:
onPost: (body: string, isInternal: boolean, mentionIds: string[], attachments?: UploadedAttachment[]) => Promise<void>;

// Inside NoteComposer:
const { stagedFiles, uploading, addFiles, removeStaged, uploadAll, clearStaged } = useAttachmentUpload({
  pathPrefix: `notes/pending`,  // Will be moved/renamed after note creation if needed
  onError: (msg) => toast({ title: "Upload failed", description: msg, variant: "destructive" }),
});

// Update handleSubmit:
async function handleSubmit(body: string, mentionIds: string[]) {
  if ((!body.trim() && stagedFiles.length === 0) || posting) return;
  setPosting(true);
  try {
    let uploaded: UploadedAttachment[] = [];
    if (stagedFiles.length > 0) {
      uploaded = await uploadAll();
    }
    await onPost(body, isInternal, mentionIds, uploaded);
    setText("");
    clearStaged();
  } finally {
    setPosting(false);
  }
}
```

The Paperclip button (already in the toolbar from the composer redesign) gets wired up:
```tsx
<button
  type="button"
  className="inline-flex items-center justify-center rounded-md h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
  title="Attach file"
  onClick={() => fileInputRef.current?.click()}
>
  <Paperclip className="h-3.5 w-3.5" strokeWidth={1.5} />
</button>
<input
  ref={fileInputRef}
  type="file"
  multiple
  className="hidden"
  onChange={(e) => e.target.files && addFiles(e.target.files)}
/>
```

Show staged files between the textarea and toolbar (inside the `comment-surface`):
```tsx
{stagedFiles.length > 0 && (
  <div className="px-3 pb-1 flex flex-wrap gap-1.5">
    {stagedFiles.map(sf => (
      <AttachmentPreview
        key={sf.id}
        fileName={sf.file.name}
        fileType={sf.file.type}
        fileSize={sf.file.size}
        storagePath=""  // Not uploaded yet, no preview click
        onRemove={() => removeStaged(sf.id)}
        compact
      />
    ))}
  </div>
)}
```

### 3E. Update `NoteCard.tsx` — Display

Show attachments below the note body text:
```tsx
{/* After the body text div, before the like pills */}
{note.note_attachments && note.note_attachments.length > 0 && (
  <AttachmentList
    attachments={note.note_attachments.map(a => ({
      id: a.id,
      fileName: a.file_name,
      fileType: a.file_type,
      fileSize: a.file_size_bytes,
      storagePath: a.storage_path,
    }))}
    compact
  />
)}
```

### 3F. Drag-and-Drop on Composer

Add drag-and-drop support to the `comment-surface` container in MentionInput (or in NoteComposer's wrapper):

```tsx
const [dragOver, setDragOver] = useState(false);

// On the comment-surface div:
onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
onDragLeave={() => setDragOver(false)}
onDrop={(e) => {
  e.preventDefault();
  setDragOver(false);
  if (e.dataTransfer.files.length > 0) {
    addFiles(e.dataTransfer.files);
  }
}}

// Visual feedback when dragging:
className={`comment-surface ${dragOver ? "ring-2 ring-primary/30 border-primary/40" : ""}`}
```

---

## Part 4: Migrate Task Attachments to Universal Components

After the universal components are built and working in notes, refactor `task-sheet.tsx` to use them:

1. Replace the inline image preview overlay with `<ImagePreviewOverlay />`
2. Replace the inline attachment list rendering with `<AttachmentList />`
3. Replace the inline upload logic with `useAttachmentUpload({ pathPrefix: \`tasks/${taskId}\` })`
4. This is a refactor only, no behavior changes.

This step is lower priority than getting notes working. Can be done as a follow-up.

---

## File Summary

### New Files
| File | Purpose |
|------|---------|
| `components/shared/attachments/AttachmentPreview.tsx` | Single file chip (icon, name, size, click-to-preview, optional remove) |
| `components/shared/attachments/AttachmentList.tsx` | Renders array of AttachmentPreview items |
| `components/shared/attachments/ImagePreviewOverlay.tsx` | Full-screen image preview modal |
| `components/shared/attachments/useAttachmentUpload.ts` | Upload hook (stage, validate, upload, clear) |
| `components/shared/attachments/index.ts` | Barrel export |

### Modified Files
| File | Change |
|------|--------|
| `components/shared/UnifiedNotes/types.ts` | Add `note_attachments` to `NoteData` |
| `components/shared/UnifiedNotes/index.tsx` | Fetch attachments in query, pass to handlePost |
| `components/shared/UnifiedNotes/NoteComposer.tsx` | Add file staging, wire Paperclip button, show staged files |
| `components/shared/UnifiedNotes/NoteCard.tsx` | Render attachments below note body |

### Database
| Change | Type |
|--------|------|
| `note_attachments` table | New table + RLS policies |
| Types regeneration | After schema change |

---

## Constraints

- Use the `loan-documents` storage bucket (consistent with all other uploads in the platform)
- Storage path for note attachments: `notes/{noteId}/{timestamp}_{sanitizedFilename}`
  - Since noteId isn't known at upload time (note hasn't been created yet), use a temp path like `notes/pending/{tempId}/{filename}` and accept the slight path mismatch, OR upload after note creation (simpler, slightly slower UX)
  - Recommended: upload files first to `notes/staged/{userId}/{timestamp}_{filename}`, then save records with that path after note creation. No need to move files.
- Max file size: 25MB (consistent with existing limits)
- Accepted types: all (same as task attachments)
- Signed URLs: 1-hour expiry for download/preview (consistent with existing)
- Dark mode must work for all new components
- Use `formatFileSize()` from `lib/document-upload-utils.ts`
- Use `sanitizeStorageName()` from `lib/document-upload-utils.ts`
- Run `pnpm build` after all changes

## Success Criteria

1. Users can attach files to any note via the Paperclip button or drag-and-drop
2. Staged files show as compact chips between textarea and toolbar before posting
3. After posting, attachments display below the note body in NoteCard
4. Clicking an image attachment opens a full-screen preview overlay
5. Clicking a non-image attachment downloads or opens in new tab
6. The AttachmentPreview, AttachmentList, and ImagePreviewOverlay components work independently and can be reused in task-sheet.tsx (follow-up refactor)
7. All existing note features (mentions, likes, pins, edit, delete, internal/external, realtime) still work
8. No TypeScript errors on `pnpm build`
