import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const DepartmentsTab = () => {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("departments").insert({ name, description: description || null });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      setName("");
      setDescription("");
      toast.success("Department added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("departments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="card-elevated p-6">
        <h3 className="mb-4 text-lg font-semibold font-body text-foreground">Add Department</h3>
        <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate(); }} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. BSc in Computer Science" required className="mt-1" />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." className="mt-1" />
          </div>
          <Button type="submit" className="btn-primary" disabled={addMutation.isPending}>
            <Plus className="mr-2 h-4 w-4" /> Add Department
          </Button>
        </form>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : departments.length === 0 ? (
          <p className="text-muted-foreground">No departments yet.</p>
        ) : (
          departments.map((d) => (
            <div key={d.id} className="card-elevated flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-foreground">{d.name}</p>
                {d.description && <p className="text-sm text-muted-foreground">{d.description}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(d.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DepartmentsTab;
