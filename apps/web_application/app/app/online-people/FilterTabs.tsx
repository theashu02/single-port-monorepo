import { TabsList, TabsTrigger, Tabs } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { type PresenceFilter } from '@/lib/hooks/useOnlinePeopleFilters';

interface FilterTabsProps {
  filters: Array<{ id: PresenceFilter; label: string }>;
  active: PresenceFilter;
  onChange: (id: PresenceFilter) => void;
}

function FilterTabs({ filters, active, onChange }: FilterTabsProps) {
  return (
    <Tabs value={active} onValueChange={(v) => onChange(v as PresenceFilter)}>
      <TabsList className="flex h-11 w-full sm:w-auto items-center justify-start gap-1 rounded-2xl border border-border/30 bg-muted/30 p-1 scrollbar-hide">
        {filters.map((f) => (
          <TabsTrigger
            key={f.id}
            value={f.id}
            className={cn(
              'h-8.5 shrink-0 rounded-xl px-4 text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-background/20',
              'data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border-border/40 border border-transparent'
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
