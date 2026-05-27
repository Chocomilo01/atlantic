import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Eye } from "lucide-react";

interface LevelDetail {
  level: number;
  totalLectures: number;
  completedLectures: number;
  assignments: {
    assignmentTitle: string;
    grade: string | null;
    feedback: string | null;
  }[];
}

interface StudentWithDetails {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  completedLectures: number;
  totalLectures: number;
  completionRate: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  levelDetails: LevelDetail[];
}

const StudentProgressTab = () => {
  const { user } = useAuth();

  const { data: progressData = [], isLoading } = useQuery({
    queryKey: ["instructor-students-progress", user?.id],
    enabled: !!user,

    queryFn: async (): Promise<StudentWithDetails[]> => {
      if (!user?.id) return [];

      // 1. Get assigned students
      const { data: assignments, error } = await supabase
        .from("instructor_students")
        .select("student_id")
        .eq("instructor_id", user.id);

      if (error) throw error;
      if (!assignments?.length) return [];

      const studentIds = assignments.map((a) => a.student_id);

      // 2. Fetch data (FIXED: use "id" consistently)
      const [
        profilesRes,
        progressRes,
        lecturesRes,
        submissionsRes,
        assignmentsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*").in("id", studentIds),

        supabase
          .from("video_progress")
          .select("user_id, lecture_id, completed, progress_seconds")
          .in("user_id", studentIds),

        supabase
          .from("lectures")
          .select("id, title, level, course_id, sort_order")
          .order("level")
          .order("sort_order"),

        supabase
          .from("assignment_submissions")
          .select("student_id, assignment_id, grade, feedback")
          .in("student_id", studentIds),

        supabase.from("assignments").select("id, title, course_id"),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (progressRes.error) throw progressRes.error;
      if (lecturesRes.error) throw lecturesRes.error;
      if (submissionsRes.error) throw submissionsRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;

      const profiles = profilesRes.data || [];
      const allLectures = lecturesRes.data || [];
      const allAssignments = assignmentsRes.data || [];

      const totalLectures = allLectures.length;

      return profiles.map((profile: any) => {
        const userProgress =
          progressRes.data?.filter((p) => p.user_id === profile.id) || [];

        const completedLectures = userProgress.filter(
          (p) => p.completed
        ).length;

        const completionRate = totalLectures
          ? Math.round((completedLectures / totalLectures) * 100)
          : 0;

        const studentSubmissions =
          submissionsRes.data?.filter(
            (s) => s.student_id === profile.id
          ) || [];

        const gradedCount = studentSubmissions.filter(
          (s) => s.grade
        ).length;

        const levels = [
          ...new Set(allLectures.map((l: any) => l.level)),
        ].sort((a: any, b: any) => a - b);

        const levelDetails: LevelDetail[] = levels.map((level: any) => {
          const levelLectures = allLectures.filter(
            (l: any) => l.level === level
          );

          const completedInLevel = levelLectures.filter((lecture: any) =>
            userProgress.some(
              (p) => p.lecture_id === lecture.id && p.completed
            )
          ).length;

          const courseIds = [
            ...new Set(levelLectures.map((l: any) => l.course_id)),
          ];

          const levelAssignments = allAssignments.filter((a: any) =>
            courseIds.includes(a.course_id)
          );

          const levelGrades = levelAssignments.map((assignment: any) => {
            const sub = studentSubmissions.find(
              (s) => s.assignment_id === assignment.id
            );

            return {
              assignmentTitle: assignment.title,
              grade: sub?.grade || null,
              feedback: sub?.feedback || null,
            };
          });

          return {
            level,
            totalLectures: levelLectures.length,
            completedLectures: completedInLevel,
            assignments: levelGrades,
          };
        });

        return {
          id: profile.id,
          user_id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          completedLectures,
          totalLectures,
          completionRate,
          totalSubmissions: studentSubmissions.length,
          gradedSubmissions: gradedCount,
          levelDetails,
        };
      });
    },
  });

  return (
    <div className="card-elevated p-6">
      <h2 className="mb-4 text-xl font-bold">My Students' Progress</h2>

      {isLoading ? (
        <p>Loading...</p>
      ) : progressData.length === 0 ? (
        <p>No students assigned to you yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {progressData.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.full_name || student.email}</TableCell>
                <TableCell>{student.email}</TableCell>

                <TableCell>
                  <Progress value={student.completionRate} />
                  {student.completionRate}%
                </TableCell>

                <TableCell>
                  {student.gradedSubmissions}/{student.totalSubmissions}
                </TableCell>

                <TableCell>
                  <StudentDetailDialog student={student} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

const StudentDetailDialog = ({ student }: { student: StudentWithDetails }) => {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{student.full_name || student.email}</DialogTitle>
        </DialogHeader>

        {student.levelDetails.map((ld) => (
          <div key={ld.level} className="border rounded-md mb-2">
            <button
              className="w-full flex justify-between p-2"
              onClick={() =>
                setExpandedLevel(expandedLevel === ld.level ? null : ld.level)
              }
            >
              <span>Level {ld.level}</span>
              {expandedLevel === ld.level ? <ChevronDown /> : <ChevronRight />}
            </button>

            {expandedLevel === ld.level && (
              <div className="p-2 text-sm">
                {ld.completedLectures}/{ld.totalLectures} lectures
              </div>
            )}
          </div>
        ))}
      </DialogContent>
    </Dialog>
  );
};

export default StudentProgressTab;