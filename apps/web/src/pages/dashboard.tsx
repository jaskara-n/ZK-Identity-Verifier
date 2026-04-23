import { useEffect, useMemo, useState } from "react";

import { Navbar } from "@/components/navbar";

type JsonObject = Record<string, unknown>;

type CredentialHistory = {
  id: string;
  chain: string;
  verifierId: string;
  ageThreshold: number;
  challengeId: string;
  sessionId: string;
  result: "verified" | "rejected";
  createdAt: string;
};

type IssuedCredential = {
  credentialId: string;
  challengeId: string;
  verifierId: string;
  ageThreshold: number;
  status: "active" | "revoked";
  issuedAt: string;
  revokedAt?: string;
  revokeReason?: string;
};

const HISTORY_KEY = "zk_demo_credential_history";
const CHAINS = ["Ethereum (Mock)", "Polygon (Mock)", "Base (Mock)", "Arbitrum (Mock)"];

const parseJson = async (response: Response) => {
  const data = await response.json().catch(() => ({ error: "invalid response" }));
  return { ok: response.ok, status: response.status, data };
};

const Badge = ({ label, tone }: { label: string; tone: "neutral" | "good" | "bad" | "active" }) => {
  const styles: Record<typeof tone, string> = {
    neutral: "bg-muted text-muted-foreground",
    good: "bg-green-100 text-green-700",
    bad: "bg-red-100 text-red-700",
    active: "bg-blue-100 text-blue-700",
  };

  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[tone]}`}>{label}</span>;
};

export default function Dashboard() {
  const [apiBase, setApiBase] = useState("http://localhost:5001/api");
  const [internalApiKey, setInternalApiKey] = useState("dev-internal-api-key-please-change");
  const [clientName, setClientName] = useState("merchant-app");

  const [apiKey, setApiKey] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifierId, setVerifierId] = useState("merchant-123");
  const [ageThreshold, setAgeThreshold] = useState(18);
  const [chainName, setChainName] = useState(CHAINS[0]);

  const [challengeId, setChallengeId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [birthDate, setBirthDate] = useState("2000-01-01");
  const [passportNumber, setPassportNumber] = useState("P1234567");

  const [statusText, setStatusText] = useState("Ready to demo");
  const [statusTone, setStatusTone] = useState<"neutral" | "good" | "bad" | "active">("neutral");
  const [details, setDetails] = useState<JsonObject>({});
  const [showDetails, setShowDetails] = useState(false);
  const [finalResult, setFinalResult] = useState<"pending" | "verified" | "rejected" | "none">("none");
  const [history, setHistory] = useState<CredentialHistory[]>([]);

  const [issuedCredentials, setIssuedCredentials] = useState<IssuedCredential[]>([]);
  const [revokeReason, setRevokeReason] = useState("User requested revocation");

  useEffect(() => {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as CredentialHistory[];
      setHistory(parsed);
    } catch {
      setHistory([]);
    }
  }, []);

  const pushHistory = (item: CredentialHistory) => {
    const next = [item, ...history].slice(0, 12);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const canIssueToken = useMemo(() => apiKey.length > 10, [apiKey]);
  const canCreateChallenge = useMemo(() => accessToken.length > 10, [accessToken]);
  const canSubmitProof = useMemo(
    () => challengeId.length > 0 && sessionId.length > 0,
    [challengeId, sessionId],
  );

  const run = async (label: string, fn: () => Promise<void>) => {
    setStatusText(`${label}...`);
    setStatusTone("active");
    try {
      await fn();
      setStatusText(`${label} complete`);
      setStatusTone("good");
    } catch (err) {
      setStatusText(`${label} failed: ${(err as Error).message}`);
      setStatusTone("bad");
    }
  };

  const fetchCredentials = async () => {
    const response = await fetch(`${apiBase}/verifier/credentials`, {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    const result = await parseJson(response);
    setDetails(result.data as JsonObject);
    if (!result.ok) throw new Error(`HTTP ${result.status}`);

    const items = (result.data as { items?: IssuedCredential[] }).items ?? [];
    setIssuedCredentials(items);
  };

  const registerClient = () =>
    run("Registering verifier client", async () => {
      const response = await fetch(`${apiBase}/verifier/clients/register`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-api-key": internalApiKey,
        },
        body: JSON.stringify({ name: clientName }),
      });
      const result = await parseJson(response);
      setDetails(result.data as JsonObject);
      if (!result.ok) throw new Error(`HTTP ${result.status}`);
      const nextApiKey = (result.data as { apiKey?: string }).apiKey || "";
      setApiKey(nextApiKey);
    });

  const issueToken = () =>
    run("Issuing verifier token", async () => {
      const response = await fetch(`${apiBase}/verifier/auth/token`, {
        method: "POST",
        headers: {
          "x-verifier-api-key": apiKey,
        },
      });
      const result = await parseJson(response);
      setDetails(result.data as JsonObject);
      if (!result.ok) throw new Error(`HTTP ${result.status}`);
      const nextToken = (result.data as { accessToken?: string }).accessToken || "";
      setAccessToken(nextToken);
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
      setDetails({ ...(result.data as JsonObject), chainName });
      if (!result.ok) throw new Error(`HTTP ${result.status}`);

      const payload = result.data as { challengeId?: string; sessionId?: string };
      setChallengeId(payload.challengeId || "");
      setSessionId(payload.sessionId || "");
      setFinalResult("pending");
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
        setDetails(proofResult.data as JsonObject);
        throw new Error(`proof HTTP ${proofResult.status}`);
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
      setDetails({ proof: proofResult.data, submit: submitResult.data, chainName });
      if (!submitResult.ok) throw new Error(`submit HTTP ${submitResult.status}`);

      const status = (submitResult.data as { status?: "verified" | "rejected" }).status;
      const final = status || "pending";
      setFinalResult(final);

      if (final === "verified" || final === "rejected") {
        pushHistory({
          id: crypto.randomUUID(),
          chain: chainName,
          verifierId,
          ageThreshold,
          challengeId,
          sessionId,
          result: final,
          createdAt: new Date().toISOString(),
        });
      }

      if (final === "verified") {
        await fetchCredentials();
      }
    });

  const fetchStatus = () =>
    run("Fetching verifier status", async () => {
      const response = await fetch(`${apiBase}/verifier/challenges/${challengeId}`, {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });
      const result = await parseJson(response);
      setDetails({ ...(result.data as JsonObject), chainName });
      if (!result.ok) throw new Error(`HTTP ${result.status}`);

      const status = (result.data as { status?: "pending" | "verified" | "rejected" }).status;
      if (status === "verified" || status === "rejected") {
        setFinalResult(status);
      } else {
        setFinalResult("pending");
      }
    });

  const refreshIssuedCredentials = () =>
    run("Fetching issued credentials", async () => {
      await fetchCredentials();
    });

  const revokeCredential = (credentialId: string) =>
    run("Revoking credential", async () => {
      const response = await fetch(`${apiBase}/verifier/credentials/${credentialId}/revoke`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reason: revokeReason }),
      });
      const result = await parseJson(response);
      setDetails(result.data as JsonObject);
      if (!result.ok) throw new Error(`HTTP ${result.status}`);
      await fetchCredentials();
    });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-6 pt-24 pb-12 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Identity Verification Demo</h1>
            <p className="text-muted-foreground">Real-app style flow with verifier + user journey.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge label={statusText} tone={statusTone} />
            <Badge label={chainName} tone="active" />
            {finalResult === "verified" && <Badge label="Final: Verified" tone="good" />}
            {finalResult === "rejected" && <Badge label="Final: Rejected" tone="bad" />}
            {finalResult === "pending" && <Badge label="Final: Pending" tone="active" />}
          </div>
        </header>

        <section className="rounded-xl border border-border p-4 space-y-4">
          <h2 className="text-lg font-semibold">Step 1: Verifier Setup</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <input className="border rounded px-3 py-2 bg-transparent" value={apiBase} onChange={(e) => setApiBase(e.target.value)} placeholder="API Base" />
            <input className="border rounded px-3 py-2 bg-transparent" value={internalApiKey} onChange={(e) => setInternalApiKey(e.target.value)} placeholder="Internal API Key" />
            <input className="border rounded px-3 py-2 bg-transparent" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Verifier Client Name" />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2 bg-transparent" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Verifier API Key" />
            <input className="border rounded px-3 py-2 bg-transparent" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="Bearer Access Token" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="px-4 py-2 rounded bg-primary text-primary-foreground" onClick={registerClient}>Register Client</button>
            <button type="button" disabled={!canIssueToken} className="px-4 py-2 rounded border disabled:opacity-50" onClick={issueToken}>Issue Token</button>
          </div>
        </section>

        <section className="rounded-xl border border-border p-4 space-y-4">
          <h2 className="text-lg font-semibold">Step 2: Create Verification Challenge</h2>
          <div className="grid md:grid-cols-5 gap-3">
            <select className="border rounded px-3 py-2 bg-transparent" value={chainName} onChange={(e) => setChainName(e.target.value)}>
              {CHAINS.map((chain) => (
                <option key={chain} value={chain}>{chain}</option>
              ))}
            </select>
            <input className="border rounded px-3 py-2 bg-transparent" value={verifierId} onChange={(e) => setVerifierId(e.target.value)} placeholder="Verifier ID" />
            <input className="border rounded px-3 py-2 bg-transparent" type="number" value={ageThreshold} onChange={(e) => setAgeThreshold(Number(e.target.value || 18))} placeholder="Age Threshold" />
            <input className="border rounded px-3 py-2 bg-transparent" value={challengeId} onChange={(e) => setChallengeId(e.target.value)} placeholder="Challenge ID" />
            <input className="border rounded px-3 py-2 bg-transparent" value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="Session ID" />
          </div>
          <button type="button" disabled={!canCreateChallenge} className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50" onClick={createChallenge}>Create Challenge</button>
        </section>

        <section className="rounded-xl border border-border p-4 space-y-4">
          <h2 className="text-lg font-semibold">Step 3: User Proof Submission</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <input className="border rounded px-3 py-2 bg-transparent" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} placeholder="Birth Date YYYY-MM-DD" />
            <input className="border rounded px-3 py-2 bg-transparent" value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} placeholder="Passport Number" />
            <input className="border rounded px-3 py-2 bg-transparent" value={`${ageThreshold}`} readOnly placeholder="Current Age Threshold" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!canSubmitProof} className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50" onClick={generateAndSubmit}>Generate + Submit Proof</button>
            <button type="button" disabled={!canSubmitProof} className="px-4 py-2 rounded border disabled:opacity-50" onClick={fetchStatus}>Fetch Verifier Status</button>
          </div>
        </section>

        <section className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Issued Credentials (Server)</h3>
            <button
              type="button"
              className="px-3 py-1 rounded border text-sm disabled:opacity-50"
              disabled={accessToken.length < 10}
              onClick={refreshIssuedCredentials}
            >
              Refresh
            </button>
          </div>
          <input
            className="border rounded px-3 py-2 bg-transparent w-full"
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            placeholder="Revoke reason"
          />
          {issuedCredentials.length === 0 ? (
            <p className="text-sm text-muted-foreground">No issued credentials yet. Complete one successful verification, then refresh.</p>
          ) : (
            <div className="space-y-2">
              {issuedCredentials.map((item) => (
                <div key={item.credentialId} className="border rounded p-3 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.status.toUpperCase()} | {item.verifierId} | {item.ageThreshold}+</p>
                    <p className="text-muted-foreground">Credential: {item.credentialId}</p>
                    <p className="text-muted-foreground">Challenge: {item.challengeId}</p>
                    {item.status === "revoked" && (
                      <p className="text-muted-foreground">Revoked: {item.revokedAt ? new Date(item.revokedAt).toLocaleString() : "-"} {item.revokeReason ? `| ${item.revokeReason}` : ""}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-muted-foreground text-xs">{new Date(item.issuedAt).toLocaleString()}</div>
                    <button
                      type="button"
                      disabled={item.status === "revoked" || accessToken.length < 10}
                      className="px-3 py-1 rounded border text-xs disabled:opacity-50"
                      onClick={() => revokeCredential(item.credentialId)}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Past Credentials (Demo History)</h3>
            <button
              type="button"
              className="px-3 py-1 rounded border text-sm"
              onClick={() => {
                setHistory([]);
                localStorage.removeItem(HISTORY_KEY);
              }}
            >
              Clear
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No past credentials yet. Complete one verification to populate history.</p>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item.id} className="border rounded p-3 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.result.toUpperCase()} on {item.chain}</p>
                    <p className="text-muted-foreground">Verifier: {item.verifierId} | Threshold: {item.ageThreshold}+ | Challenge: {item.challengeId}</p>
                  </div>
                  <div className="text-muted-foreground text-xs">{new Date(item.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Technical details</h3>
            <button type="button" className="px-3 py-1 rounded border text-sm" onClick={() => setShowDetails((prev) => !prev)}>
              {showDetails ? "Hide" : "Show"}
            </button>
          </div>
          {showDetails ? (
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">{JSON.stringify(details, null, 2)}</pre>
          ) : (
            <p className="text-sm text-muted-foreground">Hidden for clean demo UX.</p>
          )}
        </section>

        <section className="rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Standalone verifier app is available at <span className="font-medium">http://localhost:5050</span>.</p>
        </section>
      </main>
    </div>
  );
}
