import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { GraduationCap, Users, BookOpen, Award, LogIn } from "lucide-react";
import heroImg1 from "@/assets/students-hero-1.jpg";
import heroImg2 from "@/assets/students-hero-2.jpg";

const Login = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

 const handleGoogleLogin = async () => {
  setGoogleLoading(true);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    toast.error(error.message || "Google sign-in failed");
    setGoogleLoading(false);
  }
};

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Full-bleed hero */}
      <img
        src={heroImg1}
        alt="Pan-Atlantic students collaborating"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ background: "var(--hero-overlay, linear-gradient(135deg, hsla(200,30%,8%,0.85), hsla(174,72%,22%,0.55)))" }}
      />

      {/* Top bar: brand + Sign In dropdown */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-3 text-primary-foreground">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur-sm">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold font-display leading-tight">Pan-Atlantic</h2>
            <p className="text-xs opacity-80">School of Business & Management</p>
          </div>
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              size="lg"
              className="bg-primary-foreground text-foreground hover:bg-primary-foreground/90 shadow-xl"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={12}
            className="w-[360px] p-6 animate-fade-in"
          >
            <div className="mb-4">
              <h3 className="text-xl font-bold font-display text-foreground">Welcome Back</h3>
              <p className="text-sm text-muted-foreground">Sign in to continue learning</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="mt-1.5"
                />
              </div>
              <Button type="submit" className="btn-primary w-full" disabled={loading || authLoading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-popover px-3 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {googleLoading ? "Signing in..." : "Sign in with Google"}
            </Button>

            <p className="mt-4 pt-4 border-t border-border text-center text-xs text-muted-foreground">
              Need an account? Ask your administrator for a registration link.
            </p>
            <p className="mt-2 text-center">
              <Link to="/staff/login" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Instructor or Admin? Sign in here →
              </Link>
            </p>
          </PopoverContent>
        </Popover>
      </header>

      {/* Hero content */}
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-92px)] max-w-7xl flex-col justify-between px-6 pb-10 pt-8 text-primary-foreground md:px-12">
        <div className="max-w-2xl space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
            Learning Management System
          </span>
          <h1 className="text-4xl font-bold font-display leading-tight md:text-6xl xl:text-7xl">
            Empowering Future<br />Business Leaders
          </h1>
          <p className="max-w-lg text-base font-body leading-relaxed opacity-90 md:text-lg">
            Access world-class lectures, track your progress, and collaborate with instructors — all in one platform.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3 max-w-2xl">
          <div className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 p-4 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/15">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">500+</p>
              <p className="text-xs opacity-75">Students</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 p-4 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/15">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">50+</p>
              <p className="text-xs opacity-75">Courses</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 p-4 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/15">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">95%</p>
              <p className="text-xs opacity-75">Success Rate</p>
            </div>
          </div>
        </div>

        <p className="mt-12 text-xs opacity-60 font-body">© 2026 Pan-Atlantic School of Business & Management</p>
      </main>

      {/* Decorative inset image — hidden on small screens */}
      <div className="pointer-events-none absolute bottom-10 right-10 z-10 hidden xl:block">
        <div className="rounded-2xl overflow-hidden border border-primary-foreground/20 shadow-2xl w-72">
          <img src={heroImg2} alt="Students studying" className="w-full h-44 object-cover" />
        </div>
      </div>
    </div>
  );
};

export default Login;
