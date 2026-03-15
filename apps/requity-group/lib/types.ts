export interface CompanyInfo {
  id: string;
  company_name: string;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  logo_url: string | null;
  investor_login_url: string | null;
  investor_signup_url: string | null;
  founded_year: number | null;
  mission_statement: string | null;
  about_description: string | null;
  social_links: Record<string, string>;
}

export interface SiteStat {
  id: string;
  stat_key: string;
  display_value: string;
  label: string;
  page_slug: string;
  sort_order: number;
}

export interface Testimonial {
  id: string;
  author_name: string;
  rating: number;
  quote: string;
  sort_order: number;
  is_published: boolean;
  is_featured: boolean;
}

export interface SiteValue {
  id: string;
  value_type: string;
  title: string;
  description: string | null;
  icon_identifier: string | null;
  sort_order: number;
}

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  department: string;
  bio: string | null;
  headshot_url: string | null;
  sort_order: number;
}

export interface NavItem {
  id: string;
  menu_location: string;
  label: string;
  url: string;
  sort_order: number;
}

export interface PageSection {
  id: string;
  page_slug: string;
  section_key: string;
  heading: string | null;
  subheading: string | null;
  body_text: string | null;
  cta_text: string | null;
  cta_url: string | null;
  image_url: string | null;
  sort_order: number;
  metadata: Record<string, unknown>;
}

export interface LoanProgram {
  id: string;
  program_key: string;
  display_name: string;
  tagline: string | null;
  description: string | null;
  features: string[];
  sort_order: number;
}

export interface Insight {
  id: string;
  title: string;
  slug: string;
  published_date: string | null;
  excerpt: string | null;
  tags: string[];
  sort_order: number;
}

export interface PortfolioProperty {
  id: string;
  name: string;
  slug: string;
  location: string;
  description: string | null;
  image_url: string | null;
  property_type: string | null;
  status: string;
  detail_page_url: string | null;
  is_published: boolean;
  sort_order: number;
}
