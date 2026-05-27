import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";

const StudentGrades = () => {
  const { user } = useAuth();

  const { data: submissions = [], isLoading } =
    useQuery({
      queryKey: ["student-grades", user?.id],

      enabled: !!user,

      queryFn: async () => {
        const { data, error } =
          await supabase
            .from("assignment_submissions")
            .select(`
              id,
              grade,
              feedback,
              submitted_at,
              assignments (
                title
              )
            `)
            .eq("student_id", user?.id)
            .order("submitted_at", {
              ascending: false,
            });

        if (error) throw error;

        return data || [];
      },
    });

  return (
    <div className="card-elevated p-6">
      <h2 className="text-2xl font-bold mb-6">
        My Grades & Feedback
      </h2>

      {isLoading ? (
        <p>Loading...</p>
      ) : submissions.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Assignment
              </TableHead>

              <TableHead>
                Grade
              </TableHead>

              <TableHead>
                Feedback
              </TableHead>

              <TableHead>
                Status
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {submissions.map((sub: any) => (
              <TableRow key={sub.id}>
                <TableCell>
                  {
                    sub.assignments
                      ?.title
                  }
                </TableCell>

                <TableCell>
                  {sub.grade ? (
                    <Badge>
                      {sub.grade}
                    </Badge>
                  ) : (
                    "Pending"
                  )}
                </TableCell>

                <TableCell>
                  {sub.feedback ||
                    "No feedback yet"}
                </TableCell>

                <TableCell>
                  {sub.grade ? (
                    <Badge>
                      Graded
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                    >
                      Awaiting Review
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default StudentGrades;