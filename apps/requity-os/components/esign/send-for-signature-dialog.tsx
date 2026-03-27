"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Send, Loader2, PenTool } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import {
  sendForSignature,
  sendGeneratedForSignature,
  sendWithDocusealTemplate,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/esign-actions";
import { DocusealBuilderEmbed } from "@/components/esign/docuseal-builder-embed";
import type { EsignSignerRole } from "@/lib/esign/esign-types";

const signerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  role: z.enum(["signer", "co-signer", "guarantor", "approver", "witness"]),
  contactId: z.number().nullable().optional(),
  signOrder: z.number().optional(),
});

const formSchema = z.object({
  signers: z.array(signerSchema).min(1, "At least one signer is required"),
  message: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SendForSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: number;
  documentName: string;
  templateId?: number;
  pdfBase64?: string;
  defaultSigners?: {
    name: string;
    email: string;
    role: EsignSignerRole;
    contactId?: number | null;
  }[];
  onSent?: (submissionId: number) => void;
}

export function SendForSignatureDialog({
  open,
  onOpenChange,
  dealId,
  documentName,
  templateId,
  pdfBase64,
  defaultSigners,
  onSent,
}: SendForSignatureDialogProps) {
  const [sending, setSending] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [adhocTemplateId, setAdhocTemplateId] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      signers: defaultSigners?.length
        ? defaultSigners.map((s) => ({
            name: s.name,
            email: s.email,
            role: s.role,
            contactId: s.contactId ?? null,
            signOrder: 1,
          }))
        : [{ name: "", email: "", role: "signer" as const, contactId: null, signOrder: 1 }],
      message: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "signers",
  });

  async function onSubmit(values: FormValues) {
    setSending(true);

    try {
      let result: { submissionId?: number; error?: string };

      const signers = values.signers as {
        name: string;
        email: string;
        role: EsignSignerRole;
        contactId?: number | null;
        signOrder?: number;
      }[];

      if (templateId) {
        // Pre-registered esign_templates record
        result = await sendForSignature(
          dealId,
          documentName,
          templateId,
          signers,
          values.message
        );
      } else if (adhocTemplateId) {
        // Ad-hoc: user placed fields via builder, use the DocuSeal template directly
        result = await sendWithDocusealTemplate(
          dealId,
          documentName,
          adhocTemplateId,
          signers,
          values.message
        );
      } else if (pdfBase64) {
        result = await sendGeneratedForSignature(
          dealId,
          documentName,
          pdfBase64,
          signers,
          values.message
        );
      } else {
        showError("Could not send for signature", "No document or template provided");
        setSending(false);
        return;
      }

      if (result.error) {
        showError("Could not send for signature", result.error);
      } else {
        showSuccess("Document sent for signature");
        onSent?.(result.submissionId!);
        onOpenChange(false);
      }
    } catch (err) {
      showError(
        "Could not send for signature",
        err instanceof Error ? err.message : "Unexpected error"
      );
    } finally {
      setSending(false);
    }
  }

  // Ad-hoc builder: shown when user wants to place fields on a non-template doc
  if (showBuilder) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Place Signing Fields</DialogTitle>
            <DialogDescription>
              Drag signature, date, and initials fields onto the document, then
              save to continue sending.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-auto">
            <DocusealBuilderEmbed
              templateName={documentName}
              onSave={(detail) => {
                setAdhocTemplateId(detail.id);
                setShowBuilder(false);
                showSuccess("Signing fields saved");
              }}
              className="w-full h-full min-h-[600px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBuilder(false)}>
              Back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send for Signature</DialogTitle>
          <DialogDescription>
            Send &ldquo;{documentName}&rdquo; for e-signature.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Ad-hoc builder option for non-template docs */}
            {!templateId && pdfBase64 && (
              <div className="rounded-lg border border-border p-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    {adhocTemplateId
                      ? "Signing fields configured"
                      : "Place signing fields?"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {adhocTemplateId
                      ? "Fields will be pre-positioned on the document."
                      : "Optionally place signature, date, and initials fields before sending."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={adhocTemplateId ? "ghost" : "outline"}
                  size="sm"
                  onClick={() => setShowBuilder(true)}
                >
                  <PenTool className="h-3 w-3 mr-1" />
                  {adhocTemplateId ? "Edit Fields" : "Place Fields"}
                </Button>
              </div>
            )}

            {/* Signers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Signers</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    append({
                      name: "",
                      email: "",
                      role: "signer",
                      contactId: null,
                      signOrder: fields.length + 1,
                    })
                  }
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Signer
                </Button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border border-border p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Signer {index + 1}
                    </span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="h-6 w-6 p-0 ml-auto text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name={`signers.${index}.name`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`signers.${index}.email`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="email@example.com"
                              type="email"
                              {...f}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`signers.${index}.role`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Role</FormLabel>
                        <Select
                          onValueChange={f.onChange}
                          defaultValue={f.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="signer">Signer</SelectItem>
                            <SelectItem value="co-signer">Co-Signer</SelectItem>
                            <SelectItem value="guarantor">Guarantor</SelectItem>
                            <SelectItem value="approver">Approver</SelectItem>
                            <SelectItem value="witness">Witness</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Message (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a message to include in the signing request email..."
                      rows={3}
                      {...f}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send for Signature
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
