import { Card, CardContent } from "@/components/ui/card";
import { Users, MessageSquare, UserPlus, Globe } from "lucide-react";

const stats = [
  { icon: Users, value: "1.2M+", label: "Active users", description: "Online right now across every timezone", className: "col-span-2 md:col-span-2 md:row-span-2", featured: true },
  { icon: MessageSquare, value: "48M+", label: "Messages sent", description: "Every single day", className: "col-span-1 md:col-span-2" },
  { icon: UserPlus, value: "320K+", label: "Friend connections", description: "Created this month", className: "col-span-1 md:col-span-2" },
  { icon: Globe, value: "85K+", label: "Daily matches", description: "Across 150 countries", className: "col-span-2 md:col-span-4" },
];

export default function StatsSection() {
  return (
    <section className="relative border-y border-border bg-muted/20 py-10 md:py-14" aria-label="Platform statistics">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6 md:gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const isFeatured = stat.featured;

            return (
              <Card key={stat.label} className={`${stat.className} h-full gap-0 rounded-4xl border-border py-0 shadow-sm transition-colors duration-300 hover:border-primary/30 ${isFeatured ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>
                <CardContent className={`flex h-full flex-col items-start justify-between gap-5 p-4 sm:p-5 ${isFeatured ? "min-h-48 sm:min-h-56" : "min-h-36"}`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isFeatured ? "bg-primary-foreground/15" : "bg-muted"}`} aria-hidden="true">
                    <Icon className={`h-5 w-5 ${isFeatured ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <span className={`font-bold tracking-[-0.04em] tabular-nums ${isFeatured ? "text-5xl sm:text-6xl text-primary-foreground" : "text-2xl text-foreground sm:text-3xl"}`}>{stat.value}</span>
                    <p className={`mt-2 text-sm font-semibold tracking-[0.04em] ${isFeatured ? "text-primary-foreground" : "text-foreground"}`}>{stat.label}</p>
                    <p className={`mt-1 text-xs leading-relaxed tracking-[0.04em] ${isFeatured ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{stat.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
