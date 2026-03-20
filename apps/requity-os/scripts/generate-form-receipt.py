#!/usr/bin/env python3
"""
Generate a PDF receipt for a signed form submission.
Called from Next.js API route with JSON input via stdin.

Input (JSON on stdin):
{
  "form_name": "Environmental Site Form",
  "submission_id": "uuid",
  "submitted_at": "2026-03-20T15:48:05Z",
  "signer_name": "John Doe",
  "signer_email": "john@example.com",
  "signer_role": "Buyer / Borrower",
  "deal_name": "John Doe - 123 Main St",
  "signature_audit": { ip_address, user_agent, data_hash, ... },
  "form_data": { field_id: value, ... },
  "steps": [ { title, fields: [ { id, label, type } ] } ],
  "output_path": "/tmp/receipt.pdf"
}

Output: PDF file at output_path
"""

import json
import sys
import os
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, PageBreak
)
from reportlab.lib import colors
import base64
from io import BytesIO

# Brand colors
REQUITY_DARK = HexColor("#0f172a")
REQUITY_PRIMARY = HexColor("#3b82f6")
REQUITY_MUTED = HexColor("#64748b")
REQUITY_BORDER = HexColor("#e2e8f0")
REQUITY_BG = HexColor("#f8fafc")
WHITE = colors.white


def create_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        "FormTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=18,
        textColor=REQUITY_DARK,
        spaceAfter=4,
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        "FormSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=REQUITY_MUTED,
        spaceAfter=16,
    ))
    styles.add(ParagraphStyle(
        "SectionTitle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=REQUITY_DARK,
        spaceBefore=16,
        spaceAfter=8,
        borderPadding=(0, 0, 4, 0),
    ))
    styles.add(ParagraphStyle(
        "FieldLabel",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        textColor=REQUITY_MUTED,
        spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        "FieldValue",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=REQUITY_DARK,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        "AuditLabel",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7,
        textColor=REQUITY_MUTED,
    ))
    styles.add(ParagraphStyle(
        "AuditValue",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        textColor=REQUITY_DARK,
    ))
    styles.add(ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        textColor=REQUITY_MUTED,
        spaceBefore=8,
        spaceAfter=8,
        leading=11,
    ))
    styles.add(ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7,
        textColor=REQUITY_MUTED,
        alignment=TA_CENTER,
    ))
    return styles


def format_value(value, field_type="text"):
    """Format a field value for display."""
    if value is None or value == "":
        return "-"
    if isinstance(value, bool):
        return "Yes" if value else "No"
    if isinstance(value, dict):
        # Signature field - skip (handled separately)
        if "data_url" in value:
            return "[Signature - see below]"
        return str(value)
    if isinstance(value, list):
        return ", ".join(str(v) for v in value)
    val = str(value)
    if val.lower() in ("yes", "no"):
        return val.capitalize()
    return val


def add_header(story, styles, data):
    """Add document header with Requity branding."""
    # Title row
    story.append(Paragraph("REQUITY GROUP", ParagraphStyle(
        "Brand",
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=REQUITY_PRIMARY,
        spaceAfter=2,
    )))
    story.append(Paragraph(
        f"{data['form_name']} - Signed Receipt",
        styles["FormTitle"]
    ))

    # Submission metadata line
    submitted_at = data.get("submitted_at", "")
    if submitted_at:
        try:
            dt = datetime.fromisoformat(submitted_at.replace("Z", "+00:00"))
            submitted_at = dt.strftime("%B %d, %Y at %I:%M %p UTC")
        except Exception:
            pass

    meta_parts = []
    if data.get("deal_name"):
        meta_parts.append(f"Deal: {data['deal_name']}")
    if submitted_at:
        meta_parts.append(f"Submitted: {submitted_at}")
    meta_parts.append(f"ID: {data.get('submission_id', 'N/A')}")

    story.append(Paragraph(" | ".join(meta_parts), styles["FormSubtitle"]))
    story.append(HRFlowable(
        width="100%", thickness=1, color=REQUITY_BORDER,
        spaceAfter=12, spaceBefore=4
    ))


