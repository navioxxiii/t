import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Simple pluralization helper
 * Adds 's' to the end of a word if count !== 1
 */
export function pluralize(word: string, count?: number): string {
  if (count === undefined || count === 1) {
    return word;
  }
  // Handle common irregular plurals
  const irregulars: Record<string, string> = {
    'person': 'people',
    'child': 'children',
    'foot': 'feet',
    'tooth': 'teeth',
    'mouse': 'mice',
  };

  if (irregulars[word.toLowerCase()]) {
    return irregulars[word.toLowerCase()];
  }

  // Handle words ending in 'y'
  if (word.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(word[word.length - 2])) {
    return word.slice(0, -1) + 'ies';
  }

  // Handle words ending in 's', 'ss', 'sh', 'ch', 'x', 'z'
  if (word.match(/(s|ss|sh|ch|x|z)$/)) {
    return word + 'es';
  }

  // Default: just add 's'
  return word + 's';
}

export function getAbsoluteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}${path}`;
}
