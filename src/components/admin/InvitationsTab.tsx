import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link2, Copy, Trash2, Check } from "lucide-react";

type InviteRole = "student" | "instructor";

const InvitationsTab = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [role, setRole] = useState<InviteRole>("student");
  const [email, setEmail] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ["registration_invitations"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("registration_invitations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("registration_invitations").insert({
        role,
        email: email || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["registration_invitations"] });
      setEmail("");
      toast.success("Invitation link created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("registration_invitations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["registration_invitations"] });
      toast.success("Invitation deleted");
    },
  });

  const buildUrl = (token: string) =>
    `${window.location.origin}/register?token=${token}`;

  const copyLink = async (id: string, token: string) => {
    await navigator.clipboard.writeText(buildUrl(token));
    setCopiedId(id);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopiedId(null), 1500);
  };

  const statusOf = (inv: any) => {
    if (inv.used_at) return { label: "Used", variant: "secondary" as const };
    if (new Date(inv.expires_at) < new Date())
      return { label: "Expired", variant: "destructive" as const };
    return { label: "Active", variant: "default" as const };
  };

  return (
    <div className="space-y-8">
      <div className="card-elevated p-6">
        <h3 className="mb-4 text-lg font-semibold font-body text-foreground">
          Generate Registration Link
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as InviteRole)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Email (optional)</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="invitee@example.com"
                className="mt-1.5"
              />
            </div>
          </div>
          <Button type="submit" className="btn-primary" disabled={createMutation.isPending}>
            <Link2 className="mr-2 h-4 w-4" /> Generate Link
          </Button>
        </form>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Invitation Links</h3>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : invitations.length === 0 ? (
          <p className="text-muted-foreground">No invitations yet. Generate one above.</p>
        ) : (
          invitations.map((inv) => {
            const status = statusOf(inv);
            return (
              <div key={inv.id} className="card-elevated p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="capitalize">
                        {inv.role}
                      </Badge>
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {inv.email && (
                        <span className="text-sm text-muted-foreground">
                          for {inv.email}
                        </span>
                      )}
                    </div>
                    <code className="block truncate text-xs text-muted-foreground">
                      {buildUrl(inv.token)}
                    </code>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Expires {new Date(inv.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!inv.used_at && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(inv.id, inv.token)}
                      >
                        {copiedId === inv.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(inv.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InvitationsTab;
