/**
 * Create Support Ticket Page
 * Handles both authenticated users and guests
 * Public route - accessible without login
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CategoryIcon, getCategoryLabel } from '@/components/support/CategoryIcon';
import { Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CreateTicketPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const isAuthenticated = !!user;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accessLink, setAccessLink] = useState('');

  // Form state
  const [email, setEmail] = useState(profile?.email || '');
  const [name, setName] = useState(profile?.full_name || '');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');

  // Categories available based on auth status
  const categories = isAuthenticated
    ? [
        'account',
        'transaction',
        'kyc',
        'ban_appeal',
        'technical',
        'copy-trading',
        'earn-package',
        'other',
      ]
    : ['technical', 'other']; // Guests can only access these

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate
      if (!subject.trim() || !category || !message.trim()) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (!isAuthenticated && !email.trim()) {
        setError('Email is required');
        setLoading(false);
        return;
      }

      // Call appropriate API
      const endpoint = isAuthenticated
        ? '/api/support/tickets'
        : '/api/support/guest/create';

      const body = isAuthenticated
        ? { subject, category, message }
        : { email, name: name || null, subject, category, message };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create ticket');
      }

      // Success!
      if (isAuthenticated) {
        toast.success('Ticket created successfully!');
        router.push(`/support/${data.ticket.id}`);
      } else {
        // Guest - show success page with access link
        setSuccess(true);
        const link = `${window.location.origin}/support/guest/${data.ticket.access_token}`;
        setAccessLink(link);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Guest Success Page
  if (success && !isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-bg-secondary border-green-500/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-500/10 p-3">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-green-500">Ticket Created!</CardTitle>
                <CardDescription>Save your access link below</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-text-secondary">
              Your support ticket has been created successfully. Save the link below to access your ticket:
            </p>

            <div className="p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary">
              <Label className="text-xs text-text-tertiary mb-2">Access Link</Label>
              <div className="flex gap-2">
                <Input value={accessLink} readOnly className="font-mono text-sm" />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(accessLink);
                    toast.success('Link copied to clipboard!');
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>

            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Important: Save this link! You&apos;ll need it to view and reply to your ticket. We&apos;ve also sent it to your email.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3 pt-4">
              <Link href={accessLink} className="flex-1">
                <Button className="w-full bg-brand-primary hover:bg-brand-primary-light text-bg-primary">
                  View Ticket
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create Ticket Form
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href={isAuthenticated ? '/support' : '/'}>
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-text-primary">Create Support Ticket</h1>
        <p className="text-text-secondary mt-1">
          {isAuthenticated
            ? 'We\'ll get back to you as soon as possible'
            : 'Get help without creating an account'}
        </p>
      </div>

      {/* Form */}
      <Card className="bg-bg-secondary border-bg-tertiary">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Guest Fields */}
            {!isAuthenticated && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-action-red">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                  <p className="text-xs text-text-tertiary">
                    We&apos;ll send updates to this email
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name (Optional)</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
              </>
            )}

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-action-red">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={cat} className="w-4 h-4" />
                        <span>{getCategoryLabel(cat)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">
                Subject <span className="text-action-red">*</span>
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                required
                maxLength={200}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">
                Message <span className="text-action-red">*</span>
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue in detail..."
                rows={6}
                required
              />
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-primary-light text-bg-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Ticket...
                </>
              ) : (
                'Create Ticket'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
