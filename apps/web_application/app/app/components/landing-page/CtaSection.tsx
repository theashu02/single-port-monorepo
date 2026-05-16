import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, ShieldCheck, Sparkles, Zap } from "lucide-react";

const benefits = [
  { icon: Zap, label: "No download" },
  { icon: ShieldCheck, label: "Private by default" },
  { icon: MessageCircle, label: "Live in seconds" },
];

export default function CtaSection() {
  return (
    <section className="relative bg-background py-14 md:py-20" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.25rem] border border-border bg-card p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-secondary/70 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-primary/35 to-transparent" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10" aria-hidden="true">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>

              <h2 id="cta-heading" className="max-w-2xl text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-4xl lg:text-5xl">
                Ready to meet someone new?
              </h2>

              <p className="mt-5 max-w-xl text-base leading-7 tracking-[0.01em] text-muted-foreground sm:text-lg">Join over a million people who have discovered random, real-time connection. No downloads. No sign-up fees. Just people.</p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 rounded-xl bg-primary px-8 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground hover:bg-primary/90">
                  <Link href="/app/discover">
                    Create Free Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 rounded-xl border-border px-8 text-xs font-semibold uppercase tracking-[0.16em] hover:bg-muted">
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;

                return (
                  <div key={benefit.label} className={`flex items-center gap-3 rounded-3xl border border-border bg-background p-4 ${index === 1 ? "lg:ml-8" : ""}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted" aria-hidden="true">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-semibold tracking-[0.04em] text-foreground">{benefit.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
