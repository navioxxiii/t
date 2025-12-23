/**
 * Vault Actions Menu
 * Dropdown menu for vault actions (View, Edit, Toggle Visibility)
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Info } from 'lucide-react';

interface Vault {
  id: string;
  title: string;
  status: string;
}

interface VaultActionsMenuProps {
  vault: Vault;
  onViewDetails: () => void;
  onToggleVisibility: () => void;
  onEdit: () => void;
}

export function VaultActionsMenu({
  onViewDetails,
  onToggleVisibility,
  onEdit,
}: VaultActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onViewDetails}>
          <Info className="h-4 w-4 mr-2" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onToggleVisibility}>
          <Eye className="h-4 w-4 mr-2" />
          Toggle Visibility
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Vault
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
