import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Eye, X } from "lucide-react";

interface MasqueradeStatus {
  isMasquerading: boolean;
  asUser?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  originalAdmin?: {
    id: string;
    email: string;
  };
}

export function MasqueradeBanner() {
  const { data: status } = useQuery<MasqueradeStatus>({
    queryKey: ["/api/admin/masquerade-status"],
    refetchInterval: 30000,
  });

  const endMasqueradeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/end-masquerade", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/masquerade-status"] });
      window.location.reload();
    },
  });

  if (!status?.isMasquerading) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-amber-950 py-2 px-4 text-center text-sm font-medium">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span>
            Viewing as: <strong>{status.asUser?.firstName} {status.asUser?.lastName}</strong> ({status.asUser?.email})
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 bg-white/20 border-amber-700 text-amber-950 hover:bg-white/30"
          onClick={() => endMasqueradeMutation.mutate()}
          disabled={endMasqueradeMutation.isPending}
          data-testid="button-end-masquerade"
        >
          <X className="h-3 w-3 mr-1" />
          End Masquerade
        </Button>
      </div>
    </div>
  );
}
