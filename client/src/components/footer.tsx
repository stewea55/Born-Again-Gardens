import { Link } from "wouter";
import { Leaf, Mail, MapPin, Phone, Facebook, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="bg-card border-t">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Leaf className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Born Again Gardens</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 font-serif">
              A community garden serving central Indiana with fresh, organic produce on an honor system. 
              Take what you need, pay what you can.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" asChild>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" data-testid="link-facebook">
                  <Facebook className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" data-testid="link-instagram">
                  <Instagram className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/plants" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-plants">
                  Our Plants
                </Link>
              </li>
              <li>
                <Link href="/calendar" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-calendar">
                  Harvest Calendar
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-about">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/donate" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-donate">
                  Support Our Mission
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Central Indiana, USA</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:hello@bornagaingardens.org" className="hover:text-foreground transition-colors">
                  hello@bornagaingardens.org
                </a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>Contact via social media</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Newsletter</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Get monthly garden updates and harvest notifications.
            </p>
            {subscribed ? (
              <div className="bg-primary/10 text-primary p-3 rounded-md text-sm">
                Thanks for subscribing!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-newsletter-email"
                />
                <div className="flex items-start gap-2">
                  <Checkbox id="marketing" data-testid="checkbox-marketing" />
                  <label htmlFor="marketing" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                    I agree to receive marketing emails and updates
                  </label>
                </div>
                <Button type="submit" size="sm" className="w-full" data-testid="button-subscribe">
                  Subscribe
                </Button>
              </form>
            )}
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Born Again Gardens. All rights reserved.</p>
          <p className="mt-1">A 501(c)(3) nonprofit organization.</p>
        </div>
      </div>
    </footer>
  );
}
