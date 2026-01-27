import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Heart, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import type { Donation } from "@shared/schema";

export default function Donations() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: donations = [], isLoading } = useQuery<Donation[]>({
    queryKey: ["/api/donations"],
    enabled: isAuthenticated,
  });

  // Group donations by year
  const donationsByYear = donations.reduce<Record<number, Donation[]>>((acc, donation) => {
    const year = donation.taxYear;
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(donation);
    return acc;
  }, {});

  // Calculate sum per year
  const yearTotals = Object.entries(donationsByYear).reduce<Record<number, number>>(
    (acc, [year, yearDonations]) => {
      acc[parseInt(year)] = yearDonations.reduce(
        (sum, d) => sum + parseFloat(d.amount),
        0
      );
      return acc;
    },
    {}
  );

  // Sort years descending
  const sortedYears = Object.keys(donationsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading donation history...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sign in required</h2>
              <p className="text-muted-foreground mb-4">
                Please sign in to view your donation history
              </p>
              <Button onClick={() => (window.location.href = "/api/login")}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="bg-muted/30 py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Donation History</h1>
          <p className="text-lg text-muted-foreground max-w-2xl font-serif">
            View all your donations organized by tax year
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {donations.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No donations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Your donation history will appear here once you make your first donation
                </p>
                <Link href="/sponsor">
                  <Button>Make a Donation</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {sortedYears.map((year) => {
              const yearDonations = donationsByYear[year];
              const yearTotal = yearTotals[year];

              return (
                <Card key={year}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{year} Tax Year</span>
                      <span className="text-lg font-bold text-primary">
                        Total: ${yearTotal.toFixed(2)}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      {yearDonations.length} donation{yearDonations.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead className="hidden md:table-cell">Payment Method</TableHead>
                            <TableHead className="hidden md:table-cell">Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {yearDonations
                            .sort(
                              (a, b) =>
                                new Date(b.createdAt || 0).getTime() -
                                new Date(a.createdAt || 0).getTime()
                            )
                            .map((donation) => (
                              <TableRow key={donation.id}>
                                <TableCell>
                                  {donation.createdAt
                                    ? new Date(donation.createdAt).toLocaleDateString()
                                    : "-"}
                                </TableCell>
                                <TableCell className="font-medium">
                                  ${donation.amount}
                                </TableCell>
                                <TableCell className="hidden md:table-cell capitalize">
                                  {donation.paymentMethod || "-"}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-muted-foreground">
                                  {donation.notes || "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
