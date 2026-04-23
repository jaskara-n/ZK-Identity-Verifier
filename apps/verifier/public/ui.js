const ZK_APP_URL = window.__ZK_APP_URL__ || "http://localhost:5173";
const PARTNER_NAME = "Acme Marketplace";
const AGE_MIN = 21;

const $ = (id) => document.getElementById(id);
const read = (id) => $(id).value.trim();
const write = (id, value) => { $(id).value = value ?? ""; };

$("zkLink").href = ZK_APP_URL;
$("zkLink").textContent = ZK_APP_URL;

const state = { apiKey: "", accessToken: "", challengeId: "", sessionId: "", pollTimer: null, verifyBusy: false };

const verifyBtn = $("verifyBtn");
const resetBtn = $("resetBtn");
const statusCard = $("statusCard");
const statusPill = $("statusPill");
const statusMsg = $("statusMsg");
const progressSteps = $("progress").children;
const ageGate = $("ageGate");
const heroError = $("heroError");
const errorBox = $("error");
const output = $("output");

const setProgress = (step) => {
  for (let i = 0; i < progressSteps.length; i++) {
    progressSteps[i].classList.toggle("done", i <= step);
  }
};

const setStatus = (kind, message) => {
  statusCard.classList.add("visible");
  statusPill.className = `pill ${kind}`;
  statusPill.textContent = ({
    pending: "Pending",
    verified: "Verified",
    rejected: "Rejected",
    revoked: "Revoked",
    expired: "Expired",
  })[kind] || kind;
  statusMsg.textContent = message;

  if (kind === "verified") {
    ageGate.style.color = "var(--ok)";
    ageGate.textContent = "✓ Age verified — checkout unlocked";
    setProgress(3);
    verifyBtn.style.display = "none";
    resetBtn.style.display = "inline-flex";
  } else if (kind === "revoked") {
    ageGate.style.color = "var(--warn)";
    ageGate.textContent = "⚠ Credential revoked by user — re-verification required";
    setProgress(1);
    verifyBtn.style.display = "inline-flex";
    verifyBtn.disabled = false;
    verifyBtn.innerHTML = '<span class="dot"></span>Re-verify age with ZK-ID';
    resetBtn.style.display = "inline-flex";
  } else if (kind === "rejected" || kind === "expired") {
    ageGate.style.color = "var(--warn)";
    ageGate.textContent = `✗ ${kind === "expired" ? "Challenge expired" : "Verification rejected"}`;
    setProgress(1);
    resetBtn.style.display = "inline-flex";
    verifyBtn.disabled = false;
    verifyBtn.innerHTML = '<span class="dot"></span>Try again';
  }
};

