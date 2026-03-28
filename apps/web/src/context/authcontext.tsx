import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type LocalUser = {
  id: string;
  email: string;
  displayName: string;
};

type AuthContextType = {
  user: LocalUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const STORAGE_KEY = "zk_identity_user";

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  register: async () => {},
  signOut: () => {},
});

const toDisplayName = (email: string) => email.split("@")[0] || "user";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as LocalUser;
        if (parsed?.id && parsed?.email) {
          setUser(parsed);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      async signIn(email: string, password: string) {
        if (!email || !password) {
          throw new Error("Email and password are required");
        }

        const nextUser: LocalUser = {
          id: crypto.randomUUID(),
          email,
          displayName: toDisplayName(email),
        };
        setUser(nextUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      },
      async register(email: string, password: string) {
        if (!email || !password) {
          throw new Error("Email and password are required");
        }

        const nextUser: LocalUser = {
          id: crypto.randomUUID(),
          email,
          displayName: toDisplayName(email),
        };
        setUser(nextUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      },
      signOut() {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
