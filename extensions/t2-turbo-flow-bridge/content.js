(() => {
  console.log('[T2 × Turbo Flow Bridge] Active on Google Flow');

  let activeJob = null;

  // Create floating status pill inside Google Flow
  const badge = document.createElement('div');
  badge.id = 't2-turbo-flow-bridge-pill';
  badge.style.cssText =
    'position:fixed;bottom:18px;left:18px;z-index:999999;background:#020617ee;border:1px solid #06b6d4;color:#ecfeff;padding:10px 16px;border-radius:14px;font-family:Cairo,sans-serif;font-size:12px;box-shadow:0 10px 30px rgba(6,182,212,0.25);display:flex;align-items:center;gap:10px;direction:rtl;';
  badge.innerHTML = `<span style="width:9px;height:9px;border-radius:50%;background:#10b981;display:inline-block;"></span><span>جسر تيتو ستوديو × Turbo Flow متصل</span>`;
  document.body.appendChild(badge);

  function injectPromptIntoFlowOrTurboFlow(job) {
    activeJob = job;
    badge.innerHTML = `<span style="width:9px;height:9px;border-radius:50%;background:#38bdf8;display:inline-block;"></span><span>جاري توليد فيديو: ${job.brandName} (${job.day})</span>`;

    // 1. Check if Turbo Flow extension batch textarea is open
    const turboTextarea =
      document.querySelector('textarea[placeholder*="prompt" i]') ||
      document.querySelector('textarea[placeholder*="batch" i]') ||
      document.querySelector('textarea');

    if (turboTextarea) {
      turboTextarea.focus();
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(turboTextarea, job.omniPrompt);
      } else {
        turboTextarea.value = job.omniPrompt;
      }
      turboTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      turboTextarea.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  // Watch for newly generated <video> elements in Google Flow DOM and sync back to Tito Studio calendar
  const seenVideos = new Set();
  const observer = new MutationObserver(() => {
    const videos = document.querySelectorAll('video[src]');
    videos.forEach(v => {
      const src = v.getAttribute('src');
      if (src && src.startsWith('http') && !seenVideos.has(src) && activeJob) {
        seenVideos.add(src);
        chrome.runtime.sendMessage({
          type: 'T2_TURBO_FLOW_VIDEO_READY',
          jobId: activeJob.jobId,
          postId: activeJob.postId,
          brandId: activeJob.brandId,
          videoUrl: src
        });
        badge.innerHTML = `<span style="width:9px;height:9px;border-radius:50%;background:#10b981;display:inline-block;"></span><span>✅ تم حفظ فيديو (${activeJob.day}) في تقويم تيتو ستوديو!</span>`;
        activeJob = null;
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  chrome.runtime.onMessage.addListener(msg => {
    if (msg.type === 'T2_TURBO_FLOW_SYNC_JOBS' && Array.isArray(msg.jobs) && msg.jobs.length > 0) {
      if (!activeJob) {
        injectPromptIntoFlowOrTurboFlow(msg.jobs[0]);
      }
    }
  });
})();
