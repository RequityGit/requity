import type { LucideIcon } from "lucide-react";
import {
  FileText,
  User,
  Shield,
  Landmark,
  TrendingUp,
  Building2,
  Contact,
  Zap,
  Users,
  Link,
  MessageCircle,
  Info,
  MapPin,
  Target,
  CreditCard,
  Layers,
  Database,
  Calculator,
  DollarSign,
} from "lucide-react";

const SECTION_ICON_MAP: Record<string, LucideIcon> = {
  "file-text": FileText,
  "user-circle": User,
  user: User,
  shield: Shield,
  landmark: Landmark,
  "trending-up": TrendingUp,
  "building-2": Building2,
  contact: Contact,
  zap: Zap,
  users: Users,
  link: Link,
  "message-circle": MessageCircle,
  info: Info,
  "map-pin": MapPin,
  target: Target,
  "credit-card": CreditCard,
  layers: Layers,
  database: Database,
  calculator: Calculator,
  "dollar-sign": DollarSign,
};

export function getSectionIcon(iconName: string): LucideIcon {
  return SECTION_ICON_MAP[iconName] || FileText;
}
