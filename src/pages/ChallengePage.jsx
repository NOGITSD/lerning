import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { HiArrowLeft, HiLightBulb, HiEye, HiPaperAirplane, HiCheckCircle, HiSparkles, HiCommandLine, HiLanguage } from 'react-icons/hi2';
import { pythonChallenges } from '../data/pythonChallenges';
import { javascriptChallenges } from '../data/javascriptChallenges';
import { cppChallenges } from '../data/cppChallenges';
import { validateCode, codeNeedsInput } from '../utils/validator';
import { getTier } from '../data/challengeGenerator';

const challengeMap = { python: pythonChallenges, javascript: javascriptChallenges, cpp: cppChallenges };
const monacoLang = { python: 'python', javascript: 'javascript', cpp: 'cpp' };
const langNames = { python: 'Python', javascript: 'JavaScript', cpp: 'C++' };
const langColors = { python: '#3776ab', javascript: '#f7df1e', cpp: '#00599c' };

export default function ChallengePage({ progress }) {
    const { lang, level } = useParams();
    const nav = useNavigate();
    const levelNum = parseInt(level);
    const challenges = challengeMap[lang] || [];
    const ch = challenges.find(c => c.id === levelNum);
    const tier = getTier(levelNum);
    const color = langColors[lang];
    const terminalRef = useRef(null);

    const [code, setCode] = useState('');
    const [showHints, setShowHints] = useState(false);
    const [hintStep, setHintStep] = useState(0);
    const [showHelper, setShowHelper] = useState(false);
    const [result, setResult] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [terminalLines, setTerminalLines] = useState([]);
    const [showThaiHelp, setShowThaiHelp] = useState(false);
    const [errorExplanations, setErrorExplanations] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [stdinInput, setStdinInput] = useState('');
    const [needsInput, setNeedsInput] = useState(false);
    const editorRef = useRef(null);
    const stdinRef = useRef(null);

    useEffect(() => {
        if (ch) setCode(ch.starterCode || '');
        setShowHints(false);
        setHintStep(0);
        setShowHelper(false);
        setResult(null);
        setShowConfetti(false);
        setTerminalLines([]);
        setShowThaiHelp(false);
        setErrorExplanations([]);
        setIsRunning(false);
        setStdinInput('');
        setNeedsInput(false);
    }, [lang, level, ch]);

    // Check if current code needs input
    useEffect(() => {
        setNeedsInput(codeNeedsInput(code));
    }, [code]);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [terminalLines, showThaiHelp]);

    if (!ch) {
        return (
            <div style={{ ...s.center, minHeight: '100vh', zIndex: 1, position: 'relative' }}>
                <h2>ไม่พบด่านนี้</h2>
                <button onClick={() => nav(`/levels/${lang}`)} style={s.btnPrimary}>กลับ</button>
            </div>
        );
    }

    const handleSubmit = () => {
        setIsRunning(true);
        setTerminalLines([]);
        setResult(null);
        setShowThaiHelp(false);
        setErrorExplanations([]);

        // Parse stdin inputs (one per line)
        const inputs = stdinInput.split('\n').map(s => s.trim());

        setTimeout(() => {
            try {
                const res = validateCode(code, ch, lang, inputs);
                setResult(res);
                setTerminalLines(res.terminalOutput || []);
                setErrorExplanations(res.errorExplanations || []);

                if (res.passed) {
                    progress.completeLevel(lang, levelNum);
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 4000);
                }
            } catch (err) {
                console.error('Validation error:', err);
                setResult({ passed: false, feedback: 'Error', details: [err.message] });
                setTerminalLines([
                    { text: `$ ${lang === 'python' ? 'python' : 'node'} solution.${lang === 'python' ? 'py' : 'js'}`, type: 'command' },
                    { text: `InternalError: ${err.message}`, type: 'error-highlight' },
                    { text: 'Process exited with code 1', type: 'muted' }
                ]);
                setErrorExplanations([`ระบบตรวจสอบเกิดข้อผิดพลาด: ${err.message}`]);
            }
            setIsRunning(false);
        }, 400);
    };

    const goNext = () => {
        if (levelNum < 100) nav(`/challenge/${lang}/${levelNum + 1}`);
        else nav(`/levels/${lang}`);
    };

    const goPrev = () => {
        if (levelNum > 1) nav(`/challenge/${lang}/${levelNum - 1}`);
    };

    const isDone = progress.isLevelCompleted(lang, levelNum);
    const canGoPrev = levelNum > 1;
    const canGoNext = levelNum < 100 && progress.isLevelUnlocked(lang, levelNum + 1);

    const lineColor = (type) => {
        switch (type) {
            case 'command': return '#38bdf8';
            case 'success-dim': return '#4ade80';
            case 'error': return '#fb7185';
            case 'error-highlight': return '#ff4d6a';
            case 'warning': return '#fbbf24';
            case 'muted': return '#475569';
            case 'separator': return '#64748b';
            default: return '#d1d5db';
        }
    };

    return (
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Confetti */}
            {showConfetti && (
                <div style={s.confettiWrap}>
                    {Array.from({ length: 50 }).map((_, i) => (
                        <div key={i} style={{
                            ...s.confetti,
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                            background: ['#ff2d95', '#00d4ff', '#ffd43b', '#00ff88', '#b14eff'][i % 5],
                            width: `${6 + Math.random() * 8}px`,
                            height: `${6 + Math.random() * 8}px`,
                        }} />
                    ))}
                </div>
            )}

            {/* Top bar */}
            <div style={s.topBar}>
                <button onClick={() => nav(`/levels/${lang}`)} style={s.backBtn}><HiArrowLeft /> {langNames[lang]}</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ ...s.tierTag, background: `${tier.color}22`, color: tier.color }}>{tier.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>ด่าน {levelNum}/100</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>(ผ่านแล้ว {progress.getCompletedCount(lang)}/100)</span>
                    {isDone && <HiCheckCircle style={{ color: 'var(--accent-green)', fontSize: 18 }} />}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={goPrev} disabled={!canGoPrev} style={{ ...s.navBtn, opacity: !canGoPrev ? 0.3 : 1 }}>◀</button>
                    <button onClick={goNext} disabled={!canGoNext} style={{ ...s.navBtn, opacity: !canGoNext ? 0.3 : 1 }}>▶</button>
                </div>
            </div>

            {/* Main content */}
            <div style={s.splitView}>
                {/* Left: Problem */}
                <div style={s.leftPanel}>
                    <div style={s.problemHeader}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color }}>#{levelNum}. {ch.title}</h2>
                    </div>
                    <div style={s.problemBody}>
                        <p style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 16 }}>{ch.description}</p>

                        {ch.expectedOutput && (
                            <div style={s.outputBox}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: 1 }}>Expected Output</span>
                                <pre style={s.outputPre}>{ch.expectedOutput}</pre>
                            </div>
                        )}

                        {/* Hints */}
                        <div style={{ marginTop: 16 }}>
                            <button onClick={() => { setShowHints(!showHints); setHintStep(0); }} style={{ ...s.hintBtn, borderColor: showHints ? '#f59e0b66' : 'var(--border-color)' }}>
                                <HiLightBulb style={{ color: '#f59e0b' }} /> {showHints ? 'ซ่อนคำแนะนำ' : 'ดูคำแนะนำ'} 💡
                            </button>
                            {showHints && ch.hints && (
                                <div style={s.hintPanel}>
                                    {ch.hints.slice(0, hintStep + 1).map((hint, i) => (
                                        <div key={i} style={s.hintItem}>
                                            <span style={s.hintNum}>💡 {i + 1}</span>
                                            <span>{hint}</span>
                                        </div>
                                    ))}
                                    {hintStep < ch.hints.length - 1 && (
                                        <button onClick={() => setHintStep(h => h + 1)} style={s.moreHintBtn}>
                                            ดูคำแนะนำเพิ่ม ({hintStep + 1}/{ch.hints.length})
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Helper */}
                        <div style={{ marginTop: 12 }}>
                            <button onClick={() => setShowHelper(!showHelper)} style={{ ...s.hintBtn, borderColor: showHelper ? '#8b5cf666' : 'var(--border-color)' }}>
                                <HiEye style={{ color: '#8b5cf6' }} /> {showHelper ? 'ซ่อนตัวช่วย' : 'ดูตัวช่วย (Spoiler)'} 🔮
                            </button>
                            {showHelper && ch.helper && (
                                <div style={{ ...s.hintPanel, borderColor: '#8b5cf633' }}>
                                    <pre style={{ ...s.outputPre, fontSize: 12, whiteSpace: 'pre-wrap', color: '#c4b5fd' }}>{ch.helper}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Editor + Terminal */}
                <div style={s.rightPanel}>
                    {/* Editor */}
                    <div style={s.editorHeader}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>📝 Code Editor</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{langNames[lang]}</span>
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden', minHeight: 160 }}>
                        <Editor
                            height="100%"
                            language={monacoLang[lang]}
                            theme="vs-dark"
                            value={code}
                            onChange={v => setCode(v || '')}
                            onMount={editor => { editorRef.current = editor; }}
                            options={{
                                fontSize: 14,
                                fontFamily: "'JetBrains Mono', monospace",
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                padding: { top: 12 },
                                lineNumbers: 'on',
                                renderLineHighlight: 'all',
                                bracketPairColorization: { enabled: true },
                                wordWrap: 'on',
                            }}
                        />
                    </div>

                    {/* Stdin Input Area (shows when code uses input()) */}
                    {needsInput && (
                        <div style={s.stdinWrap}>
                            <div style={s.stdinHeader}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>⌨️ Standard Input (stdin)</span>
                                <span style={{ fontSize: 10, color: '#64748b' }}>ใส่ค่า input แต่ละค่าแยกบรรทัด</span>
                            </div>
                            <textarea
                                ref={stdinRef}
                                value={stdinInput}
                                onChange={e => setStdinInput(e.target.value)}
                                placeholder={'พิมพ์ค่า input ที่ต้องการทดสอบ\nแต่ละ input() แยกคนละบรรทัด\nเช่น:\nAlice\n25'}
                                style={s.stdinTextarea}
                                rows={3}
                            />
                        </div>
                    )}

                    {/* Action Bar */}
                    <div style={s.editorFooter}>
                        <button onClick={() => { setCode(ch.starterCode || ''); setResult(null); setTerminalLines([]); setShowThaiHelp(false); setStdinInput(''); }} style={s.resetBtn}>🔄 รีเซ็ต</button>
                        <button onClick={handleSubmit} disabled={isRunning} style={{ ...s.submitBtn, opacity: isRunning ? 0.7 : 1 }}>
                            {isRunning ? (
                                <><span style={{ animation: 'pulse 1s infinite' }}>⏳</span> กำลังรัน...</>
                            ) : (
                                <><HiPaperAirplane /> ▶ รันโค้ด</>
                            )}
                        </button>
                    </div>

                    {/* Terminal Panel */}
                    <div style={s.terminalWrap}>
                        <div style={s.terminalTitleBar}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ display: 'flex', gap: 5 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                                </div>
                                <HiCommandLine style={{ fontSize: 13, color: '#64748b' }} />
                                <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                                    Terminal — {langNames[lang]}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {result && !result.passed && errorExplanations.length > 0 && (
                                    <button
                                        onClick={() => setShowThaiHelp(!showThaiHelp)}
                                        style={{
                                            ...s.thaiHelpBtn,
                                            background: showThaiHelp ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)',
                                            borderColor: showThaiHelp ? '#fbbf2444' : '#334155'
                                        }}
                                    >
                                        <HiLanguage style={{ fontSize: 14 }} />
                                        {showThaiHelp ? 'ซ่อนคำอธิบาย' : '💡 อธิบายภาษาไทย'}
                                    </button>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: isRunning ? '#fbbf24' : result === null ? '#475569' : result.passed ? '#4ade80' : '#fb7185',
                                        boxShadow: isRunning ? '0 0 6px #fbbf24' : result?.passed ? '0 0 6px #4ade80' : 'none',
                                        animation: isRunning ? 'pulse 1s infinite' : 'none'
                                    }} />
                                    <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                                        {isRunning ? 'running...' : result === null ? 'idle' : result.passed ? 'exit 0' : 'exit 1'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Terminal Body */}
                        <div ref={terminalRef} style={s.terminalBody}>
                            {terminalLines.length === 0 && !isRunning ? (
                                <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', padding: '4px 0' }}>
                                    <span style={{ color: '#4ade80' }}>user@codequest</span>
                                    <span style={{ color: '#64748b' }}>:</span>
                                    <span style={{ color: '#38bdf8' }}>~/challenges</span>
                                    <span style={{ color: '#64748b' }}>$ </span>
                                    <span style={{ color: '#475569', animation: 'pulse 1.5s infinite' }}>▋</span>
                                </div>
                            ) : (
                                <>
                                    {/* Show stdin inputs used */}
                                    {stdinInput.trim() && terminalLines.length > 0 && (
                                        <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4, fontFamily: 'var(--font-mono)' }}>
                                            [stdin: {stdinInput.split('\n').filter(s => s.trim()).map(s => `"${s.trim()}"`).join(', ')}]
                                        </div>
                                    )}

                                    {terminalLines.map((line, i) => (
                                        <div key={i} style={{
                                            color: lineColor(line.type),
                                            fontSize: 13,
                                            lineHeight: 1.6,
                                            fontFamily: 'var(--font-mono)',
                                            whiteSpace: 'pre-wrap',
                                            fontWeight: line.type === 'command' || line.type === 'error-highlight' ? 600 : 400,
                                        }}>
                                            {line.type === 'command' && (
                                                <>
                                                    <span style={{ color: '#4ade80' }}>user@codequest</span>
                                                    <span style={{ color: '#64748b' }}>:</span>
                                                    <span style={{ color: '#38bdf8' }}>~</span>
                                                    <span style={{ color: '#64748b' }}> </span>
                                                </>
                                            )}
                                            {line.text}
                                        </div>
                                    ))}

                                    {/* Thai Error Explanations */}
                                    {showThaiHelp && errorExplanations.length > 0 && (
                                        <div style={s.thaiExplainBox}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 6 }}>
                                                💡 คำอธิบายภาษาไทย (สำหรับผู้เริ่มต้น)
                                            </div>
                                            {errorExplanations.map((exp, i) => (
                                                <div key={i} style={{ fontSize: 13, color: '#fde68a', lineHeight: 1.7, padding: '4px 0', whiteSpace: 'pre-wrap' }}>
                                                    {errorExplanations.length > 1 && <span style={{ color: '#f59e0b', marginRight: 6 }}>{i + 1}.</span>}
                                                    {exp}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Cursor prompt after output */}
                                    {!isRunning && (
                                        <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                                            <span style={{ color: '#4ade80' }}>user@codequest</span>
                                            <span style={{ color: '#64748b' }}>:</span>
                                            <span style={{ color: '#38bdf8' }}>~/challenges</span>
                                            <span style={{ color: '#64748b' }}>$ </span>
                                            <span style={{ color: '#475569', animation: 'pulse 1.5s infinite' }}>▋</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Success Footer */}
                        {result && result.passed && (
                            <div style={s.terminalFooter}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <HiCheckCircle style={{ color: '#4ade80', fontSize: 22 }} />
                                    <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 14 }}>🎉 ยอดเยี่ยม! ผ่านด่าน #{levelNum} — {ch.title}</span>
                                </div>
                                <button onClick={goNext} disabled={levelNum >= 100} style={{ ...s.nextBtn, opacity: levelNum >= 100 ? 0.5 : 1 }}>
                                    <HiSparkles /> {levelNum < 100 ? 'ไปด่านถัดไป →' : '🎉 ครบ 100 ด่าน!'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const s = {
    center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 },
    topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border-color)', background: 'rgba(10,14,23,0.9)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10 },
    backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13 },
    tierTag: { fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)' },
    navBtn: { width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-secondary)', transition: 'all 0.2s' },
    splitView: { flex: 1, display: 'flex', minHeight: 0 },
    leftPanel: { width: '40%', minWidth: 300, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'auto' },
    problemHeader: { padding: '16px 20px', borderBottom: '1px solid var(--border-color)' },
    problemBody: { flex: 1, padding: '16px 20px', overflow: 'auto' },
    outputBox: { background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 'var(--radius-md)', padding: 12 },
    outputPre: { fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)', marginTop: 6, whiteSpace: 'pre-wrap' },
    hintBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13, fontWeight: 500, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', color: 'var(--text-primary)', width: '100%', justifyContent: 'center' },
    hintPanel: { marginTop: 8, padding: 12, background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 'var(--radius-md)', animation: 'slideDown 0.3s ease' },
    hintItem: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', fontSize: 13, color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.04)' },
    hintNum: { fontSize: 12, flexShrink: 0 },
    moreHintBtn: { marginTop: 8, fontSize: 12, color: '#f59e0b', fontWeight: 600 },
    rightPanel: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
    editorHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border-color)', background: 'rgba(26,31,46,0.5)' },
    editorFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--border-color)', background: 'rgba(26,31,46,0.5)' },
    resetBtn: { padding: '8px 16px', fontSize: 12, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', transition: 'all 0.2s' },
    submitBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 24px', fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 0 15px rgba(34,197,94,0.25)' },
    btnPrimary: { padding: '10px 24px', background: 'var(--accent-blue)', color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 600 },
    confettiWrap: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, overflow: 'hidden' },
    confetti: { position: 'absolute', top: 0, borderRadius: '2px', animation: 'confetti-fall 3s ease forwards' },
    // Stdin input area
    stdinWrap: { borderTop: '1px solid #334155' },
    stdinHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px', background: 'rgba(245,158,11,0.05)' },
    stdinTextarea: {
        width: '100%', background: '#0c0f14', border: 'none', borderTop: '1px solid #1e293b',
        color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
        padding: '8px 16px', resize: 'none', outline: 'none', lineHeight: 1.5,
    },
    // Terminal
    terminalWrap: { borderTop: '2px solid #0f172a', display: 'flex', flexDirection: 'column', minHeight: 170, maxHeight: 300 },
    terminalTitleBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 12px', background: '#1e293b', borderBottom: '1px solid #0f172a' },
    terminalBody: { flex: 1, padding: '10px 14px', background: '#0c0f14', overflow: 'auto', fontFamily: 'var(--font-mono)' },
    terminalFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(34,197,94,0.06)', borderTop: '1px solid rgba(34,197,94,0.2)', animation: 'fadeIn 0.4s ease' },
    nextBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 24px', fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 0 15px rgba(16,185,129,0.3)', cursor: 'pointer' },
    thaiHelpBtn: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', fontSize: 11, fontWeight: 600, border: '1px solid #334155', borderRadius: 'var(--radius-full)', color: '#fbbf24', cursor: 'pointer', transition: 'all 0.2s' },
    thaiExplainBox: { margin: '8px 0', padding: '10px 14px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 6, animation: 'slideDown 0.3s ease' },
};