def add_form_responses(story, styles, data):
    """Add all form responses organized by step."""
    form_data = data.get("form_data", {})
    steps = data.get("steps", [])

    for step in steps:
        title = step.get("title", "Untitled Section")
        fields = step.get("fields", [])

        # Skip steps with no answered fields
        answered_fields = [
            f for f in fields
            if f.get("id") in form_data
            and form_data[f["id"]] is not None
            and form_data[f["id"]] != ""
            and f.get("type") != "custom"  # Skip signature fields here
        ]

        if not answered_fields:
            continue

        section_items = []
        section_items.append(Paragraph(title, styles["SectionTitle"]))
        section_items.append(HRFlowable(
            width="100%", thickness=0.5, color=REQUITY_BORDER,
            spaceAfter=8
        ))

        for field in answered_fields:
            field_id = field["id"]
            label = field.get("label") or field_id
            value = form_data.get(field_id, "")
            field_type = field.get("type", "text")

            # Truncate very long labels for display
            if len(label) > 200:
                label = label[:200] + "..."

            formatted = format_value(value, field_type)

            section_items.append(Paragraph(label, styles["FieldLabel"]))
            section_items.append(Paragraph(formatted, styles["FieldValue"]))

        story.append(KeepTogether(section_items[:6]))  # Keep at least first few together
        if len(section_items) > 6:
            for item in section_items[6:]:
                story.append(item)


def add_signature_section(story, styles, data):
    """Add signature image and audit trail."""
    form_data = data.get("form_data", {})
    audit = data.get("signature_audit", {})

    # Find signature fields
    signature_fields = {}
    for key, val in form_data.items():
        if isinstance(val, dict) and "data_url" in val:
            signature_fields[key] = val

    if not signature_fields:
        return

    story.append(Spacer(1, 16))
    story.append(HRFlowable(
        width="100%", thickness=1.5, color=REQUITY_PRIMARY,
        spaceAfter=12
    ))
    story.append(Paragraph("Electronic Signature", styles["SectionTitle"]))

    # Disclaimer from the signature field config
    steps = data.get("steps", [])
    for step in steps:
        for field in step.get("fields", []):
            if field.get("component_type") == "signature":
                config = field.get("component_config", {})
                disclaimer = config.get("disclaimer", "")
                if disclaimer:
                    story.append(Paragraph(disclaimer, styles["Disclaimer"]))
                break

    # Render each signature
    for field_id, sig_data in signature_fields.items():
        mode = sig_data.get("mode", "unknown")
        typed_name = sig_data.get("typed_name", "")
        data_url = sig_data.get("data_url", "")
        timestamp = sig_data.get("timestamp", "")

        # Try to render the signature image from base64
        if data_url and data_url.startswith("data:image"):
            try:
                # Extract base64 data
                b64_data = data_url.split(",", 1)[1]
                img_bytes = base64.b64decode(b64_data)

                from reportlab.platypus import Image
                img_buffer = BytesIO(img_bytes)
                img = Image(img_buffer, width=3 * inch, height=1.2 * inch)
                img.hAlign = "LEFT"
                story.append(img)
            except Exception:
                if typed_name:
                    story.append(Paragraph(
                        f"<i>{typed_name}</i>",
                        ParagraphStyle(
                            "TypedSig",
                            fontName="Times-Italic",
                            fontSize=24,
                            textColor=REQUITY_DARK,
                            spaceBefore=8,
                            spaceAfter=8,
                        )
                    ))
        elif typed_name:
            story.append(Paragraph(
                f"<i>{typed_name}</i>",
                ParagraphStyle(
                    "TypedSig",
                    fontName="Times-Italic",
                    fontSize=24,
                    textColor=REQUITY_DARK,
                    spaceBefore=8,
                    spaceAfter=8,
                )
            ))

        # Signature line
        story.append(HRFlowable(
            width="50%", thickness=0.5, color=REQUITY_DARK,
            spaceAfter=4
        ))

        sig_label_parts = []
        if data.get("signer_name"):
            sig_label_parts.append(data["signer_name"])
        if data.get("signer_role"):
            sig_label_parts.append(f"({data['signer_role']})")
        if timestamp:
            try:
                dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                sig_label_parts.append(f"- {dt.strftime('%B %d, %Y at %I:%M %p UTC')}")
            except Exception:
                sig_label_parts.append(f"- {timestamp}")

        story.append(Paragraph(
            " ".join(sig_label_parts),
            styles["AuditValue"]
        ))
        story.append(Paragraph(
            f"Method: {'Typed' if mode == 'type' else 'Hand-drawn'}",
            styles["AuditLabel"]
        ))

    # Audit trail section
    story.append(Spacer(1, 16))
    story.append(Paragraph("Signature Verification Details", ParagraphStyle(
        "AuditTitle",
        fontName="Helvetica-Bold",
        fontSize=9,
        textColor=REQUITY_DARK,
        spaceBefore=8,
        spaceAfter=6,
    )))

    audit_rows = []
    if audit.get("ip_address"):
        audit_rows.append(["IP Address", audit["ip_address"]])
    if audit.get("user_agent"):
        ua = audit["user_agent"]
        if len(ua) > 80:
            ua = ua[:80] + "..."
        audit_rows.append(["User Agent", ua])
    if audit.get("submitted_at"):
        audit_rows.append(["Timestamp (UTC)", audit["submitted_at"]])
    if audit.get("data_hash"):
        audit_rows.append(["Data Integrity Hash", audit["data_hash"][:32] + "..."])
    if audit.get("hash_algorithm"):
        audit_rows.append(["Hash Algorithm", audit["hash_algorithm"].upper()])
    audit_rows.append(["E-Sign Consent", "Yes" if audit.get("esign_consent") else "No"])

    if audit_rows:
        # Build table
        table_data = []
        for label, value in audit_rows:
            table_data.append([
                Paragraph(label, styles["AuditLabel"]),
                Paragraph(str(value), styles["AuditValue"]),
            ])

        t = Table(table_data, colWidths=[1.5 * inch, 5 * inch])
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("LINEBELOW", (0, 0), (-1, -1), 0.25, REQUITY_BORDER),
            ("BACKGROUND", (0, 0), (-1, -1), REQUITY_BG),
        ]))
        story.append(t)


