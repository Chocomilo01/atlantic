import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const CoursesTab = () => {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*, departments(name)").order("title");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("courses").insert({ title, department_id: departmentId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      setTitle("");
      setDepartmentId("");
      toast.success("Course added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="card-elevated p-6">
        <h3 className="mb-4 text-lg font-semibold font-body text-foreground">Add Course</h3>
        <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate(); }} className="space-y-4">
          <div>
            <Label>Department</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Course Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Introduction to Programming" required className="mt-1" />
          </div>
          <Button type="submit" className="btn-primary" disabled={addMutation.isPending || !departmentId}>
            <Plus className="mr-2 h-4 w-4" /> Add Course
          </Button>
        </form>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : courses.length === 0 ? (
          <p className="text-muted-foreground">No courses yet.</p>
        ) : (
          courses.map((c) => (
            <div key={c.id} className="card-elevated flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-foreground">{c.title}</p>
                <p className="text-sm text-muted-foreground">{(c as any).departments?.name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CoursesTab;
