import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Heart, Leaf, Users, MapPin, Mail, Phone, ArrowRight, Check } from "lucide-react";

const values = [
  {
    title: "Community First",
    description: "We believe everyone deserves access to fresh, healthy food regardless of their financial situation.",
  },
  {
    title: "Sustainability",
    description: "We use organic growing practices and focus on plants that thrive in our Indiana climate.",
  },
  {
    title: "Education",
    description: "We share knowledge about growing, harvesting, and the health benefits of our plants.",
  },
  {
    title: "Trust",
    description: "Our honor system is built on mutual respect and the belief in the goodness of people.",
  },
];

const stats = [
  { value: "68+", label: "Plant Varieties" },
  { value: "170", label: "Growing Days" },
  { value: "100%", label: "Community Focused" },
  { value: "24/7", label: "Garden Access" },
];

export default function About() {
  return (
    <div className="min-h-screen">
      <section className="bg-muted/30 py-16 border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">About Born Again Gardens</h1>
            <p className="text-xl text-muted-foreground font-serif leading-relaxed">
              Born Again Gardens is a community garden serving central Indiana with fresh, 
              organic produce on an honor system. We believe that access to healthy food 
              is a right, not a privilege.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center" data-testid={`card-stat-${index}`}>
                <CardContent className="pt-6 pb-4">
                  <p className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
              <div className="prose prose-lg dark:prose-invert font-serif">
                <p>
                  Born Again Gardens was founded with a simple belief: that everyone in our 
                  community should have access to fresh, nutritious food. We operate on an 
                  honor system—take what you need, pay what you can—because we trust in 
                  the goodness of our neighbors.
                </p>
                <p>
                  Our garden grows over 68 varieties of fruits, vegetables, herbs, and flowers, 
                  all selected for their ability to thrive in central Indiana's climate. From 
                  cold-hardy Chicago figs to medicinal herbs like echinacea, we cultivate 
                  diversity to serve our community's varied needs.
                </p>
                <p>
                  Whether you're a family looking for fresh produce, someone interested in 
                  learning about medicinal plants, or a neighbor who simply wants to contribute 
                  to something meaningful, Born Again Gardens welcomes you.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6">Our Values</h2>
              <div className="space-y-4">
                {values.map((value, index) => (
                  <Card key={index} className="hover-elevate" data-testid={`card-value-${index}`}>
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{value.title}</h3>
                        <p className="text-sm text-muted-foreground">{value.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-4">The Honor System</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-serif">
              At Born Again Gardens, we trust our community. Here's how it works:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center hover-elevate">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Visit the Garden</h3>
                <p className="text-sm text-muted-foreground">
                  Stop by during daylight hours. Browse what's growing and ready for harvest.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover-elevate">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Take What You Need</h3>
                <p className="text-sm text-muted-foreground">
                  Harvest what your family needs. Use our guides to learn proper techniques.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover-elevate">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Pay What You Can</h3>
                <p className="text-sm text-muted-foreground">
                  Donate what feels right. Suggested amounts help cover costs, but any amount helps.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Location</h3>
                    <p className="text-muted-foreground">Central Indiana, USA</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Exact address shared with registered visitors
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <a href="mailto:hello@bornagaingardens.org" className="text-primary hover:underline">
                      hello@bornagaingardens.org
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Social Media</h3>
                    <p className="text-muted-foreground">
                      Follow us for updates and garden photos
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-4">Get Involved</h2>
              <p className="text-muted-foreground mb-6 font-serif">
                There are many ways to support Born Again Gardens beyond financial donations:
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Volunteer for garden work days</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Donate seeds, tools, or supplies</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Share our mission with your network</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Become a monthly supporter</span>
                </li>
              </ul>
              <Link href="/donate">
                <Button data-testid="button-about-donate">
                  <Heart className="h-4 w-4 mr-2" />
                  Support Our Mission
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
