import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, ShieldCheck, ShieldAlert, Fingerprint, ArrowRight, ExternalLink } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { SandboxBanner } from "@/components/sandbox-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/authcontext";
import {
  fetchChallengePublic,
  generateAndSubmitProof,
  pushHistory,
  readIdentity,
  type ChallengePublic,
  type ZkIdentity,
} from "@/lib/zk-identity";

type Phase = "loading" | "needs-identity" | "ready" | "verifying" | "verified" | "rejected" | "error";

export default function VerifyPage() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const challengeIdParam = params.get("challenge") || params.get("challengeId") || "";
  const returnTo = params.get("returnTo") || "";
  const partnerName = params.get("partner") || "a partner service";

  const [phase, setPhase] = useState<Phase>("loading");
  const [challenge, setChallenge] = useState<ChallengePublic | null>(null);
  const [identity, setIdentity] = useState<ZkIdentity | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      setLocation(`/auth?redirect=${redirect}`);
      return;
    }
    if (!challengeIdParam) {
      setError("No challenge provided. Open this page from a partner site.");
      setPhase("error");
      return;
    }
    const id = readIdentity();
    setIdentity(id);

    fetchChallengePublic(challengeIdParam)
      .then((c) => {
        setChallenge(c);
        if (c.status === "verified" || c.status === "rejected") {
          setPhase(c.status);
        } else if (!id) {
          setPhase("needs-identity");
        } else {
          setPhase("ready");
        }
      })
      .catch((err) => {
        setError((err as Error).message);
        setPhase("error");
      });
  }, [authLoading, user, challengeIdParam, setLocation]);

  const redirectBack = (status: "verified" | "rejected") => {
    if (!returnTo) return;
    try {
      const target = new URL(decodeURIComponent(returnTo));
      target.searchParams.set("status", status);
      target.searchParams.set("challenge", challengeIdParam);
      window.location.href = target.toString();
    } catch {
      // ignore invalid returnTo
    }
  };

  const approve = async () => {
    if (!challenge || !identity) return;
    setPhase("verifying");
    setError("");
    try {
      const result = await generateAndSubmitProof({
        challengeId: challenge.challengeId,
        sessionId: challenge.sessionId,
        verifierId: challenge.verifierId,
        ageThreshold: challenge.ageThreshold,
        identity,
      });
      pushHistory({
        id: crypto.randomUUID(),
        partner: partnerName,
        ageThreshold: challenge.ageThreshold,
        result: result.status,
        challengeId: challenge.challengeId,
        createdAt: new Date().toISOString(),
      });
      setPhase(result.status);
      setTimeout(() => redirectBack(result.status), 1500);
    } catch (err) {
      setError((err as Error).message);
      setPhase("error");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <SandboxBanner />
      <main className="container mx-auto px-6 pt-32 pb-12">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Fingerprint className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-heading font-bold">Verification request</h1>
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">{partnerName}</span> wants to verify something about you using your ZK Identity.
            </p>
          </div>

          {phase === "loading" && (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />Loading challenge…</CardContent></Card>
          )}

          {phase === "error" && (
            <Card className="border-red-500/30">
              <CardContent className="py-8 text-center space-y-3">
                <ShieldAlert className="w-8 h-8 mx-auto text-red-400" />
                <p className="text-sm text-red-400">{error}</p>
                <Button variant="outline" onClick={() => setLocation("/dashboard")}>Back to dashboard</Button>
              </CardContent>
            </Card>
          )}

          {phase === "needs-identity" && (
            <Card className="border-border/50 shadow-xl">
              <CardHeader>
                <CardTitle>You don't have a ZK Identity yet</CardTitle>
                <CardDescription>Set one up once. You'll be able to verify with any partner instantly afterwards.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full h-11"
                  onClick={() => setLocation(`/onboarding?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
                >
                  <Fingerprint className="w-4 h-4 mr-2" />
                  Create my ZK Identity
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {(phase === "ready" || phase === "verifying") && challenge && (
            <Card className="border-border/50 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Consent to share a proof</CardTitle>
                  <Badge variant="outline" className="border-primary/40 text-primary">Zero-Knowledge</Badge>
                </div>
                <CardDescription>We will only prove this single fact. Nothing else about your identity is revealed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Statement</p>
                  <p className="text-lg font-semibold">Age is at least {challenge.ageThreshold}</p>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                  <li>Partner: <span className="text-foreground">{partnerName}</span></li>
                  <li>Challenge: <span className="font-mono text-xs">{challenge.challengeId.slice(0, 12)}…</span></li>
                  <li>Your passport number is <span className="text-foreground">never sent</span> to the partner.</li>
                </ul>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 h-11 bg-primary hover:bg-primary/90"
                    onClick={approve}
                    disabled={phase === "verifying"}
                  >
                    {phase === "verifying" ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating proof…</>
                    ) : (
                      <><ShieldCheck className="w-4 h-4 mr-2" />Approve & Verify</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11"
                    disabled={phase === "verifying"}
                    onClick={() => redirectBack("rejected")}
                  >
                    Deny
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {phase === "verified" && (
            <Card className="border-emerald-500/40 bg-emerald-500/5">
              <CardContent className="py-10 text-center space-y-3">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-emerald-400" />
                </div>
                <h2 className="text-xl font-heading font-bold text-emerald-300">Verified</h2>
                <p className="text-sm text-muted-foreground">Redirecting you back to {partnerName}…</p>
                {returnTo && (
                  <a
                    href={decodeURIComponent(returnTo) + (decodeURIComponent(returnTo).includes("?") ? "&" : "?") + `status=verified&challenge=${challengeIdParam}`}
                    className="inline-flex items-center text-sm text-primary hover:underline"
                  >
                    Continue <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {phase === "rejected" && (
            <Card className="border-red-500/30">
              <CardContent className="py-10 text-center space-y-3">
                <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                  <ShieldAlert className="w-7 h-7 text-red-400" />
                </div>
                <h2 className="text-xl font-heading font-bold text-red-300">Not verified</h2>
                <p className="text-sm text-muted-foreground">The proof could not be generated or was rejected.</p>
                <Button variant="outline" onClick={() => setLocation("/dashboard")}>Back to dashboard</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
