import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, Trash2 } from "lucide-react";

const StudentsTab = () => {
  const qc = useQueryClient();

  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("");

  // =========================
  // DEPARTMENTS
  // =========================

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");

      if (error) throw error;

      return data;
    },
  });

  // =========================
  // STUDENTS
  // =========================

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "student");

      if (rolesErr) throw rolesErr;

      if (!roles?.length) return [];

      const userIds = roles.map((r) => r.user_id);

      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      if (profErr) throw profErr;

      return profiles;
    },
  });

  // =========================
  // INSTRUCTORS
  // =========================

  const { data: instructors = [] } = useQuery({
    queryKey: ["instructors"],
    queryFn: async () => {
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "instructor");

      if (rolesErr) throw rolesErr;

      if (!roles?.length) return [];

      const ids = roles.map((r) => r.user_id);

      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", ids);

      if (profErr) throw profErr;

      return profiles;
    },
  });

  // =========================
  // CURRENT ASSIGNMENTS
  // =========================

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["student_departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_departments")
        .select(`
          *,
          departments(name),
          profiles:user_id(full_name, email)
        `);

      if (error) throw error;

      return data;
    },
  });

  // =========================
  // ASSIGN STUDENT TO DEPARTMENT
  // =========================

  const assignMutation = useMutation({
    mutationFn: async () => {
      // CHECK IF STUDENT ALREADY HAS DEPARTMENT
      const { data: existing } = await supabase
        .from("student_departments")
        .select("id")
        .eq("user_id", selectedStudent)
        .maybeSingle();

      if (existing) {
        throw new Error(
          "Student is already assigned to a department"
        );
      }

      const { error } = await supabase
        .from("student_departments")
        .insert({
          user_id: selectedStudent,
          department_id: selectedDept,
        });

      if (error) throw error;
    },

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["student_departments"],
      });

      setSelectedStudent("");
      setSelectedDept("");

      toast.success("Student assigned to department");
    },

    onError: (e: any) => {
      toast.error(e.message);
    },
  });

  // =========================
  // ASSIGN STUDENT TO INSTRUCTOR
  // =========================

  const assignInstructorMutation = useMutation({
  mutationFn: async () => {

    // CHECK IF STUDENT ALREADY HAS AN INSTRUCTOR
    const { data: existingInstructor } = await supabase
      .from("instructor_students")
      .select("id")
      .eq("student_id", selectedStudent)
      .maybeSingle();

    if (existingInstructor) {
      throw new Error(
        "Student is already assigned to an instructor"
      );
    }

    // INSERT NEW ASSIGNMENT
    const { error } = await supabase
      .from("instructor_students")
      .insert({
        student_id: selectedStudent,
        instructor_id: selectedInstructor,
      });

    if (error) throw error;
  },

  onSuccess: () => {
    toast.success("Instructor assigned successfully");

    setSelectedStudent("");
    setSelectedInstructor("");

    qc.invalidateQueries({
      queryKey: ["instructor_students"],
    });
  },

  onError: (e: any) => {
    toast.error(e.message);
  },
});

  // =========================
  // REMOVE ASSIGNMENT
  // =========================

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("student_departments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["student_departments"],
      });

      toast.success("Assignment removed");
    },

    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  // =========================
  // PROMOTE STUDENT
  // =========================

  const promoteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .update({
          role: "instructor",
        })
        .eq("user_id", userId);

      if (error) throw error;
    },

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["students"],
      });

      qc.invalidateQueries({
        queryKey: ["instructors"],
      });

      toast.success("Promoted to instructor");
    },

    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  return (
    <div className="space-y-8">

      {/* ASSIGN TO DEPARTMENT */}

      <div className="card-elevated p-6">
        <h3 className="mb-4 text-lg font-semibold">
          Assign Student to Department
        </h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            assignMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <Label>Student</Label>

            <Select
              value={selectedStudent}
              onValueChange={setSelectedStudent}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>

              <SelectContent>
                {students.map((s: any) => (
                  <SelectItem
                    key={s.user_id}
                    value={s.user_id}
                  >
                    {s.full_name || s.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Department</Label>

            <Select
              value={selectedDept}
              onValueChange={setSelectedDept}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>

              <SelectContent>
                {departments.map((d: any) => (
                  <SelectItem
                    key={d.id}
                    value={d.id}
                  >
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="btn-primary"
            disabled={
              assignMutation.isPending ||
              !selectedStudent ||
              !selectedDept
            }
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Assign Student
          </Button>
        </form>
      </div>

      {/* ASSIGN TO INSTRUCTOR */}

      <div className="card-elevated p-6">
        <h3 className="mb-4 text-lg font-semibold">
          Assign Student to Instructor
        </h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            assignInstructorMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <Label>Student</Label>

            <Select
              value={selectedStudent}
              onValueChange={setSelectedStudent}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>

              <SelectContent>
                {students.map((s: any) => (
                  <SelectItem
                    key={s.user_id}
                    value={s.user_id}
                  >
                    {s.full_name || s.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Instructor</Label>

            <Select
              value={selectedInstructor}
              onValueChange={setSelectedInstructor}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select instructor" />
              </SelectTrigger>

              <SelectContent>
                {instructors.map((i: any) => (
                  <SelectItem
                    key={i.user_id}
                    value={i.user_id}
                  >
                    {i.full_name || i.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="btn-primary"
            disabled={
              assignInstructorMutation.isPending ||
              !selectedStudent ||
              !selectedInstructor
            }
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Assign Instructor
          </Button>
        </form>
      </div>

      {/* CURRENT STUDENTS */}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          Current Students
        </h3>

        {students.length === 0 ? (
          <p className="text-muted-foreground">
            No students found.
          </p>
        ) : (
          students.map((s: any) => (
            <div
              key={s.user_id}
              className="card-elevated flex items-center justify-between p-4"
            >
              <div>
                <p className="font-semibold text-foreground">
                  {s.full_name || s.email || "Unknown"}
                </p>

                <p className="text-sm text-muted-foreground">
                  {s.email}
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() =>
                  promoteMutation.mutate(s.user_id)
                }
                disabled={promoteMutation.isPending}
              >
                Promote to Instructor
              </Button>
            </div>
          ))
        )}
      </div>

      {/* CURRENT ASSIGNMENTS */}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          Current Department Assignments
        </h3>

        {isLoading ? (
          <p className="text-muted-foreground">
            Loading...
          </p>
        ) : assignments.length === 0 ? (
          <p className="text-muted-foreground">
            No assignments yet.
          </p>
        ) : (
          assignments.map((a: any) => {
            const profile = a.profiles;

            return (
              <div
                key={a.id}
                className="card-elevated flex items-center justify-between p-4"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {profile?.full_name ||
                      profile?.email ||
                      "Unknown"}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {a.departments?.name}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    removeMutation.mutate(a.id)
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentsTab;