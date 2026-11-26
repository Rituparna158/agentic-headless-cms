'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Radio, Search, X } from 'lucide-react';
import { Badge, Button, Checkbox } from '@repo/shared-ui';
import { cn } from '@/lib/utils';

export interface WebhookEventItem {
  id: string;
  description: string;
}

export interface WebhookEventCategory {
  category: string;
  events: WebhookEventItem[];
}

interface WebhookEventsComboboxProps {
  categories: WebhookEventCategory[];
  selectedEvents: string[];
  onChange: (events: string[]) => void;
  disabled?: boolean;
}

export function WebhookEventsCombobox({
  categories,
  selectedEvents,
  onChange,
  disabled = false,
}: WebhookEventsComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Smoothly ensure dropdown is scrolled into view when opened
  useEffect(() => {
    if (isOpen && containerRef.current) {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 50);
    }
  }, [isOpen]);

  const allEvents = useMemo(
    () => categories.flatMap((cat) => cat.events),
    [categories],
  );

  const toggleEvent = (eventId: string) => {
    if (selectedEvents.includes(eventId)) {
      onChange(selectedEvents.filter((id) => id !== eventId));
    } else {
      onChange([...selectedEvents, eventId]);
    }
  };

  const removeEvent = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedEvents.filter((id) => id !== eventId));
  };

  const selectAll = () => {
    onChange(allEvents.map((e) => e.id));
  };

  const clearAll = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange([]);
  };

  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return categories;

    return categories
      .map((cat) => ({
        category: cat.category,
        events: cat.events.filter(
          (e) =>
            e.id.toLowerCase().includes(term) ||
            e.description.toLowerCase().includes(term),
        ),
      }))
      .filter((cat) => cat.events.length > 0);
  }, [categories, searchTerm]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Combobox Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Select events to subscribe"
        aria-expanded={isOpen}
        className={cn(
          'w-full min-h-10 flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-input bg-background text-sm shadow-xs transition-colors text-left focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
          {selectedEvents.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Radio className="size-3.5 text-muted-foreground/60 shrink-0" />
              <span>Select events to subscribe...</span>
            </div>
          ) : (
            selectedEvents.map((eventId) => (
              <Badge
                key={eventId}
                variant="secondary"
                size="xs"
                className="font-mono text-[11px] gap-1 pl-1.5 pr-1 py-0.5 inline-flex items-center max-w-full"
              >
                <span className="truncate">{eventId}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => removeEvent(eventId, e)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      removeEvent(eventId, e as unknown as React.MouseEvent);
                    }
                  }}
                  className="rounded hover:bg-muted-foreground/20 p-0.5 cursor-pointer text-muted-foreground hover:text-foreground"
                  aria-label={`Remove event ${eventId}`}
                >
                  <X className="size-3" />
                </span>
              </Badge>
            ))
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1 text-muted-foreground">
          {selectedEvents.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={clearAll}
              className="text-xs hover:text-foreground cursor-pointer px-1 py-0.5 rounded hover:bg-muted"
              title="Clear all selected events"
            >
              Clear
            </span>
          )}
          <ChevronDown
            className={cn(
              'size-4 transition-transform duration-200',
              isOpen && 'rotate-180',
            )}
          />
        </div>
      </button>

      {/* Combobox Dropdown Popover */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 max-h-80 flex flex-col rounded-lg border border-border bg-popover text-popover-foreground shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95">
          {/* Search Header */}
          <div className="p-2 border-b border-border/70 flex items-center gap-2 bg-muted/20">
            <Search className="size-3.5 text-muted-foreground shrink-0 ml-1" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter events by name or description..."
              className="flex-1 bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground/70"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 hover:text-foreground text-muted-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Quick Actions Row */}
          <div className="px-3 py-1.5 border-b border-border/50 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {selectedEvents.length} of {allEvents.length} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="hover:text-primary transition-colors cursor-pointer font-medium"
              >
                Select all
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="hover:text-destructive transition-colors cursor-pointer"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Categorized List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-3 max-h-56">
            {filteredCategories.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No events match &ldquo;{searchTerm}&rdquo;
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    {cat.category}
                  </div>
                  <div className="space-y-0.5">
                    {cat.events.map((event) => {
                      const isChecked = selectedEvents.includes(event.id);
                      return (
                        <div
                          key={event.id}
                          onClick={() => toggleEvent(event.id)}
                          className={cn(
                            'flex items-start gap-2.5 p-2 rounded-md cursor-pointer transition-colors text-left select-none',
                            isChecked
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted/50',
                          )}
                        >
                          <Checkbox
                            checked={isChecked}
                            onChange={() => toggleEvent(event.id)}
                            aria-label={event.id}
                            className="mt-0.5 shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-mono text-xs font-medium text-foreground">
                              {event.id}
                            </span>
                            <span className="text-[11px] text-muted-foreground leading-normal">
                              {event.description}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Done Button Footer */}
          <div className="p-2 border-t border-border/70 bg-muted/20 flex justify-end">
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
