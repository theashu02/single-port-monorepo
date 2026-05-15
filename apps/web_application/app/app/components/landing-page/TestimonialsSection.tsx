import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const testimonials = [
  { name: "Sarah Lin", avatar: "SL", quote: "I have made three genuine friends on here in the past month. The conversations feel effortless and the matching is surprisingly good.", location: "San Francisco, CA" },
  { name: "Jordan Peters", avatar: "JP", quote: "As someone who travels a lot, this has been the best way to meet locals and get real recommendations. Not your typical chat app.", location: "London, UK" },
  { name: "Aisha Patel", avatar: "AP", quote: "The moderation actually works. I have never had a bad experience, which is rare for platforms like this. Truly feels safe.", location: "Toronto, CA" },
  { name: "Marcus Chen", avatar: "MC", quote: "Matched with a developer in Berlin during a hackathon. We ended up collaborating on a project. You never know who you will meet.", location: "Berlin, DE" },
  { name: "Elena Rossi", avatar: "ER", quote: "The UI is beautiful and the app is fast. I have tried similar platforms but this one actually respects your time.", location: "Milan, IT" },
  { name: "David Kim", avatar: "DK", quote: "I was skeptical at first, but the friend request feature turned random chats into real friendships. Highly recommend giving it a shot.", location: "Seoul, KR" },
];

export default function TestimonialsSection() {
  return (
    <section className="relative bg-background py-20 md:py-28" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 flex flex-col items-center text-center">
          <span className="mb-4 inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Testimonials</span>
          <h2 id="testimonials-heading" className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Loved by real people
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">Do not take our word for it. Here is what our community has to say about their experience.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="h-full border-border bg-card transition-all duration-300 hover:border-primary/15 hover:shadow-sm">
              <CardContent className="flex flex-col gap-4 p-6">
                <Quote className="h-5 w-5 text-muted-foreground/40" aria-hidden="true" />
                <p className="flex-1 text-sm leading-relaxed text-foreground">{testimonial.quote}</p>
                <div className="flex items-center gap-3 border-t border-border/60 pt-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground" aria-hidden="true">
                    {testimonial.avatar}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
