'use client';

/**
 * Admin Staking
 * Configure stakeable coins, record the rewards the platform actually received,
 * and see how much is staked per coin (so ops know how much to stake).
 */

import { useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { formatCrypto } from '@/lib/utils/currency';
import { STAKING_ENABLED } from '@/lib/feature-flags';
import type { StakingAsset, StakingRewardBatch } from '@/types/staking';

interface AvailableToken {
  id: number;
  symbol: string;
  name: string;
  logo_url: string | null;
}

type BatchRow = StakingRewardBatch & { token: { symbol: string; name: string; logo_url: string | null } | null };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function yesterdayUtc() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function TokenLabel({ symbol, logo }: { symbol: string; logo: string | null }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold">
      <Image src={logo || '/icons/crypto/default.svg'} alt={symbol} width={20} height={20} className="rounded-full" />
      {symbol}
    </span>
  );
}

// ─── Edit / add coin terms ───

interface TermsForm {
  baseTokenId: number;
  symbol: string;
  enabled: boolean;
  min_stake: string;
  unbonding_days: string;
  commission_percent: string;
  estimated_apy: string;
}

function TermsDialog({ form, onClose }: { form: TermsForm | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<TermsForm | null>(form);
  if (form && values?.baseTokenId !== form.baseTokenId) setValues(form);

  const save = useMutation({
    mutationFn: (v: TermsForm) =>
      api('/api/admin/staking/assets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...v, estimated_apy: v.estimated_apy === '' ? null : v.estimated_apy }),
      }),
    onSuccess: () => {
      toast.success('Staking terms saved');
      queryClient.invalidateQueries({ queryKey: ['admin-staking-assets'] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!values) return null;
  const set = (key: keyof TermsForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues({ ...values, [key]: e.target.value });

  return (
    <ResponsiveDialog open={form !== null} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{values.symbol} staking terms</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between rounded-lg border border-bg-tertiary p-3">
            <div>
              <p className="font-medium">Available to users</p>
              <p className="text-xs text-text-tertiary">Users can stake when enabled (and the feature flag is on)</p>
            </div>
            <Switch checked={values.enabled} onCheckedChange={(enabled) => setValues({ ...values, enabled })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="min">Minimum stake ({values.symbol})</Label>
              <Input id="min" inputMode="decimal" value={values.min_stake} onChange={set('min_stake')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unbonding">Unbonding days</Label>
              <Input id="unbonding" inputMode="numeric" value={values.unbonding_days} onChange={set('unbonding_days')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="commission">Commission %</Label>
              <Input id="commission" inputMode="decimal" value={values.commission_percent} onChange={set('commission_percent')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apy">Estimated APY % (optional)</Label>
              <Input id="apy" inputMode="decimal" placeholder="e.g. 4.5" value={values.estimated_apy} onChange={set('estimated_apy')} />
            </div>
          </div>
          <p className="text-xs text-text-tertiary">
            The estimate is shown (labelled &quot;est.&quot;) until at least 7 days of rewards have been distributed
            in the last 30; after that users see the realized APY. Match unbonding days to the chain&apos;s real unstaking period.
          </p>
        </div>
        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate(values)} disabled={save.isPending}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

// ─── Page ───

export default function AdminStakingPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<TermsForm | null>(null);
  const [reward, setReward] = useState({ baseTokenId: '', rewardDate: yesterdayUtc(), grossAmount: '', notes: '' });
  const [confirmDistribute, setConfirmDistribute] = useState(false);

  const assetsQuery = useQuery({
    queryKey: ['admin-staking-assets'],
    queryFn: () => api<{ assets: StakingAsset[]; available_tokens: AvailableToken[] }>('/api/admin/staking/assets'),
  });
  const batchesQuery = useQuery({
    queryKey: ['admin-staking-batches'],
    queryFn: () => api<{ batches: BatchRow[] }>('/api/admin/staking/rewards'),
  });

  const recordReward = useMutation({
    mutationFn: () =>
      api('/api/admin/staking/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reward),
      }),
    onSuccess: () => {
      toast.success('Rewards recorded. They are paid out on the next distribution.');
      setReward({ ...reward, grossAmount: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-staking-batches'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const distribute = useMutation({
    mutationFn: () => api<{ batches: { recipients: number; complete: boolean }[]; released: number }>('/api/admin/staking/distribute', { method: 'POST' }),
    onSuccess: (data) => {
      const paid = data.batches.reduce((sum, b) => sum + b.recipients, 0);
      const incomplete = data.batches.filter((b) => !b.complete).length;
      toast.success(`Distributed ${data.batches.length} batch(es) to ${paid} stake(s); released ${data.released} unstake(s)`);
      if (incomplete) toast.warning(`${incomplete} batch(es) had failures and will retry on the next run`);
      queryClient.invalidateQueries({ queryKey: ['admin-staking-batches'] });
      queryClient.invalidateQueries({ queryKey: ['admin-staking-assets'] });
      setConfirmDistribute(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const assets = assetsQuery.data?.assets ?? [];
  const available = assetsQuery.data?.available_tokens ?? [];
  const batches = batchesQuery.data?.batches ?? [];
  const pending = batches.filter((b) => b.status !== 'distributed');
  const selectedAsset = assets.find((a) => String(a.base_token_id) === reward.baseTokenId);
  const gross = parseFloat(reward.grossAmount) || 0;
  const commission = selectedAsset ? gross * (selectedAsset.commission_percent / 100) : 0;

  const editAsset = (asset: StakingAsset) =>
    setEditing({
      baseTokenId: asset.base_token_id,
      symbol: asset.token.symbol,
      enabled: asset.enabled,
      min_stake: String(asset.min_stake),
      unbonding_days: String(asset.unbonding_days),
      commission_percent: String(asset.commission_percent),
      estimated_apy: asset.estimated_apy != null ? String(asset.estimated_apy) : '',
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Staking</h1>
        <p className="text-text-secondary mt-2">
          Configure stakeable coins and record the rewards the platform actually receives.
          {!STAKING_ENABLED && ' The user-facing feature is currently switched off (NEXT_PUBLIC_STAKING_ENABLED).'}
        </p>
      </div>

      {/* Coins */}
      <Card className="p-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-bg-tertiary px-5 py-4">
          <div>
            <h2 className="font-semibold">Coins</h2>
            <p className="text-xs text-text-tertiary">&quot;Staked&quot; is what ops should have staked for each coin right now.</p>
          </div>
          {available.length > 0 && (
            <Select
              value=""
              onValueChange={(id) => {
                const token = available.find((t) => String(t.id) === id);
                if (token) {
                  setEditing({
                    baseTokenId: token.id,
                    symbol: token.symbol,
                    enabled: false,
                    min_stake: '0',
                    unbonding_days: '0',
                    commission_percent: '20',
                    estimated_apy: '',
                  });
                }
              }}
            >
              <SelectTrigger size="sm" className="w-[150px]">
                <Plus className="h-4 w-4" />
                <SelectValue placeholder="Add coin" />
              </SelectTrigger>
              <SelectContent>
                {available.map((token) => (
                  <SelectItem key={token.id} value={String(token.id)}>
                    {token.symbol} - {token.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {assetsQuery.isPending ? (
          <div className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
        ) : assetsQuery.isError ? (
          <p className="p-6 text-sm text-action-red">{assetsQuery.error.message}</p>
        ) : assets.length === 0 ? (
          <p className="p-6 text-sm text-text-secondary">No coins set up yet. Use &quot;Add coin&quot; to start.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-text-tertiary">
                <tr className="border-b border-bg-tertiary">
                  {['Coin', 'Status', 'Staked', 'Min', 'Unbonding', 'Commission', 'APY', ''].map((h) => (
                    <th key={h} className="px-5 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id} className="border-b border-bg-tertiary last:border-0">
                    <td className="px-5 py-3"><TokenLabel symbol={asset.token.symbol} logo={asset.token.logo_url} /></td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className={asset.enabled ? 'text-action-green border-action-green/30' : 'text-text-tertiary'}>
                        {asset.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 font-medium">{formatCrypto(asset.total_staked ?? 0, asset.token.symbol)}</td>
                    <td className="px-5 py-3">{formatCrypto(asset.min_stake, asset.token.symbol)}</td>
                    <td className="px-5 py-3">{asset.unbonding_days} d</td>
                    <td className="px-5 py-3">{asset.commission_percent}%</td>
                    <td className="px-5 py-3">
                      {asset.apy != null ? `${asset.apy.toFixed(2)}%` : '-'}
                      {asset.apy != null && asset.apy_is_estimate && <span className="ml-1 text-xs text-text-tertiary">est.</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => editAsset(asset)}>Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Record rewards */}
      <Card className="p-5 gap-4">
        <div>
          <h2 className="font-semibold">Record rewards received</h2>
          <p className="text-xs text-text-tertiary">
            Enter what the platform actually received for one coin and one day. Stakes active for that whole day share it
            in proportion to their size, after commission.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Coin</Label>
            <Select value={reward.baseTokenId} onValueChange={(baseTokenId) => setReward({ ...reward, baseTokenId })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={String(asset.base_token_id)}>{asset.token.symbol}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reward-date">Reward date (UTC)</Label>
            <Input id="reward-date" type="date" max={yesterdayUtc()} value={reward.rewardDate} onChange={(e) => setReward({ ...reward, rewardDate: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gross">Amount received</Label>
            <Input id="gross" inputMode="decimal" placeholder="0.00" value={reward.grossAmount} onChange={(e) => setReward({ ...reward, grossAmount: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input id="notes" placeholder="e.g. exchange reference" value={reward.notes} onChange={(e) => setReward({ ...reward, notes: e.target.value })} />
          </div>
        </div>
        {selectedAsset && gross > 0 && (
          <p className="text-sm text-text-secondary">
            Commission {selectedAsset.commission_percent}%: {formatCrypto(commission, selectedAsset.token.symbol)} ·
            To stakers: <span className="font-semibold text-text-primary">{formatCrypto(gross - commission, selectedAsset.token.symbol)} {selectedAsset.token.symbol}</span>
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => recordReward.mutate()} disabled={!reward.baseTokenId || gross <= 0 || recordReward.isPending}>
            {recordReward.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record rewards
          </Button>
          <Button variant="outline" onClick={() => setConfirmDistribute(true)} disabled={pending.length === 0 || distribute.isPending}>
            <Send className="mr-2 h-4 w-4" />
            Distribute now ({pending.length} pending)
          </Button>
        </div>
      </Card>

      {/* Batches */}
      <Card className="p-0 gap-0 overflow-hidden">
        <div className="border-b border-bg-tertiary px-5 py-4">
          <h2 className="font-semibold">Reward history</h2>
          <p className="text-xs text-text-tertiary">Pending batches are paid out by the daily job, or with &quot;Distribute now&quot;.</p>
        </div>
        {batches.length === 0 ? (
          <p className="p-6 text-sm text-text-secondary">No rewards recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-text-tertiary">
                <tr className="border-b border-bg-tertiary">
                  {['Date', 'Coin', 'Received', 'Commission', 'To stakers', 'Stakes paid', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const symbol = batch.token?.symbol ?? '';
                  return (
                    <tr key={batch.id} className="border-b border-bg-tertiary last:border-0">
                      <td className="px-5 py-3">{batch.reward_date}</td>
                      <td className="px-5 py-3">{symbol}</td>
                      <td className="px-5 py-3">{formatCrypto(Number(batch.gross_amount), symbol)}</td>
                      <td className="px-5 py-3">{batch.status === 'distributed' ? formatCrypto(Number(batch.commission_amount), symbol) : '-'}</td>
                      <td className="px-5 py-3">{batch.status === 'distributed' ? formatCrypto(Number(batch.distributed_amount), symbol) : '-'}</td>
                      <td className="px-5 py-3">{batch.status === 'distributed' ? batch.recipients : '-'}</td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={batch.status === 'distributed' ? 'text-action-green border-action-green/30' : 'text-yellow-500 border-yellow-500/30'}>
                          {batch.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <TermsDialog form={editing} onClose={() => setEditing(null)} />

      <ConfirmActionDialog
        open={confirmDistribute}
        onOpenChange={setConfirmDistribute}
        onConfirm={() => distribute.mutate()}
        title="Distribute staking rewards now?"
        description={`Pays out ${pending.length} pending batch(es) to stakers and releases any finished unstakes. This credits user balances.`}
        confirmText="Distribute"
        loading={distribute.isPending}
      />
    </div>
  );
}
