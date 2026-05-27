import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const CourseAssignments = ({ courseId }: { courseId: string }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["assignments", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["my-submissions", courseId],
    queryFn: async () => {
      if (!assignments.length) return [];
      const { data, error } = await supabase
        .from("assignment_submissions")
        .select("*")
        .in("assignment_id", assignments.map(a => a.id))
        .eq("student_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user && assignments.length > 0,
  });

  const submitMutation = useMutation({
    mutationFn: async ({ assignmentId, answer }: { assignmentId: string, answer: string }) => {
      const { error } = await supabase.from("assignment_submissions").insert({
        assignment_id: assignmentId,
        student_id: user!.id,
        answer,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-submissions", courseId] });
      toast.success("Assignment submitted!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="mt-8 text-muted-foreground">Loading assignments...</div>;
  if (!assignments.length) return null;

  return (
    <div className="space-y-6 mt-12 border-t pt-8">
      <h2 className="text-2xl font-bold text-foreground">Course Assignments</h2>
      <div className="grid gap-6">
        {assignments.map(a => {
          const submission = submissions.find(s => s.assignment_id === a.id);
          
          return (
            <div key={a.id} className="card-elevated p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{a.title}</h3>
                {submission && (
                  <Badge variant={submission.grade ? "default" : "secondary"}>
                    {submission.grade ? `Graded: ${submission.grade}` : "Submitted"}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mb-6 whitespace-pre-wrap">{a.description}</p>
              
              {submission ? (
                <div className="bg-muted p-4 rounded-md space-y-4">
                  <div>
                    <p className="font-medium text-sm mb-1 text-foreground">Your Answer:</p>
                    <p className="whitespace-pre-wrap text-foreground">{submission.answer}</p>
                  </div>
                  {submission.feedback && (
                    <div className="bg-background p-4 rounded-md border mt-4">
                      <p className="font-medium text-sm text-primary mb-2">Instructor Feedback:</p>
                      <p className="text-foreground">{submission.feedback}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Textarea 
                    placeholder="Write your answer here..."
                    value={answers[a.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [a.id]: e.target.value })}
                    className="min-h-[120px]"
                  />
                  <Button 
                    className="btn-primary"
                    disabled={!answers[a.id]?.trim() || submitMutation.isPending}
                    onClick={() => submitMutation.mutate({ assignmentId: a.id, answer: answers[a.id] })}
                  >
                    Submit Answer
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseAssignments;


// import { useState } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { toast } from "sonner";
// import { Badge } from "@/components/ui/badge";

// const CourseAssignments = ({ courseId }: { courseId: string }) => {
//   const { user } = useAuth();
//   const qc = useQueryClient();
//   const [answers, setAnswers] = useState<Record<string, string>>({});

//   const { data: assignments = [], isLoading } = useQuery({
//     queryKey: ["assignments", courseId],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from("assignments")
//         .select("*")
//         .eq("course_id", courseId)
//         .order("created_at", { ascending: true });
//       if (error) throw error;
//       return data;
//     },
//   });

//   const { data: submissions = [] } = useQuery({
//     queryKey: ["my-submissions", courseId],
//     queryFn: async () => {
//       if (!assignments.length) return [];
//       const { data, error } = await supabase
//         .from("assignment_submissions")
//         .select("*")
//         .in("assignment_id", assignments.map(a => a.id))
//         .eq("student_id", user!.id);
//       if (error) throw error;
//       return data;
//     },
//     enabled: !!user && assignments.length > 0,
//   });

//   const submitMutation = useMutation({
//     mutationFn: async ({ assignmentId, answer }: { assignmentId: string, answer: string }) => {
//       const { error } = await supabase.from("assignment_submissions").insert({
//         assignment_id: assignmentId,
//         student_id: user!.id,
//         answer,
//       });
//       if (error) throw error;
//     },
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["my-submissions", courseId] });
//       toast.success("Assignment submitted!");
//     },
//     onError: (e: Error) => toast.error(e.message),
//   });

//   if (isLoading) return <div className="mt-8 text-muted-foreground">Loading assignments...</div>;
//   if (!assignments.length) return null;

//   return (
//     <div className="space-y-6 mt-12 border-t pt-8">
//       <h2 className="text-2xl font-bold text-foreground">Course Assignments</h2>
//       <div className="grid gap-6">
//         {assignments.map(a => {
//           const submission = submissions.find(s => s.assignment_id === a.id);
          
//           return (
//             <div key={a.id} className="card-elevated p-6">
//               <div className="flex justify-between items-start mb-4">
//                 <h3 className="text-xl font-semibold">{a.title}</h3>
//                 {submission && (
//                   <Badge variant={submission.grade ? "default" : "secondary"}>
//                     {submission.grade ? `Graded: ${submission.grade}` : "Submitted"}
//                   </Badge>
//                 )}
//               </div>
//               <p className="text-muted-foreground mb-6 whitespace-pre-wrap">{a.description}</p>
              
//               {submission ? (
//                 <div className="bg-muted p-4 rounded-md space-y-4">
//                   <div>
//                     <p className="font-medium text-sm mb-1 text-foreground">Your Answer:</p>
//                     <p className="whitespace-pre-wrap text-foreground">{submission.answer}</p>
//                   </div>
//                   {submission.feedback && (
//                     <div className="bg-background p-4 rounded-md border mt-4">
//                       <p className="font-medium text-sm text-primary mb-2">Instructor Feedback:</p>
//                       <p className="text-foreground">{submission.feedback}</p>
//                     </div>
//                   )}
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   <Textarea 
//                     placeholder="Write your answer here..."
//                     value={answers[a.id] || ""}
//                     onChange={(e) => setAnswers({ ...answers, [a.id]: e.target.value })}
//                     className="min-h-[120px]"
//                   />
//                   <Button 
//                     className="btn-primary"
//                     disabled={!answers[a.id]?.trim() || submitMutation.isPending}
//                     onClick={() => submitMutation.mutate({ assignmentId: a.id, answer: answers[a.id] })}
//                   >
//                     Submit Answer
//                   </Button>
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default CourseAssignments;