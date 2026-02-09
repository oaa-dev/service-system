'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select';
  placeholder?: string;
  options?: FilterOption[];
  icon?: React.ReactNode;
}

export interface FilterValues {
  [key: string]: string;
}

interface DataTableFiltersProps {
  filters: FilterField[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onReset: () => void;
  globalSearchKey?: string;
  globalSearchPlaceholder?: string;
}

export function DataTableFilters({
  filters,
  values,
  onChange,
  onReset,
  globalSearchKey = 'search',
  globalSearchPlaceholder = 'Search...',
}: DataTableFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterCount = Object.entries(values).filter(
    ([key, value]) => value && key !== globalSearchKey
  ).length;

  const handleChange = useCallback(
    (key: string, value: string) => {
      onChange({ ...values, [key]: value });
    },
    [values, onChange]
  );

  const handleClearFilter = useCallback(
    (key: string) => {
      const newValues = { ...values };
      delete newValues[key];
      onChange(newValues);
    },
    [values, onChange]
  );

  const handleReset = useCallback(() => {
    onReset();
    setIsOpen(false);
  }, [onReset]);

  const advancedFilters = filters.filter((f) => f.key !== globalSearchKey);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Global Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={globalSearchPlaceholder}
            value={values[globalSearchKey] || ''}
            onChange={(e) => handleChange(globalSearchKey, e.target.value)}
            className="pl-9 h-10"
          />
          {values[globalSearchKey] && (
            <button
              onClick={() => handleClearFilter(globalSearchKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Button with Popover */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-10 gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Filters</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 px-2 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset all
                </Button>
              </div>
              <Separator />
              <div className="space-y-4">
                {advancedFilters.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {filter.label}
                    </label>
                    {filter.type === 'text' ? (
                      <div className="relative">
                        {filter.icon && (
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {filter.icon}
                          </div>
                        )}
                        <Input
                          placeholder={filter.placeholder}
                          value={values[filter.key] || ''}
                          onChange={(e) => handleChange(filter.key, e.target.value)}
                          className={filter.icon ? 'pl-9' : ''}
                        />
                      </div>
                    ) : filter.type === 'select' && filter.options ? (
                      <Select
                        value={values[filter.key] || '__all__'}
                        onValueChange={(value) => handleChange(filter.key, value === '__all__' ? '' : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={filter.placeholder || `Select ${filter.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All</SelectItem>
                          {filter.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Reset Button (visible when filters are active) */}
        {(activeFilterCount > 0 || values[globalSearchKey]) && (
          <Button variant="ghost" onClick={handleReset} className="h-10 gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {advancedFilters.map((filter) => {
            const value = values[filter.key];
            if (!value) return null;

            let displayValue = value;
            if (filter.type === 'select' && filter.options) {
              const option = filter.options.find((o) => o.value === value);
              displayValue = option?.label || value;
            }

            return (
              <Badge
                key={filter.key}
                variant="secondary"
                className="h-7 pl-2 pr-1 gap-1 text-xs font-normal"
              >
                <span className="text-muted-foreground">{filter.label}:</span>
                <span className="font-medium">{displayValue}</span>
                <button
                  onClick={() => handleClearFilter(filter.key)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
