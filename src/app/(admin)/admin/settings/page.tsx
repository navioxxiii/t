import { redirect } from 'next/navigation';

export default function SettingsPage() {
  // Redirect to system settings by default
  redirect('/admin/settings/system');
}
