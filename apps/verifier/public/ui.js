const output = document.getElementById("output");
const errorBox = document.getElementById("error");
const stateChip = document.getElementById("state");
const historyBox = document.getElementById("history");
const selectedChain = document.getElementById("selectedChain");
const chainSelect = document.getElementById("chainName");
const verdictText = document.getElementById("verdictText");
const verdictCard = document.getElementById("verdictCard");

const HISTORY_KEY = "zk_verifier_demo_history";

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
    verdictText.textContent = `${verdictText.textContent} — ${reason}`;
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

const pushHistory = (entry) => {
  const current = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  const next = [entry, ...current].slice(0, 10);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  renderHistory();
};

const renderHistory = () => {
  const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  if (!list.length) {
    historyBox.className = "history muted";
    historyBox.textContent = "No verifications yet.";
    return;
  }

  historyBox.className = "history";
  historyBox.innerHTML = list
    .map(
      (item) => `
        <div class="history-item">
          <strong>${item.result}</strong> | ${item.verifierId} | ${item.chain}<br />
          <span class="muted">Challenge: ${item.challengeId}</span><br />
          <span class="muted">${new Date(item.createdAt).toLocaleString()}</span>
        </div>
      `,
    )
    .join("");
};

const run = async (label, fn) => {
  setState(`${label}...`);
  try {
    const data = await fn();
    setState(`${label} done`, "ok");
    return data;
  } catch (error) {
    setState(`${label} failed`, "bad");
    throw error;
  }
};

chainSelect.addEventListener("change", () => {
  selectedChain.textContent = `Chain: ${chainSelect.value}`;
});

document.getElementById("registerBtn").addEventListener("click", async () => {
  await run("Register", async () => {
    const res = await post("/register-client", { name: read("clientName") });
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
    show({ ...data, chain: chainSelect.value });
  });
});

document.getElementById("submitBtn").addEventListener("click", async () => {
  await run("Submit proof", async () => {
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
    if (result === "verified" || result === "rejected") {
      pushHistory({
        result,
        verifierId: read("verifierId"),
        chain: chainSelect.value,
        challengeId,
        createdAt: new Date().toISOString(),
      });
    }
  });
});

document.getElementById("statusBtn").addEventListener("click", async () => {
  await run("Fetch status", async () => {
    const challengeId = read("challengeId");
    const accessToken = read("accessToken");
    const res = await fetch(
      `/challenges/${encodeURIComponent(challengeId)}?accessToken=${encodeURIComponent(accessToken)}`,
    );

    if (!res.ok) return fail(res);
    const data = await res.json();
    show({ ...data, chain: chainSelect.value });
    setVerdict(data?.status || "pending", data?.reason || "");
  });
});

document.getElementById("fetchCredentialsBtn").addEventListener("click", async () => {
  await run("Fetch credentials", async () => {
    const accessToken = read("accessToken");
    const res = await fetch(
      `/credentials?accessToken=${encodeURIComponent(accessToken)}`,
    );
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

document.getElementById("clearHistoryBtn").addEventListener("click", () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  setState("History cleared");
});

setVerdict("pending");
renderHistory();
