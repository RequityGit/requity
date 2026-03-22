# Prompt: Inline Image Thumbnails + File-Type Color Coding for Attachments

## Objective

Upgrade the `AttachmentPreview` component with two visual improvements:
1. **Image attachments render as inline thumbnails** instead of file chips
2. **Non-image attachments get file-type color coding** on the icon and chip background

These are visual-only changes to existing components. No schema, no new tables, no logic changes.

## Context

The universal attachment components were recently built:
- `components/shared/attachments/AttachmentPreview.tsx` — single file chip
- `components/shared/attachments/AttachmentList.tsx` — renders array of chips
- `components/shared/attachments/ImagePreviewOverlay.tsx` — full-screen image modal
- `components/shared/attachments/useAttachmentUpload.ts` — upload hook
- `components/shared/attachments/index.ts` — barrel export

Attachments display in `NoteCard.tsx` via `<AttachmentList compact />` below note body text. They also display as staged file chips in `NoteComposer.tsx` before posting.

The current `AttachmentPreview` renders ALL file types identically: a gray rounded chip with a generic file icon, file name, and file size. Images and spreadsheets look the same. This needs to change.

## Part 1: Inline Image Thumbnails

### When to show a thumbnail

If `fileType` starts with `"image/"` (jpeg, png, gif, webp, svg), render a thumbnail instead of a file chip.

### Thumbnail rendering

For image attachments in **NoteCard** (already uploaded, has `storagePath`):

```tsx
// Instead of the file chip, render:
<button
  type="button"
  onClick={() => handlePreview()}
  className="group relative rounded-lg overflow-hidden border border-border/50 hover:border-border transition-colors cursor-pointer mt-2"
>
  <img
    src={signedUrl}
    alt={fileName}
    className="max-w-[240px] max-h-[160px] object-cover rounded-lg"
    loading="lazy"
  />
  {/* Subtle hover overlay */}
  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
</button>
```

**Compact variant** (used inside note cards): `max-w-[200px] max-h-[120px]`
**Non-compact variant**: `max-w-[280px] max-h-[180px]`

### Signed URL for thumbnails

The component needs a signed URL to display the image. Options:
- **Recommended:** Generate the signed URL on mount/click using the existing `getDocumentSignedUrl` server action (or direct Supabase client call)
- Show a small skeleton/placeholder while the URL loads
- Cache the URL in component state so it doesn't re-fetch on every render

```tsx
const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
const [loadingUrl, setLoadingUrl] = useState(false);

useEffect(() => {
  if (!isImage || !storagePath) return;
  setLoadingUrl(true);
  const supabase = createClient();
  supabase.storage
    .from("loan-documents")
    .createSignedUrl(storagePath, 3600)
    .then(({ data }) => {
      if (data?.signedUrl) setThumbnailUrl(data.signedUrl);
    })
    .finally(() => setLoadingUrl(false));
}, [storagePath, isImage]);
```

Loading state: show a `bg-muted animate-pulse rounded-lg` placeholder at the thumbnail dimensions.

### Staged file thumbnails (NoteComposer, before upload)

For staged files that haven't been uploaded yet, use the `FileReader` data URL:

```tsx
// In useAttachmentUpload or AttachmentPreview:
// If the StagedFile has a preview (data URL from FileReader), use it directly
// The useAttachmentUpload hook already creates previews for images
```

Check if `useAttachmentUpload.ts` already generates previews. If `StagedFile` has a `preview?: string` field, use it as `src` for staged image thumbnails. If not, add it:

```typescript
interface StagedFile {
  id: string;
  file: File;
  preview?: string;  // Data URL for images
}

// In addFiles:
if (file.type.startsWith("image/")) {
  const reader = new FileReader();
  reader.onload = (e) => {
    setStagedFiles(prev => prev.map(sf =>
      sf.id === tempId ? { ...sf, preview: e.target?.result as string } : sf
    ));
  };
  reader.readAsDataURL(file);
}
```

For staged image files, render the thumbnail using the data URL preview. For staged non-image files, render the color-coded chip (Part 2).

### Click behavior

