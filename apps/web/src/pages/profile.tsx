import { useEffect, useState } from "react";
import { useLocation } from "wouter";

import { Navbar } from "@/components/navbar";
import { SandboxBanner } from "@/components/sandbox-banner";
import { useAuth } from "@/context/authcontext";

export default function ProfilePage() {
  const [_, setLocation] = useLocation();
  const { user, loading, updateProfile, changePassword, signOut } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/auth");
      return;
    }

    if (user) {
      setDisplayName(user.displayName);
    }
  }, [user, loading, setLocation]);

  const onUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      setStatus("");
      await updateProfile(displayName);
      setStatus("Profile updated.");
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      setStatus("");

      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match");
      }

      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStatus("Password updated.");
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <SandboxBanner />
      <main className="container mx-auto px-6 pt-32 pb-12 space-y-6">
        <header>
          <h1 className="text-3xl font-heading font-bold">Account settings</h1>
          <p className="text-muted-foreground">Manage your ZK-ID account details.</p>
        </header>

        <section className="rounded-xl border border-border p-4 space-y-4 max-w-2xl">
          <h2 className="font-semibold">Account</h2>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Email:</span> {user.email}</p>
            <p><span className="text-muted-foreground">User ID:</span> {user.id}</p>
          </div>

          <form className="space-y-3" onSubmit={onUpdateProfile}>
            <label className="text-sm text-muted-foreground" htmlFor="displayName">Display Name</label>
            <input
              id="displayName"
              className="w-full border rounded px-3 py-2 bg-transparent"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <button type="submit" disabled={busy} className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50">
              Save Profile
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-border p-4 space-y-4 max-w-2xl">
          <h2 className="font-semibold">Change Password</h2>
          <form className="space-y-3" onSubmit={onChangePassword}>
            <input
              type="password"
              placeholder="Current password"
              className="w-full border rounded px-3 py-2 bg-transparent"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="New password"
              className="w-full border rounded px-3 py-2 bg-transparent"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full border rounded px-3 py-2 bg-transparent"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button type="submit" disabled={busy} className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50">
              Update Password
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-border p-4 max-w-2xl space-y-3">
          <h2 className="font-semibold">Session</h2>
          <button
            type="button"
            className="px-4 py-2 rounded border"
            onClick={() => {
              signOut();
              setLocation("/auth");
            }}
          >
            Logout
          </button>
        </section>

        {status ? <p className="max-w-2xl text-sm text-muted-foreground">{status}</p> : null}
      </main>
    </div>
  );
}
