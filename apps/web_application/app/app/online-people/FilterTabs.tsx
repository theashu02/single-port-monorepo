import React from "react";
import { TabsList, TabsTrigger, Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { type PresenceFilter } from "@/lib/hooks/useOnlinePeopleFilters";

interface FilterTabsProps {
  filters: Array<{ id: PresenceFilter; label: string }>;
  active: PresenceFilter;
  onChange: (id: PresenceFilter) => void;
}

function FilterTabs({ filters, active, onChange }: FilterTabsProps) {
  return (
    <Tabs value={active} onValueChange={(v) => onChange(v as PresenceFilter)}>
      <TabsList className="flex h-auto w-full justify-start gap-2 overflow-x-auto rounded-xl p-1 scrollbar-hide">
        {filters.map((f) => (
          <TabsTrigger
            key={f.id}
            value={f.id}
            className={cn(
              "h-8 shrink-0 rounded-xl border border-border bg-background px-4 text-xs font-semibold transition-all hover:bg-muted hover:text-foreground",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:hover:bg-primary/90",
            )}
          >
            {f.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export default FilterTabs;
