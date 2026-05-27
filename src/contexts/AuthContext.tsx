import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "superadmin" | "student" | "instructor" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string): Promise<AppRole> => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch role:", error.message);
      return null;
    }

    if (data?.role) return data.role;

    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "student" as const });

    if (insertError) {
      console.error("Failed to auto-assign student role:", insertError.message);
      return null;
    }

    return "student";
  };

  useEffect(() => {
    let isMounted = true;

    const syncSession = async (currentSession: Session | null) => {
      if (!isMounted) return;

      setLoading(true);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        const resolvedRole = await fetchRole(currentSession.user.id);
        if (!isMounted) return;
        setRole(resolvedRole);
      } else {
        setRole(null);
      }

      if (isMounted) setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      void syncSession(currentSession);
    });

    void supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      void syncSession(currentSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
