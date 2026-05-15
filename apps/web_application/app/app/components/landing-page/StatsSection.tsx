import { Card, CardContent } from "@/components/ui/card";
import { Users, MessageSquare, UserPlus, Globe } from "lucide-react";

const stats = [
  { icon: Users, value: "1.2M+", label: "Active users", description: "Online right now" },
  { icon: MessageSquare, value: "48M+", label: "Messages sent", description: "Every single day" },
  { icon: UserPlus, value: "320K+", label: "Friend connections", description: "Created this month" },
  { icon: Globe, value: "85K+", label: "Daily matches", description: "Across 150 countries" },
];

export default function StatsSection() {
  return (
    <section className="relative border-t border-border bg-background py-16 md:py-20" aria-label="Platform statistics">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="h-full border-border bg-card transition-colors duration-300 hover:border-primary/30 rounded-3xl">
              <CardContent className="flex flex-col items-start gap-3 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted" aria-hidden="true">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums sm:text-4xl">{stat.value}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{stat.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
