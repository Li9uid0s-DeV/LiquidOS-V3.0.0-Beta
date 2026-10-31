import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

interface ChatMessage {
  role: 'user' | 'assistant' | 'model';
  content?: string;
  text?: string;
}

interface ActionPayload {
  type:
    | 'open_app'
    | 'set_shell'
    | 'set_theme'
    | 'apply_theme'
    | 'set_wallpaper'
    | 'set_aurora'
    | 'set_glass'
    | 'lock_system'
    | 'snap_windows'
    | 'none';
  target?: string;
  label?: string;
}

function evaluateSafeMath(expr: string): number | null {
  const cleaned = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/＋/g, '+')
    .replace(/－/g, '-')
    .replace(/[^0-9+\-*/().%\s]/g, '')
    .trim();
  if (!cleaned || !/[0-9]/.test(cleaned) || !/[+\-*/%]/.test(cleaned)) return null;
  try {
    const val = Function(`"use strict"; return (${cleaned});`)();
    return typeof val === 'number' && Number.isFinite(val) ? val : null;
  } catch {
    return null;
  }
}

function getIntelligentLocalResponse(
  message: string
): { reply: string; action: ActionPayload | null; model: string } {
  const raw = (message || '').trim();
  const q = raw.toLowerCase();

  // 1. Aurora customization
  if (q.includes('オーロラ') || q.includes('aurora')) {
    if (q.includes('エメラルド') || q.includes('emerald') || q.includes('緑')) {
      return {
        reply: 'オーロラ背景を「エメラルド & スカイ」に切り替えました。',
        action: { type: 'set_aurora', target: 'emerald-sky', label: 'エメラルドを適用' },
        model: 'assistant',
      };
    }
    if (q.includes('ローズ') || q.includes('rose') || q.includes('ピンク') || q.includes('ゴールド')) {
      return {
        reply: 'オーロラ背景を「ローズ & アンバー」に切り替えました。',
        action: { type: 'set_aurora', target: 'rose-gold', label: 'ローズを適用' },
        model: 'assistant',
      };
    }
    if (q.includes('オーシャン') || q.includes('ocean') || q.includes('青') || q.includes('ブルー')) {
      return {
        reply: 'オーロラ背景を「ディープオーシャン」に切り替えました。',
        action: { type: 'set_aurora', target: 'ocean-blue', label: 'オーシャンを適用' },
        model: 'assistant',
      };
    }
    if (q.includes('サンセット') || q.includes('マゼンタ') || q.includes('sunset') || q.includes('紫')) {
      return {
        reply: 'オーロラ背景を「マゼンタ & サンセット」に切り替えました。',
        action: { type: 'set_aurora', target: 'sunset-magenta', label: 'サンセットを適用' },
        model: 'assistant',
      };
    }
    return {
      reply: '2D オーロラライブ背景を適用しました。設定アプリの「オーロラ背景」から色や揺らぎ速度も細かく調整できます。',
      action: { type: 'set_aurora', target: 'cyan-violet', label: 'オーロラ背景を適用' },
      model: 'assistant',
    };
  }

  // 2. 3D Glass Curvature / Jelly Wobble
  if (q.includes('湾曲') || q.includes('プルプル') || (q.includes('ガラス') && (q.includes('強') || q.includes('立体')))) {
    return {
      reply: '3Dガラスのレンズ湾曲度とプルプル弾性を高めに設定しました。設定アプリからスライダーでさらに細かく調整できます。',
      action: { type: 'set_glass', target: '78', label: '3Dガラスを強化' },
      model: 'assistant',
    };
  }

  // 3. Sleep / Lock screen
  if (q.includes('スリープ') || q.includes('ロック') || q.includes('sleep') || q.includes('lock')) {
    return {
      reply: 'スリープ画面を起動します。画面をタップすると解除できます。',
      action: { type: 'lock_system', label: 'スリープにする' },
      model: 'assistant',
    };
  }

  // 4. App Launches
  if (q.includes('設定') || q.includes('settings')) {
    return {
      reply: '設定アプリを開きます。3Dガラス造形やオーロラ背景、レイアウトを調整できます。',
      action: { type: 'open_app', target: 'settings', label: '設定を開く' },
      model: 'assistant',
    };
  }
  if (q.includes('browser') || q.includes('ブラウザ') || q.includes('web') || q.includes('検索') || q.includes('ネット')) {
    return {
      reply: 'ブラウザを起動します。プロキシ経由であらゆるWebサイトやjsDelivrページを閲覧できます。',
      action: { type: 'open_app', target: 'browser', label: 'ブラウザを開く' },
      model: 'assistant',
    };
  }
  if (q.includes('music') || q.includes('synth') || q.includes('音楽') || q.includes('曲')) {
    return {
      reply: 'ミュージックプレイヤーを起動します。',
      action: { type: 'open_app', target: 'synth', label: '音楽を開く' },
      model: 'assistant',
    };
  }
  if (q.includes('terminal') || q.includes('ターミナル') || q.includes('コマンド')) {
    return {
      reply: 'ターミナルを起動します。',
      action: { type: 'open_app', target: 'terminal', label: 'ターミナルを開く' },
      model: 'assistant',
    };
  }
  if (q.includes('store') || q.includes('ストア')) {
    return {
      reply: 'アプリストアを起動します。',
      action: { type: 'open_app', target: 'appstore', label: 'ストアを開く' },
      model: 'assistant',
    };
  }
  if (q.includes('game') || q.includes('ゲーム') || q.includes('2048') || q.includes('snake') || q.includes('スネーク') || q.includes('ブロック崩し') || q.includes('迷路')) {
    return {
      reply: 'ゲームアプリを起動します。Velocity 3D、3D Maze、2048 Glass、Neon Snake、Glass Breakerの5種類から選んで遊べます。',
      action: { type: 'open_app', target: 'game', label: 'ゲームを開く' },
      model: 'assistant',
    };
  }
  if (q.includes('天気') || q.includes('weather')) {
    return {
      reply: '天気アプリを起動します。',
      action: { type: 'open_app', target: 'weather', label: '天気を開く' },
      model: 'assistant',
    };
  }
  if (q.includes('時計') || q.includes('アラーム') || q.includes('タイマー') || q.includes('clock')) {
    return {
      reply: '時計・タイマーアプリを起動します。',
      action: { type: 'open_app', target: 'clock', label: '時計を開く' },
      model: 'assistant',
    };
  }
  if (q.includes('メモ') || q.includes('notepad') || q.includes('ノート')) {
    return {
      reply: 'メモ帳を起動します。',
      action: { type: 'open_app', target: 'notepad', label: 'メモ帳を開く' },
      model: 'assistant',
    };
  }
  if (q.includes('ファイル') || q.includes('explorer') || q.includes('フォルダ')) {
    return {
      reply: 'ファイルエクスプローラーを起動します。',
      action: { type: 'open_app', target: 'explorer', label: 'ファイルを開く' },
      model: 'assistant',
    };
  }

  // 5. Layouts / Shells
  if (q.includes('mac') || q.includes('マック')) {
    return {
      reply: 'macOSレイアウトに切り替えました。上部のメニューバーと下部のDockが利用できます。',
      action: { type: 'set_shell', target: 'mac', label: 'macOSに切替' },
      model: 'assistant',
    };
  }
  if (q.includes('windows 11') || q.includes('win11')) {
    return {
      reply: 'Windows 11レイアウトに切り替えました。',
      action: { type: 'set_shell', target: 'windows11', label: 'Windows 11に切替' },
      model: 'assistant',
    };
  }
  if (q.includes('windows 10') || q.includes('win10')) {
    return {
      reply: 'Windows 10レイアウトに切り替えました。',
      action: { type: 'set_shell', target: 'windows10', label: 'Windows 10に切替' },
      model: 'assistant',
    };
  }
  if (q.includes('vista') || q.includes('ビスタ') || q.includes('aero')) {
    return {
      reply: 'Aero Glassレイアウトに切り替えました。',
      action: { type: 'set_shell', target: 'vista', label: 'Aero Glassに切替' },
      model: 'assistant',
    };
  }
  if (q.includes('xp')) {
    return {
      reply: 'クラシックXPレイアウトに切り替えました。',
      action: { type: 'set_shell', target: 'xp', label: 'XPに切替' },
      model: 'assistant',
    };
  }
  if (q.includes('zorin') || q.includes('ubuntu') || q.includes('linux')) {
    return {
      reply: 'Linuxデスクトップレイアウトに切り替えました。',
      action: { type: 'set_shell', target: 'ubuntu', label: 'Ubuntuに切替' },
      model: 'assistant',
    };
  }
  if (q.includes('整列') || q.includes('スナップ') || q.includes('並べる')) {
    return {
      reply: '開いているウィンドウを左右50:50に整列しました。',
      action: { type: 'snap_windows', target: '50-50', label: 'ウィンドウを整列' },
      model: 'assistant',
    };
  }

  // 6. Math calculation
  const mathResult = evaluateSafeMath(raw);
  if (mathResult !== null) {
    return {
      reply: `計算結果: **${mathResult}**`,
      action: null,
      model: 'assistant',
    };
  }

  // 7. Programming / Coding questions
  if (q.includes('typescript') || q.includes('javascript') || q.includes('配列') || q.includes('重複')) {
    return {
      reply:
        'TypeScript / JavaScriptで配列の重複を除去する最も簡潔な方法は `Set` を使う方法です：\n\n```ts\nconst numbers = [1, 2, 2, 3, 4, 4, 5];\nconst unique = [...new Set(numbers)];\n// 結果: [1, 2, 3, 4, 5]\n```\n\nオブジェクトの配列で特定のキー（例: `id`）で重複を除去する場合は以下のように書けます：\n\n```ts\nconst uniqueById = Array.from(\n  new Map(items.map(item => [item.id, item])).values()\n);\n```',
      action: null,
      model: 'assistant',
    };
  }

  if (q.includes('python') || q.includes('パイソン')) {
    return {
      reply:
        'Pythonの基本的なリスト内包表記と関数定義のサンプルです：\n\n```python\ndef filter_even(nums: list[int]) -> list[int]:\n    return [n for n in nums if n % 2 == 0]\n\nprint(filter_even([1, 2, 3, 4, 5, 6]))  # [2, 4, 6]\n```\nほかに作成したい処理があれば教えてください。',
      action: null,
      model: 'assistant',
    };
  }

  if (q.includes('html') || q.includes('css') || q.includes('ガラス') || q.includes('glass')) {
    return {
      reply:
        '3Dガラス（Liquid Glass）風のCSSスタイル例です：\n\n```css\n.glass-card {\n  background: rgba(255, 255, 255, 0.08);\n  backdrop-filter: blur(20px) saturate(190%);\n  border-radius: 20px;\n  box-shadow:\n    0 20px 50px rgba(0, 0, 0, 0.45),\n    inset 0 1.5px 2px rgba(255, 255, 255, 0.4),\n    inset 0 -2px 4px rgba(0, 0, 0, 0.3);\n}\n```',
      action: null,
      model: 'assistant',
    };
  }

  // 8. Time / Date questions
  if (q.includes('何時') || q.includes('今日') || q.includes('日付') || q.includes('日時')) {
    const now = new Date();
    return {
      reply: `現在は **${now.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      })} ${now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}** です。`,
      action: null,
      model: 'assistant',
    };
  }

  // 9. Conversational & helpful general response
  return {
    reply: `「${raw}」についてですね。\n\n以下の操作やサポートが可能です：\n- **OSの操作**: 「オーロラをエメラルドにして」「ガラスの湾曲を強くして」「macOSモードにして」「スリープにして」\n- **アプリの起動**: 「ゲームを起動」「設定を開いて」「ブラウザを開いて」\n- **計算・コード作成**: 数式の入力（例: \`128 * 45\`）や、TypeScript / Python / CSS のコード作成`,
    action: null,
    model: 'assistant',
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      geminiAvailable: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Web Reverse Proxy Endpoint for Browser & jsDelivr / GitHub Pages
  app.get('/api/proxy', async (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      return res.status(400).send('URL query parameter required');
    }

    let targetUrl = rawUrl.trim();

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
            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
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

      const isJsDelivrOrRaw =
        parsed.hostname.includes('jsdelivr.net') || parsed.hostname.includes('githubusercontent.com');
      if (
        isJsDelivrOrRaw &&
        (parsed.pathname.endsWith('.html') || parsed.pathname.endsWith('.htm') || parsed.pathname.endsWith('/'))
      ) {
        contentType = 'text/html; charset=utf-8';
      }

      res.setHeader('Content-Type', contentType);
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.removeHeader('X-Content-Type-Options');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (contentType.includes('text/html')) {
        let html = await response.text();
        const baseHref = `${parsed.protocol}//${parsed.host}${parsed.pathname.substring(0, parsed.pathname.lastIndexOf('/') + 1) || '/'}`;

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
        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));
      }
    } catch (err: unknown) {
      console.error('Proxy error:', err);
      return res.status(502).send(`
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family:sans-serif;background:#09090b;color:#f4f4f5;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="max-width:420px;padding:2rem;background:rgba(255,255,255,0.04);border-radius:1rem;text-align:center;">
              <h1 style="font-size:1rem;color:#38bdf8;">ページの読み込みに失敗しました</h1>
              <p style="font-size:0.8rem;color:rgba(255,255,255,0.6);">${rawUrl}</p>
              <button onclick="window.location.reload()" style="background:#38bdf8;color:#000;font-weight:600;border:none;padding:0.5rem 1.2rem;border-radius:0.5rem;cursor:pointer;">再試行</button>
            </div>
          </body>
        </html>
      `);
    }
  });

  // AI Chat Endpoint using @google/genai
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message, history, context } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        return res.json(getIntelligentLocalResponse(message));
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const systemInstruction = `You are the AI assistant built into a 3D Liquid Glass Desktop OS.
Answer any general knowledge, programming, math, writing, or OS control request naturally and accurately in the user's language (default to clear, natural Japanese).

Available OS Actions (only trigger when the user asks to open an app, change settings/theme/aurora/glass, or sleep):
- type: "open_app", target: "browser" | "synth" | "explorer" | "terminal" | "settings" | "notepad" | "game" | "appstore" | "calculator" | "taskmanager" | "sysmon" | "calendar" | "weather" | "clock"
- type: "set_shell", target: "windows11" | "windows10" | "vista" | "xp" | "mac" | "dex" | "chromeos" | "ubuntu" | "metro"
- type: "set_aurora", target: "cyan-violet" | "emerald-sky" | "rose-gold" | "ocean-blue" | "sunset-magenta"
- type: "set_glass", target: "0" to "100" (curvature percentage)
- type: "lock_system" (put screen to sleep/lock)
- type: "snap_windows"
- type: "none" (when answering general questions, coding, math, or conversation)`;

      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-8) as ChatMessage[]) {
          const text = item.content || item.text || '';
          if (text) {
            contents.push({
              role: item.role === 'model' || item.role === 'assistant' ? 'model' : 'user',
              parts: [{ text }],
            });
          }
        }
      }

      contents.push({
        role: 'user',
        parts: [
          {
            text: context ? `[Desktop Context: ${JSON.stringify(context)}]\n${message}` : message,
          },
        ],
      });

      const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest'];
      let rawText = '';

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  reply: { type: Type.STRING },
                  action: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      target: { type: Type.STRING },
                      label: { type: Type.STRING },
                    },
                  },
                },
                required: ['reply'],
              },
            },
          });
          if (response.text) {
            rawText = response.text;
            break;
          }
        } catch (innerErr) {
          console.warn(`Model ${modelName} attempt failed:`, innerErr);
        }
      }

      if (!rawText) {
        return res.json(getIntelligentLocalResponse(message));
      }

      try {
        const parsed = JSON.parse(rawText);
        return res.json({
          reply: parsed.reply || rawText,
          action: parsed.action && parsed.action.type !== 'none' ? parsed.action : null,
        });
      } catch {
        return res.json({
          reply: rawText,
          action: null,
        });
      }
    } catch (err: unknown) {
      console.warn('AI route fallback:', err);
      return res.json(getIntelligentLocalResponse(req.body?.message || ''));
    }
  });

  app.use((req, _res, next) => {
    if (req.url.startsWith('/LiquidOS-')) {
      const rewritten = req.url.replace(/^\/LiquidOS-[^/]+/, '') || '/';
      req.url = rewritten;
    }
    next();
  });

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
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
