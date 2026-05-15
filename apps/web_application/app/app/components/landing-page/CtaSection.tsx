import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="relative bg-background py-20 md:py-28" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10" aria-hidden="true">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>

          <h2 id="cta-heading" className="mb-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Ready to meet someone new?
          </h2>

          <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">Join over a million people who have already discovered the joy of random, real-time connection. No downloads. No sign-up fees. Just people.</p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-xl bg-primary px-8 text-sm font-semibold tracking-wide text-primary-foreground hover:bg-primary/90">
              <Link href="/app/discover">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-xl border-border px-8 text-sm font-semibold tracking-wide hover:bg-muted">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
