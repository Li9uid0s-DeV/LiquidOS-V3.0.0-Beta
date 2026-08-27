import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOS } from '../OSContext';
import { Icon } from '../Icon';

interface Props {
  payload?: { fileName?: string; content?: string };
}

// Simple grammar/heuristics engine — corrects common mistakes without an API
function correctGrammar(text: string): { corrected: string; changes: string[] } {
  let result = text;
  const changes: string[] = [];

  // Capitalize first letter of each sentence
  result = result.replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix: string, letter: string) => {
    changes.push(`Capitalized "${letter}" after sentence boundary`);
    return prefix + letter.toUpperCase();
  });

  // Capitalize standalone "i" → "I"
  result = result.replace(/\bi\b/g, (match, offset: number) => {
    // Don't capitalize inside words — only standalone
    if (offset > 0 && /\w/.test(result[offset - 1] ?? '')) return match;
    changes.push('Changed standalone "i" to "I"');
    return 'I';
  });

  // Fix double spaces
  if (/  +/.test(result)) {
    result = result.replace(/  +/g, ' ');
    changes.push('Removed extra spaces');
  }

  // Fix space before punctuation
  if (/\s+[,.!?;:]/.test(result)) {
    result = result.replace(/\s+([,.!?;:])/g, '$1');
    changes.push('Removed space before punctuation');
  }

  // Add space after punctuation if missing
  if (/([,.!?;:])([A-Za-z])/g.test(result)) {
    result = result.replace(/([,.!?;:])([A-Za-z])/g, (_, punct: string, letter: string) => {
      changes.push(`Added space after "${punct}"`);
      return punct + ' ' + letter;
    });
  }

  // Fix common misspellings
  const commonFixes: Record<string, string> = {
    'teh': 'the',
    'recieve': 'receive',
    'seperate': 'separate',
    'definately': 'definitely',
    'occured': 'occurred',
    'untill': 'until',
    'wich': 'which',
    'thier': 'their',
    'dont': "don't",
    'cant': "can't",
    'wont': "won't",
    'isnt': "isn't",
    'didnt': "didn't",
    'wouldnt': "wouldn't",
    'couldnt': "couldn't",
    'shouldnt': "shouldn't",
    'im': "I'm",
    'ive': "I've",
    'ill': "I'll",
    'thats': "that's",
    'whats': "what's",
    'lets': "let's",
  };
  for (const [wrong, right] of Object.entries(commonFixes)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, right);
      changes.push(`Corrected "${wrong}" → "${right}"`);
    }
  }

  // Ensure ending punctuation
  if (result.trim() && !/[.!?]$/.test(result.trim())) {
    result = result.trimEnd() + '.';
    changes.push('Added period at end of text');
  }

  return { corrected: result, changes: [...new Set(changes)] };
}

export function NotepadApp({ payload }: Props) {
  const { saveFile } = useOS();
  const [text, setText] = useState(payload?.content ?? '');
  const [name, setName] = useState(payload?.fileName ?? 'Untitled.txt');
  const [saved, setSaved] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [saveFolder, setSaveFolder] = useState('Documents');
  const [grammarResult, setGrammarResult] = useState<{ changes: string[] } | null>(null);

  useEffect(() => {
    setText(payload?.content ?? '');
    setName(payload?.fileName ?? 'Untitled.txt');
  }, [payload]);

  const dirty = text !== (payload?.content ?? '') && !saved;

  const doSave = () => {
    const path =
      saveFolder === 'Downloads' ? ['Downloads'] :
      saveFolder === 'Pictures' ? ['Pictures'] : ['Documents'];
    saveFile(path, name.endsWith('.txt') ? name : name + '.txt', text);
    setSaved(true);
    setShowSave(false);
  };

  const handleGrammarFix = () => {
    if (!text.trim()) return;
    const { corrected, changes } = correctGrammar(text);
    if (corrected !== text) {
      setText(corrected);
      setSaved(false);
      setGrammarResult({ changes });
      setTimeout(() => setGrammarResult(null), 5000);
    } else {
      setGrammarResult({ changes: ['No grammar issues found — your text looks clean!'] });
      setTimeout(() => setGrammarResult(null), 3000);
    }
  };

  return (
    <div className="flex h-full w-full min-w-0 min-h-0 flex-col bg-zinc-900/40">
      {/* Menu bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/10 text-xs text-white/70">
        <button
          className="px-2 py-1 rounded hover:bg-white/10 transition"
          onClick={() => setShowSave(true)}
        >
          File
        </button>
        <button
          className="px-2 py-1 rounded hover:bg-white/10 transition flex items-center gap-1"
          onClick={handleGrammarFix}
          title="AI grammar correction"
        >
          <Icon name="Sparkles" size={12} className="text-violet-300" />
          Fix Grammar
        </button>
        <span className="text-white/30">|</span>
        <span className="px-2">{name}{dirty ? ' •' : ''}</span>
        {saved && <span className="text-green-400/70">Saved</span>}
      </div>

      {/* AI Grammar suggestion banner */}
      {grammarResult && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-3 py-2 bg-violet-500/15 border-b border-violet-400/20 text-[11px] text-violet-200"
        >
          <div className="flex items-start gap-2">
            <Icon name="Sparkles" size={12} className="text-violet-300 mt-0.5 shrink-0" />
            <div>
              <span className="font-medium">AI Grammar Assistant:</span>{' '}
              {grammarResult.changes.join(' · ')}
            </div>
          </div>
        </motion.div>
      )}

      {/* Editor */}
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setSaved(false); }}
        spellCheck={false}
        className="flex-1 w-full resize-none bg-transparent p-4 text-sm text-white/90 outline-none font-mono leading-relaxed"
        placeholder="Start typing..."
      />

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-white/10 text-[11px] text-white/50">
        <span>{text.length} characters</span>
        <span>Ln {text.split('\n').length}</span>
      </div>

      {/* Save dialog */}
      {showSave && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10"
          onClick={() => setShowSave(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="glass-panel rounded-xl p-5 w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white text-sm font-semibold mb-4 flex items-center gap-2">
              <Icon name="Save" size={16} /> Save File
            </h3>
            <label className="block text-[11px] text-white/60 mb-1">File name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mb-3 rounded bg-black/30 border border-white/15 px-2 py-1.5 text-sm text-white outline-none focus:border-brand-400"
            />
            <label className="block text-[11px] text-white/60 mb-1">Save to</label>
            <select
              value={saveFolder}
              onChange={(e) => setSaveFolder(e.target.value)}
              className="w-full mb-4 rounded bg-black/30 border border-white/15 px-2 py-1.5 text-sm text-white outline-none focus:border-brand-400"
            >
              <option>Documents</option>
              <option>Downloads</option>
              <option>Pictures</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1.5 rounded text-xs text-white/70 hover:bg-white/10 transition"
                onClick={() => setShowSave(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1.5 rounded text-xs bg-brand-500 hover:bg-brand-400 text-white transition liquid-glow"
                onClick={doSave}
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
