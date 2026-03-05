'use client';

import { useState } from 'react';
import { useLoyaltyCards } from '@/hooks/useLoyalty';
import { useMyBranches } from '@/hooks/useMyMerchant';
import type { LoyaltyCard } from '@/types/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Search,
  Star,
  Stamp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LoyaltyCardsListProps {
  program_required_stamps: number;
  onSelectCard: (card: LoyaltyCard) => void;
  isOrganization?: boolean;
}

export function LoyaltyCardsList({ program_required_stamps, onSelectCard, isOrganization = false }: LoyaltyCardsListProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  const { data: branchesData } = useMyBranches(
    isOrganization ? { per_page: 100 } : undefined
  );
  const branches = branchesData?.data ?? [];

  const { data, isLoading } = useLoyaltyCards({
    page,
    per_page: 15,
    sort: '-created_at',
    ...(search ? { 'filter[search]': search } : {}),
    ...(branchFilter !== 'all' ? { 'filter[branch_id]': Number(branchFilter) } : {}),
  });

  const cards = data?.data ?? [];
  const pagination = data?.meta;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const getStampProgress = (card: LoyaltyCard) => {
    const current = card.current_stamps;
    const required = program_required_stamps;
    const pct = Math.min(100, Math.round((current / required) * 100));
    return { current, required, pct };
  };

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by customer name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        {isOrganization && branches.length > 0 && (
          <Select
            value={branchFilter}
            onValueChange={(v) => {
              setBranchFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={String(branch.id)}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button type="submit" variant="secondary" size="sm">
          Search
        </Button>
        {search && (
          <Button variant="ghost" size="sm" onClick={handleClearSearch}>
            Clear
          </Button>
        )}
      </form>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              {isOrganization && <TableHead>Branch</TableHead>}
              <TableHead>Stamps</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="text-right">Rewards</TableHead>
              <TableHead>Last stamp</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }, (_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: isOrganization ? 7 : 6 }, (_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : cards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isOrganization ? 7 : 6}>
                  <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                    <CreditCard className="h-8 w-8 opacity-40" />
                    <p>{search ? 'No cards match your search.' : 'No customer cards yet.'}</p>
                    {search && (
                      <Button variant="ghost" size="sm" onClick={handleClearSearch}>
                        Clear search
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              cards.map((card) => {
                const { current, required, pct } = getStampProgress(card);
                const available = (card.total_rewards_earned ?? 0) - (card.total_rewards_redeemed ?? 0);

                return (
                  <TableRow key={card.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell
                      className="font-medium"
                      onClick={() => onSelectCard(card)}
                    >
                      {card.customer?.name ?? `Customer #${card.customer_id}`}
                    </TableCell>

                    {isOrganization && (
                      <TableCell onClick={() => onSelectCard(card)}>
                        <span className="text-sm text-muted-foreground">
                          {card.merchant?.name ?? '—'}
                        </span>
                      </TableCell>
                    )}

                    <TableCell onClick={() => onSelectCard(card)}>
                      <div className="flex items-center gap-1.5">
                        <Stamp className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm tabular-nums">
                          {current} / {required}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell onClick={() => onSelectCard(card)}>
                      <div className="flex items-center gap-2 w-32">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                          {pct}%
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right" onClick={() => onSelectCard(card)}>
                      <div className="flex items-center justify-end gap-1.5">
                        {available > 0 && (
                          <Badge variant="default" className="gap-1 text-xs">
                            <Star className="h-3 w-3" />
                            {available} available
                          </Badge>
                        )}
                        {available === 0 && card.total_rewards_earned > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {card.total_rewards_earned} total
                          </span>
                        )}
                        {card.total_rewards_earned === 0 && (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell onClick={() => onSelectCard(card)}>
                      <span className="text-xs text-muted-foreground">
                        {card.last_stamp_at
                          ? formatDistanceToNow(new Date(card.last_stamp_at), { addSuffix: true })
                          : 'Never'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectCard(card)}
                        className="text-xs"
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {pagination.total} {pagination.total === 1 ? 'card' : 'cards'}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {page} / {pagination.last_page}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= pagination.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Summary footer */}
      {pagination && (
        <Card className="bg-muted/30">
          <CardContent className="flex items-center gap-6 py-3 px-4">
            <div className="text-center">
              <p className="text-xl font-bold tabular-nums">{pagination.total}</p>
              <p className="text-xs text-muted-foreground">Total cards</p>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="text-center">
              <p className="text-xl font-bold tabular-nums">
                {cards.reduce((acc, c) => acc + (c.total_stamps_earned ?? 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground">Stamps on page</p>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="text-center">
              <p className="text-xl font-bold tabular-nums">
                {cards.reduce(
                  (acc, c) =>
                    acc + ((c.total_rewards_earned ?? 0) - (c.total_rewards_redeemed ?? 0)),
                  0
                )}
              </p>
              <p className="text-xs text-muted-foreground">Available rewards on page</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
