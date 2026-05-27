import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { ShieldCheck, ArrowLeft, LogIn } from "lucide-react";
import heroImg from "@/assets/students-hero-2.jpg";

const StaffLogin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [authLoading, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success("Logged in successfully!");
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <img
        src={heroImg}
        alt="Pan-Atlantic faculty"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, hsla(200,25%,10%,0.92), hsla(174,72%,22%,0.65))",
        }}
      />

      <header className="relative z-20 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-3 text-primary-foreground">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold font-display leading-tight">Pan-Atlantic</h2>
            <p className="text-xs opacity-80">Staff Portal</p>
          </div>
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              size="lg"
              className="bg-primary-foreground text-foreground hover:bg-primary-foreground/90 shadow-xl"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Staff Sign In
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={12} className="w-[360px] p-6 animate-fade-in">
            <div className="mb-4">
              <h3 className="text-xl font-bold font-display text-foreground">Staff Sign In</h3>
              <p className="text-sm text-muted-foreground">Instructors and administrators</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="staff-email">Email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@panatlantic.edu"
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="staff-password">Password</Label>
                <Input
                  id="staff-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="mt-1.5"
                />
              </div>
              <Button type="submit" className="w-full bg-sidebar-background text-sidebar-foreground hover:bg-sidebar-accent" disabled={loading || authLoading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="mt-4 pt-4 border-t border-border text-center text-xs text-muted-foreground">
              Need a staff account? Ask the super admin for a registration link.
            </p>
            <p className="mt-2 text-center">
              <Link to="/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="h-3 w-3" />
                Back to Student Login
              </Link>
            </p>
          </PopoverContent>
        </Popover>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-92px)] max-w-7xl flex-col justify-end px-6 pb-16 text-primary-foreground md:px-12">
        <div className="max-w-2xl space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            Staff Portal
          </span>
          <h1 className="text-4xl font-bold font-display leading-tight md:text-6xl xl:text-7xl">
            Manage &<br />Inspire
          </h1>
          <p className="max-w-lg text-base font-body leading-relaxed opacity-90 md:text-lg">
            Track student progress, manage courses, and shape the future of business education.
          </p>
        </div>
        <p className="mt-12 text-xs opacity-60 font-body">© 2026 Pan-Atlantic School of Business & Management</p>
      </main>
    </div>
  );
};

export default StaffLogin;
