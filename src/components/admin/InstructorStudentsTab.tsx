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

const InstructorStudentsTab = () => {
  const qc = useQueryClient();

  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  // =========================================
  // FETCH INSTRUCTORS
  // =========================================

  const { data: instructors = [] } = useQuery({
    queryKey: ["instructors"],

    queryFn: async () => {
      const { data: roles, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (roleError) throw roleError;

      // filter instructor roles safely
      const instructorRoles =
        roles?.filter(
          (r) =>
            r.role?.toLowerCase() === "instructor"
        ) || [];

      if (instructorRoles.length === 0) return [];

      const instructorIds = instructorRoles
  .map((r) => r.user_id)
  .filter(Boolean);

      const { data: profiles, error: profileError } =
        await supabase
          .from("profiles")
          .select("*")
          .in("user_id", instructorIds);

      if (profileError) throw profileError;

      return profiles || [];
    },
  });

  // =========================================
  // FETCH STUDENTS
  // =========================================

  const { data: students = [] } = useQuery({
    queryKey: ["students"],

    queryFn: async () => {
      const { data: roles, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (roleError) throw roleError;

      const studentRoles =
        roles?.filter(
          (r) =>
            r.role?.toLowerCase() === "student"
        ) || [];

      if (studentRoles.length === 0) return [];

      const studentIds = studentRoles.map(
        (r) => r.user_id
      );

      const { data: profiles, error: profileError } =
        await supabase
          .from("profiles")
          .select("*")
          .in("user_id", studentIds);

      if (profileError) throw profileError;

      return profiles || [];
    },
  });

  // =========================================
  // FETCH ASSIGNMENTS
  // =========================================

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["instructor_students"],

    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_students")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;

      return data || [];
    },
  });

  // =========================================
  // ASSIGN STUDENT TO INSTRUCTOR
  // =========================================

  const assignMutation = useMutation({
  mutationFn: async () => {

    // =====================================
    // CHECK IF STUDENT ALREADY ASSIGNED
    // =====================================

    const { data: existingAssignment, error: checkError } =
      await supabase
        .from("instructor_students")
        .select("id")
        .eq("student_id", selectedStudent)
        .maybeSingle();

    if (checkError) throw checkError;

    if (existingAssignment) {
      throw new Error(
        "Student is already assigned to an instructor"
      );
    }

    // =====================================
    // INSERT NEW ASSIGNMENT
    // =====================================

    const { error } = await supabase
      .from("instructor_students")
      .insert({
        instructor_id: selectedInstructor,
        student_id: selectedStudent,
      });

    if (error) throw error;
  },

  onSuccess: () => {
    qc.invalidateQueries({
      queryKey: ["instructor_students"],
    });

    setSelectedInstructor("");
    setSelectedStudent("");

    toast.success(
      "Student assigned to instructor"
    );
  },

  onError: (e: any) => {
    toast.error(e.message);
  },
});

  // =========================================
  // REMOVE ASSIGNMENT
  // =========================================

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("instructor_students")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["instructor_students"],
      });

      toast.success("Assignment removed");
    },

    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  // =========================================
  // HELPERS
  // =========================================

  const getProfile = (userId: string) => {
    return [...instructors, ...students].find(
      (p: any) => p.user_id === userId
    );
  };

  // =========================================
  // UI
  // =========================================

  return (
    <div className="space-y-8">

      {/* ASSIGN FORM */}

      <div className="card-elevated p-6">
        <h3 className="mb-4 text-lg font-semibold">
          Assign Student to Instructor
        </h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            assignMutation.mutate();
          }}
          className="space-y-4"
        >

          {/* INSTRUCTOR */}

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
  {instructors.length === 0 ? (
    <div className="p-2 text-sm text-muted-foreground">
      No instructors found
    </div>
  ) : (
    instructors.map((i: any) => {
      console.log("Instructor:", i);

      return (
        <SelectItem
          key={i.user_id || i.id}
          value={String(i.user_id || i.id)}
        >
          {i.full_name || i.email || "Unnamed Instructor"}
        </SelectItem>
      );
    })
  )}
</SelectContent>
            </Select>
          </div>

          {/* STUDENT */}

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

          <Button
            type="submit"
            className="btn-primary"
            disabled={
              assignMutation.isPending ||
              !selectedInstructor ||
              !selectedStudent
            }
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Assign Student
          </Button>
        </form>
      </div>

      {/* CURRENT ASSIGNMENTS */}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          Current Assignments
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
            const instructor = getProfile(
              a.instructor_id
            );

            const student = getProfile(
              a.student_id
            );

            return (
              <div
                key={a.id}
                className="card-elevated flex items-center justify-between p-4"
              >
                <div>
                  <p className="font-semibold">
                    {student?.full_name ||
                      student?.email ||
                      "Unknown Student"}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Assigned to:{" "}
                    {instructor?.full_name ||
                      instructor?.email ||
                      "Unknown Instructor"}
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

export default InstructorStudentsTab;