import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Leaf, Users, Mail, ArrowRight, Church, Apple, Brain, BookOpen } from "lucide-react";
import { SiInstagram, SiFacebook } from "react-icons/si";
import logoImage from "@assets/image_1768587748920.png";

const whatWeAddress = [
  {
    icon: Church,
    title: "Church land is often underutilized.",
    description: "Much of it remains lawn—requiring time and money to maintain—while holding the potential to be stewarded as a source of nourishment, beauty, and blessing.",
  },
  {
    icon: Apple,
    title: "Truly fresh produce is becoming rare.",
    description: "Store-bought food is often far removed from harvest and grown with heavy chemical inputs, reducing its nutritional value.",
  },
  {
    icon: Brain,
    title: "We're missing nature's medicine.",
    description: "Regular time in gardens and green spaces is proven to lower stress hormones and blood pressure while improving mental health and immune function.",
  },
  {
    icon: BookOpen,
    title: "Foundational wisdom is being lost.",
    description: "Most of this generation was never taught the skills that were once passed down—how to grow food, steward land, and nourish our body.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen">
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1456295198429-05d2315cfebb?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Z3JhcGV2aW5lfGVufDB8fDB8fHwy"
            alt="Born Again Gardens community garden"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 md:px-8 text-center text-white">
          <img src={logoImage} alt="Born Again Gardens" className="h-24 w-24 mx-auto mb-6" />
          <p className="text-lg md:text-xl italic mb-4 text-white/90">Cultivating Gardens of New Life</p>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 font-serif">Born Again Gardens</h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Born Again Gardens is a vibrant new nonprofit cultivating abundance and provision 
            by bringing new life to unused church land. Beginning in Hamilton County, IN, 
            we create beautiful gardens where people can harvest affordable produce.
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <p className="text-xl md:text-2xl font-serif text-foreground leading-relaxed">
              We believe gardens should be places of <strong>beauty</strong>, <strong>healing</strong>, and <strong>provision</strong>. 
              They invite awe, restore wellness, and reconnect us—to the land, to one another, and to our Creator.
            </p>
            <div className="mt-8">
              <p className="text-lg text-muted-foreground mb-6 font-serif">
                We are just beginning, and you're invited to help
              </p>
              <Link href="/donate">
                <Button size="lg" className="text-lg px-8 py-6" data-testid="button-sow-first-seeds">
                  sow the first seeds
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">What we're building</h2>
            <div className="text-center bg-muted/50 rounded-xl p-8 mb-12">
              <p className="text-lg font-serif mb-4">
                These gardens are thoughtfully designed and carefully tended to be
              </p>
              <p className="text-xl font-semibold text-primary mb-4">
                abundant, beautiful, spacious, and educational.
              </p>
              <p className="text-muted-foreground italic mb-6">
                (Think: farm / park / art installation / home ec class)
              </p>
              <p className="text-lg font-serif mb-2">
                They are places for neighbors to
              </p>
              <p className="text-xl font-semibold text-primary mb-4">
                gather, harvest, play, learn, & rejuvenate.
              </p>
              <p className="text-lg font-serif text-muted-foreground italic">
                The ways gardens were always meant to be.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Why It Matters</h2>
            <p className="text-lg text-muted-foreground font-serif mb-8">
              At its heart, this work is a response to real needs in our towns and neighborhoods:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {whatWeAddress.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Card key={index} className="hover-elevate" data-testid={`card-address-${index}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2 italic">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Meet Our Founders</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Card className="text-center overflow-hidden">
              <div className="aspect-square bg-muted flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-16 w-16 text-primary/50" />
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold">Lydia Weatherford</h3>
                <p className="text-muted-foreground">Co-Founder</p>
              </CardContent>
            </Card>

            <Card className="text-center overflow-hidden">
              <div className="aspect-square bg-muted flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-16 w-16 text-primary/50" />
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold">Sterling Weatherford</h3>
                <p className="text-muted-foreground">Co-Founder</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-lg font-serif text-muted-foreground max-w-2xl mx-auto">
              Lydia and Sterling are a married pair of Cicero natives, who have grown in their 
              love of the Lord, their passion for wellness, and their excitement for gardening 
              over the course of their relationship, and they are thrilled to be bringing that 
              love to their cherished community.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Connect With Us</h2>
            <p className="text-lg text-muted-foreground font-serif">
              We'd love to hear from you! Follow our humble beginnings on social media or send us a message.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a 
              href="https://instagram.com/bornagain_gardens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="text-center hover-elevate h-full">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                    <SiInstagram className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">Instagram</h3>
                  <p className="text-sm text-muted-foreground">@bornagain_gardens</p>
                </CardContent>
              </Card>
            </a>

            <a 
              href="https://facebook.com/BornAgainGardens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="text-center hover-elevate h-full">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-4">
                    <SiFacebook className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">Facebook</h3>
                  <p className="text-sm text-muted-foreground">Born Again Gardens</p>
                </CardContent>
              </Card>
            </a>

            <a href="mailto:info@BornAgainGardens.org" className="block">
              <Card className="text-center hover-elevate h-full">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <p className="text-sm text-muted-foreground">info@BornAgainGardens.org</p>
                </CardContent>
              </Card>
            </a>
          </div>

          <div className="text-center mt-12">
            <Link href="/sponsor">
              <Button size="lg" data-testid="button-about-vision">
                <Leaf className="h-5 w-5 mr-2" />
                Help this Vision Take Root
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
