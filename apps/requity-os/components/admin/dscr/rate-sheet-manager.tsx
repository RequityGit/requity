"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, Eye, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  createRateSheetUploadAction,
  parseRateSheetAction,
  commitRateSheetAction,
} from "@/app/(authenticated)/(admin)/models/dscr/actions";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { RateSheetReview } from "./rate-sheet-review";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function RateSheetManager({
  lenders,
  products,
  uploads,
}: {
  lenders: any[];
  products: any[];
  uploads: any[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<{ uploadId: string; data: any } | null>(null);

  const [selectedLender, setSelectedLender] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const lenderProducts = products.filter(
    (p: any) => p.lender_id === selectedLender
  );

  async function handleUpload() {
    if (!selectedLender || !file) {
      toast({ title: "Error", description: "Select a lender and file", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const date = effectiveDate || new Date().toISOString().split("T")[0];
      const filePath = `${selectedLender}/${date}_${file.name}`;

      const { error: storageErr } = await supabase.storage
        .from("rate-sheets")
        .upload(filePath, file, { upsert: true });

      if (storageErr) {
        toast({ title: "Error", description: `Upload failed: ${storageErr.message}`, variant: "destructive" });
        return;
      }

      const result = await createRateSheetUploadAction(
        selectedLender,
        selectedProduct || null,
        file.name,
        filePath,
        effectiveDate || null
      );

      if ("error" in result) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }

      toast({ title: "Rate sheet uploaded successfully" });
      setUploadOpen(false);
      setFile(null);
      setSelectedLender("");
      setSelectedProduct("");
      setEffectiveDate("");
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function handleParse(uploadId: string) {
    setParsing(uploadId);
    try {
      const result = await parseRateSheetAction(uploadId);
      if ("error" in result) {
        toast({ title: "Parse Error", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Rate sheet parsed successfully" });
      setReviewData({ uploadId, data: result.parsedData });
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Parse failed", variant: "destructive" });
    } finally {
      setParsing(null);
    }
  }

  function handleReview(upload: any) {
    if (upload.raw_parsed_data) {
      setReviewData({ uploadId: upload.id, data: upload.raw_parsed_data });
    }
  }

  return (
    <>
      {reviewData ? (
        <RateSheetReview
          uploadId={reviewData.uploadId}
          parsedData={reviewData.data}
          products={products}
          onClose={() => {
            setReviewData(null);
            router.refresh();
          }}
        />
      ) : (
        <Tabs defaultValue="current">
          <TabsList>
            <TabsTrigger value="current">Current Rate Sheets</TabsTrigger>
            <TabsTrigger value="history">Upload History</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Rate Sheet
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Rate Sheet PDF</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Lender *</Label>
                      <Select value={selectedLender} onValueChange={setSelectedLender}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lender" />
                        </SelectTrigger>
                        <SelectContent>
                          {lenders.map((l: any) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.name} ({l.short_name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {lenderProducts.length > 0 && (
                      <div>
                        <Label>Product (optional)</Label>
                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                          <SelectTrigger>
                            <SelectValue placeholder="All products" />
                          </SelectTrigger>
                          <SelectContent>
                            {lenderProducts.map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.product_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label>Effective Date</Label>
                      <DatePicker
                        value={effectiveDate}
                        onChange={(value) => setEffectiveDate(value)}
                      />
                    </div>
                    <div>
                      <Label>PDF File *</Label>
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <Button onClick={handleUpload} disabled={uploading} className="w-full">
                      {uploading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Current rate sheet status per lender */}
            {lenders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No lenders configured.{" "}
                    <a href="/models/dscr?tab=lenders" className="text-teal-600 hover:underline">
                      Add lenders first
                    </a>
                    .
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {lenders.map((l: any) => {
                  const lProducts = products.filter((p: any) => p.lender_id === l.id);
                  return (
                    <Card key={l.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{l.name}</h3>
                            <div className="mt-2 space-y-1">
                              {lProducts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No products configured</p>
                              ) : (
                                lProducts.map((p: any) => {
                                  const isStale = p.rate_sheet_date &&
                                    (Date.now() - new Date(p.rate_sheet_date).getTime()) > 86400000;
                                  return (
                                    <div key={p.id} className="flex items-center gap-2 text-sm">
                                      <span>{p.product_name}</span>
                                      {p.rate_sheet_date ? (
                                        <Badge variant={isStale ? "destructive" : "default"} className="text-xs">
                                          {formatDate(p.rate_sheet_date)}
                                          {isStale && " (stale)"}
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-xs">No rate sheet</Badge>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>All Uploads</CardTitle>
              </CardHeader>
              <CardContent>
                {uploads.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No rate sheets uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {uploads.map((u: any) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">
                              {u.dscr_lenders?.short_name || "Unknown"} — {u.file_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Uploaded {formatDate(u.created_at)}
                              {u.effective_date && ` | Effective: ${formatDate(u.effective_date)}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              u.parsing_status === "success" ? "default" :
                              u.parsing_status === "error" ? "destructive" :
                              u.parsing_status === "review_needed" ? "outline" :
                              "secondary"
                            }
                          >
                            {u.parsing_status === "review_needed" ? "Review Needed" : u.parsing_status}
                          </Badge>
                          {u.parsing_status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleParse(u.id)}
                              disabled={parsing === u.id}
                            >
                              {parsing === u.id ? (
                                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Parsing...</>
                              ) : (
                                "Parse"
                              )}
                            </Button>
                          )}
                          {u.parsing_status === "review_needed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReview(u)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}
