"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Type, Pen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CustomFieldComponentProps } from "./index";

type SignatureMode = "draw" | "type";

interface SignatureValue {
  mode: SignatureMode;
  data_url: string; // Base64 PNG of the signature
  typed_name?: string; // If typed mode
  timestamp: string; // ISO timestamp of when signature was created
}

export function SignaturePad({ field, value, onChange, error }: CustomFieldComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [mode, setMode] = useState<SignatureMode>("draw");
  const [typedName, setTypedName] = useState("");
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const disclaimer = (field.component_config?.disclaimer as string) || "";
  const existingValue = value as SignatureValue | null;

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = 160 * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = "160px";

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#1a1a1a";
      }
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [mode]);

  // Get canvas coordinates from mouse/touch event
  const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const point = getPoint(e);
    lastPointRef.current = point;

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }
  }, [getPoint]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !lastPointRef.current) return;

    const point = getPoint(e);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
    setHasDrawn(true);
  }, [isDrawing, getPoint]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;

    // Save signature when stroke ends
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      const dataUrl = canvas.toDataURL("image/png");
      const sigValue: SignatureValue = {
        mode: "draw",
        data_url: dataUrl,
        timestamp: new Date().toISOString(),
      };
      onChange(sigValue);
    }
  }, [isDrawing, hasDrawn, onChange]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
    onChange(null);
  }, [onChange]);

  // Generate typed signature as canvas image
  const handleTypedSignature = useCallback((name: string) => {
    setTypedName(name);

    if (!name.trim()) {
      onChange(null);
      return;
    }

    // Create an offscreen canvas to render the typed signature
    const offscreen = document.createElement("canvas");
    offscreen.width = 600;
    offscreen.height = 160;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);

    ctx.font = "italic 42px 'Georgia', 'Times New Roman', serif";
    ctx.fillStyle = "#1a1a1a";
    ctx.textBaseline = "middle";
    ctx.fillText(name, 20, 80);

    const dataUrl = offscreen.toDataURL("image/png");
    const sigValue: SignatureValue = {
      mode: "type",
      data_url: dataUrl,
      typed_name: name,
      timestamp: new Date().toISOString(),
    };
    onChange(sigValue);
  }, [onChange]);

  const switchMode = useCallback((newMode: SignatureMode) => {
    setMode(newMode);
    onChange(null);
    setHasDrawn(false);
    setTypedName("");
  }, [onChange]);

  return (
    <div className="w-full space-y-3">
      {/* Disclaimer */}
      {disclaimer && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {disclaimer}
        </p>
      )}

      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={mode === "draw" ? "default" : "outline"}
          size="sm"
          onClick={() => switchMode("draw")}
        >
          <Pen size={14} strokeWidth={1.5} className="mr-1.5" />
          Draw
        </Button>
        <Button
          type="button"
          variant={mode === "type" ? "default" : "outline"}
          size="sm"
          onClick={() => switchMode("type")}
        >
          <Type size={14} strokeWidth={1.5} className="mr-1.5" />
          Type
        </Button>
      </div>

      {mode === "draw" ? (
        <div ref={containerRef} className="w-full">
          <div
            className={cn(
              "relative rounded-lg border-2 border-dashed bg-white cursor-crosshair",
              error ? "border-destructive" : "border-border",
              hasDrawn && "border-solid border-primary/30"
            )}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="touch-none"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-sm text-muted-foreground/50">Sign here</p>
              </div>
            )}
            {/* Signature line */}
            <div className="absolute bottom-6 left-6 right-6 border-b border-muted-foreground/20" />
          </div>
          {hasDrawn && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearCanvas}
              className="mt-2"
            >
              <Eraser size={14} strokeWidth={1.5} className="mr-1.5" />
              Clear
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            type="text"
            value={typedName}
            onChange={(e) => handleTypedSignature(e.target.value)}
            placeholder="Type your full legal name"
            className={cn(error && "border-destructive")}
          />
          {typedName.trim() && (
            <div className="rounded-lg border bg-white p-4">
              <p
                className="text-3xl text-foreground"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: "italic" }}
              >
                {typedName}
              </p>
              <div className="mt-2 border-b border-muted-foreground/20" />
            </div>
          )}
        </div>
      )}

      {/* Timestamp indicator */}
      {existingValue?.timestamp && (
        <p className="text-xs text-muted-foreground">
          Signed: {new Date(existingValue.timestamp).toLocaleString()}
        </p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
