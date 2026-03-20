// ═══════════════════════════════════════════════════════════════
// STYLED DOCUMENT LAYOUT SCHEMA
// The contract between the database JSON and the renderer.
// ═══════════════════════════════════════════════════════════════

export interface StyledLayout {
  header: LayoutHeader;
  title_banner: LayoutTitleBanner;
  sections: SectionBlock[];
  disclaimer?: LayoutDisclaimer;
  footer: LayoutFooter;
}

export interface LayoutHeader {
  entity: string;
  subtitle?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  show_logo?: boolean;
}

export interface LayoutTitleBanner {
  title: string;
  subtitle?: string;
  date_field?: string;
  expiration_field?: string;
}

export type SectionBlock =
  | TermTableSection
  | BulletListSection
  | ParagraphSection
  | SignatureSection
  | DividerSection;

export interface TermTableSection {
  type: "term_table";
  title: string;
  rows: TermRow[];
}

export interface TermRow {
  label: string;
  field?: string;
  value?: string;
  format?: "currency" | "percentage" | "date" | "number";
  highlight?: boolean;
  suffix?: string;
}

export interface BulletListSection {
  type: "bullet_list";
  title: string;
  items: string[];
  field?: string;
}

export interface ParagraphSection {
  type: "paragraph";
  title?: string;
  text: string;
}

export interface SignatureSection {
  type: "signature";
  title?: string;
  blocks: SignatureBlock[];
}

export interface SignatureBlock {
  role: string;
  name_field?: string;
  title_field?: string;
  show_date_line?: boolean;
}

export interface DividerSection {
  type: "divider";
  style?: "line" | "space";
}

export interface LayoutDisclaimer {
  label?: string;
  text: string;
}

export interface LayoutFooter {
  entity: string;
  nmls?: string;
  confidential?: boolean;
  generated_by?: string;
}

export interface MergeFieldDefinition {
  key: string;
  label: string;
  column: string;
  source: string;
  format?: string | null;
}
