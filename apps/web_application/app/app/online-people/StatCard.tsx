import React from 'react';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border/40 bg-muted/20 p-4 transition-all duration-300 hover:bg-muted/40 hover:-translate-y-0.5 hover:shadow-xs">
      <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80">
        {icon}
        {label}
      </div>
      <span className="text-2xl font-black tracking-tight text-foreground">{value}</span>
    </div>
  );
}

export default StatCard;
