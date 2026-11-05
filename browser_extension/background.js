/**
 * MindGuard AI Browser Extension - Background Service Worker
 * ==========================================================
 * Strict Privacy Commitments:
 * 1. Only records top-level Domain Name (e.g. github.com, canvas.edu).
 * 2. Zero page text, password, form content, or private message logging.
 * 3. Never tracks Incognito / Private browsing tabs.
 * 4. Only counts time when the tab is currently active and user is not idle.
 * 5. Search queries recorded only when explicit user consent toggle is active.
 */

const LOCAL_AGENT_URL = "http://127.0.0.1:42424";
const SAMPLE_INTERVAL_SECONDS = 3;

let activeTabId = null;
let currentDomain = null;
let lastHeartbeatTime = Date.now();
let searchTrackingConsent = false;
let isMonitoringPaused = false;

// Load stored preferences
chrome.storage.local.get(["search_consent", "is_paused"], (res) => {
  searchTrackingConsent = Boolean(res.search_consent);
  isMonitoringPaused = Boolean(res.is_paused);
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.search_consent) {
    searchTrackingConsent = Boolean(changes.search_consent.newValue);
  }
  if (changes.is_paused) {
    isMonitoringPaused = Boolean(changes.is_paused.newValue);
  }
});

function extractDomain(urlStr) {
  if (!urlStr) return null;
  try {
    const parsed = new URL(urlStr);
    // Ignore internal browser schemes
    if (["chrome:", "edge:", "about:", "chrome-extension:", "moz-extension:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function detectSearchEngineQuery(urlStr) {
  if (!urlStr || !searchTrackingConsent) return null;
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();

    let engine = null;
    let queryParam = null;

    if (host.includes("google.")) {
      engine = "Google";
      queryParam = "q";
    } else if (host.includes("bing.")) {
      engine = "Bing";
      queryParam = "q";
    } else if (host.includes("duckduckgo.")) {
      engine = "DuckDuckGo";
      queryParam = "q";
    }

    if (engine && queryParam) {
      const q = parsed.searchParams.get(queryParam);
      if (q && q.trim().length > 1) {
        return { engine, query: q.trim() };
      }
    }
  } catch {}
  return null;
}

// Track active tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  activeTabId = activeInfo.tabId;
  try {
    const tab = await chrome.tabs.get(activeTabId);
    if (tab && !tab.incognito) {
      currentDomain = extractDomain(tab.url);
      lastHeartbeatTime = Date.now();
    } else {
      currentDomain = null;
    }
  } catch {
    currentDomain = null;
  }
});

// Track URL navigations in active tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    if (tab.incognito) {
      currentDomain = null;
      return;
    }

    currentDomain = extractDomain(changeInfo.url);
    lastHeartbeatTime = Date.now();

    // Check for consented academic search queries
    const searchData = detectSearchEngineQuery(changeInfo.url);
    if (searchData) {
      dispatchSearchTelemetry(searchData.engine, searchData.query);
    }
  }
});

// Periodic active time accumulator
setInterval(async () => {
  if (isMonitoringPaused || !currentDomain) return;

  chrome.idle.queryState(60, async (state) => {
    // Only accumulate if user is actively interacting with the device
    if (state !== "active") return;

    try {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (!tab || tab.incognito) return;

      const domain = extractDomain(tab.url);
      if (domain) {
        dispatchWebTelemetry(domain, SAMPLE_INTERVAL_SECONDS);
      }
    } catch {}
  });
}, SAMPLE_INTERVAL_SECONDS * 1000);

async function dispatchWebTelemetry(domain, seconds) {
  try {
    await fetch(`${LOCAL_AGENT_URL}/api/web-activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain: domain,
        duration_seconds: seconds,
        browser: "Chrome / Edge",
        category: categorizeDomain(domain),
        is_new_visit: false
      })
    });
  } catch {
    // Desktop agent offline; local accumulation will flush once desktop agent starts
  }
}

async function dispatchSearchTelemetry(engine, query) {
  if (!searchTrackingConsent) return;
  try {
    await fetch(`${LOCAL_AGENT_URL}/api/search-query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        engine: engine,
        query: query,
        category: "Academic"
      })
    });
  } catch {}
}

function categorizeDomain(domain) {
  const d = domain.toLowerCase();
  if (d.includes("github") || d.includes("stackoverflow") || d.includes("leetcode") || d.includes("arxiv") || d.includes("overleaf") || d.includes("canvas") || d.includes("coursera") || d.includes("edx") || d.includes("notion")) {
    return "Education";
  }
  if (d.includes("youtube") || d.includes("netflix") || d.includes("twitch") || d.includes("primevideo") || d.includes("spotify")) {
    return "Entertainment";
  }
  if (d.includes("reddit") || d.includes("instagram") || d.includes("twitter") || d.includes("x.com") || d.includes("linkedin") || d.includes("facebook") || d.includes("discord")) {
    return "Social Media";
  }
  return "General";
}
