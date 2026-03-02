/**
 * Admin Email Management Page
 * Compose, Templates, and History tabs
 */

'use client';

import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComposeEmailTab } from '@/components/admin/email/ComposeEmailTab';
import { EmailTemplatesTab } from '@/components/admin/email/EmailTemplatesTab';
import { EmailHistoryTab } from '@/components/admin/email/EmailHistoryTab';
import { CreateTemplateDialog } from '@/components/admin/email/CreateTemplateDialog';
import type { EmailTemplate } from '@/hooks/useAdminEmail';

export default function AdminEmailPage() {
  const [activeTab, setActiveTab] = useState('compose');
  const [saveTemplateData, setSaveTemplateData] = useState<{
    name: string;
    subject: string;
    content: string;
    category: string;
    replyMode: string;
    ctaLabel?: string;
    ctaUrl?: string;
  } | null>(null);

  const handleSaveAsTemplate = useCallback((data: {
    name: string;
    subject: string;
    content: string;
    category: string;
    replyMode: string;
    ctaLabel?: string;
    ctaUrl?: string;
  }) => {
    setSaveTemplateData(data);
  }, []);

  const handleUseInCompose = useCallback((template: EmailTemplate) => {
    setActiveTab('compose');
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Email Management</h1>
        <p className="text-text-secondary mt-2">
          Send branded emails to members, manage templates, and track delivery history.
        </p>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-6">
          <ComposeEmailTab onSaveAsTemplate={handleSaveAsTemplate} />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <EmailTemplatesTab onUseInCompose={handleUseInCompose} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <EmailHistoryTab />
        </TabsContent>
      </Tabs>

      {/* Save as Template Dialog (triggered from Compose tab) */}
      <CreateTemplateDialog
        open={!!saveTemplateData}
        onOpenChange={(open) => !open && setSaveTemplateData(null)}
        initialData={saveTemplateData || undefined}
      />
    </div>
  );
}
