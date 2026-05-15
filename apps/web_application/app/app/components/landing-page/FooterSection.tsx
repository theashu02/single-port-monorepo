import Link from "next/link";
import { Globe, Mail, MessageCircle, Shield } from "lucide-react";

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "How it Works", href: "#how-it-works" },
    { label: "Safety", href: "#faq" },
    { label: "Pricing", href: "#faq" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};

const socialLinks = [
  { icon: Globe, href: "#", label: "Community" },
  { icon: Mail, href: "#", label: "Email" },
  { icon: Shield, href: "#", label: "Safety" },
];

export default function FooterSection() {
  return (
    <footer className="relative border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-18 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2" aria-label="StrangerChat home">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary" aria-hidden="true">
                <MessageCircle className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">StrangerChat</span>
            </Link>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground">Real-time stranger matching and friendship platform. Built for genuine human connection.</p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <Link key={social.label} href={social.href} aria-label={social.label} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-all duration-300 hover:border-muted-foreground/20 hover:text-foreground">
                  <social.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          <nav aria-label="Product links">
            <h4 className="mb-4 text-sm font-semibold text-foreground">Product</h4>
            <ul className="space-y-2.5">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company links">
            <h4 className="mb-4 text-sm font-semibold text-foreground">Company</h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal links">
            <h4 className="mb-4 text-sm font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="my-10 h-px w-full bg-border" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">&copy; 2026 StrangerChat. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Built with care for people who love connection.</p>
        </div>
      </div>
    </footer>
  );
}
