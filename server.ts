import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

interface ChatMessage {
  role: 'user' | 'assistant' | 'model';
  content?: string;
  text?: string;
}

interface ActionPayload {
  type: 'open_app' | 'set_shell' | 'set_theme' | 'apply_theme' | 'snap_windows' | 'play_music' | 'none';
  target?: string;
  label?: string;
}

function getFallbackResponse(message: string): { reply: string; action: ActionPayload | null; model: string } {
  const q = (message || '').toLowerCase();

  // App launch intents
  if (q.includes('browser') || q.includes('web') || q.includes('ブラウザ') || q.includes('ネット') || q.includes('インターネット')) {
    return {
      reply: 'Liquid Browserを起動します。高速プロキシエンジン（Scramjet / Ultraviolet）とブックマークが利用可能です。',
      action: { type: 'open_app', target: 'browser', label: 'ブラウザを開く' },
      model: 'local-copilot',
    };
  }
  if (q.includes('music') || q.includes('synth') || q.includes('音楽') || q.includes('曲') || q.includes('再生')) {
    return {
      reply: 'Monochrome Musicプレイヤーを開きます。Hi-Fiロスレス音楽と同期歌詞をお楽しみください。',
      action: { type: 'open_app', target: 'synth', label: '音楽を再生' },
      model: 'local-copilot',
    };
  }
  if (q.includes('terminal') || q.includes('cli') || q.includes('ターミナル') || q.includes('コマンド')) {
    return {
      reply: 'Liquid Terminalを起動します。シェルコマンドやシステム診断が可能です。',
      action: { type: 'open_app', target: 'terminal', label: 'ターミナルを開く' },
      model: 'local-copilot',
    };
  }
  if (q.includes('store') || q.includes('ストア') || q.includes('ダウンロード') || q.includes('アプリ')) {
    return {
      reply: 'App Storeを開きます。新しいアプリやVista/XPなどのカスタムテーマをダウンロード・適用できます。',
      action: { type: 'open_app', target: 'appstore', label: 'ストアを開く' },
      model: 'local-copilot',
    };
  }
  if (q.includes('calc') || q.includes('電卓') || q.includes('計算')) {
    return {
      reply: 'Calculator Proを起動します。科学計算とメモリレジスタが利用できます。',
      action: { type: 'open_app', target: 'calculator', label: '電卓を開く' },
      model: 'local-copilot',
    };
  }
  if (q.includes('game') || q.includes('ゲーム') || q.includes('宇宙') || q.includes('3d') || q.includes('レース')) {
    return {
      reply: '3D Arcadium Engine / Cosmic Velocityを起動します。Three.jsによる60FPSの宇宙レースをお楽しみください。',
      action: { type: 'open_app', target: 'game', label: 'ゲームを起動' },
      model: 'local-copilot',
    };
  }

  // Theme & Shell change intents
  if (q.includes('xp') || q.includes('ルナ') || q.includes('luna')) {
    return {
      reply: 'Windows XP ルナ・クラシックテーマを適用します！ロイヤルブルータスクバーと懐かしのBliss草原デスクトップへ切り替えます。',
      action: { type: 'apply_theme', target: 'xp-luna', label: 'XPテーマを適用' },
      model: 'local-copilot',
    };
  }
  if (q.includes('vista') || q.includes('ビスタ') || q.includes('aero') || q.includes('エアロ')) {
    return {
      reply: 'Windows Vista アルティメット・エアロテーマを適用します！半透明エアログラスと、リアルタイム動作するアナログ時計＆CPUメーターガジェットが起動します。',
      action: { type: 'apply_theme', target: 'vista-aero', label: 'Vista Aeroを適用' },
      model: 'local-copilot',
    };
  }
  if (q.includes('10') || q.includes('win10') || q.includes('windows 10')) {
    return {
      reply: 'Windows 10 フルエント・ダークテーマを適用します。Cortana検索とライブタイルメニューへ切り替えます。',
      action: { type: 'apply_theme', target: 'win10-fluent', label: 'Win10テーマを適用' },
      model: 'local-copilot',
    };
  }
  if (q.includes('11') || q.includes('win11') || q.includes('windows 11')) {
    return {
      reply: 'Windows 11 マイカ・プロテーマを適用します。中央タスクバーとMicaすりガラスへ切り替えます。',
      action: { type: 'apply_theme', target: 'win11-mica', label: 'Win11テーマを適用' },
      model: 'local-copilot',
    };
  }
  if (q.includes('dex') || q.includes('サムスン') || q.includes('samsung')) {
    return {
      reply: 'Samsung DeX デスクトップシェルに切り替えます。マルチウィンドウとアプリドロワーが有効になります。',
      action: { type: 'set_shell', target: 'dex', label: 'DeXシェルに切替' },
      model: 'local-copilot',
    };
  }
  if (q.includes('chrome') || q.includes('chromeos')) {
    return {
      reply: 'ChromeOS Material 3シェルに切り替えます。Everythingボタンとピルシェルフが起動します。',
      action: { type: 'set_shell', target: 'chromeos', label: 'ChromeOSに切替' },
      model: 'local-copilot',
    };
  }
  if (q.includes('mac') || q.includes('apple') || q.includes('マック')) {
    return {
      reply: 'macOS Liquid Aquaシェルに切り替えます。ボトムの拡大Dockと上部システムメニューバーへ移行します。',
      action: { type: 'set_shell', target: 'mac', label: 'macOSに切替' },
      model: 'local-copilot',
    };
  }
  if (q.includes('cyber') || q.includes('サイバー') || q.includes('ネオン') || q.includes('ブラックホール')) {
    return {
      reply: 'サイバーパンク・シンギュラリティテーマを適用します。3D Einstein Ring Raymarcherブラックホールと高輝度ネオンHUDが起動します。',
      action: { type: 'apply_theme', target: 'cyberpunk-singularity', label: 'サイバーパンク適用' },
      model: 'local-copilot',
    };
  }
  if (q.includes('snap') || q.includes('スナップ') || q.includes('整列') || q.includes('並べる') || q.includes('タイリング')) {
    return {
      reply: '開いているウィンドウを左右50:50にスナップ整列します。',
      action: { type: 'snap_windows', target: '50-50', label: 'ウィンドウを整列' },
      model: 'local-copilot',
    };
  }
  if (q.includes('dark') || q.includes('ダーク')) {
    return {
      reply: 'ダークモードに切り替えます。',
      action: { type: 'set_theme', target: 'dark', label: 'ダークモード' },
      model: 'local-copilot',
    };
  }
  if (q.includes('light') || q.includes('ライト')) {
    return {
      reply: 'ライトモードに切り替えます。',
      action: { type: 'set_theme', target: 'light', label: 'ライトモード' },
      model: 'local-copilot',
    };
  }

  // General conversational assistance
  return {
    reply: `LiquidOS Copilotです！何かお手伝いできることはありますか？\n「XPテーマにして」「Vista Aeroを適用」「ブラウザを開いて」「DeXモードに切替」「ウィンドウを整列」などのOS操作や、プログラミング・質問・アイデア出しなど何でもお気軽にどうぞ！`,
    action: null,
    model: 'local-copilot',
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health and capabilities check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      os: 'LiquidOS-4.1.0-Beta',
      geminiAvailable: Boolean(process.env.GEMINI_API_KEY),
      model: 'gemini-3.8-flash',
    });
  });

  // Web Reverse Proxy Endpoint for Liquid Browser & jsDelivr / GitHub Pages (bypasses X-Frame-Options / CSP / nosniff)
  app.get('/api/proxy', async (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      return res.status(400).send('URL query parameter required');
    }

    let targetUrl = rawUrl.trim();

    // Support jsdelivr:owner/repo or gh:owner/repo shortcuts
    if (/^(jsdelivr|gh):/i.test(targetUrl)) {
      const repoPath = targetUrl.replace(/^(jsdelivr|gh):\/+/i, '').replace(/^(jsdelivr|gh):/i, '');
      const parts = repoPath.split('/');
      if (parts.length >= 2) {
        const owner = parts[0];
        const repo = parts[1].replace(/\.git$/i, '');
        const rest = parts.slice(2).join('/') || 'index.html';
        targetUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@latest/${rest}`;
      }
    } else if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    const fetchWithFallback = async (urlToFetch: string) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const resp = await fetch(urlToFetch, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8',
          },
        });
        clearTimeout(timeout);
        return resp;
      } catch (e) {
        clearTimeout(timeout);
        throw e;
      }
    };

    try {
      let response = await fetchWithFallback(targetUrl);

      // Automatic GitHub Pages -> jsDelivr CDN fallback when GitHub Pages 404s
      if (!response.ok && response.status === 404) {
        const ghPagesMatch = targetUrl.match(/^https?:\/\/([^.]+)\.github\.io\/([^/]+)(\/.*)?$/i);
        if (ghPagesMatch) {
          const owner = ghPagesMatch[1];
          const repo = ghPagesMatch[2];
          const subPath = !ghPagesMatch[3] || ghPagesMatch[3] === '/' ? '/index.html' : ghPagesMatch[3];
          const jsDelivrUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@latest${subPath}`;
          const fallbackResp = await fetchWithFallback(jsDelivrUrl);
          if (fallbackResp.ok) {
            targetUrl = jsDelivrUrl;
            response = fallbackResp;
          }
        }
      }

      const parsed = new URL(targetUrl);
      let contentType = response.headers.get('content-type') || 'text/html; charset=utf-8';

      // jsDelivr & raw.githubusercontent often serve .html with text/plain or nosniff; force text/html for .html or root paths
      const isJsDelivrOrRaw =
        parsed.hostname.includes('jsdelivr.net') || parsed.hostname.includes('githubusercontent.com');
      if (
        isJsDelivrOrRaw &&
        (parsed.pathname.endsWith('.html') || parsed.pathname.endsWith('.htm') || parsed.pathname.endsWith('/'))
      ) {
        contentType = 'text/html; charset=utf-8';
      }

      // Set headers allowing iframe embedding
      res.setHeader('Content-Type', contentType);
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.removeHeader('X-Content-Type-Options');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (contentType.includes('text/html')) {
        let html = await response.text();
        const baseHref = `${parsed.protocol}//${parsed.host}${parsed.pathname.substring(0, parsed.pathname.lastIndexOf('/') + 1) || '/'}`;

        // Inject <base> tag and script to rewrite link clicks through /api/proxy
        const scriptInjection = `
          <base href="${baseHref}">
          <script>
            (function() {
              window.addEventListener('click', function(e) {
                var a = e.target.closest('a');
                if (a && a.href && !a.href.startsWith('javascript:') && !a.href.startsWith('#')) {
                  e.preventDefault();
                  window.location.href = '/api/proxy?url=' + encodeURIComponent(a.href);
                }
              }, true);
            })();
          </script>
        `;

        if (/<head[^>]*>/i.test(html)) {
          html = html.replace(/<head[^>]*>/i, (match) => `${match}${scriptInjection}`);
        } else {
          html = scriptInjection + html;
        }

        return res.send(html);
      } else {
        // Stream images, css, scripts directly
        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));
      }
    } catch (err: unknown) {
      console.error('Proxy error:', err);
      return res.status(502).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { max-width: 480px; padding: 2rem; background: rgba(255,255,255,0.04); border-radius: 1rem; border: 1px solid rgba(255,255,255,0.08); text-align: center; }
              h1 { font-size: 1.1rem; margin-bottom: 0.5rem; color: #f43f5e; }
              p { font-size: 0.85rem; color: rgba(255,255,255,0.6); margin-bottom: 1.5rem; }
              button { background: #0ea5e9; color: #000; font-weight: 600; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Connection Timeout or Blocked</h1>
              <p>The proxy could not load: <code>${rawUrl}</code>. Check the URL or connection.</p>
              <button onclick="window.location.reload()">Retry</button>
            </div>
          </body>
        </html>
      `);
    }
  });

  // AI Chat Endpoint with Gemini 3.8 Flash
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message, history, context } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        const fallback = getFallbackResponse(message);
        return res.json({
          ...fallback,
          note: 'Operating via built-in intelligent engine (GEMINI_API_KEY optional).',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const systemInstruction = `You are LiquidOS Copilot, the AI assistant inside LiquidOS (a web-based desktop OS).
Respond naturally in the user's language (Japanese if asked in Japanese, English if in English).
Be concise, helpful, friendly, and precise.

Available Apps in LiquidOS:
- 'browser': Liquid Browser with Scramjet/Ultraviolet proxy engine
- 'synth': Monochrome Music & synced lyrics
- 'explorer': File Explorer & virtual storage
- 'terminal': Liquid CLI Terminal
- 'settings': System Settings & shell picker
- 'notepad': Notepad Text Editor
- 'game': Cosmic Velocity 3D arcade racer
- 'appstore': App Store & Theme Store
- 'calculator': Calculator Pro
- 'taskmanager': Task Manager & process monitor
- 'sysmon': System Monitor & clock telemetry
- 'calendar': Cosmic Calendar & Tasks

Available Shells:
- 'xp' (Windows XP Luna Blue)
- 'vista' (Windows Vista Aero Glass with live Sidebar gadgets)
- 'windows10' (Windows 10 Fluent Dark)
- 'windows' or 'windows11' (Windows 11 Mica Fluent)
- 'windows8' (Windows 8 Metro Live Tiles)
- 'dex' (Samsung DeX Desktop)
- 'chromeos' (ChromeOS Material 3)
- 'mac' (macOS Liquid Aqua)
- 'ubuntu' (Ubuntu Linux Yaru)

Available Store Themes:
- 'xp-luna', 'vista-aero', 'win10-fluent', 'win11-mica', 'win8-metro', 'samsung-dex', 'chromeos-m3', 'macos-sonoma', 'cyberpunk-singularity', 'sakura-vaporwave', 'ubuntu-lunar', 'gargantua-oled'

Always reply with strict JSON matching this schema:
{
  "reply": "Your conversational answer in user's language",
  "action": {
    "type": "open_app" | "set_shell" | "set_theme" | "apply_theme" | "snap_windows" | "play_music" | "none",
    "target": "target string if applicable (e.g., 'browser', 'vista', 'xp-luna')",
    "label": "Short button label for manual trigger"
  }
}
If no OS command is requested, set action to null or type "none". Return ONLY raw JSON without markdown backticks.`;

      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-6) as ChatMessage[]) {
          contents.push({
            role: item.role === 'model' || item.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: item.content || item.text || '' }],
          });
        }
      }

      contents.push({
        role: 'user',
        parts: [
          {
            text: `Current Desktop State: ${JSON.stringify(context || {})}\n\nUser Message: ${message}`,
          },
        ],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '';
      try {
        const parsed = JSON.parse(rawText);
        return res.json({
          reply: parsed.reply || rawText,
          action: parsed.action || null,
          model: 'gemini-3.8-flash',
        });
      } catch {
        return res.json({
          reply: rawText,
          action: null,
          model: 'gemini-3.8-flash',
        });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn('Gemini API call failed, using fallback:', errMsg);
      const fallback = getFallbackResponse(req.body?.message);
      return res.json({
        ...fallback,
        warning: 'Fallback activated',
      });
    }
  });

  // Support legacy subpaths like /LiquidOS-V3.0.0-Beta/ or /LiquidOS-4.1.0-Beta/
  app.use((req, _res, next) => {
    if (req.url.startsWith('/LiquidOS-')) {
      const rewritten = req.url.replace(/^\/LiquidOS-[^/]+/, '') || '/';
      req.url = rewritten;
    }
    next();
  });

  // Vite middlewares in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LiquidOS Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
