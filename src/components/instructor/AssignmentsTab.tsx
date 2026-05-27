import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { toast } from "sonner";

const AssignmentsTab = () => {
  const { user } = useAuth();

  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [courseId, setCourseId] =
    useState("");

  // FETCH COURSES
  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],

    queryFn: async () => {
      const { data, error } =
        await supabase
          .from("courses")
          .select("*")
          .order("title");

      if (error) throw error;

      return data || [];
    },
  });

  // FETCH ASSIGNMENTS
  const {
  data: assignments = [],
  isLoading,
} = useQuery({
  queryKey: ["assignments-instructor"],

  queryFn: async () => {
    const { data, error } =
      await supabase
        .from("assignments")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (error) throw error;

    if (!data || data.length === 0)
      return [];

    const courseIds = data.map(
      (a) => a.course_id
    );

    const {
      data: coursesData,
      error: coursesError,
    } = await supabase
      .from("courses")
      .select("id, title")
      .in("id", courseIds);

    if (coursesError)
      throw coursesError;

    return data.map((assignment) => ({
      ...assignment,

      courses: coursesData?.find(
        (c) =>
          c.id ===
          assignment.course_id
      ),
    }));
  },

  enabled: !!user,
});

  // CREATE ASSIGNMENT
  const createMutation = useMutation({
  mutationFn: async () => {
    if (
      !title.trim() ||
      !description.trim() ||
      !courseId
    ) {
      throw new Error(
        "All fields are required"
      );
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      course_id: courseId,
    };

    const { error } = await supabase
      .from("assignments")
      .insert(payload as any);

    if (error) {
      console.error(error);
      throw error;
    }
  },

  onSuccess: () => {
    qc.invalidateQueries({
      queryKey: [
        "assignments-instructor",
      ],
    });

    setTitle("");
    setDescription("");
    setCourseId("");

    toast.success(
      "Assignment created"
    );
  },

  onError: (e: Error) => {
    console.error(e);
    toast.error(e.message);
  },
});

  return (
    <div className="space-y-6">
      {/* CREATE ASSIGNMENT */}
      <div className="card-elevated p-6">
        <h3 className="mb-4 text-lg font-semibold">
          Create Assignment
        </h3>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
          {/* COURSE */}
          <div>
            <Label>
              Select Course
            </Label>

            <Select
              value={courseId}
              onValueChange={setCourseId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose course" />
              </SelectTrigger>

              <SelectContent>
                {courses.map((course: any) => (
                  <SelectItem
                    key={course.id}
                    value={course.id}
                  >
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* TITLE */}
          <div>
            <Label>
              Assignment Title
            </Label>

            <Input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Enter assignment title"
              required
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <Label>
              Instructions
            </Label>

            <Textarea
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Write instructions..."
              className="min-h-[140px]"
              required
            />
          </div>

          <Button
            type="submit"
            className="btn-primary"
            disabled={
              createMutation.isPending
            }
          >
            {createMutation.isPending
              ? "Creating..."
              : "Create Assignment"}
          </Button>
        </form>
      </div>

      {/* ASSIGNMENTS LIST */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          All Assignments
        </h3>

        {isLoading ? (
          <p className="text-muted-foreground">
            Loading assignments...
          </p>
        ) : assignments.length === 0 ? (
          <p className="text-muted-foreground">
            No assignments found.
          </p>
        ) : (
          assignments.map((a: any) => (
            <div
              key={a.id}
              className="card-elevated p-5 flex flex-col gap-4"
            >
              <div>
                <h4 className="text-lg font-semibold">
                  {a.title}
                </h4>

                <p className="text-sm text-muted-foreground">
                  Course:{" "}
                  {a.courses?.title ||
                    "Unknown"}
                </p>
              </div>

              <p className="whitespace-pre-wrap">
                {a.description}
              </p>

              <SubmissionsDialog
                assignmentId={a.id}
                assignmentTitle={a.title}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface SubmissionDialogProps {
  assignmentId: string;
  assignmentTitle: string;
}

const SubmissionsDialog = ({
  assignmentId,
  assignmentTitle,
}: SubmissionDialogProps) => {
  const qc = useQueryClient();

  // FETCH SUBMISSIONS
  const {
    data: submissions = [],
  } = useQuery({
    queryKey: [
      "submissions",
      assignmentId,
    ],

    queryFn: async () => {
      const { data, error } =
        await supabase
          .from(
            "assignment_submissions"
          )
          .select("*")
          .eq(
            "assignment_id",
            assignmentId
          )
          .order("submitted_at", {
            ascending: false,
          });

      if (error) throw error;

      if (!data || data.length === 0)
        return [];

      const studentIds = data.map(
        (s) => s.student_id
      );

      const {
        data: profiles,
        error: profileErr,
      } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", studentIds);

      if (profileErr)
        throw profileErr;

      return data.map((sub) => ({
        ...sub,
        profile: profiles?.find(
          (p) =>
            p.user_id ===
            sub.student_id
        ),
      }));
    },
  });

  // GRADE SUBMISSION
  const gradeMutation = useMutation({
    mutationFn: async ({
      id,
      grade,
      feedback,
    }: {
      id: string;
      grade: string;
      feedback: string;
    }) => {
      const { error } =
        await supabase
          .from(
            "assignment_submissions"
          )
          .update({
            grade,
            feedback,
          })
          .eq("id", id);

      if (error) throw error;
    },

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [
          "submissions",
          assignmentId,
        ],
      });

      toast.success(
        "Grade saved"
      );
    },

    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          View Submissions (
          {submissions.length})
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {assignmentTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {submissions.length ===
          0 ? (
            <p className="text-muted-foreground">
              No submissions yet.
            </p>
          ) : (
            submissions.map(
              (sub: any) => (
                <div
                  key={sub.id}
                  className="border rounded-lg p-4 space-y-4"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">
                        {sub.profile
                          ?.full_name ||
                          sub.profile
                            ?.email}
                      </p>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {new Date(
                        sub.submitted_at
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="bg-muted rounded-md p-4">
                    <p className="whitespace-pre-wrap">
                      {sub.answer}
                    </p>
                  </div>

                  <form
                    className="space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();

                      const form =
                        new FormData(
                          e.currentTarget
                        );

                      gradeMutation.mutate(
                        {
                          id: sub.id,
                          grade:
                            form.get(
                              "grade"
                            ) as string,
                          feedback:
                            form.get(
                              "feedback"
                            ) as string,
                        }
                      );
                    }}
                  >
                    <div>
                      <Label>
                        Feedback
                      </Label>

                      <Textarea
                        name="feedback"
                        defaultValue={
                          sub.feedback ||
                          ""
                        }
                      />
                    </div>

                    <div>
                      <Label>
                        Grade
                      </Label>

                      <Input
                        name="grade"
                        defaultValue={
                          sub.grade ||
                          ""
                        }
                      />
                    </div>

                    <Button
                      type="submit"
                      size="sm"
                      disabled={
                        gradeMutation.isPending
                      }
                    >
                      Save Grade
                    </Button>
                  </form>
                </div>
              )
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentsTab;