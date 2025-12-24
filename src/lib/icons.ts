import {
  Shield,
  Zap,
  Network,
  Smartphone,
  Vault,
  TrendingUp,
  Lock,
  KeyRound,
  FileCheck,
  Apple,
  Globe,
  Monitor,
  Download,
  Fingerprint,
  Key,
  CircleDot,
  type LucideIcon,
} from 'lucide-react'

/**
 * Centralized icon map for branding config references.
 * Add new icons here as needed - components will use fallback if not found.
 */
export const iconMap: Record<string, LucideIcon> = {
  Shield,
  Zap,
  Network,
  Smartphone,
  Vault,
  TrendingUp,
  Lock,
  Key: KeyRound,
  KeyRound,
  FileCheck,
  Apple,
  Globe,
  Monitor,
  Download,
  Fingerprint,
}

/**
 * Get an icon by name with fallback to prevent crashes.
 * @param name - Icon name from branding config
 * @returns The icon component or a fallback
 */
export function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? CircleDot
}
