import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../supabase";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role: "owner" | "admin" | "member";
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  accessToken: string | null;
  profile: UserProfile | null;
  organizations: Organization[];
  activeOrg: Organization | null;
  loading: boolean;
  isConfigured: boolean;
  recoveryMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    canteenName?: string,
  ) => Promise<{ error: Error | null; needsEmailVerification: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>;
  setActiveOrgId: (orgId: string) => void;
  refreshOrganizations: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo fallback when Supabase credentials are not yet configured in local environment
const DEMO_ORG: Organization = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "ADAPPT Canteen Central",
  slug: "adappt-canteen-central",
  role: "owner",
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([
    DEMO_ORG,
  ]);
  const [activeOrgId, setActiveOrgIdState] = useState<string>(() => {
    try {
      return localStorage.getItem("wastewise-active-org") || DEMO_ORG.id;
    } catch {
      return DEMO_ORG.id;
    }
  });
  const [loading, setLoading] = useState<boolean>(() => isSupabaseConfigured);
  const [recoveryMode, setRecoveryMode] = useState(false);

  const setActiveOrgId = useCallback((orgId: string) => {
    setActiveOrgIdState(orgId);
    try {
      localStorage.setItem("wastewise-active-org", orgId);
    } catch {
      // ignore storage failure
    }
  }, []);

  const refreshOrganizations = useCallback(async () => {
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData?.session?.user;
    if (!currentUser) return;

    try {
      // Fetch user's organizations via organization_members join
      const { data, error } = await supabase.from("organization_members")
        .select(`
          role,
          organizations (
            id,
            name,
            slug
          )
        `);

      if (!error && data && data.length > 0) {
        const orgs: Organization[] = data
          .map((row: any) => {
            const org = Array.isArray(row.organizations)
              ? row.organizations[0]
              : row.organizations;
            if (!org) return null;
            return {
              id: org.id,
              name: org.name,
              slug: org.slug,
              role: row.role as "owner" | "admin" | "member",
            };
          })
          .filter(Boolean) as Organization[];

        if (orgs.length > 0) {
          setOrganizations(orgs);
          if (!orgs.some((o) => o.id === activeOrgId)) {
            setActiveOrgId(orgs[0].id);
          }
        }
      }
    } catch (err) {
      console.warn("Could not load user organizations from Supabase:", err);
    }
  }, [activeOrgId, setActiveOrgId]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setProfile({
          id: session.user.id,
          email: session.user.email ?? "",
          full_name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0],
        });
        refreshOrganizations();
      }
      setLoading(false);
    });

    // 2. Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      }

      if (currentSession?.user) {
        setProfile({
          id: currentSession.user.id,
          email: currentSession.user.email ?? "",
          full_name:
            currentSession.user.user_metadata?.full_name ||
            currentSession.user.email?.split("@")[0],
        });
        refreshOrganizations();
      } else {
        setProfile(null);
        setOrganizations([DEMO_ORG]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshOrganizations]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return {
        error: new Error(
          "Supabase credentials are not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.",
        ),
      };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    canteenName?: string,
  ) => {
    if (!supabase) {
      return {
        error: new Error(
          "Supabase credentials are not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.",
        ),
        needsEmailVerification: false,
      };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          canteen_name: canteenName,
        },
        emailRedirectTo: `${window.location.origin}/#overview`,
      },
    });

    if (error) {
      return { error: new Error(error.message), needsEmailVerification: false };
    }

    const needsEmailVerification = !data.session && Boolean(data.user);
    return { error: null, needsEmailVerification };
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
    setProfile(null);
    setOrganizations([DEMO_ORG]);
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return {
        error: new Error("Supabase credentials are not configured in .env."),
      };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#overview`,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const updatePassword = async (newPassword: string) => {
    if (!supabase) {
      return {
        error: new Error("Supabase credentials are not configured in .env."),
      };
    }
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (!error) {
      setRecoveryMode(false);
    }
    return { error: error ? new Error(error.message) : null };
  };

  const resendVerificationEmail = async (email: string) => {
    if (!supabase) {
      return {
        error: new Error("Supabase credentials are not configured in .env."),
      };
    }
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/#overview`,
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const activeOrg =
    organizations.find((o) => o.id === activeOrgId) || organizations[0] || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        accessToken: session?.access_token ?? null,
        profile,
        organizations,
        activeOrg,
        loading,
        isConfigured: isSupabaseConfigured,
        recoveryMode,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        resendVerificationEmail,
        setActiveOrgId,
        refreshOrganizations,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
