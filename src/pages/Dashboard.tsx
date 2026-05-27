import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import AdminDashboard from "@/components/admin/AdminDashboard";
import StudentDashboard from "@/components/student/StudentDashboard";
import InstructorDashboard from "@/components/instructor/InstructorDashboard";

const Dashboard = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (role === "superadmin") return <AdminDashboard />;
  if (role === "instructor") return <InstructorDashboard />;
  if (role === "student") return <StudentDashboard />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Your account has not been assigned a role yet. Please contact the administrator.</p>
    </div>
  );
};

export default Dashboard;
