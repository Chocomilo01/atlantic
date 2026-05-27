import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppHeader from "@/components/AppHeader";
import CourseCard from "./CourseCard";
import { BookOpen } from "lucide-react";

const StudentDashboard = () => {
  const { user } = useAuth();

  // =========================
  // GET STUDENT DEPARTMENTS
  // =========================
  const { data: myDepartments = [] } = useQuery({
    queryKey: ["my-departments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_departments")
        .select(`
          department_id,
          departments(id, name)
        `)
        .eq("user_id", user!.id);

      if (error) throw error;

      return data || [];
    },
  });

  // =========================
  // GET COURSES
  // =========================
  const departmentIds = myDepartments.map(
    (d: any) => d.department_id
  );

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["my-courses", departmentIds],
    enabled: departmentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          departments(name)
        `)
        .in("department_id", departmentIds)
        .order("title");

      if (error) throw error;

      return data || [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            My Courses
          </h1>

          <p className="mt-2 text-muted-foreground">
            {myDepartments.length > 0
              ? `Department: ${myDepartments
                  .map(
                    (d: any) => d.departments?.name
                  )
                  .join(", ")}`
              : "You have not been assigned to a department yet."}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen className="mb-4 h-16 w-16 text-muted-foreground/40" />

            <p className="text-muted-foreground">
              No courses available.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course: any) => (
              <CourseCard
                key={course.id}
                course={course}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;





// import { useQuery } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { useAuth } from "@/contexts/AuthContext";
// import AppHeader from "@/components/AppHeader";
// import CourseCard from "./CourseCard";
// import { BookOpen } from "lucide-react";

// const StudentDashboard = () => {
//   const { user } = useAuth();

//   // Get student's department assignments
//   const { data: myDepartments = [] } = useQuery({
//     queryKey: ["my-departments", user?.id],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from("student_departments")
//         .select("department_id, departments(id, name)")
//         .eq("user_id", user!.id);
//       if (error) throw error;
//       return data;
//     },
//     enabled: !!user,
//   });

//   // Get courses for student's departments
//   const departmentIds = myDepartments.map((d) => d.department_id);

//   const { data: courses = [], isLoading } = useQuery({
//     queryKey: ["my-courses", departmentIds],
//     queryFn: async () => {
//       if (!departmentIds.length) return [];
//       const { data, error } = await supabase
//         .from("courses")
//         .select("*, departments(name)")
//         .in("department_id", departmentIds)
//         .order("title");
//       if (error) throw error;
//       return data;
//     },
//     enabled: departmentIds.length > 0,
//   });

//   return (
//     <div className="min-h-screen bg-background">
//       <AppHeader />
//       <main className="container py-8">
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
//           <p className="mt-2 text-muted-foreground">
//             {myDepartments.length > 0
//               ? `Department: ${myDepartments.map((d) => (d as any).departments?.name).join(", ")}`
//               : "You haven't been assigned to a department yet. Contact your administrator."}
//           </p>
//         </div>

//         {isLoading ? (
//           <div className="flex justify-center py-12">
//             <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
//           </div>
//         ) : courses.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-20 text-center">
//             <BookOpen className="mb-4 h-16 w-16 text-muted-foreground/40" />
//             <p className="text-lg text-muted-foreground">No courses available yet.</p>
//           </div>
//         ) : (
//           <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
//             {courses.map((course) => (
//               <CourseCard key={course.id} course={course} />
//             ))}
//           </div>
//         )}
//       </main>
//     </div>
//   );
// };

// export default StudentDashboard;
