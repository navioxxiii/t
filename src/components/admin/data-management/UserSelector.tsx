/**
 * User Selector Component
 * Searchable dropdown for selecting users
 */

'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface User {
  id: string;
  email: string;
  full_name?: string;
  balance: string;
}

interface UserSelectorProps {
  value: string;
  onValueChange: (userId: string) => void;
  placeholder?: string;
}

export function UserSelector({ value, onValueChange, placeholder = 'Select user...' }: UserSelectorProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users?pageSize=100&globalFilter=${search}`);
      const data = await response.json();
      if (response.ok) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find((user) => user.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedUser ? (
            <span className="flex items-center gap-2">
              <span className="font-medium">{selectedUser.email}</span>
              {selectedUser.full_name && (
                <span className="text-text-tertiary text-sm">({selectedUser.full_name})</span>
              )}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput
            placeholder="Search users..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              'No users found.'
            )}
          </CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {users.map((user) => (
              <CommandItem
                key={user.id}
                value={user.id}
                onSelect={(currentValue) => {
                  onValueChange(currentValue === value ? '' : currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === user.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex-1">
                  <div className="font-medium">{user.email}</div>
                  {user.full_name && (
                    <div className="text-xs text-text-tertiary">{user.full_name}</div>
                  )}
                </div>
                <div className="text-sm text-text-secondary">
                  ${parseFloat(user.balance).toFixed(2)}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
