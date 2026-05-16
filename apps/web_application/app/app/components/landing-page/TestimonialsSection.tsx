import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const testimonials = [
  { name: "Sarah Lin", avatar: "SL", quote: "I have made three genuine friends on here in the past month. The conversations feel effortless and the matching is surprisingly good.", location: "San Francisco, CA", className: "md:col-span-2 lg:col-span-3", featured: true },
  { name: "Jordan Peters", avatar: "JP", quote: "As someone who travels a lot, this has been the best way to meet locals and get real recommendations. Not your typical chat app.", location: "London, UK", className: "md:col-span-2 lg:col-span-3" },
  { name: "Aisha Patel", avatar: "AP", quote: "The moderation actually works. I have never had a bad experience, which is rare for platforms like this. Truly feels safe.", location: "Toronto, CA", className: "md:col-span-2 lg:col-span-2" },
  { name: "Marcus Chen", avatar: "MC", quote: "Matched with a developer in Berlin during a hackathon. We ended up collaborating on a project.", location: "Berlin, DE", className: "md:col-span-2 lg:col-span-2" },
  { name: "Elena Rossi", avatar: "ER", quote: "The UI is beautiful and the app is fast. I have tried similar platforms but this one actually respects your time.", location: "Milan, IT", className: "md:col-span-2 lg:col-span-2" },
  { name: "David Kim", avatar: "DK", quote: "I was skeptical at first, but the friend request feature turned random chats into real friendships. Highly recommend giving it a shot.", location: "Seoul, KR", className: "md:col-span-4 lg:col-span-6", wide: true },
];

export default function TestimonialsSection() {
  return (
    <section className="relative bg-background py-14 md:py-20" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-9 grid gap-4 md:mb-11 md:grid-cols-[0.8fr_1fr] md:items-end">
          <div>
            <span className="mb-4 inline-flex items-center rounded-full bg-muted px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Testimonials</span>
            <h2 id="testimonials-heading" className="max-w-xl text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl">
              Loved by real people
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 tracking-[0.01em] text-muted-foreground md:justify-self-end">Do not take our word for it. The community is already turning quick random chats into repeat conversations and real friendships.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
          {testimonials.map((testimonial) => {
            const isFeatured = testimonial.featured;

            return (
              <Card key={testimonial.name} className={`${testimonial.className} h-full gap-0 rounded-4xl border-border py-0 shadow-sm transition-all duration-300 hover:border-primary/20 ${isFeatured ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                <CardContent className={`flex h-full flex-col gap-5 p-5 sm:p-6 ${testimonial.wide ? "md:flex-row md:items-center md:justify-between" : ""} ${isFeatured ? "min-h-56" : "min-h-48"}`}>
                  <div className={testimonial.wide ? "max-w-3xl" : ""}>
                    <Quote className={`h-5 w-5 ${isFeatured ? "text-primary-foreground/45" : "text-muted-foreground/40"}`} aria-hidden="true" />
                    <p className={`mt-4 leading-7 tracking-[0.01em] ${isFeatured ? "text-base text-primary-foreground" : "text-sm text-foreground"}`}>{testimonial.quote}</p>
                  </div>
                  <div className={`mt-auto flex items-center gap-3 border-t pt-4 ${isFeatured ? "border-primary-foreground/20" : "border-border/60"} ${testimonial.wide ? "md:mt-0 md:min-w-56 md:border-l md:border-t-0 md:pl-5 md:pt-0" : ""}`}>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${isFeatured ? "bg-primary-foreground/15 text-primary-foreground" : "bg-muted text-muted-foreground"}`} aria-hidden="true">
                      {testimonial.avatar}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold tracking-[0.02em] ${isFeatured ? "text-primary-foreground" : "text-foreground"}`}>{testimonial.name}</p>
                      <p className={`text-xs tracking-[0.08em] ${isFeatured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{testimonial.location}</p>
                    </div>
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
