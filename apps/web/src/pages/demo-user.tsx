import { useEffect, useState } from "react";
import { useLocation } from "wouter";

import { Navbar } from "@/components/navbar";
import { readChallengeState } from "@/lib/demo-state";

type JsonObject = Record<string, unknown>;

const parseJson = async (response: Response) => {
  const data = await response.json().catch(() => ({ error: "invalid response" }));
  return { ok: response.ok, status: response.status, data };
};

export default function DemoUserPage() {
  const [, setLocation] = useLocation();

  const [apiBase, setApiBase] = useState("http://localhost:5000/api");
  const [challengeId, setChallengeId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [verifierId, setVerifierId] = useState("merchant-123");
  const [ageThreshold, setAgeThreshold] = useState(18);
  const [birthDate, setBirthDate] = useState("2000-01-01");
  const [passportNumber, setPassportNumber] = useState("P1234567");

  const [status, setStatus] = useState("Ready");
  const [output, setOutput] = useState<JsonObject>({});

  useEffect(() => {
    const latest = readChallengeState();
    if (latest) {
      setChallengeId(latest.challengeId);
      setSessionId(latest.sessionId);
      setVerifierId(latest.verifierId);
      setAgeThreshold(latest.ageThreshold);
    }
  }, []);

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

  const loadChallenge = () =>
    run("Loading challenge", async () => {
      const response = await fetch(`${apiBase}/verifier/challenges/${challengeId}/public`);
      const result = await parseJson(response);
      setOutput(result.data as JsonObject);
      if (!result.ok) throw new Error(`load challenge failed (${result.status})`);

      const data = result.data as {
        sessionId?: string;
        verifierId?: string;
        ageThreshold?: number;
      };
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.verifierId) setVerifierId(data.verifierId);
      if (typeof data.ageThreshold === "number") setAgeThreshold(data.ageThreshold);
    });

  const generateAndSubmit = () =>
    run("Generating and submitting proof", async () => {
      const proofResponse = await fetch(`${apiBase}/proofs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          verifierId,
          ageThreshold,
          birthDate,
          passportNumber,
        }),
      });

      const proofResult = await parseJson(proofResponse);
      if (!proofResult.ok) {
        setOutput(proofResult.data as JsonObject);
        throw new Error(`proof generation failed (${proofResult.status})`);
      }

      const proof = (proofResult.data as { proof?: JsonObject }).proof;
      const submitResponse = await fetch(`${apiBase}/verifier/challenges/${challengeId}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          passportNumber,
          proof,
        }),
      });

      const submitResult = await parseJson(submitResponse);
      setOutput({ proof: proofResult.data, submit: submitResult.data });
      if (!submitResult.ok) throw new Error(`submit failed (${submitResult.status})`);
    });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-6 pt-24 pb-12 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Proof Flow</h1>
            <p className="text-muted-foreground">Load challenge, generate proof, and submit verification.</p>
          </div>
          <button type="button" className="px-4 py-2 rounded border" onClick={() => setLocation("/demo/verifier")}>Back to Verifier</button>
        </div>

        <section className="rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-lg font-semibold">Challenge details</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <input className="border rounded px-3 py-2 bg-transparent" value={apiBase} onChange={(e) => setApiBase(e.target.value)} placeholder="API Base" />
            <input className="border rounded px-3 py-2 bg-transparent" value={challengeId} onChange={(e) => setChallengeId(e.target.value)} placeholder="Challenge ID" />
            <input className="border rounded px-3 py-2 bg-transparent" value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="Session ID" />
          </div>
          <button type="button" className="px-4 py-2 rounded border" onClick={loadChallenge}>Load Challenge Public Data</button>
        </section>

        <section className="rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-lg font-semibold">Proof input</h2>
          <div className="grid md:grid-cols-4 gap-3">
            <input className="border rounded px-3 py-2 bg-transparent" value={verifierId} onChange={(e) => setVerifierId(e.target.value)} placeholder="Verifier ID" />
            <input className="border rounded px-3 py-2 bg-transparent" type="number" value={ageThreshold} onChange={(e) => setAgeThreshold(Number(e.target.value || 18))} placeholder="Age Threshold" />
            <input className="border rounded px-3 py-2 bg-transparent" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} placeholder="Birth Date YYYY-MM-DD" />
            <input className="border rounded px-3 py-2 bg-transparent" value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} placeholder="Passport Number" />
          </div>
          <button type="button" className="px-4 py-2 rounded bg-primary text-primary-foreground" onClick={generateAndSubmit}>Generate + Submit Proof</button>
        </section>

        <section className="rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground mb-2">{status}</p>
          <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-80">{JSON.stringify(output, null, 2)}</pre>
        </section>
      </main>
    </div>
  );
}
