import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2, Fingerprint, ShieldCheck, Lock } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { SandboxBanner } from "@/components/sandbox-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { saveIdentity } from "@/lib/zk-identity";

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const [birthDate, setBirthDate] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const returnTo = new URLSearchParams(window.location.search).get("returnTo");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      setError("Birth date must be YYYY-MM-DD");
      return;
    }
    if (passportNumber.trim().length < 5) {
      setError("Passport number is too short");
      return;
    }
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      saveIdentity({ birthDate, passportNumber: passportNumber.trim() });
      setLocation(returnTo ? decodeURIComponent(returnTo) : "/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
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
            <h1 className="text-3xl font-heading font-bold">Create your ZK Identity</h1>
            <p className="text-muted-foreground">
              One-time setup. Your data stays on this device — we only generate zero-knowledge proofs when you approve a verification.
            </p>
          </div>

          <Card className="border-border/50 shadow-xl">
            <CardHeader>
              <CardTitle>Identity details</CardTitle>
              <CardDescription>These are hashed locally and never sent to partners.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Date of birth</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passportNumber">Passport / document number</Label>
                  <Input
                    id="passportNumber"
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value)}
                    placeholder="P1234567"
                    autoComplete="off"
                    required
                  />
                </div>
                {error ? <p className="text-sm text-red-400">{error}</p> : null}
                <Button type="submit" className="w-full h-11" disabled={busy}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                  {busy ? "Creating identity..." : "Create my ZK Identity"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex items-start gap-3 text-xs text-muted-foreground rounded-xl border border-border/50 p-4">
            <Lock className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <p>
              In sandbox mode, identity data is stored in your browser's local storage. In production this is replaced with secure enclave / hardware-backed storage.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
