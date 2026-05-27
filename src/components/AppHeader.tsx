import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AppHeader = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-display text-foreground leading-tight">Pan-Atlantic</h2>
            <p className="text-xs text-muted-foreground">School of Business & Management</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-muted-foreground sm:block">
            {user?.email} • <span className="capitalize font-semibold text-primary">{role}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
