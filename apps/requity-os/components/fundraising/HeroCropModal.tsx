"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { cropAndResizeImage } from "@/lib/crop-image";

interface HeroCropModalProps {
  open: boolean;
  imageSrc: string | null;
  onCropComplete: (file: File) => void;
  onCancel: () => void;
}

export function HeroCropModal({
  open,
  imageSrc,
  onCropComplete,
  onCancel,
}: HeroCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      setCroppedArea(croppedAreaPixels);
    },
    []
  );

  const handleConfirm = async () => {
    if (!imageSrc || !croppedArea) return;
    setProcessing(true);
    try {
      const file = await cropAndResizeImage(imageSrc, croppedArea);
      onCropComplete(file);
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle>Crop Hero Image</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Adjust the crop area to frame the image. Output: 1200 x 675px (16:9).
          </p>
        </DialogHeader>

        <div className="relative w-full h-[340px] bg-black/90">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropChange}
            />
          )}
        </div>

        <div className="flex items-center justify-center gap-3 px-6 py-3 border-t border-border">
          <ZoomOut className="h-4 w-4 text-muted-foreground" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-48 accent-primary"
          />
          <ZoomIn className="h-4 w-4 text-muted-foreground" />
        </div>

        <DialogFooter className="px-6 pb-6 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={processing}>
            {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Crop &amp; Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
