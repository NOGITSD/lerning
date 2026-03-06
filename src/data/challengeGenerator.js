/**
 * Challenge Generator - creates 100 levels per language programmatically
 * Each challenge has: id, title, description, difficulty, hints, helpers,
 * requiredKeywords, bannedPatterns, expectedOutput, starterCode, minLines, preventHardcode
 */

// Difficulty tiers
const TIERS = [
    { name: 'Beginner', range: [1, 20], color: '#10b981' },
    { name: 'Easy', range: [21, 40], color: '#3b82f6' },
    { name: 'Medium', range: [41, 60], color: '#f59e0b' },
    { name: 'Hard', range: [61, 80], color: '#f97316' },
    { name: 'Expert', range: [81, 100], color: '#ef4444' },
];

export function getTier(level) {
    return TIERS.find(t => level >= t.range[0] && level <= t.range[1]) || TIERS[0];
}

export function getTiers() {
    return TIERS;
}

export default { getTier, getTiers };
