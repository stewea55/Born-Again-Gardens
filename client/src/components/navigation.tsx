import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, User, LogOut, LayoutDashboard, Heart, ShoppingBasket, Shield } from "lucide-react";
import { useState } from "react";
import logoImage from "@assets/image_1768587748920.png";

const navLinks = [
  { href: "/about", label: "About Us" },
  { href: "/plants", label: "Harvest Now" },
  { href: "/donate", label: "Founders Club" },
  { href: "/sponsor", label: "Sponsorships" },
  { href: "/volunteer", label: "Volunteer" },
  { href: "/calendar", label: "See Whats Ripe" },
];

export function Navigation() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const userInitials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U"
    : "G";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 hover-elevate rounded-md px-1 sm:px-2 py-1" data-testid="link-home">
            <img src={logoImage} alt="Born Again Gardens" className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 logo-transparent" />
            <span className="font-serif font-semibold text-base sm:text-lg leading-tight">Born Again Gardens</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  className="text-sm"
                  data-testid={`link-nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/basket">
              <Button variant="ghost" size="icon" className="h-9 w-9" data-testid="button-cart">
                <ShoppingBasket className="h-5 w-5" />
              </Button>
            </Link>

            <ThemeToggle />

            {isLoading ? (
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                      <AvatarFallback className="bg-primary text-primary-foreground">{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer" data-testid="link-dashboard">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/donations" className="flex items-center gap-2 cursor-pointer" data-testid="link-donations">
                      <Heart className="h-4 w-4" />
                      My Donations
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2 cursor-pointer text-primary" data-testid="link-admin">
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" className="flex items-center gap-2 cursor-pointer text-destructive" data-testid="button-logout">
                      <LogOut className="h-4 w-4" />
                      Log out
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 sm:hidden" 
                  data-testid="button-sign-in-mobile"
                  onClick={() => {
                    window.location.href = "/api/login";
                  }}
                >
                  <User className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hidden sm:flex" 
                  data-testid="button-sign-in"
                  onClick={() => {
                    window.location.href = "/api/login";
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
                <Link href="/sponsor">
                  <Button size="icon" className="h-9 w-9 sm:hidden" data-testid="button-donate-nav-mobile">
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button size="sm" className="hidden sm:flex" data-testid="button-donate-nav">
                    <Heart className="h-4 w-4 mr-2" />
                    Donate
                  </Button>
                </Link>
              </div>
            )}

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                      <Button
                        variant={location === link.href ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        data-testid={`link-mobile-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        {link.label}
                      </Button>
                    </Link>
                  ))}
                  {!isAuthenticated && (
                    <>
                      <div className="border-t pt-4">
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          data-testid="button-mobile-sign-in"
                          onClick={() => {
                            setMobileOpen(false);
                            window.location.href = "/api/login";
                          }}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Sign In
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
