"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ProfilePhotoUploadProps {
  userId: string;
  avatarUrl: string | null;
  fullName: string;
  onAvatarChange?: (url: string | null) => void;
}

function getInitials(name: string): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfilePhotoUpload({
  userId,
  avatarUrl,
  fullName,
  onAvatarChange,
}: ProfilePhotoUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(avatarUrl);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input so the same file can be re-selected
      e.target.value = "";

      // Validate file type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPEG, PNG, or WebP image.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);
      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const filePath = `${userId}/avatar.${ext}`;

        // Remove old avatar files with different extensions before uploading
        const { data: existingFiles } = await supabase.storage
          .from("profile-photos")
          .list(userId);

        if (existingFiles?.length) {
          const filesToRemove = existingFiles
            .filter((f) => f.name.startsWith("avatar."))
            .map((f) => `${userId}/${f.name}`);
          if (filesToRemove.length > 0) {
            await supabase.storage
              .from("profile-photos")
              .remove(filesToRemove);
          }
        }

        // Upload new file
        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("profile-photos").getPublicUrl(filePath);

        // Add cache-busting param so the browser loads the new image
        const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

        // Update profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: urlWithCacheBust })
          .eq("id", userId);

        if (updateError) {
          throw updateError;
        }

        setCurrentUrl(urlWithCacheBust);
        onAvatarChange?.(urlWithCacheBust);

        toast({
          title: "Photo updated",
          description: "Your profile photo has been updated successfully.",
        });
      } catch (err: unknown) {
        console.error("Photo upload failed:", err);

        let description = "Could not upload your photo. Please try again.";

        if (err && typeof err === "object" && "message" in err) {
          const msg = (err as { message: string }).message.toLowerCase();
          if (
            msg.includes("payload too large") ||
            msg.includes("file size") ||
            msg.includes("too large") ||
            msg.includes("exceeded") ||
            msg.includes("413")
          ) {
            description =
              "The file exceeds the maximum allowed size. Please upload an image under 5MB (JPEG, PNG, or WebP).";
          } else if (
            msg.includes("mime") ||
            msg.includes("content type") ||
            msg.includes("not allowed") ||
            msg.includes("invalid type")
          ) {
            description =
              "This file type is not supported. Please upload a JPEG, PNG, or WebP image (max 5MB).";
          } else if (
            msg.includes("not found") ||
            msg.includes("bucket")
          ) {
            description =
              "Photo storage is not configured. Please contact support.";
          } else if (
            msg.includes("permission") ||
            msg.includes("policy") ||
            msg.includes("unauthorized") ||
            msg.includes("403")
          ) {
            description =
              "You don't have permission to upload photos. Please contact support.";
          } else {
            description = `Upload failed: ${(err as { message: string }).message}. Accepted formats: JPEG, PNG, or WebP (max 5MB).`;
          }
        } else {
          description =
            "Could not upload your photo. Please ensure your image is a JPEG, PNG, or WebP file under 5MB and try again.";
        }

        toast({
          title: "Upload failed",
          description,
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    },
    [userId, toast, onAvatarChange]
  );

  const handleRemove = useCallback(async () => {
    setUploading(true);
    try {
      const supabase = createClient();

      // List and remove all avatar files
      const { data: existingFiles } = await supabase.storage
        .from("profile-photos")
        .list(userId);

      if (existingFiles?.length) {
        const filesToRemove = existingFiles
          .filter((f) => f.name.startsWith("avatar."))
          .map((f) => `${userId}/${f.name}`);
        if (filesToRemove.length > 0) {
          await supabase.storage
            .from("profile-photos")
            .remove(filesToRemove);
        }
      }

      // Clear avatar_url on profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      setCurrentUrl(null);
      onAvatarChange?.(null);

      toast({
        title: "Photo removed",
        description: "Your profile photo has been removed.",
      });
    } catch (err) {
      console.error("Photo removal failed:", err);
      toast({
        title: "Removal failed",
        description: "Could not remove your photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [userId, toast, onAvatarChange]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar with hover overlay */}
      <div className="relative group">
        <Avatar
          className={cn(
            "h-24 w-24 cursor-pointer ring-2 ring-slate-200 ring-offset-2 transition-all",
            uploading && "opacity-50"
          )}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {currentUrl && (
            <AvatarImage
              src={currentUrl}
              alt={fullName || "Profile photo"}
              className="object-cover"
            />
          )}
          <AvatarFallback className="bg-[#1a2b4a] text-white text-xl font-medium">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>

        {/* Hover overlay */}
        {!uploading && (
          <div
            className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-5 w-5 text-white" />
            <span className="text-[10px] text-white mt-0.5 font-medium">
              Change
            </span>
          </div>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-xs text-[#1a2b4a] hover:underline font-medium disabled:opacity-50"
        >
          {currentUrl ? "Change photo" : "Upload photo"}
        </button>
        {currentUrl && (
          <>
            <span className="text-xs text-muted-foreground">·</span>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="text-xs text-red-600 hover:underline font-medium disabled:opacity-50 flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          </>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        JPG, PNG, or WebP. Max 5MB.
      </p>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
