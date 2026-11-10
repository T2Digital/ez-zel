const API_BASE = 'http://localhost:3000/api/studio/turbo-flow';

// Poll pending video jobs every 12 seconds and forward to active Google Flow tab
setInterval(async () => {
  try {
    const res = await fetch(`${API_BASE}/queue`);
    if (!res.ok) return;
    const data = await res.json();
    const pendingJobs = (data.jobs || []).filter(j => j.status === 'queued');
    if (pendingJobs.length === 0) return;

    const tabs = await chrome.tabs.query({ url: 'https://labs.google/fx/*' });
    if (tabs.length > 0 && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'T2_TURBO_FLOW_SYNC_JOBS',
        jobs: pendingJobs
      });
    }
  } catch (err) {
    // Server offline or not reachable right now
  }
}, 12000);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'T2_TURBO_FLOW_VIDEO_READY') {
    fetch(`${API_BASE}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: msg.jobId,
        postId: msg.postId,
        brandId: msg.brandId,
        videoUrl: msg.videoUrl
      })
    })
      .then(r => r.json())
      .then(res => sendResponse({ ok: true, res }))
      .catch(err => sendResponse({ ok: false, error: String(err) }));
    return true;
  }
});
