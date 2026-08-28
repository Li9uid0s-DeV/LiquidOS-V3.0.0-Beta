import { useState, useEffect, useCallback } from 'react';
import { Icon } from '../Icon';

export function Calculator() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [mode, setMode] = useState<'standard' | 'scientific'>('standard');
  const [memory, setMemory] = useState<number>(0);
  const [history, setHistory] = useState<{ eq: string; res: string }[]>(() => {
    try {
      const saved = localStorage.getItem('liquidos_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('liquidos_calc_history', JSON.stringify(history.slice(0, 30)));
    } catch {
      // ignore
    }
  }, [history]);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setEquation('');
    setWaitingForOperand(false);
  };

  const clearEntry = () => {
    setDisplay('0');
  };

  const backspace = () => {
    if (waitingForOperand) return;
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const toggleSign = () => {
    const val = parseFloat(display);
    if (!isNaN(val) && val !== 0) {
      setDisplay(String(-val));
    }
  };

  const performOp = (nextOp: string) => {
    const inputValue = parseFloat(display);
    if (equation && !waitingForOperand) {
      const result = evaluateEquation(equation + ' ' + inputValue);
      setDisplay(String(result));
      setEquation(String(result) + ' ' + nextOp);
    } else {
      setEquation(inputValue + ' ' + nextOp);
    }
    setWaitingForOperand(true);
  };

  const evaluateEquation = (expr: string): number => {
    try {
      // sanitize and compute safely
      const clean = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-');
      const fn = new Function(`return (${clean})`);
      const val = fn();
      return isFinite(val) ? Math.round(val * 1e10) / 1e10 : 0;
    } catch {
      return 0;
    }
  };

  const calculate = () => {
    if (!equation) return;
    const fullEq = `${equation} ${display}`;
    const result = evaluateEquation(fullEq);
    setDisplay(String(result));
    setHistory((prev) => [{ eq: fullEq, res: String(result) }, ...prev]);
    setEquation('');
    setWaitingForOperand(true);
  };

  // Scientific functions
  const performSciFunc = (func: string) => {
    const val = parseFloat(display);
    if (isNaN(val)) return;
    let res = 0;
    switch (func) {
      case 'sin':
        res = Math.sin((val * Math.PI) / 180);
        break;
      case 'cos':
        res = Math.cos((val * Math.PI) / 180);
        break;
      case 'tan':
        res = Math.tan((val * Math.PI) / 180);
        break;
      case 'sqrt':
        res = val >= 0 ? Math.sqrt(val) : NaN;
        break;
      case 'sqr':
        res = Math.pow(val, 2);
        break;
      case 'cube':
        res = Math.pow(val, 3);
        break;
      case 'inv':
        res = val !== 0 ? 1 / val : NaN;
        break;
      case 'ln':
        res = val > 0 ? Math.log(val) : NaN;
        break;
      case 'log':
        res = val > 0 ? Math.log10(val) : NaN;
        break;
      case 'fact':
        res = factorial(Math.min(100, Math.floor(Math.abs(val))));
        break;
      case 'pi':
        res = Math.PI;
        break;
      case 'e':
        res = Math.E;
        break;
      default:
        res = val;
    }
    setDisplay(isNaN(res) ? 'Error' : String(Math.round(res * 1e10) / 1e10));
    setWaitingForOperand(true);
  };

  const factorial = (n: number): number => {
    if (n <= 1) return 1;
    let acc = 1;
    for (let i = 2; i <= n; i++) acc *= i;
    return acc;
  };

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') inputDigit(e.key);
      else if (e.key === '.') inputDecimal();
      else if (e.key === '+' || e.key === '-') performOp(e.key === '-' ? '−' : '+');
      else if (e.key === '*') performOp('×');
      else if (e.key === '/') performOp('÷');
      else if (e.key === 'Enter' || e.key === '=') calculate();
      else if (e.key === 'Backspace') backspace();
      else if (e.key === 'Escape') clearAll();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [display, equation, waitingForOperand]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex h-full w-full select-none flex-col bg-slate-950/40 text-white backdrop-blur-xl">
      {/* Top bar mode toggle & memory indicator */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMode('standard')}
            className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
              mode === 'standard'
                ? 'bg-sky-500/20 text-sky-300 shadow-sm shadow-sky-500/20'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setMode('scientific')}
            className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
              mode === 'scientific'
                ? 'bg-sky-500/20 text-sky-300 shadow-sm shadow-sky-500/20'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            Scientific
          </button>
        </div>

        <div className="flex items-center gap-2">
          {memory !== 0 && (
            <span className="rounded bg-sky-500/30 px-1.5 py-0.5 text-[10px] font-bold text-sky-200">
              M = {memory}
            </span>
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`rounded-lg p-1.5 transition-all ${
              showHistory ? 'bg-white/20 text-sky-300' : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
            title="Calculation History Tape"
          >
            <Icon name="History" size={15} />
          </button>
        </div>
      </div>

      {/* Main display */}
      <div className="flex flex-1 flex-col justify-end px-5 py-3 text-right">
        <div className="h-6 font-mono text-sm tracking-wide text-white/50">{equation}</div>
        <div className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-3xl font-light tracking-tight text-white/95">
          {display}
        </div>
      </div>

      {/* Memory Bar */}
      <div className="grid grid-cols-5 gap-1 border-t border-white/5 px-3 py-1.5 text-xs text-white/70">
        <button
          onClick={() => setMemory(0)}
          disabled={memory === 0}
          className="rounded py-1 font-medium transition-colors hover:bg-white/10 disabled:opacity-30"
        >
          MC
        </button>
        <button
          onClick={() => { setDisplay(String(memory)); setWaitingForOperand(true); }}
          disabled={memory === 0}
          className="rounded py-1 font-medium transition-colors hover:bg-white/10 disabled:opacity-30"
        >
          MR
        </button>
        <button
          onClick={() => setMemory((m) => m + parseFloat(display))}
          className="rounded py-1 font-medium transition-colors hover:bg-white/10"
        >
          M+
        </button>
        <button
          onClick={() => setMemory((m) => m - parseFloat(display))}
          className="rounded py-1 font-medium transition-colors hover:bg-white/10"
        >
          M-
        </button>
        <button
          onClick={() => setMemory(parseFloat(display))}
          className="rounded py-1 font-medium transition-colors hover:bg-white/10"
        >
          MS
        </button>
      </div>

      {/* Keypad */}
      <div className="flex-1 border-t border-white/10 p-2.5">
        {mode === 'scientific' ? (
          <div className="grid h-full grid-cols-5 gap-1.5 text-xs">
            {/* Row 1 */}
            <button onClick={() => performSciFunc('sin')} className="calc-btn sci">sin</button>
            <button onClick={() => performSciFunc('cos')} className="calc-btn sci">cos</button>
            <button onClick={() => performSciFunc('tan')} className="calc-btn sci">tan</button>
            <button onClick={() => performSciFunc('pi')} className="calc-btn sci">π</button>
            <button onClick={() => performSciFunc('e')} className="calc-btn sci">e</button>

            {/* Row 2 */}
            <button onClick={() => performSciFunc('sqr')} className="calc-btn sci">x²</button>
            <button onClick={() => performSciFunc('cube')} className="calc-btn sci">x³</button>
            <button onClick={() => performSciFunc('sqrt')} className="calc-btn sci">√x</button>
            <button onClick={() => performSciFunc('ln')} className="calc-btn sci">ln</button>
            <button onClick={() => performSciFunc('log')} className="calc-btn sci">log</button>

            {/* Row 3 */}
            <button onClick={() => performSciFunc('inv')} className="calc-btn sci">1/x</button>
            <button onClick={() => performSciFunc('fact')} className="calc-btn sci">n!</button>
            <button onClick={clearEntry} className="calc-btn fn">CE</button>
            <button onClick={clearAll} className="calc-btn fn">C</button>
            <button onClick={backspace} className="calc-btn fn"><Icon name="Delete" size={14} /></button>

            {/* Row 4 */}
            <button onClick={() => inputDigit('7')} className="calc-btn num">7</button>
            <button onClick={() => inputDigit('8')} className="calc-btn num">8</button>
            <button onClick={() => inputDigit('9')} className="calc-btn num">9</button>
            <button onClick={() => performOp('÷')} className="calc-btn op">÷</button>
            <button onClick={toggleSign} className="calc-btn fn">±</button>

            {/* Row 5 */}
            <button onClick={() => inputDigit('4')} className="calc-btn num">4</button>
            <button onClick={() => inputDigit('5')} className="calc-btn num">5</button>
            <button onClick={() => inputDigit('6')} className="calc-btn num">6</button>
            <button onClick={() => performOp('×')} className="calc-btn op">×</button>
            <button onClick={calculate} className="calc-btn equal row-span-2">=</button>

            {/* Row 6 */}
            <button onClick={() => inputDigit('1')} className="calc-btn num">1</button>
            <button onClick={() => inputDigit('2')} className="calc-btn num">2</button>
            <button onClick={() => inputDigit('3')} className="calc-btn num">3</button>
            <button onClick={() => performOp('−')} className="calc-btn op">−</button>

            {/* Row 7 */}
            <button onClick={() => inputDigit('0')} className="calc-btn num col-span-2">0</button>
            <button onClick={inputDecimal} className="calc-btn num">.</button>
            <button onClick={() => performOp('+')} className="calc-btn op">+</button>
          </div>
        ) : (
          <div className="grid h-full grid-cols-4 gap-1.5 text-sm">
            <button onClick={clearEntry} className="calc-btn fn">CE</button>
            <button onClick={clearAll} className="calc-btn fn">C</button>
            <button onClick={backspace} className="calc-btn fn"><Icon name="Delete" size={16} /></button>
            <button onClick={() => performOp('÷')} className="calc-btn op">÷</button>

            <button onClick={() => inputDigit('7')} className="calc-btn num">7</button>
            <button onClick={() => inputDigit('8')} className="calc-btn num">8</button>
            <button onClick={() => inputDigit('9')} className="calc-btn num">9</button>
            <button onClick={() => performOp('×')} className="calc-btn op">×</button>

            <button onClick={() => inputDigit('4')} className="calc-btn num">4</button>
            <button onClick={() => inputDigit('5')} className="calc-btn num">5</button>
            <button onClick={() => inputDigit('6')} className="calc-btn num">6</button>
            <button onClick={() => performOp('−')} className="calc-btn op">−</button>

            <button onClick={() => inputDigit('1')} className="calc-btn num">1</button>
            <button onClick={() => inputDigit('2')} className="calc-btn num">2</button>
            <button onClick={() => inputDigit('3')} className="calc-btn num">3</button>
            <button onClick={() => performOp('+')} className="calc-btn op">+</button>

            <button onClick={toggleSign} className="calc-btn fn">±</button>
            <button onClick={() => inputDigit('0')} className="calc-btn num">0</button>
            <button onClick={inputDecimal} className="calc-btn num">.</button>
            <button onClick={calculate} className="calc-btn equal">=</button>
          </div>
        )}
      </div>

      {/* History Slide-out Tape */}
      {showHistory && (
        <div className="absolute inset-0 z-30 flex flex-col bg-slate-950/90 p-4 backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-sm font-semibold tracking-wide text-white">Calculation History</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistory([])}
                className="text-xs text-rose-400 hover:underline"
              >
                Clear
              </button>
              <button
                onClick={() => setShowHistory(false)}
                className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <Icon name="X" size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto pt-3">
            {history.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-white/40">
                No calculation history yet
              </div>
            ) : (
              history.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setDisplay(item.res);
                    setShowHistory(false);
                  }}
                  className="cursor-pointer rounded-lg bg-white/5 p-2.5 text-right transition-colors hover:bg-white/10"
                >
                  <div className="text-xs text-white/50">{item.eq}</div>
                  <div className="font-mono text-base font-medium text-sky-300">{item.res}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Styles for calculator buttons */}
      <style>{`
        .calc-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.15s ease;
          border: 1px solid rgba(255, 255, 255, 0.05);
          user-select: none;
        }
        .calc-btn:active {
          transform: scale(0.96);
        }
        .calc-btn.num {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }
        .calc-btn.num:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        .calc-btn.fn {
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.7);
        }
        .calc-btn.fn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }
        .calc-btn.sci {
          background: rgba(56, 189, 248, 0.08);
          color: rgba(186, 230, 253, 0.9);
          font-size: 11px;
        }
        .calc-btn.sci:hover {
          background: rgba(56, 189, 248, 0.2);
          color: #ffffff;
        }
        .calc-btn.op {
          background: rgba(59, 130, 246, 0.18);
          color: #60a5fa;
          font-size: 16px;
        }
        .calc-btn.op:hover {
          background: rgba(59, 130, 246, 0.35);
          color: #ffffff;
        }
        .calc-btn.equal {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: #ffffff;
          font-weight: 600;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
        }
        .calc-btn.equal:hover {
          background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
          box-shadow: 0 6px 18px rgba(2, 132, 199, 0.5);
        }
      `}</style>
    </div>
  );
}
