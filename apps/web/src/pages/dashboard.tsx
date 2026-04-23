import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Fingerprint, ShieldCheck, ShieldAlert, ShieldX, Trash2, History, Zap, ExternalLink, Loader2 } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { SandboxBanner } from "@/components/sandbox-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/authcontext";
import { API_URL, VERIFIER_URL } from "@/lib/config";
import {
  clearHistory,
  clearIdentity,
  readHistory,
  readIdentity,
  type VerificationRecord,
  type ZkIdentity,
} from "@/lib/zk-identity";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [identity, setIdentity] = useState<ZkIdentity | null>(null);
  const [history, setHistory] = useState<VerificationRecord[]>([]);
  const [revoking, setRevoking] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; message: string } | null>(null);

  useEffect(() => {
    setIdentity(readIdentity());
    setHistory(readHistory());
  }, []);

  const onRevoke = async () => {
    if (!identity) return;
    setRevoking(true);
    setStatus(null);
    try {
      const res = await fetch(`${API_URL}/user/revoke-identity`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          passportNumber: identity.passportNumber,
          reason: "User revoked identity from dashboard",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || `Revoke failed (${res.status})`);

      clearIdentity();
      clearHistory();
      setIdentity(null);
      setHistory([]);
      setStatus({
        kind: "ok",
        message: `Revoked ${(data as { revokedCount?: number }).revokedCount ?? 0} issued credential(s). All partner verifications are now marked unverified.`,
      });
    } catch (err) {
      setStatus({ kind: "err", message: (err as Error).message });
    } finally {
      setRevoking(false);
    }
  };

  const stats = {
    total: history.length,
    verified: history.filter((h) => h.result === "verified").length,
    rejected: history.filter((h) => h.result === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <SandboxBanner />
      <main className="container mx-auto px-6 pt-32 pb-16">
        <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back{user?.displayName ? `, ${user.displayName}` : ""}.</p>
            <h1 className="text-3xl md:text-4xl font-heading font-bold">Your ZK Identity</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a href={VERIFIER_URL} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-2"><ExternalLink className="w-3.5 h-3.5" />Try partner demo</Button>
            </a>
          </div>
        </header>

        {status && (
          <div className={`mb-6 rounded-xl border p-3 text-sm ${status.kind === "ok" ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-200" : "border-red-500/40 bg-red-500/5 text-red-200"}`}>
            {status.message}
          </div>
        )}

        {!identity ? (
          <Card className="border-primary/40 bg-primary/5 shadow-xl">
            <CardContent className="py-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                <Fingerprint className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <h2 className="text-xl font-heading font-bold">You don't have a ZK Identity yet</h2>
                <p className="text-sm text-muted-foreground">Create one now — it only takes 10 seconds and you can verify with any partner afterwards.</p>
              </div>
              <Button size="lg" onClick={() => setLocation("/onboarding")}>
                <Zap className="w-4 h-4 mr-2" />Create identity
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 border-border/50 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400" />Active ZK Identity</CardTitle>
                    <CardDescription>Reusable across any partner that supports ZK-ID.</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Identity ID</p>
                    <p className="font-mono text-xs truncate">{identity.id}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Created</p>
                    <p>{new Date(identity.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Document</p>
                    <p>•••• {identity.passportNumber.slice(-4)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">DOB</p>
                    <p>{identity.birthDate}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Revoking your identity invalidates every credential issued to partners.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-red-500/40 text-red-300 hover:bg-red-500/10 gap-2">
                        <Trash2 className="w-3.5 h-3.5" />Revoke identity
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke your ZK Identity?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This deletes your local identity and marks every credential issued to partners as revoked. Partners that previously verified you will immediately see "unverified" on their dashboards.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onRevoke} disabled={revoking} className="bg-red-500 hover:bg-red-600">
                          {revoking ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Revoking…</> : "Yes, revoke"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-base">Verification stats</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <StatRow label="Total requests" value={stats.total} />
                <StatRow label="Verified" value={stats.verified} tone="good" />
                <StatRow label="Rejected" value={stats.rejected} tone="bad" />
              </CardContent>
            </Card>
          </div>
        )}

        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-bold flex items-center gap-2"><History className="w-5 h-5 text-primary" />Recent verifications</h2>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { clearHistory(); setHistory([]); }}>
                Clear history
              </Button>
            )}
          </div>
          {history.length === 0 ? (
            <Card className="border-dashed border-border/50">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No verifications yet. Try the <a href={VERIFIER_URL} target="_blank" rel="noreferrer" className="underline text-primary">partner demo</a> to see the flow.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item.id} className="rounded-xl border border-border/50 bg-card/50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {item.result === "verified" ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ShieldX className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <p className="font-medium">{item.partner}</p>
                      <p className="text-xs text-muted-foreground">Age ≥ {item.ageThreshold} · {new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={item.result === "verified" ? "border-emerald-500/40 text-emerald-300" : "border-red-500/40 text-red-300"}>
                    {item.result}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatRow({ label, value, tone }: { label: string; value: number; tone?: "good" | "bad" }) {
  const color = tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-red-300" : "text-foreground";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}
