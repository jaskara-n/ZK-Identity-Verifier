import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type LocalUser = {
  id: string;
  email: string;
  displayName: string;
};

type StoredUser = LocalUser & {
  password: string;
};

type AuthContextType = {
  user: LocalUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (displayName: string) => Promise<void>;
  changePassword: (currentPassword: string, nextPassword: string) => Promise<void>;
};

const USERS_KEY = "zk_identity_users";
const SESSION_KEY = "zk_identity_session_user_id";
const LEGACY_USER_KEY = "zk_identity_user";

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  register: async () => {},
  signOut: () => {},
  updateProfile: async () => {},
  changePassword: async () => {},
});

const toDisplayName = (email: string) => email.split("@")[0] || "user";

const readUsers = (): StoredUser[] => {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const stripPassword = (stored: StoredUser): LocalUser => ({
  id: stored.id,
  email: stored.email,
  displayName: stored.displayName,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionUserId = localStorage.getItem(SESSION_KEY);
    const users = readUsers();

    if (sessionUserId) {
      const found = users.find((item) => item.id === sessionUserId);
      if (found) {
        setUser(stripPassword(found));
        setLoading(false);
        return;
      }
    }

    // Migrate legacy single-user demo storage.
    const legacyRaw = localStorage.getItem(LEGACY_USER_KEY);
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw) as LocalUser;
        if (legacy?.id && legacy?.email) {
          const migrated: StoredUser = {
            ...legacy,
            password: "demo-pass-123456",
          };
          saveUsers([migrated]);
          localStorage.setItem(SESSION_KEY, migrated.id);
          localStorage.removeItem(LEGACY_USER_KEY);
          setUser(stripPassword(migrated));
        }
      } catch {
        localStorage.removeItem(LEGACY_USER_KEY);
      }
    }

    setLoading(false);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      async signIn(email: string, password: string) {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !password) {
          throw new Error("Email and password are required");
        }

        const users = readUsers();
        const found = users.find((item) => item.email.toLowerCase() === cleanEmail);
        if (!found || found.password !== password) {
          throw new Error("Invalid email or password");
        }

        setUser(stripPassword(found));
        localStorage.setItem(SESSION_KEY, found.id);
      },
      async register(email: string, password: string) {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !password) {
          throw new Error("Email and password are required");
        }

        const users = readUsers();
        const existing = users.find((item) => item.email.toLowerCase() === cleanEmail);
        if (existing) {
          throw new Error("User already exists. Please sign in.");
        }

        const nextUser: StoredUser = {
          id: crypto.randomUUID(),
          email: cleanEmail,
          displayName: toDisplayName(cleanEmail),
          password,
        };

        const nextUsers = [...users, nextUser];
        saveUsers(nextUsers);
        localStorage.setItem(SESSION_KEY, nextUser.id);
        setUser(stripPassword(nextUser));
      },
      signOut() {
        setUser(null);
        localStorage.removeItem(SESSION_KEY);
      },
      async updateProfile(displayName: string) {
        const trimmed = displayName.trim();
        if (!user) throw new Error("Not authenticated");
        if (trimmed.length < 2) throw new Error("Display name must be at least 2 characters");

        const users = readUsers();
        const idx = users.findIndex((item) => item.id === user.id);
        if (idx === -1) throw new Error("User not found");

        users[idx] = { ...users[idx], displayName: trimmed };
        saveUsers(users);
        setUser(stripPassword(users[idx]));
      },
      async changePassword(currentPassword: string, nextPassword: string) {
        if (!user) throw new Error("Not authenticated");
        if (nextPassword.length < 6) throw new Error("New password must be at least 6 characters");

        const users = readUsers();
        const idx = users.findIndex((item) => item.id === user.id);
        if (idx === -1) throw new Error("User not found");
        if (users[idx].password !== currentPassword) throw new Error("Current password is incorrect");

        users[idx] = { ...users[idx], password: nextPassword };
        saveUsers(users);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
