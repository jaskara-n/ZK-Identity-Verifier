import { useState } from "react";
import { useLocation } from "wouter";

import { Navbar } from "@/components/navbar";
import { saveChallengeState } from "@/lib/demo-state";

type JsonObject = Record<string, unknown>;

const parseJson = async (response: Response) => {
  const data = await response.json().catch(() => ({ error: "invalid response" }));
  return { ok: response.ok, status: response.status, data };
};

export default function DemoVerifierPage() {
  const [, setLocation] = useLocation();

  const [apiBase, setApiBase] = useState("http://localhost:5000/api");
  const [internalApiKey, setInternalApiKey] = useState("dev-internal-api-key-please-change");
  const [clientName, setClientName] = useState("merchant-app");

  const [apiKey, setApiKey] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifierId, setVerifierId] = useState("merchant-123");
  const [ageThreshold, setAgeThreshold] = useState(18);
  const [challengeId, setChallengeId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [output, setOutput] = useState<JsonObject>({});
  const [status, setStatus] = useState("Ready");

  const run = async (label: string, fn: () => Promise<void>) => {
    setStatus(`${label}...`);
    try {
      await fn();
      setStatus(`${label} complete`);
    } catch (err) {
      setStatus(`${label} failed`);
      setOutput({ error: (err as Error).message });
    }
  };

  const registerClient = () =>
    run("Registering client", async () => {
      const response = await fetch(`${apiBase}/verifier/clients/register`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-api-key": internalApiKey,
        },
        body: JSON.stringify({ name: clientName }),
      });
      const result = await parseJson(response);
      setOutput(result.data as JsonObject);
      if (!result.ok) throw new Error(`register failed (${result.status})`);
      setApiKey((result.data as { apiKey?: string }).apiKey || "");
    });

  const issueToken = () =>
    run("Issuing token", async () => {
      const response = await fetch(`${apiBase}/verifier/auth/token`, {
        method: "POST",
        headers: {
          "x-verifier-api-key": apiKey,
        },
      });
      const result = await parseJson(response);
      setOutput(result.data as JsonObject);
      if (!result.ok) throw new Error(`token failed (${result.status})`);
      setAccessToken((result.data as { accessToken?: string }).accessToken || "");
    });

  const createChallenge = () =>
    run("Creating challenge", async () => {
      const response = await fetch(`${apiBase}/verifier/challenges`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ verifierId, ageThreshold }),
      });

      const result = await parseJson(response);
      setOutput(result.data as JsonObject);
      if (!result.ok) throw new Error(`create challenge failed (${result.status})`);

      const ch = result.data as { challengeId?: string; sessionId?: string };
      const nextChallengeId = ch.challengeId || "";
      const nextSessionId = ch.sessionId || "";
      setChallengeId(nextChallengeId);
      setSessionId(nextSessionId);
      saveChallengeState({
        challengeId: nextChallengeId,
        sessionId: nextSessionId,
        verifierId,
        ageThreshold,
      });
    });

  const fetchStatus = () =>
    run("Fetching status", async () => {
      const response = await fetch(`${apiBase}/verifier/challenges/${challengeId}`, {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });
      const result = await parseJson(response);
      setOutput(result.data as JsonObject);
      if (!result.ok) throw new Error(`status failed (${result.status})`);
    });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-6 pt-24 pb-12 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Verifier Console</h1>
            <p className="text-muted-foreground">Create verification challenges and track final result.</p>
          </div>
          <button type="button" className="px-4 py-2 rounded border" onClick={() => setLocation("/demo/user")}>Go to User Flow</button>
        </div>

        <section className="rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-lg font-semibold">Step 1: Setup</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <input className="border rounded px-3 py-2 bg-transparent" value={apiBase} onChange={(e) => setApiBase(e.target.value)} placeholder="API Base" />
            <input className="border rounded px-3 py-2 bg-transparent" value={internalApiKey} onChange={(e) => setInternalApiKey(e.target.value)} placeholder="Internal API Key" />
            <input className="border rounded px-3 py-2 bg-transparent" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client Name" />
          </div>
          <button type="button" className="px-4 py-2 rounded bg-primary text-primary-foreground" onClick={registerClient}>Register Client</button>
        </section>

        <section className="rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-lg font-semibold">Step 2: Auth</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2 bg-transparent" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Verifier API Key" />
            <input className="border rounded px-3 py-2 bg-transparent" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="Bearer Access Token" />
          </div>
          <button type="button" className="px-4 py-2 rounded border" onClick={issueToken}>Issue Token</button>
        </section>

        <section className="rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-lg font-semibold">Step 3: Challenge</h2>
          <div className="grid md:grid-cols-4 gap-3">
            <input className="border rounded px-3 py-2 bg-transparent" value={verifierId} onChange={(e) => setVerifierId(e.target.value)} placeholder="Verifier ID" />
            <input className="border rounded px-3 py-2 bg-transparent" type="number" value={ageThreshold} onChange={(e) => setAgeThreshold(Number(e.target.value || 18))} placeholder="Age Threshold" />
            <input className="border rounded px-3 py-2 bg-transparent" value={challengeId} onChange={(e) => setChallengeId(e.target.value)} placeholder="Challenge ID" />
            <input className="border rounded px-3 py-2 bg-transparent" value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="Session ID" />
          </div>
          <div className="flex gap-2">
            <button type="button" className="px-4 py-2 rounded bg-primary text-primary-foreground" onClick={createChallenge}>Create Challenge</button>
            <button type="button" className="px-4 py-2 rounded border" onClick={fetchStatus}>Fetch Status</button>
          </div>
        </section>

        <section className="rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground mb-2">{status}</p>
          <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-80">{JSON.stringify(output, null, 2)}</pre>
        </section>
      </main>
    </div>
  );
}
