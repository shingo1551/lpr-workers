import { createRoute } from 'honox/factory'

export default createRoute((c) => c.render(
  <main class="shell">
    <header class="topbar">
      <a class="brand" href="/" aria-label="Plate Lens ホーム">
        <span class="brand-mark">P</span><span>PLATE<span class="brand-light">LENS</span></span>
      </a>
      <span class="status"><i></i> CLOUDFLARE AI</span>
    </header>

    <section class="intro">
      <p class="eyebrow">LIVE LICENSE PLATE RECOGNITION</p>
      <h1>ナンバーを、<br /><span>すばやく読み取る。</span></h1>
      <p class="lead">カメラを車に向けると、Cloudflare Vision AI がナンバープレートを認識します。</p>
    </section>

    <section class="workspace" aria-label="ナンバープレート読み取り">
      <div class="camera-panel">
        <div class="panel-heading"><span>カメラ映像</span><span id="camera-state" class="subtle">停止中</span></div>
        <div class="video-wrap">
          <video id="camera" autoplay playsinline muted></video>
          <div id="camera-placeholder" class="placeholder">
            <div class="camera-icon">◎</div>
            <strong>カメラを起動してください</strong>
            <span>車のナンバーが枠内に入るように合わせます</span>
          </div>
          <div class="target-frame" aria-hidden="true"><b></b><b></b><b></b><b></b></div>
          <span id="live-tag" class="live-tag"><i></i> LIVE</span>
        </div>
        <div class="controls">
          <button id="start-button" class="primary-button" type="button"><span>▶</span> カメラを起動</button>
          <button id="stop-button" class="secondary-button" type="button" disabled>停止</button>
        </div>
        <p class="privacy-note"><span>⌑</span> 映像は認識のために送信されます。保存はされません。</p>
      </div>

      <aside class="result-panel">
        <div class="panel-heading"><span>認識結果</span><span class="ai-chip">AI</span></div>
        <div id="result-content" class="result-empty">
          <span class="result-glyph">▤</span>
          <strong>読み取り待ち</strong>
          <span>カメラを起動すると<br />自動で認識を開始します</span>
        </div>
        <div id="result-data" class="result-data" hidden>
          <span class="result-label">LICENSE PLATE</span>
          <strong id="plate-number" class="plate-number">—</strong>
          <div class="result-meta"><span>信頼度</span><span id="confidence">—</span></div>
          <div class="result-meta"><span>最終更新</span><span id="last-seen">—</span></div>
        </div>
        <div class="result-footer"><span class="pulse-dot"></span><span id="scan-state">待機中</span></div>
      </aside>
    </section>

    <footer><span>PLATE LENS</span><span>映像からナンバーを自動認識</span></footer>

    <script dangerouslySetInnerHTML={{ __html: `
      const video = document.getElementById('camera');
      const placeholder = document.getElementById('camera-placeholder');
      const startButton = document.getElementById('start-button');
      const stopButton = document.getElementById('stop-button');
      const cameraState = document.getElementById('camera-state');
      const scanState = document.getElementById('scan-state');
      const resultContent = document.getElementById('result-content');
      const resultData = document.getElementById('result-data');
      let stream = null;
      let scanTimer = null;
      let busy = false;
      let previousPlate = '';

      async function scanFrame() {
        if (!stream || busy || video.readyState < 2) return;
        busy = true;
        scanState.textContent = '画像を解析中';
        try {
          const canvas = document.createElement('canvas');
          const scale = Math.min(1, 1280 / video.videoWidth);
          canvas.width = Math.round(video.videoWidth * scale);
          canvas.height = Math.round(video.videoHeight * scale);
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
          const response = await fetch('/api/recognize', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ image: canvas.toDataURL('image/jpeg', 0.82) })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || '認識に失敗しました');
          const modelOutput = data.result?.response ?? data.result;
          const text = typeof modelOutput === 'string' ? modelOutput : JSON.stringify(modelOutput);
          const match = text.match(/\\{[\\s\\S]*\\}/);
          let parsed = null;
          try { parsed = match ? JSON.parse(match[0]) : null; } catch {}
          const plate = parsed?.plate && parsed.plate !== 'null' ? String(parsed.plate).trim() : '';
          if (plate) {
            document.getElementById('plate-number').textContent = plate;
            document.getElementById('confidence').textContent = parsed.confidence || '—';
            document.getElementById('last-seen').textContent = new Date().toLocaleTimeString('ja-JP');
            resultContent.hidden = true;
            resultData.hidden = false;
            scanState.textContent = plate === previousPlate ? '認識中' : 'ナンバーを認識しました';
            previousPlate = plate;
          } else {
            scanState.textContent = 'ナンバーを探しています';
          }
        } catch (error) {
          scanState.textContent = error.message || '通信エラー';
        } finally {
          busy = false;
        }
      }

      startButton.addEventListener('click', async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
          video.srcObject = stream;
          document.querySelector('.video-wrap').classList.add('is-live');
          placeholder.hidden = true;
          startButton.disabled = true;
          stopButton.disabled = false;
          cameraState.textContent = 'カメラ使用中';
          scanState.textContent = 'ナンバーを探しています';
          scanTimer = setInterval(scanFrame, 2200);
          scanFrame();
        } catch (error) {
          scanState.textContent = error.name === 'NotAllowedError' ? 'カメラの使用を許可してください' : 'カメラを起動できません';
        }
      });

      stopButton.addEventListener('click', () => {
        clearInterval(scanTimer);
        stream?.getTracks().forEach(track => track.stop());
        stream = null;
        video.srcObject = null;
        document.querySelector('.video-wrap').classList.remove('is-live');
        placeholder.hidden = false;
        startButton.disabled = false;
        stopButton.disabled = true;
        cameraState.textContent = '停止中';
        scanState.textContent = '待機中';
      });
    ` }} />
  </main>, { title: 'Plate Lens — ナンバープレート認識' }
))
