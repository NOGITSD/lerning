import { useParams, useNavigate } from 'react-router-dom';
import { HiLockClosed, HiCheckCircle, HiPlay, HiArrowLeft, HiSparkles } from 'react-icons/hi2';
import { pythonChallenges } from '../data/pythonChallenges';
import { javascriptChallenges } from '../data/javascriptChallenges';
import { cppChallenges } from '../data/cppChallenges';
import { getTiers } from '../data/challengeGenerator';

const challengeMap = { python: pythonChallenges, javascript: javascriptChallenges, cpp: cppChallenges };
const langNames = { python: 'Python', javascript: 'JavaScript', cpp: 'C++' };
const langColors = { python: '#3776ab', javascript: '#f7df1e', cpp: '#00599c' };

export default function LevelMap({ progress }) {
    const { lang } = useParams();
    const nav = useNavigate();
    const challenges = challengeMap[lang] || [];
    const tiers = getTiers();
    const color = langColors[lang] || '#3b82f6';
    const completed = progress.getCompletedCount(lang);

    return (
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '0 20px' }}>
            {/* Header */}
            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 0' }}>
                <button onClick={() => nav('/')} style={styles.backBtn}>
                    <HiArrowLeft /> กลับหน้าหลัก
                </button>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4 }}>
                        <span style={{ color }}>{langNames[lang]}</span> Quest
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        {completed}/100 ด่านสำเร็จ • {Math.round(completed)}%
                    </p>
                    <div style={{ ...styles.totalProgress, marginTop: 12 }}>
                        <div style={{ ...styles.totalFill, width: `${completed}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
                    </div>
                </div>

                {/* Tiers */}
                {tiers.map(tier => {
                    const tierChallenges = challenges.filter(c => c.id >= tier.range[0] && c.id <= tier.range[1]);
                    const tierDone = tierChallenges.filter(c => progress.isLevelCompleted(lang, c.id)).length;
                    return (
                        <div key={tier.name} style={{ marginBottom: 32, animation: 'fadeInUp 0.5s ease forwards' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <span style={{ ...styles.tierBadge, background: `${tier.color}22`, color: tier.color, border: `1px solid ${tier.color}44` }}>
                                    ด่าน {tier.range[0]}-{tier.range[1]}
                                </span>
                                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{tier.name}</h2>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>{tierDone}/20</span>
                            </div>
                            <div style={styles.levelGrid}>
                                {tierChallenges.map(ch => {
                                    const done = progress.isLevelCompleted(lang, ch.id);
                                    const unlocked = progress.isLevelUnlocked(lang, ch.id);
                                    const isCurrent = !done && unlocked;
                                    return (
                                        <button
                                            key={ch.id}
                                            disabled={!unlocked}
                                            onClick={() => unlocked && nav(`/challenge/${lang}/${ch.id}`)}
                                            style={{
                                                ...styles.levelCard,
                                                borderColor: done ? `${tier.color}66` : isCurrent ? `${color}88` : 'var(--border-color)',
                                                opacity: unlocked ? 1 : 0.35,
                                                cursor: unlocked ? 'pointer' : 'not-allowed',
                                                background: done ? `${tier.color}11` : isCurrent ? `${color}08` : 'var(--bg-card)',
                                                animation: isCurrent ? 'borderGlow 2s ease infinite' : 'none',
                                            }}
                                            onMouseEnter={e => { if (unlocked) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 0 15px ${tier.color}33`; } }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span style={{ ...styles.levelNum, color: done ? tier.color : isCurrent ? color : 'var(--text-muted)' }}>#{ch.id}</span>
                                                {done ? <HiCheckCircle style={{ color: tier.color, fontSize: 18 }} /> :
                                                    !unlocked ? <HiLockClosed style={{ color: 'var(--text-muted)', fontSize: 16 }} /> :
                                                        isCurrent ? <HiPlay style={{ color, fontSize: 16 }} /> : null}
                                            </div>
                                            <p style={{ fontSize: 12, color: done ? 'var(--text-primary)' : unlocked ? 'var(--text-secondary)' : 'var(--text-muted)', lineHeight: 1.4, fontWeight: done ? 500 : 400 }}>
                                                {ch.title}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const styles = {
    backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, padding: '8px 0', marginBottom: 8, transition: 'color 0.2s' },
    totalProgress: { width: '100%', maxWidth: 400, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-full)', overflow: 'hidden', margin: '0 auto' },
    totalFill: { height: '100%', borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease' },
    tierBadge: { fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 'var(--radius-full)' },
    levelGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 },
    levelCard: {
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        textAlign: 'left',
        transition: 'all 0.25s ease',
        minHeight: 70,
    },
    levelNum: { fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' },
};