- **Uploaded image thumbnail:** Click opens `ImagePreviewOverlay` with the signed URL (same as current chip click behavior, just the trigger element changes from chip to thumbnail)
- **Staged image thumbnail:** Click does nothing (not uploaded yet, can't preview full size). Show the remove X button on hover.

### Thumbnail remove button (staged files only)

When `onRemove` is provided, show an X button overlaid on the top-right corner of the thumbnail:

```tsx
{onRemove && (
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); onRemove(); }}
    className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
  >
    <X className="h-3 w-3" />
  </button>
)}
```

---

## Part 2: File-Type Color Coding

### Color map

Define a helper function that returns icon and color info based on MIME type or file extension:

```typescript
// In components/shared/attachments/file-type-colors.ts (new file)

interface FileTypeStyle {
  icon: LucideIcon;
  color: string;        // Tailwind text color class
  bgTint: string;       // Tailwind bg tint for chip
  darkColor: string;    // Dark mode text color
  darkBgTint: string;   // Dark mode bg tint
}

export function getFileTypeStyle(fileType?: string | null, fileName?: string): FileTypeStyle {
  const type = fileType?.toLowerCase() || "";
  const ext = fileName?.split(".").pop()?.toLowerCase() || "";

  // Spreadsheets — green
  if (type.includes("spreadsheet") || type.includes("excel") || ["xlsx", "xls", "csv", "tsv"].includes(ext)) {
    return {
      icon: FileSpreadsheet,
      color: "text-emerald-600",
      bgTint: "bg-emerald-500/8",
      darkColor: "dark:text-emerald-400",
      darkBgTint: "dark:bg-emerald-500/10",
    };
  }

  // PDFs — red
  if (type === "application/pdf" || ext === "pdf") {
    return {
      icon: FileText,
      color: "text-red-600",
      bgTint: "bg-red-500/8",
      darkColor: "dark:text-red-400",
      darkBgTint: "dark:bg-red-500/10",
    };
  }

  // Word docs — blue
  if (type.includes("word") || type.includes("document") || ["doc", "docx"].includes(ext)) {
    return {
      icon: FileText,
      color: "text-blue-600",
      bgTint: "bg-blue-500/8",
      darkColor: "dark:text-blue-400",
      darkBgTint: "dark:bg-blue-500/10",
    };
  }

  // Images — purple (only used for the chip fallback; thumbnails are the primary display)
  if (type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    return {
      icon: FileImage,
      color: "text-violet-600",
      bgTint: "bg-violet-500/8",
      darkColor: "dark:text-violet-400",
      darkBgTint: "dark:bg-violet-500/10",
    };
  }

  // Archives — amber
  if (type.includes("zip") || type.includes("archive") || type.includes("compressed") || ["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return {
      icon: FileArchive,
      color: "text-amber-600",
      bgTint: "bg-amber-500/8",
      darkColor: "dark:text-amber-400",
      darkBgTint: "dark:bg-amber-500/10",
    };
  }

  // Code/text — cyan
  if (type.includes("text") || type.includes("json") || type.includes("xml") || ["txt", "json", "xml", "html", "css", "js", "ts"].includes(ext)) {
    return {
      icon: FileCode,
      color: "text-cyan-600",
      bgTint: "bg-cyan-500/8",
      darkColor: "dark:text-cyan-400",
      darkBgTint: "dark:bg-cyan-500/10",
    };
  }

  // Default — muted gray
  return {
    icon: File,
    color: "text-muted-foreground",
    bgTint: "bg-muted/30",
    darkColor: "dark:text-muted-foreground",
    darkBgTint: "dark:bg-muted/30",
  };
}
```

Import icons from lucide-react: `File`, `FileText`, `FileSpreadsheet`, `FileImage`, `FileArchive`, `FileCode`.

### Apply to AttachmentPreview chip

Update the chip rendering in `AttachmentPreview.tsx`:

```tsx
const isImage = fileType?.startsWith("image/");
const style = getFileTypeStyle(fileType, fileName);
const IconComponent = style.icon;

// For non-image files (or image files where thumbnail failed to load):
<div
  className={cn(
    "inline-flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2 cursor-pointer rq-transition group",
    style.bgTint,
    style.darkBgTint,
    compact && "px-2 py-1.5"
  )}
  onClick={handleClick}
>
  <IconComponent
    className={cn("h-4 w-4 flex-shrink-0", style.color, style.darkColor, compact && "h-3.5 w-3.5")}
    strokeWidth={1.5}
  />
  <span className="text-xs font-medium text-foreground truncate max-w-[200px]">
    {fileName}
  </span>
  <span className="text-[11px] text-muted-foreground">·</span>
  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
    {formatFileSize(fileSize)}
  </span>
  {onRemove && (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onRemove(); }}
      className="h-4 w-4 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 rq-transition ml-1"
    >
      <X className="h-3 w-3" />
    </button>
  )}
</div>
```

This gives:
- **Excel files:** green-tinted chip with green FileSpreadsheet icon
- **PDFs:** red-tinted chip with red FileText icon
- **Word docs:** blue-tinted chip with blue FileText icon
- **Images (fallback):** violet-tinted chip (when thumbnail can't load)
- **Archives:** amber-tinted chip
- **Default:** subtle gray chip

### AttachmentPreview decision tree

```
Is it an image?
  ├── YES: Has storagePath (uploaded)?
  │     ├── YES → Render inline thumbnail (signed URL)
  │     └── NO (staged) → Has preview data URL?
  │           ├── YES → Render inline thumbnail (data URL)
  │           └── NO → Render color-coded chip (violet)
  └── NO → Render color-coded chip (color based on file type)
```

---

## Part 3: AttachmentList layout update

When displaying a mix of thumbnails and chips, the layout needs to handle both:

```tsx
// In AttachmentList.tsx:
<div className={cn(
  "mt-2",
  compact ? "flex flex-wrap gap-2" : "flex flex-col gap-2"
)}>
  {attachments.map(a => (
    <AttachmentPreview key={a.id} ... />
  ))}
</div>
```

Thumbnails and chips mix naturally in a flex-wrap layout. Thumbnails are block-level (wider) and chips are inline. Both work in `flex flex-wrap`.

---

## Files to Modify

| File | Change |
|------|--------|
| `components/shared/attachments/AttachmentPreview.tsx` | Major: add thumbnail rendering for images, color-coded chips for non-images, signed URL loading |
| `components/shared/attachments/file-type-colors.ts` | **New file:** `getFileTypeStyle()` helper |
| `components/shared/attachments/AttachmentList.tsx` | Minor: layout tweak for mixed thumbnails + chips |
| `components/shared/attachments/useAttachmentUpload.ts` | Add `preview` field to `StagedFile`, generate data URLs for staged images |
| `components/shared/attachments/index.ts` | Export `getFileTypeStyle` from new file |

## Files NOT to Modify

- `NoteCard.tsx` — already uses `<AttachmentList compact />`, will pick up changes automatically
- `NoteComposer.tsx` — already uses `<AttachmentPreview>` for staged files, will pick up changes automatically
- `ImagePreviewOverlay.tsx` — no changes needed, still used for full-screen view on thumbnail click
- `UnifiedNotes/index.tsx` — no changes
- `globals.css` — no new classes needed

## Constraints

- Use `createClient()` from `@/lib/supabase/client` for signed URLs (client-side)
- Signed URL expiry: 3600 seconds (1 hour), consistent with existing patterns
- Use `formatFileSize()` from `@/lib/document-upload-utils.ts` for file size display
- All colors must work in both light and dark mode (use Tailwind `dark:` variants)
- Thumbnails must lazy-load (`loading="lazy"` on img tags)
- Handle image load errors gracefully (fall back to color-coded chip if image fails)
- Do NOT use raw hex colors; use Tailwind's built-in color palette (emerald, red, blue, violet, amber, cyan)
- The tint opacity should be very subtle: `bg-{color}-500/8` in light mode, `bg-{color}-500/10` in dark mode
- Run `pnpm build` after all changes

## Success Criteria

1. Image attachments in posted notes render as clickable inline thumbnails (not chips)
2. Clicking a thumbnail opens the ImagePreviewOverlay (same as before, just the trigger element changed)
3. Staged image files in the composer show thumbnail previews with a remove X button
4. Excel/CSV files show a green-tinted chip with green FileSpreadsheet icon
5. PDF files show a red-tinted chip with red FileText icon
6. Word docs show a blue-tinted chip with blue FileText icon
7. Unknown/default files show a neutral gray chip
8. File names, sizes, and click-to-download/preview all still work
9. Both light and dark mode render correctly
10. No TypeScript errors on `pnpm build`