def add_footer_info(story, styles, data):
    """Add legal footer."""
    story.append(Spacer(1, 24))
    story.append(HRFlowable(
        width="100%", thickness=0.5, color=REQUITY_BORDER,
        spaceAfter=8
    ))
    story.append(Paragraph(
        "This document was electronically generated by Requity Group's form engine. "
        "The electronic signature above was executed in compliance with the Electronic Signatures in "
        "Global and National Commerce Act (ESIGN Act) and the Uniform Electronic Transactions Act (UETA). "
        "The data integrity hash verifies that no modifications have been made to the form data after signing.",
        styles["Disclaimer"]
    ))
    story.append(Paragraph(
        f"Requity Group | app.requitygroup.com | Generated {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        styles["Footer"]
    ))


def generate_receipt(data, output_path):
    """Generate the complete PDF receipt."""
    styles = create_styles()

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        title=f"{data['form_name']} - Signed Receipt",
        author="Requity Group",
        subject=f"Form submission receipt - {data.get('submission_id', '')}",
    )

    story = []

    add_header(story, styles, data)
    add_form_responses(story, styles, data)
    add_signature_section(story, styles, data)
    add_footer_info(story, styles, data)

    doc.build(story)
    return output_path


def main():
    # Read JSON from stdin
    input_data = json.loads(sys.stdin.read())
    output_path = input_data.get("output_path", "/tmp/form-receipt.pdf")

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    generate_receipt(input_data, output_path)

    # Output the path for the calling process
    result = {"success": True, "path": output_path}
    print(json.dumps(result))


if __name__ == "__main__":
    main()
