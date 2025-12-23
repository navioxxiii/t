/**
 * Category Icon Component
 * Returns icon for each support ticket category
 */

import {
  User,
  Receipt,
  IdCard,
  Ban,
  Settings,
  Users,
  TrendingUp,
  HelpCircle,
} from 'lucide-react';

interface CategoryIconProps {
  category: string;
  className?: string;
}

export function CategoryIcon({ category, className = 'w-5 h-5' }: CategoryIconProps) {
  switch (category) {
    case 'account':
      return <User className={className} />;
    case 'transaction':
      return <Receipt className={className} />;
    case 'kyc':
      return <IdCard className={className} />;
    case 'ban_appeal':
      return <Ban className={className} />;
    case 'technical':
      return <Settings className={className} />;
    case 'copy-trading':
      return <Users className={className} />;
    case 'earn-package':
      return <TrendingUp className={className} />;
    case 'other':
    default:
      return <HelpCircle className={className} />;
  }
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    account: 'Account Issues',
    transaction: 'Transaction Issues',
    kyc: 'KYC Verification',
    ban_appeal: 'Ban Appeal',
    technical: 'Technical Support',
    'copy-trading': 'Copy Trading',
    'earn-package': 'Earn Package',
    other: 'Other',
  };
  return labels[category] || category;
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    account: 'text-blue-500',
    transaction: 'text-green-500',
    kyc: 'text-purple-500',
    ban_appeal: 'text-red-500',
    technical: 'text-orange-500',
    'copy-trading': 'text-cyan-500',
    'earn-package': 'text-yellow-500',
    other: 'text-gray-500',
  };
  return colors[category] || 'text-gray-500';
}
