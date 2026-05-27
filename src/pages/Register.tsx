import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap, BookOpen, ShieldAlert } from "lucide-react";

type Invitation = {
  id: string;
  token: string;
  role: "student" | "instructor";
  email: string | null;
  used_at: string | null;
  expires_at: string;
};

const Register = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setInviteError("No registration link provided. Please request a link from your administrator.");
        setChecking(false);
        return;
      }
      const { data, error } = await (supabase as any)
        .from("registration_invitations")
        .select("*")
        .eq("token", token)
        .maybeSingle();
      if (error || !data) {
        setInviteError("This registration link is invalid.");
        setChecking(false);
        return;
      }
      if (data.used_at) {
        setInviteError("This registration link has already been used.");
        setChecking(false);
        return;
      }
      if (new Date(data.expires_at) < new Date()) {
        setInviteError("This registration link has expired.");
        setChecking(false);
        return;
      }
      setInvitation(data);
      if (data.email) setEmail(data.email);
      setChecking(false);
    };
    validate();
  }, [token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: data.user.id, role: invitation.role });
      if (roleError && roleError.code !== "23505") {
        toast.error("Account created, but role setup failed. Contact admin.");
        setLoading(false);
        return;
      }

      await (supabase as any)
        .from("registration_invitations")
        .update({ used_at: new Date().toISOString(), used_by: data.user.id })
        .eq("id", invitation.id);
    }

    toast.success("Registration successful! Please check your email to confirm.");
    navigate(invitation.role === "instructor" ? "/staff/login" : "/login");
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md card-elevated p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-display">Registration Unavailable</h1>
          <p className="mt-3 text-muted-foreground">{inviteError}</p>
          <Link to="/login" className="mt-6 inline-block text-primary font-semibold hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  const isInstructor = invitation!.role === "instructor";
  const Icon = isInstructor ? BookOpen : GraduationCap;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full gradient-primary">
            <Icon className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground font-display">
            {isInstructor ? "Instructor Registration" : "Student Registration"}
          </h1>
          <p className="mt-2 text-muted-foreground font-body">
            You've been invited to join Pan-Atlantic LMS
          </p>
        </div>

        <div className="card-elevated p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isInstructor ? "Dr. Jane Smith" : "John Doe"}
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={!!invitation!.email}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1.5"
              />
            </div>
            <Button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Creating account..." : "Complete Registration"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to={isInstructor ? "/staff/login" : "/login"}
              className="text-primary font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
