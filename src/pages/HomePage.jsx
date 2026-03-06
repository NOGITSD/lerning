import { useNavigate } from 'react-router-dom';
import { FaPython, FaJsSquare } from 'react-icons/fa';
import { SiCplusplus } from 'react-icons/si';
import { HiSparkles, HiAcademicCap } from 'react-icons/hi2';

const languages = [
    { id: 'python', name: 'Python', icon: FaPython, color: '#3776ab', glow: '#ffd43b', desc: 'ภาษาที่ง่ายที่สุด เหมาะสำหรับเริ่มต้น', tag: 'Beginner Friendly' },
    { id: 'javascript', name: 'JavaScript', icon: FaJsSquare, color: '#f7df1e', glow: '#f7df1e', desc: 'ภาษาสำหรับ Web Development', tag: 'Most Popular' },
    { id: 'cpp', name: 'C++', icon: SiCplusplus, color: '#00599c', glow: '#659ad2', desc: 'ภาษาสำหรับ Performance & Systems', tag: 'Advanced' },
];

export default function HomePage({ progress }) {
    const nav = useNavigate();

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.logoWrap}>
                    <HiSparkles style={{ color: 'var(--neon-blue)', fontSize: 32 }} />
                    <h1 style={styles.logo}>
                        Code<span style={{ color: 'var(--neon-blue)' }}>Quest</span>
                    </h1>
                </div>
                <p style={styles.tagline}>เรียนรู้การเขียนโปรแกรมผ่านระบบด่าน 100 ด่าน</p>
            </header>

            <main style={styles.main}>
                <div style={styles.heroSection}>
                    <HiAcademicCap style={{ fontSize: 64, color: 'var(--neon-purple)', marginBottom: 16, filter: 'drop-shadow(0 0 20px rgba(177,78,255,0.4))' }} />
                    <h2 style={styles.heroTitle}>เลือกภาษาที่ต้องการเรียนรู้</h2>
                    <p style={styles.heroSub}>แต่ละภาษามี 100 ด่าน เรียงจากง่ายไปยาก พร้อมระบบคำแนะนำและตัวช่วย</p>
                </div>

                <div style={styles.grid}>
                    {languages.map((lang, i) => {
                        const completed = progress.getCompletedCount(lang.id);
                        const pct = Math.round((completed / 100) * 100);
                        const Icon = lang.icon;
                        return (
                            <button
                                key={lang.id}
                                style={{ ...styles.card, animationDelay: `${i * 0.15}s`, '--lang-color': lang.color, '--lang-glow': lang.glow }}
                                onClick={() => nav(`/levels/${lang.id}`)}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                                    e.currentTarget.style.boxShadow = `0 0 30px ${lang.glow}33, 0 8px 32px rgba(0,0,0,0.5)`;
                                    e.currentTarget.style.borderColor = `${lang.glow}66`;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = '';
                                    e.currentTarget.style.boxShadow = '';
                                    e.currentTarget.style.borderColor = '';
                                }}
                            >
                                <span style={{ ...styles.tag, background: `${lang.color}22`, color: lang.color, border: `1px solid ${lang.color}44` }}>{lang.tag}</span>
                                <Icon style={{ fontSize: 72, color: lang.color, filter: `drop-shadow(0 0 15px ${lang.glow}55)`, marginBottom: 16 }} />
                                <h3 style={{ ...styles.cardTitle, color: lang.color }}>{lang.name}</h3>
                                <p style={styles.cardDesc}>{lang.desc}</p>
                                <div style={styles.progressBar}>
                                    <div style={{ ...styles.progressFill, width: `${pct}%`, background: `linear-gradient(90deg, ${lang.color}, ${lang.glow})` }} />
                                </div>
                                <span style={styles.progressText}>{completed}/100 ด่าน ({pct}%)</span>
                                <span style={styles.playBtn}>เริ่มเล่น →</span>
                            </button>
                        );
                    })}
                </div>

                <div style={styles.features}>
                    {[
                        { emoji: '🎯', title: '100 ด่านต่อภาษา', desc: 'ค่อยๆ ขยับความยากขึ้น' },
                        { emoji: '💡', title: 'คำแนะนำ & ตัวช่วย', desc: 'เปิดดูได้เมื่อติดปัญหา' },
                        { emoji: '🛡️', title: 'ระบบป้องกันโกง', desc: 'ต้องเขียนโค้ดจริงๆ' },
                        { emoji: '💾', title: 'บันทึก Progress', desc: 'กลับมาเล่นต่อได้เสมอ' },
                    ].map((f, i) => (
                        <div key={i} style={{ ...styles.featureCard, animationDelay: `${0.5 + i * 0.1}s` }}>
                            <span style={{ fontSize: 32 }}>{f.emoji}</span>
                            <h4 style={styles.featureTitle}>{f.title}</h4>
                            <p style={styles.featureDesc}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </main>

            <footer style={styles.footer}>
                <p>Code Quest • เรียนรู้การเขียนโปรแกรมอย่างสนุก</p>
            </footer>
        </div>
    );
}

const styles = {
    container: { position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    header: { textAlign: 'center', padding: '48px 20px 0' },
    logoWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 },
    logo: { fontSize: 42, fontWeight: 900, letterSpacing: '-1px', background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    tagline: { color: 'var(--text-secondary)', fontSize: 16, marginTop: 4 },
    main: { flex: 1, maxWidth: 1100, margin: '0 auto', padding: '0 20px', width: '100%' },
    heroSection: { textAlign: 'center', margin: '48px 0 40px', animation: 'fadeInUp 0.6s ease forwards' },
    heroTitle: { fontSize: 28, fontWeight: 800, marginBottom: 8, background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    heroSub: { color: 'var(--text-secondary)', fontSize: 15, maxWidth: 500, margin: '0 auto' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 48 },
    card: {
        background: 'linear-gradient(145deg, var(--bg-card) 0%, rgba(26,31,46,0.8) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        animation: 'fadeInUp 0.6s ease forwards',
        opacity: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    tag: { fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 'var(--radius-full)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' },
    cardTitle: { fontSize: 24, fontWeight: 800, marginBottom: 8 },
    cardDesc: { color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 },
    progressBar: { width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 8 },
    progressFill: { height: '100%', borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease' },
    progressText: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 },
    playBtn: { fontSize: 14, fontWeight: 700, color: 'var(--neon-blue)', padding: '8px 24px', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 'var(--radius-full)', transition: 'all 0.3s ease' },
    features: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 48 },
    featureCard: {
        background: 'rgba(26,31,46,0.5)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        textAlign: 'center',
        animation: 'fadeInUp 0.6s ease forwards',
        opacity: 0,
    },
    featureTitle: { fontSize: 14, fontWeight: 700, margin: '8px 0 4px' },
    featureDesc: { fontSize: 12, color: 'var(--text-muted)' },
    footer: { textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13, borderTop: '1px solid var(--border-color)' },
};
