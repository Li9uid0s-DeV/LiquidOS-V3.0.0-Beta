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
      os: 'LiquidOS 3.0.0',
      geminiAvailable: Boolean(process.env.GEMINI_API_KEY),
      model: 'gemini-3.8-flash',
    });
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
        const fallback = getFallbackResponse(message, context);
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
