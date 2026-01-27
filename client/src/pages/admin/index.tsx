import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Shield,
  Users,
  Leaf,
  Heart,
  Award,
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  UserCheck,
  AlertTriangle,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import type { Plant, Sponsor, Donation, User, PlantStatus, UserPreferences } from "@shared/schema";

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [masqueradeUserId, setMasqueradeUserId] = useState<string | null>(null);
  const [plantsPage, setPlantsPage] = useState(1);
  const plantsPerPage = 10;

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin area",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, isAdmin, setLocation, toast]);

  const { data: plants = [] } = useQuery<Plant[]>({
    queryKey: ["/api/plants"],
    enabled: isAdmin,
  });

  const { data: sponsors = [] } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
    enabled: isAdmin,
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin,
  });

  const { data: allDonations = [] } = useQuery<Donation[]>({
    queryKey: ["/api/admin/donations"],
    enabled: isAdmin,
  });

  const { data: userPreferences = [] } = useQuery<UserPreferences[]>({
    queryKey: ["/api/admin/user-preferences"],
    enabled: isAdmin,
  });

  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [editStatus, setEditStatus] = useState<PlantStatus | "auto">("out_of_season");
  const currentYear = new Date().getFullYear();
  const preferencesByUserId = userPreferences.reduce<Record<string, UserPreferences>>((acc, pref) => {
    acc[pref.userId] = pref;
    return acc;
  }, {});

  const updatePlantMutation = useMutation({
    mutationFn: async ({ plantId, status }: { plantId: number; status: PlantStatus }) => {
      return apiRequest("PUT", `/api/admin/plants/${plantId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      setEditingPlant(null);
      toast({
        title: "Success",
        description: "Plant status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update plant status",
        variant: "destructive",
      });
    },
  });

  const updateAutoStatusMutation = useMutation({
    mutationFn: async ({ plantId }: { plantId: number }) => {
      return apiRequest("PUT", `/api/admin/plants/${plantId}/auto-status`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      setEditingPlant(null);
      toast({
        title: "Success",
        description: "Plant status recalculated from harvest dates",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to recalculate plant status",
        variant: "destructive",
      });
    },
  });

  const updateTaxVisibilityMutation = useMutation({
    mutationFn: async ({ userId, taxDocumentsVisible }: { userId: string; taxDocumentsVisible: boolean }) => {
      return apiRequest("PUT", `/api/admin/users/${userId}/tax-visibility`, { taxDocumentsVisible });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-preferences"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tax document visibility",
        variant: "destructive",
      });
    },
  });

  const handleEditPlant = (plant: Plant) => {
    setEditingPlant(plant);
    setEditStatus(plant.status || "out_of_season");
  };

  const handleSavePlantStatus = () => {
    if (editingPlant) {
      if (editStatus === "auto") {
        // Call the auto-status endpoint instead
        updateAutoStatusMutation.mutate({ plantId: editingPlant.id });
      } else {
        // Normal status update
        updatePlantMutation.mutate({
          plantId: editingPlant.id,
          status: editStatus as PlantStatus,
        });
      }
    }
  };

  const masqueradeMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", "/api/admin/masquerade", { userId });
    },
    onSuccess: () => {
      toast({
        title: "Masquerade Active",
        description: "You are now viewing as the selected user. Refresh to see their view.",
      });
      setMasqueradeUserId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start masquerade session",
        variant: "destructive",
      });
    },
  });

  const endMasqueradeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/end-masquerade", {});
    },
    onSuccess: () => {
      toast({
        title: "Masquerade Ended",
        description: "You are back to your admin account",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const usersById = allUsers.reduce<Record<string, User>>((acc, userItem) => {
    acc[userItem.id] = userItem;
    return acc;
  }, {});

  const filteredUsers = allUsers.filter(
    (u) =>
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDonations = allDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  const yearDonations = allDonations.filter((d) => d.taxYear === currentYear);
  const yearTotal = yearDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);

  // Pagination for plants
  const totalPlantsPages = Math.ceil(plants.length / plantsPerPage);
  const startIndex = (plantsPage - 1) * plantsPerPage;
  const endIndex = startIndex + plantsPerPage;
  const paginatedPlants = plants.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-muted/30">
      <section className="bg-background border-b py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage your garden data</p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Back to User View
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Leaf className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{plants.length}</p>
                  <p className="text-xs text-muted-foreground">Plants</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{allUsers.length}</p>
                  <p className="text-xs text-muted-foreground">Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">${totalDonations.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Donations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{sponsors.length}</p>
                  <p className="text-xs text-muted-foreground">Sponsors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
            <TabsTrigger value="users" className="text-xs sm:text-sm" data-testid="tab-admin-users">
              <Users className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="plants" className="text-xs sm:text-sm" data-testid="tab-admin-plants">
              <Leaf className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Plants</span>
            </TabsTrigger>
            <TabsTrigger value="donations" className="text-xs sm:text-sm" data-testid="tab-admin-donations">
              <Heart className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Donations</span>
            </TabsTrigger>
            <TabsTrigger value="sponsors" className="text-xs sm:text-sm" data-testid="tab-admin-sponsors">
              <Award className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Sponsors</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>View and manage user accounts</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-users"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-6 px-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="hidden md:table-cell">Joined</TableHead>
                        <TableHead>Tax Docs</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => {
                        const taxVisible = preferencesByUserId[u.id]?.taxDocumentsVisible !== false;
                        return (
                          <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                {u.firstName?.[0] || u.email?.[0] || "?"}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {u.firstName} {u.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground sm:hidden truncate">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{u.email}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                u.role === "admin" 
                                  ? "default" 
                                  : u.role === "company"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                u.role === "company"
                                  ? "bg-blue-500 text-white hover:bg-blue-600"
                                  : ""
                              }
                            >
                              {u.role || "user"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={taxVisible ? "default" : "outline"}
                              onClick={() =>
                                updateTaxVisibilityMutation.mutate({
                                  userId: u.id,
                                  taxDocumentsVisible: !taxVisible,
                                })
                              }
                              data-testid={`button-tax-visibility-${u.id}`}
                            >
                              {taxVisible ? "Visible" : "Hidden"}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  window.open(`/api/donations/tax-document/${u.id}?year=${currentYear}`, "_blank");
                                }}
                                data-testid={`button-view-tax-${u.id}`}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={u.id === user?.id}
                                    data-testid={`button-masquerade-${u.id}`}
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Masquerade as User</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        {u.firstName?.[0] || "?"}
                                      </div>
                                      <div>
                                        <p className="font-medium">{u.firstName} {u.lastName}</p>
                                        <p className="text-sm text-muted-foreground">{u.email}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                      <p className="text-sm text-amber-800 dark:text-amber-200">
                                        You will view the site as this user. All actions will be logged. 
                                        Use this only for troubleshooting.
                                      </p>
                                    </div>
                                    <Button
                                      className="w-full"
                                      onClick={() => masqueradeMutation.mutate(u.id)}
                                      disabled={masqueradeMutation.isPending}
                                      data-testid="button-confirm-masquerade"
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View as {u.firstName || "User"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plants">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Plant Inventory</CardTitle>
                    <CardDescription>Manage plant listings and status</CardDescription>
                  </div>
                  <Link href="/admin/plants/new">
                    <Button size="sm" data-testid="button-add-plant">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Plant
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-6 px-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plant</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Harvest</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPlants.map((plant) => (
                        <TableRow key={plant.id} data-testid={`row-plant-${plant.id}`}>
                          <TableCell className="font-medium">{plant.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{plant.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                plant.status === "ready"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                  : plant.status === "coming_soon"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                  : ""
                              }
                            >
                              {plant.status?.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {plant.harvestStart} - {plant.harvestEnd}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8" 
                                data-testid={`button-edit-plant-${plant.id}`}
                                onClick={() => handleEditPlant(plant)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {plants.length > plantsPerPage && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setPlantsPage((p) => Math.max(1, p - 1))}
                            className={plantsPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPlantsPages }, (_, i) => i + 1).map((page) => {
                          if (
                            page === 1 ||
                            page === totalPlantsPages ||
                            (page >= plantsPage - 1 && page <= plantsPage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setPlantsPage(page)}
                                  isActive={plantsPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (page === plantsPage - 2 || page === plantsPage + 2) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setPlantsPage((p) => Math.min(totalPlantsPages, p + 1))}
                            className={plantsPage === totalPlantsPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Showing {startIndex + 1}-{Math.min(endIndex, plants.length)} of {plants.length} plants
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="donations">
            <Card>
              <CardHeader>
                <CardTitle>Donation History</CardTitle>
                <CardDescription>View all donations across users</CardDescription>
              </CardHeader>
              <CardContent>
                {allDonations.length > 0 ? (
                  <div className="overflow-x-auto -mx-6 px-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead className="hidden md:table-cell">Tax Year</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allDonations.map((donation) => {
                          const donationUser = usersById[donation.userId];
                          const userLabel =
                            donationUser?.firstName || donationUser?.lastName
                              ? `${donationUser?.firstName || ""} ${donationUser?.lastName || ""}`.trim()
                              : donationUser?.email || donation.userId;

                          return (
                            <TableRow key={donation.id} data-testid={`row-donation-${donation.id}`}>
                              <TableCell>
                                {donation.createdAt ? new Date(donation.createdAt).toLocaleDateString() : "-"}
                              </TableCell>
                              <TableCell>{userLabel}</TableCell>
                              <TableCell className="font-medium">${donation.amount}</TableCell>
                              <TableCell className="hidden md:table-cell">{donation.taxYear}</TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell colSpan={2} className="text-right">
                            Total Donations ({currentYear}):
                          </TableCell>
                          <TableCell className="font-bold text-lg">${yearTotal.toFixed(2)}</TableCell>
                          <TableCell className="hidden md:table-cell"></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No donations yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sponsors">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Sponsor Management</CardTitle>
                    <CardDescription>Manage sponsor tiers and recognition</CardDescription>
                  </div>
                  <Link href="/admin/sponsors/new">
                    <Button size="sm" data-testid="button-add-sponsor">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Sponsor
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {sponsors.length > 0 ? (
                  <div className="overflow-x-auto -mx-6 px-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sponsor</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sponsors.map((sponsor) => (
                          <TableRow key={sponsor.id} data-testid={`row-sponsor-${sponsor.id}`}>
                            <TableCell className="font-medium">{sponsor.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{sponsor.tier}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={sponsor.isActive ? "default" : "secondary"}>
                                {sponsor.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-edit-sponsor-${sponsor.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" data-testid={`button-delete-sponsor-${sponsor.id}`}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No sponsors yet</p>
                    <Link href="/admin/sponsors/new">
                      <Button variant="outline" size="sm" className="mt-3">
                        Add First Sponsor
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Plant Status Dialog */}
      <Dialog open={!!editingPlant} onOpenChange={(open) => !open && setEditingPlant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Plant Status</DialogTitle>
            <DialogDescription>
              Update the status for {editingPlant?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as PlantStatus | "auto")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ready">Ready Now</SelectItem>
                  <SelectItem value="coming_soon">Coming Soon</SelectItem>
                  <SelectItem value="out_of_season">Out of Season</SelectItem>
                  <SelectItem value="auto">Auto (By Harvest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingPlant(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePlantStatus}
                disabled={updatePlantMutation.isPending || updateAutoStatusMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
