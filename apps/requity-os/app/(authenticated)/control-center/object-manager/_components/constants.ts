import {
  Type,
  FileText,
  Hash,
  DollarSign,
  Percent,
  Calendar,
  Clock,
  ListFilter,
  ToggleLeft,
  Mail,
  Phone,
  Globe,
  Link2,
  Calculator,
  MapPin,
  User,
  type LucideIcon,
} from "lucide-react";

export interface FieldTypeInfo {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const FIELD_TYPES: FieldTypeInfo[] = [
  { key: "text", label: "Text", icon: Type, color: "#8A8A8A" },
  { key: "textarea", label: "Long Text", icon: FileText, color: "#8A8A8A" },
  { key: "number", label: "Number", icon: Hash, color: "#2E6EA6" },
  { key: "currency", label: "Currency", icon: DollarSign, color: "#1B7A44" },
  { key: "percentage", label: "Percentage", icon: Percent, color: "#B8822A" },
  { key: "date", label: "Date", icon: Calendar, color: "#2E6EA6" },
  { key: "datetime", label: "Date & Time", icon: Clock, color: "#2E6EA6" },
  { key: "dropdown", label: "Dropdown", icon: ListFilter, color: "#7C5CFC" },
  { key: "boolean", label: "Toggle", icon: ToggleLeft, color: "#1B7A44" },
  { key: "email", label: "Email", icon: Mail, color: "#2E6EA6" },
  { key: "phone", label: "Phone", icon: Phone, color: "#2E6EA6" },
  { key: "url", label: "URL", icon: Globe, color: "#2E6EA6" },
  { key: "relationship", label: "Relationship", icon: Link2, color: "#7C5CFC" },
  { key: "formula", label: "Formula", icon: Calculator, color: "#B8822A" },
  { key: "address", label: "Address", icon: MapPin, color: "#8A8A8A" },
  { key: "user", label: "User Lookup", icon: User, color: "#7C5CFC" },
];

export function getFieldType(key: string): FieldTypeInfo {
  return FIELD_TYPES.find((ft) => ft.key === key) || FIELD_TYPES[0];
}

// Map object_definitions icon strings to Lucide icon components
import {
  Layers,
  Building2,
  Database,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  layers: Layers,
  user: User,
  "building-2": Building2,
  "map-pin": MapPin,
  database: Database,
  calculator: Calculator,
  "file-text": FileText,
  "dollar-sign": DollarSign,
};

export function getObjectIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Database;
}
