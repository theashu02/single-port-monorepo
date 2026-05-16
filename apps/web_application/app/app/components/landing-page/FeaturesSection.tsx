import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Shuffle, UserPlus, ShieldCheck, Zap, Smartphone, Clock, Bell, Radio, Keyboard } from "lucide-react";

const features = [
  { icon: MessageCircle, eyebrow: "Live", title: "Real-time chat", description: "Send and receive messages instantly with crisp typing, delivery, and presence feedback.", className: "sm:col-span-2 lg:col-span-3 lg:row-span-2", featured: true },
  { icon: Shuffle, eyebrow: "Queue", title: "Random matching", description: "Get paired with interesting strangers based on shared interests and availability.", className: "lg:col-span-3" },
  { icon: UserPlus, eyebrow: "Social", title: "Friend requests", description: "Turn great conversations into lasting connections without losing the moment.", className: "lg:col-span-2" },
  { icon: ShieldCheck, eyebrow: "Safety", title: "Safe moderation", description: "AI-assisted moderation and community standards keep the room respectful.", className: "lg:col-span-2", soft: true },
  { icon: Zap, eyebrow: "Speed", title: "Instant messaging", description: "No delays, no refresh needed. Messages appear the moment they are sent.", className: "lg:col-span-2" },
  { icon: Radio, eyebrow: "Presence", title: "Online indicators", description: "See who is online, away, or busy with elegant real-time status cues.", className: "sm:col-span-2 lg:col-span-2" },
  { icon: Smartphone, eyebrow: "Responsive", title: "Mobile ready", description: "A compact experience across phones, tablets, laptops, and wide desktops.", className: "lg:col-span-2", soft: true },
  { icon: Clock, eyebrow: "Matching", title: "Fast matching system", description: "Get matched in under 3 seconds through a smart low-friction queue.", className: "lg:col-span-2" },
  { icon: Keyboard, eyebrow: "Flow", title: "Typing indicators", description: "Know when someone is typing so the conversation keeps its natural rhythm.", className: "lg:col-span-3" },
  { icon: Bell, eyebrow: "Alerts", title: "Real-time notifications", description: "Stay aware of new matches, messages, and friend requests without noise.", className: "lg:col-span-3" },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden bg-background py-14 md:py-20">
      <div className="pointer-events-none absolute inset-x-0 top-10 h-64 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklch,var(--secondary)_42%,transparent),transparent_58%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative mb-9 grid gap-4 md:mb-11 md:grid-cols-[0.8fr_1fr] md:items-end">
          <div>
            <span className="mb-4 inline-flex items-center rounded-full bg-muted px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Features</span>
            <h2 className="max-w-xl text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl">Everything you need to connect</h2>
          </div>
          <p className="max-w-2xl text-base leading-7 tracking-[0.01em] text-muted-foreground md:justify-self-end">Built for genuine human connection. Every feature is designed to make meeting new people effortless, safe, enjoyable, and fast on every screen size.</p>
        </div>

        <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isFeatured = feature.featured;

            return (
              <Card key={feature.title} className={`group h-full gap-0 rounded-4xl border-border py-0 shadow-sm transition-all duration-300 hover:border-primary/25 ${feature.className} ${isFeatured ? "border-primary bg-primary text-primary-foreground" : feature.soft ? "bg-secondary/60" : "bg-card"}`}>
                <CardContent className={`flex h-full flex-col justify-between gap-6 p-5 sm:p-6 ${isFeatured ? "min-h-64" : "min-h-44"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors duration-300 ${isFeatured ? "bg-primary-foreground/15" : "bg-muted group-hover:bg-primary/10"}`} aria-hidden="true">
                      <Icon className={`h-5 w-5 transition-colors duration-300 ${isFeatured ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"}`} />
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] ${isFeatured ? "bg-primary-foreground/15 text-primary-foreground/80" : "bg-background text-muted-foreground"}`}>{feature.eyebrow}</span>
                  </div>
                  <div>
                    <h3 className={`mb-2 text-base font-semibold tracking-[0.01em] ${isFeatured ? "text-primary-foreground" : "text-foreground"}`}>{feature.title}</h3>
                    <p className={`text-sm leading-6 tracking-[0.01em] ${isFeatured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{feature.description}</p>
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
