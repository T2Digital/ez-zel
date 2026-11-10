(() => {
  console.log('[T2 × Turbo Flow Bridge] Active on Google Flow');

  let activeJob = null;
  const seenVideos = new Set();

  // Create floating status pill inside Google Flow
  const badge = document.createElement('div');
  badge.id = 't2-turbo-flow-bridge-pill';
  badge.style.cssText =
    'position:fixed;bottom:18px;left:18px;z-index:999999;background:#020617ee;border:1px solid #06b6d4;color:#ecfeff;padding:10px 16px;border-radius:14px;font-family:Cairo,sans-serif;font-size:12px;box-shadow:0 10px 30px rgba(6,182,212,0.25);display:flex;align-items:center;gap:10px;direction:rtl;';
  badge.innerHTML = `<span style="width:9px;height:9px;border-radius:50%;background:#10b981;display:inline-block;"></span><span>جسر تيتو ستوديو × Turbo Flow متصل</span>`;
  document.body.appendChild(badge);

  function triggerGenerateButton() {
    const buttons = Array.from(document.querySelectorAll('button'));
    const genBtn = buttons.find(b => {
      const txt = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase();
      return (
        txt.includes('generate') ||
        txt.includes('create') ||
        txt.includes('run queue') ||
        txt.includes('start') ||
        txt.includes('توليد')
      );
    });
    if (genBtn && !genBtn.disabled) {
      genBtn.click();
      return true;
    }
    return false;
  }

  function injectPromptIntoFlowOrTurboFlow(job) {
    activeJob = job;
    badge.innerHTML = `<span style="width:9px;height:9px;border-radius:50%;background:#38bdf8;display:inline-block;"></span><span>جاري توليد فيديو: ${job.brandName} (${job.day})</span>`;

    const turboTextarea =
      document.querySelector('textarea[placeholder*="prompt" i]') ||
      document.querySelector('textarea[placeholder*="batch" i]') ||
      document.querySelector('textarea[aria-label*="prompt" i]') ||
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

      setTimeout(() => {
        triggerGenerateButton();
      }, 900);
    }
  }

  async function resolveVideoSourceToPersistableUrl(src) {
    if (!src) return null;
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    if (src.startsWith('blob:')) {
      try {
        const resp = await fetch(src);
        const blob = await resp.blob();
        if (blob.size > 0 && blob.size <= 25 * 1024 * 1024) {
          return await new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        }
      } catch {}
    }
    return null;
  }

  // Watch for newly generated <video> elements (both https:// and blob:) in Google Flow DOM
  const observer = new MutationObserver(() => {
    if (!activeJob) return;
    const videos = document.querySelectorAll('video');
    videos.forEach(async v => {
      const src = v.currentSrc || v.getAttribute('src') || v.querySelector('source')?.getAttribute('src');
      if (src && !seenVideos.has(src) && activeJob) {
        seenVideos.add(src);
        const jobSnapshot = activeJob;
        const persistableUrl = await resolveVideoSourceToPersistableUrl(src);
        if (persistableUrl) {
          chrome.runtime.sendMessage({
            type: 'T2_TURBO_FLOW_VIDEO_READY',
            jobId: jobSnapshot.jobId,
            postId: jobSnapshot.postId,
            brandId: jobSnapshot.brandId,
            videoUrl: persistableUrl
          });
          badge.innerHTML = `<span style="width:9px;height:9px;border-radius:50%;background:#10b981;display:inline-block;"></span><span>✅ تم حفظ فيديو (${jobSnapshot.day}) في تقويم تيتو ستوديو!</span>`;
          activeJob = null;
        }
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
