document.addEventListener("DOMContentLoaded", () => {
  const searchConsentOpt = document.getElementById("searchConsentOpt");
  const pauseOpt = document.getElementById("pauseOpt");
  const checkAgentBtn = document.getElementById("checkAgentBtn");
  const agentStatusLabel = document.getElementById("agentStatusLabel");

  chrome.storage.local.get(["search_consent", "is_paused"], (res) => {
    searchConsentOpt.checked = Boolean(res.search_consent);
    pauseOpt.checked = Boolean(res.is_paused);
  });

  searchConsentOpt.addEventListener("change", (e) => {
    chrome.storage.local.set({ search_consent: e.target.checked });
  });

  pauseOpt.addEventListener("change", (e) => {
    chrome.storage.local.set({ is_paused: e.target.checked });
  });

  checkAgentBtn.addEventListener("click", async () => {
    agentStatusLabel.textContent = "Connecting...";
    agentStatusLabel.style.color = "#94A3B8";
    try {
      const res = await fetch("http://127.0.0.1:42424/api/status", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        agentStatusLabel.textContent = `Connected (Agent v${data.agent_version})`;
        agentStatusLabel.style.color = "#34D399";
      } else {
        throw new Error("HTTP error");
      }
    } catch {
      agentStatusLabel.textContent = "Could not connect to desktop agent at port 42424";
      agentStatusLabel.style.color = "#F87171";
    }
  });
});

