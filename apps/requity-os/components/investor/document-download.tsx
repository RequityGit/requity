"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface DocumentDownloadProps {
  filePath: string;
  bucket?: string;
  fileName: string;
}

export function DocumentDownload({
  filePath,
  bucket = "investor-documents",
  fileName,
}: DocumentDownloadProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 60); // 60 seconds expiry

      if (error) {
        console.error("Failed to create signed URL:", error.message);
        return;
      }

      if (data?.signedUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement("a");
        link.href = data.signedUrl;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
      className="text-foreground hover:text-foreground/80"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span className="ml-1.5 sr-only sm:not-sr-only">Download</span>
    </Button>
  );
}
