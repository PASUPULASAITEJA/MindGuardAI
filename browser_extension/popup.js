document.addEventListener("DOMContentLoaded", async () => {
  const statusBadge = document.getElementById("statusBadge");
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const activeDomainText = document.getElementById("activeDomainText");
  const searchConsentToggle = document.getElementById("searchConsentToggle");
  const pauseToggle = document.getElementById("pauseToggle");
  const openDashboardBtn = document.getElementById("openDashboardBtn");

  // Load current tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && !tab.incognito) {
      const u = new URL(tab.url);
      activeDomainText.textContent = u.hostname.replace(/^www\./, "");
    } else if (tab && tab.incognito) {
      activeDomainText.textContent = "Incognito Tab (Ignored)";
    } else {
      activeDomainText.textContent = "No active web page";
    }
  } catch {
    activeDomainText.textContent = "Browser Home";
  }

  // Load stored preferences
  chrome.storage.local.get(["search_consent", "is_paused"], (res) => {
    searchConsentToggle.checked = Boolean(res.search_consent);
    pauseToggle.checked = Boolean(res.is_paused);
  });

  // Check desktop agent connection
  try {
    const res = await fetch("http://127.0.0.1:42424/api/status", { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      statusBadge.className = "status-badge status-online";
      statusDot.className = "dot dot-green";
      statusText.textContent = "Agent Active";
    }
  } catch {
    statusBadge.className = "status-badge status-offline";
    statusDot.className = "dot dot-red";
    statusText.textContent = "Agent Offline";
  }

  // Event handlers
  searchConsentToggle.addEventListener("change", (e) => {
    chrome.storage.local.set({ search_consent: e.target.checked });
  });

  pauseToggle.addEventListener("change", (e) => {
    chrome.storage.local.set({ is_paused: e.target.checked });
  });

  openDashboardBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "http://localhost:5173/student/screentime" });
  });
});

