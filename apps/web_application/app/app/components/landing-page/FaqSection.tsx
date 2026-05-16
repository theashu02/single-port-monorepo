const faqs = [
  { question: "Is the platform really free to use?", answer: "Yes, the core experience is completely free. You can match, chat, and send friend requests without paying anything. We may introduce optional premium features in the future for power users." },
  { question: "How does the matching system work?", answer: "Our algorithm considers shared interests, language preferences, and real-time availability to pair you with someone you are likely to have a great conversation with. Matches typically happen in under 3 seconds." },
  { question: "Is my identity protected?", answer: "Absolutely. You only need a username to get started. We do not require your real name, phone number, or email to begin chatting. You control what you share." },
  { question: "What safety measures are in place?", answer: "We use a combination of AI-powered content moderation, community reporting, and automated blocking to maintain a safe environment. Violations of our community guidelines result in immediate action." },
  { question: "Can I block or report someone?", answer: "Yes. Every chat has quick-access buttons to block or report a user. Reports are reviewed promptly and acted upon to keep the community safe." },
  { question: "Does it work on mobile devices?", answer: "The entire platform is fully responsive and works beautifully on phones, tablets, and desktops. No app download required, just open your browser and start chatting." },
];

export default function FaqSection() {
  return (
    <section id="faq" className="relative border-y border-border bg-muted/30 py-14 md:py-20" aria-labelledby="faq-heading">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:px-8">
        <div>
          <span className="mb-4 inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">FAQ</span>
          <h2 id="faq-heading" className="max-w-md text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl">
            Questions? Answered.
          </h2>
          <p className="mt-4 max-w-md text-base leading-7 tracking-[0.01em] text-muted-foreground">Everything you need to know before jumping in. The answers stay short, practical, and focused on trust.</p>

          <div className="mt-6 rounded-3xl border border-border bg-background p-4">
            <p className="text-sm font-semibold tracking-[0.04em] text-foreground">Still unsure?</p>
            <p className="mt-1 text-sm leading-6 tracking-[0.01em] text-muted-foreground">Start with a random match, keep control over what you share, and leave any chat instantly.</p>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-[1.25rem] border border-border bg-card px-5 shadow-sm transition-colors duration-300 open:border-primary/25 open:bg-background">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-left text-sm font-semibold tracking-[0.02em] text-foreground marker:hidden">
                {faq.question}
                <span className="text-muted-foreground transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="pb-4 text-sm leading-6 tracking-[0.01em] text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
