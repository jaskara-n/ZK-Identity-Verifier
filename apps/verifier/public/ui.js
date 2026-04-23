const output = document.getElementById("output");
const errorBox = document.getElementById("error");
const stateChip = document.getElementById("state");
const selectedChain = document.getElementById("selectedChain");
const chainSelect = document.getElementById("chainName");
const verdictText = document.getElementById("verdictText");
const verdictCard = document.getElementById("verdictCard");
const userFlowUrlInput = document.getElementById("userFlowUrl");
const openUserAppBtn = document.getElementById("openUserAppBtn");
const togglePollBtn = document.getElementById("togglePollBtn");

let pollTimer = null;

const read = (id) => document.getElementById(id).value.trim();
const write = (id, value) => {
  document.getElementById(id).value = value || "";
};

const setState = (label, tone = "") => {
  stateChip.textContent = label;
  stateChip.className = `state ${tone}`.trim();
};

const setVerdict = (status, reason = "") => {
  const normalized = String(status || "pending").toLowerCase();
  verdictCard.className = "verdict";

  if (normalized === "verified") {
    verdictCard.classList.add("ok");
    verdictText.textContent = "Verified";
  } else if (normalized === "rejected" || normalized === "expired") {
    verdictCard.classList.add("bad");
    verdictText.textContent = normalized === "expired" ? "Expired" : "Rejected";
  } else {
    verdictText.textContent = "Pending";
  }

  if (reason) {
    verdictText.textContent = `${verdictText.textContent} - ${reason}`;
  }
};

const show = (data) => {
  output.textContent = JSON.stringify(data, null, 2);
  errorBox.textContent = "";
};

const fail = async (res) => {
  const data = await res.json().catch(() => ({ error: "request failed" }));
  errorBox.textContent = data.error || `Request failed (${res.status})`;
  output.textContent = JSON.stringify(data, null, 2);
  setState("Failed", "bad");
};

const post = (url, body) =>
  fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const run = async (label, fn) => {
  setState(`${label}...`);
  try {
    await fn();
    setState(`${label} done`, "ok");
  } catch {
    setState(`${label} failed`, "bad");
  }
};

const refreshUserFlowLink = () => {
  const params = new URLSearchParams({
    challengeId: read("challengeId"),
    sessionId: read("sessionId"),
    verifierId: read("verifierId"),
    ageThreshold: read("ageThreshold"),
  });
  const url = `http://localhost:5173/user-app?${params.toString()}`;
  userFlowUrlInput.value = url;
  openUserAppBtn.href = url;
};

const fetchStatus = async () => {
  const challengeId = read("challengeId");
  const accessToken = read("accessToken");
  if (!challengeId || !accessToken) {
    throw new Error("challenge and token required");
  }

  const res = await fetch(
    `/challenges/${encodeURIComponent(challengeId)}?accessToken=${encodeURIComponent(accessToken)}`,
  );

  if (!res.ok) return fail(res);
  const data = await res.json();
  show({ ...data, chain: chainSelect.value });
  setVerdict(data?.status || "pending", data?.reason || "");

  if (["verified", "rejected", "expired"].includes(String(data?.status || "").toLowerCase())) {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
      togglePollBtn.textContent = "Start Auto Poll";
    }
  }
};

chainSelect.addEventListener("change", () => {
  selectedChain.textContent = `Chain: ${chainSelect.value}`;
});

["challengeId", "sessionId", "verifierId", "ageThreshold"].forEach((id) => {
  document.getElementById(id).addEventListener("input", refreshUserFlowLink);
});

document.getElementById("registerBtn").addEventListener("click", async () => {
  await run("Register", async () => {
    const res = await post("/register-client", {
      name: read("clientName"),
      internalApiKey: read("internalApiKey"),
    });
    if (!res.ok) return fail(res);
    const data = await res.json();
    write("apiKey", data.apiKey);
    show(data);
  });
});

document.getElementById("tokenBtn").addEventListener("click", async () => {
  await run("Issue token", async () => {
    const res = await post("/auth/token", { apiKey: read("apiKey") });
    if (!res.ok) return fail(res);
    const data = await res.json();
    write("accessToken", data.accessToken);
    show(data);
  });
});

document.getElementById("challengeBtn").addEventListener("click", async () => {
  await run("Create challenge", async () => {
    const res = await post("/challenges", {
      accessToken: read("accessToken"),
      verifierId: read("verifierId"),
      ageThreshold: Number(read("ageThreshold")),
    });

    if (!res.ok) return fail(res);
    const data = await res.json();
    write("challengeId", data.challengeId);
    write("sessionId", data.sessionId);
    refreshUserFlowLink();
    setVerdict("pending");
    show({ ...data, chain: chainSelect.value, next: "Open user app link and let user submit proof" });
  });
});

document.getElementById("statusBtn").addEventListener("click", async () => {
  await run("Fetch status", fetchStatus);
});

togglePollBtn.addEventListener("click", () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
    togglePollBtn.textContent = "Start Auto Poll";
    setState("Auto poll stopped");
    return;
  }

  pollTimer = setInterval(() => {
    fetchStatus().catch(() => {});
  }, 3000);
  togglePollBtn.textContent = "Stop Auto Poll";
  setState("Auto poll active", "ok");
});

document.getElementById("fetchCredentialsBtn").addEventListener("click", async () => {
  await run("Fetch credentials", async () => {
    const accessToken = read("accessToken");
    const res = await fetch(`/credentials?accessToken=${encodeURIComponent(accessToken)}`);
    if (!res.ok) return fail(res);
    const data = await res.json();
    const firstActive = data?.items?.find?.((item) => item.status === "active");
    if (firstActive?.credentialId) {
      write("credentialId", firstActive.credentialId);
    }
    show(data);
  });
});

document.getElementById("revokeBtn").addEventListener("click", async () => {
  await run("Revoke credential", async () => {
    const credentialId = read("credentialId");
    if (!credentialId) {
      throw new Error("credential id is required");
    }

    const res = await post(`/credentials/${encodeURIComponent(credentialId)}/revoke`, {
      accessToken: read("accessToken"),
      reason: read("revokeReason"),
    });

    if (!res.ok) return fail(res);
    const data = await res.json();
    show(data);
  });
});

// Demo shortcut only

document.getElementById("submitBtn").addEventListener("click", async () => {
  await run("Submit proof (shortcut)", async () => {
    const challengeId = read("challengeId");

    const res = await post("/simulate-submit", {
      challengeId,
      sessionId: read("sessionId"),
      verifierId: read("verifierId"),
      ageThreshold: Number(read("ageThreshold")),
      birthDate: read("birthDate"),
      passportNumber: read("passportNumber"),
    });

    if (!res.ok) return fail(res);
    const data = await res.json();
    show({ ...data, chain: chainSelect.value });

    const result = data?.submitResult?.status || "pending";
    setVerdict(result, data?.submitResult?.reason || "");
  });
});

setVerdict("pending");
refreshUserFlowLink();
