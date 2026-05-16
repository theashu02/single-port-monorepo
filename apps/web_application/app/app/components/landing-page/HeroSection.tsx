import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Zap, ArrowRight, Users, Sparkles, Globe2, ShieldCheck } from "lucide-react";

const heroStats = [
  { value: "3s", label: "avg match" },
  { value: "150+", label: "countries" },
  { value: "24/7", label: "safe chat" },
];

function InitialAvatar({ initials, className = "" }: { initials: string; className?: string }) {
  return (
    <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ${className}`} aria-hidden="true">
      {initials}
    </span>
  );
}

function FloatingCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`absolute rounded-2xl border border-border bg-card/95 p-4 shadow-md backdrop-blur ${className}`}>{children}</div>;
}

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background pt-16 pb-12 sm:pt-20 md:pt-24 md:pb-16">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_12%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_34%),radial-gradient(circle_at_82%_4%,color-mix(in_oklch,var(--secondary)_55%,transparent),transparent_32%),linear-gradient(180deg,transparent_0%,color-mix(in_oklch,var(--muted)_38%,transparent)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-32 bg-[linear-gradient(90deg,color-mix(in_oklch,var(--border)_55%,transparent)_1px,transparent_1px),linear-gradient(180deg,color-mix(in_oklch,var(--border)_45%,transparent)_1px,transparent_1px)] bg-size-[56px_56px] opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-9 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
          <div className="flex flex-col items-start text-left">
            <Badge variant="secondary" className="mb-5 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-secondary-foreground">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              2,847 people online now
            </Badge>

            <h1 className="mb-5 max-w-2xl text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">
              Meet someone
              <br />
              <span className="text-primary">new today</span>
            </h1>

            <p className="mb-7 max-w-xl text-base leading-7 tracking-[0.01em] text-muted-foreground sm:text-lg">Connect with real people from around the world in real time. Start meaningful conversations, make genuine friends, and discover stories you have never heard before.</p>

            <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-xl bg-primary px-8 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground hover:bg-primary/90">
                <Link href="/app/discover">
                  <Zap className="mr-2 h-4 w-4" />
                  Start Matching
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-xl border-border px-8 text-xs font-semibold uppercase tracking-[0.16em] hover:bg-muted">
                <Link href="#how-it-works">
                  See How It Works
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-7 grid w-full max-w-xl grid-cols-3 gap-2.5 sm:gap-3">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-border bg-card/80 px-3 py-3 shadow-sm backdrop-blur sm:px-4">
                  <p className="text-xl font-bold tracking-[-0.03em] text-foreground sm:text-2xl">{stat.value}</p>
                  <p className="mt-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex items-center gap-4">
              <div className="flex -space-x-2.5" aria-hidden="true">
                {["JD", "AK", "SM", "RL"].map((initials) => (
                  <InitialAvatar key={initials} initials={initials} className="border-2 border-background ring-2 ring-background" />
                ))}
              </div>
              <p className="text-sm tracking-[0.01em] text-muted-foreground">
                <span className="font-semibold text-foreground">12,400+</span> joined this week
              </p>
            </div>
          </div>

          <div className="relative" aria-hidden="true">
            <div className="relative mx-auto max-w-md lg:max-w-lg">
              <div className="absolute -inset-3 rounded-[2.25rem] bg-secondary/45 blur-2xl" />
              <div className="relative overflow-hidden rounded-4xl border border-border bg-card shadow-lg">
                <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-5 py-4">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-card" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold tracking-[0.01em] text-foreground">Random Chat</p>
                    <p className="text-xs tracking-[0.08em] text-muted-foreground">Matched 2s ago</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-secondary px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-secondary-foreground">
                    Live
                  </Badge>
                </div>

                <div className="min-h-70 space-y-4 px-5 py-5">
                  <div className="flex items-start gap-3">
                    <InitialAvatar initials="AL" className="h-8 w-8 shrink-0 bg-secondary text-secondary-foreground" />
                    <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5">
                      <p className="text-sm leading-relaxed tracking-[0.005em] text-foreground">Hey there! I am Alex from Toronto. What is your favorite way to spend a weekend?</p>
                    </div>
                  </div>

                  <div className="flex flex-row-reverse items-start gap-3">
                    <InitialAvatar initials="ME" className="h-8 w-8 shrink-0 bg-primary text-primary-foreground" />
                    <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5">
                      <p className="text-sm leading-relaxed tracking-[0.005em] text-primary-foreground">Hi Alex! I love hiking and finding new coffee shops. You?</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <InitialAvatar initials="AL" className="h-8 w-8 shrink-0 bg-secondary text-secondary-foreground" />
                    <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5">
                      <p className="text-sm leading-relaxed tracking-[0.005em] text-foreground">That sounds amazing. I am a huge photography nerd, so I am always chasing sunsets.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pl-11 pt-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                  </div>
                </div>

                <div className="border-t border-border bg-muted/40 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 flex-1 items-center rounded-xl border border-border bg-background px-4">
                      <span className="text-sm text-muted-foreground">Type a message...</span>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary">
                      <MessageCircle className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 border-t border-border bg-background">
                  <div className="flex items-center gap-2 border-r border-border px-4 py-3">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold tracking-[0.08em] text-foreground">Safe mode on</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3">
                    <Globe2 className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold tracking-[0.08em] text-foreground">Global queue</span>
                  </div>
                </div>
              </div>
            </div>

            <FloatingCard className="top-4 -left-4 hidden lg:block lg:-left-8">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                  <Sparkles className="h-4 w-4 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">New Match</p>
                  <p className="text-[0.65rem] text-muted-foreground">Someone liked your profile</p>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard className="bottom-12 -right-4 hidden lg:block lg:-right-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <InitialAvatar initials="MK" className="bg-accent text-accent-foreground" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Maya is online</p>
                  <p className="text-[0.65rem] text-muted-foreground">Active now</p>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard className="top-1/3 -right-4 hidden xl:block xl:-right-10">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">1,204 matches today</span>
              </div>
            </FloatingCard>
          </div>
        </div>
      </div>
    </section>
  );
}