const post = (url, body) => fetch(url, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

const show = (data) => { output.textContent = JSON.stringify(data, null, 2); errorBox.textContent = ""; };
const fail = async (res, { rethrow = false } = {}) => {
  const data = await res.json().catch(() => ({ error: "request failed" }));
  errorBox.textContent = data.error || `Request failed (${res.status})`;
  output.textContent = JSON.stringify(data, null, 2);
  if (rethrow) throw new Error(data.error || `HTTP ${res.status}`);
};

async function ensureClientAndToken() {
  if (!state.apiKey) {
    const res = await post("/register-client", {
      name: read("clientName") || "acme-marketplace",
      internalApiKey: read("internalApiKey"),
    });
    if (!res.ok) { await fail(res, { rethrow: true }); }
    const data = await res.json();
    state.apiKey = data.apiKey;
    write("apiKey", data.apiKey);
    show(data);
  }
  if (!state.accessToken) {
    const res = await post("/auth/token", { apiKey: state.apiKey });
    if (!res.ok) { await fail(res, { rethrow: true }); }
    const data = await res.json();
    state.accessToken = data.accessToken;
    write("accessToken", data.accessToken);
    show(data);
  }
}

async function createChallenge() {
  const res = await post("/challenges", {
    accessToken: state.accessToken,
    verifierId: read("verifierId") || "acme-checkout",
    ageThreshold: Number(read("ageThreshold") || AGE_MIN),
  });
  if (!res.ok) { await fail(res, { rethrow: true }); }
  const data = await res.json();
  state.challengeId = data.challengeId;
  state.sessionId = data.sessionId;
  write("challengeId", data.challengeId);
  write("sessionId", data.sessionId);
  $("metaChallenge").textContent = data.challengeId.slice(0, 20) + "…";
  $("metaSession").textContent = data.sessionId.slice(0, 20) + "…";
  $("metaRequirement").textContent = `Age ≥ ${data.ageThreshold}`;
  show(data);
  return data;
}

async function fetchStatus() {
  if (!state.challengeId || !state.accessToken) return null;
  const res = await fetch(`/challenges/${encodeURIComponent(state.challengeId)}?accessToken=${encodeURIComponent(state.accessToken)}`);
  if (!res.ok) { await fail(res); return null; }
  const data = await res.json();
  show(data);
  const status = String(data.status || "pending").toLowerCase();

  if (data.credentialId) $("metaCredential").textContent = data.credentialId.slice(0, 20) + "…";

  if (status === "verified") {
    setStatus("verified", "User approved. Zero-knowledge proof validated — age requirement satisfied.");
    stopPolling();
  } else if (status === "revoked") {
    setStatus("revoked", "User revoked their identity. The credential is no longer valid.");
  } else if (status === "rejected") {
    setStatus("rejected", data.reason || "Proof rejected.");
    stopPolling();
  } else if (status === "expired") {
    setStatus("expired", "Challenge window elapsed before the user approved.");
    stopPolling();
  } else {
    setStatus("pending", "Waiting for user to approve in ZK-ID app…");
  }
  return data;
}

function startPolling() {
  if (state.pollTimer) return;
  state.pollTimer = setInterval(() => { fetchStatus().catch(() => {}); }, 2500);
  $("togglePollBtn").textContent = "Stop auto-poll";
}
function stopPolling() {
  if (!state.pollTimer) return;
  clearInterval(state.pollTimer);
  state.pollTimer = null;
  $("togglePollBtn").textContent = "Start auto-poll";
}

verifyBtn.addEventListener("click", async () => {
  if (state.verifyBusy) return;
  state.verifyBusy = true;
  heroError.textContent = "";
  verifyBtn.disabled = true;
  verifyBtn.innerHTML = '<span class="spinner"></span>Preparing verification…';
  try {
    await ensureClientAndToken();
    setProgress(1);
    const challenge = await createChallenge();
    setStatus("pending", "Opening ZK-ID app in a new tab…");
    setProgress(2);

    const returnTo = window.location.origin + "/?return=1";
    const userUrl = `${ZK_APP_URL}/verify?challenge=${encodeURIComponent(challenge.challengeId)}&returnTo=${encodeURIComponent(returnTo)}&partner=${encodeURIComponent(PARTNER_NAME)}`;
    window.open(userUrl, "_blank");

    verifyBtn.innerHTML = '<span class="spinner"></span>Waiting for approval…';
    startPolling();
  } catch (err) {
    heroError.textContent = err.message;
    verifyBtn.disabled = false;
    verifyBtn.innerHTML = '<span class="dot"></span>Verify age with ZK-ID';
  } finally {
    state.verifyBusy = false;
  }
});

resetBtn.addEventListener("click", () => {
  stopPolling();
  state.challengeId = "";
  state.sessionId = "";
  write("challengeId", "");
  write("sessionId", "");
  statusCard.classList.remove("visible");
  setProgress(0);
  ageGate.style.color = "var(--amber)";
  ageGate.textContent = `⚠ Age verification required (${AGE_MIN}+)`;
  verifyBtn.style.display = "inline-flex";
  resetBtn.style.display = "none";
  verifyBtn.disabled = false;
  verifyBtn.innerHTML = '<span class="dot"></span>Verify age with ZK-ID';
});

// Dev console buttons
$("registerBtn").addEventListener("click", async () => {
  const res = await post("/register-client", { name: read("clientName"), internalApiKey: read("internalApiKey") });
  if (!res.ok) return fail(res);
  const data = await res.json();
  state.apiKey = data.apiKey;
  write("apiKey", data.apiKey);
  show(data);
});
$("tokenBtn").addEventListener("click", async () => {
  const res = await post("/auth/token", { apiKey: read("apiKey") });
  if (!res.ok) return fail(res);
  const data = await res.json();
  state.accessToken = data.accessToken;
  write("accessToken", data.accessToken);
  show(data);
});
$("challengeBtn").addEventListener("click", async () => {
  state.accessToken = read("accessToken");
  try { await createChallenge(); } catch {}
});
$("statusBtn").addEventListener("click", async () => {
  state.challengeId = read("challengeId");
  state.accessToken = read("accessToken");
  await fetchStatus();
});
$("togglePollBtn").addEventListener("click", () => {
  state.challengeId = read("challengeId");
  state.accessToken = read("accessToken");
  state.pollTimer ? stopPolling() : startPolling();
});
$("fetchCredentialsBtn").addEventListener("click", async () => {
  const accessToken = read("accessToken");
  const res = await fetch(`/credentials?accessToken=${encodeURIComponent(accessToken)}`);
  if (!res.ok) return fail(res);
  const data = await res.json();
  const firstActive = data?.items?.find?.((item) => item.status === "active");
  if (firstActive?.credentialId) write("credentialId", firstActive.credentialId);
  show(data);
});
$("revokeBtn").addEventListener("click", async () => {
  const credentialId = read("credentialId");
  if (!credentialId) { errorBox.textContent = "credential id required"; return; }
  const res = await post(`/credentials/${encodeURIComponent(credentialId)}/revoke`, {
    accessToken: read("accessToken"),
    reason: read("revokeReason"),
  });
  if (!res.ok) return fail(res);
  show(await res.json());
});

// Auto-refresh on return from verify flow
if (new URLSearchParams(location.search).get("return") === "1") {
  setTimeout(() => fetchStatus().catch(() => {}), 300);
}
