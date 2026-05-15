import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Zap, ArrowRight, Users, Sparkles } from "lucide-react";

function InitialAvatar({ initials, className = "" }: { initials: string; className?: string }) {
  return (
    <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ${className}`} aria-hidden="true">
      {initials}
    </span>
  );
}

function FloatingCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`absolute rounded-2xl border border-border bg-card p-4 shadow-md ${className}`}>{children}</div>;
}

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background pt-20 pb-16 md:pt-28 md:pb-24">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_15%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_34%),radial-gradient(circle_at_80%_0%,color-mix(in_oklch,var(--secondary)_45%,transparent),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col items-start text-left">
            <Badge variant="secondary" className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-secondary-foreground">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              2,847 people online now
            </Badge>

            <h1 className="mb-6 text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Meet someone
              <br />
              <span className="text-primary">new today</span>
            </h1>

            <p className="mb-8 max-w-lg text-lg leading-relaxed text-muted-foreground">Connect with real people from around the world in real time. Start meaningful conversations, make genuine friends, and discover stories you have never heard before.</p>

            <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-xl bg-primary px-8 text-sm font-semibold tracking-wide text-primary-foreground hover:bg-primary/90">
                <Link href="/app/discover">
                  <Zap className="mr-2 h-4 w-4" />
                  Start Matching
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-xl border-border px-8 text-sm font-semibold tracking-wide hover:bg-muted">
                <Link href="#how-it-works">
                  See How It Works
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2.5" aria-hidden="true">
                {["JD", "AK", "SM", "RL"].map((initials) => (
                  <InitialAvatar key={initials} initials={initials} className="border-2 border-background ring-2 ring-background" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">12,400+</span> joined this week
              </p>
            </div>
          </div>

          <div className="relative hidden md:block" aria-hidden="true">
            <div className="relative mx-auto max-w-md">
              <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
                <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-5 py-4">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-card" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Random Chat</p>
                    <p className="text-xs text-muted-foreground">Matched 2s ago</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-secondary px-2.5 py-0.5 text-[0.65rem] font-medium text-secondary-foreground">
                    Live
                  </Badge>
                </div>

                <div className="min-h-70 space-y-4 px-5 py-6">
                  <div className="flex items-start gap-3">
                    <InitialAvatar initials="AL" className="h-8 w-8 shrink-0 bg-secondary text-secondary-foreground" />
                    <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5">
                      <p className="text-sm leading-relaxed text-foreground">Hey there! I am Alex from Toronto. What is your favorite way to spend a weekend?</p>
                    </div>
                  </div>

                  <div className="flex flex-row-reverse items-start gap-3">
                    <InitialAvatar initials="ME" className="h-8 w-8 shrink-0 bg-primary text-primary-foreground" />
                    <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5">
                      <p className="text-sm leading-relaxed text-primary-foreground">Hi Alex! I love hiking and finding new coffee shops. You?</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <InitialAvatar initials="AL" className="h-8 w-8 shrink-0 bg-secondary text-secondary-foreground" />
                    <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5">
                      <p className="text-sm leading-relaxed text-foreground">That sounds amazing. I am a huge photography nerd, so I am always chasing sunsets.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pl-11 pt-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                  </div>
                </div>

                <div className="border-t border-border bg-muted/30 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 flex-1 items-center rounded-xl border border-border bg-background px-4">
                      <span className="text-sm text-muted-foreground">Type a message...</span>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary">
                      <MessageCircle className="h-4 w-4 text-primary-foreground" />
                    </div>
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
