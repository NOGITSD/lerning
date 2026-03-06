/**
 * Anti-Cheat Code Validator
 * Validates user code against challenge requirements with Python simulation
 */

/**
 * Main validation function
 * @param {string} code - User's submitted code
 * @param {object} challenge - Challenge object with validation rules
 * @param {string} language - 'python' | 'javascript' | 'cpp'
 * @param {string[]} stdinInputs - stdin inputs for input() calls
 */
export function validateCode(code, challenge, language, stdinInputs = []) {
    const errors = [];
    const trimmedCode = code.trim();

    // 1. Empty code
    if (!trimmedCode) {
        return fail('กรุณาเขียนโค้ดก่อนส่งคำตอบ', [{ en: 'No code provided', th: 'โค้ดว่างเปล่า กรุณาเขียนโค้ดก่อนกดรัน' }], '', language, trimmedCode, null, challenge);
    }

    // 2. Minimum lines
    const lines = trimmedCode.split('\n').filter(l => l.trim().length > 0);
    if (challenge.minLines && lines.length < challenge.minLines) {
        errors.push({ en: `Expected at least ${challenge.minLines} lines of code (got ${lines.length})`, th: `โค้ดต้องมีอย่างน้อย ${challenge.minLines} บรรทัด (ตอนนี้มี ${lines.length} บรรทัด)` });
    }

    // 3. Required keywords
    if (challenge.requiredKeywords) {
        for (const kw of challenge.requiredKeywords) {
            if (!trimmedCode.includes(kw)) {
                errors.push({ en: `Missing required keyword: "${kw}"`, th: `โค้ดต้องใช้ "${kw}" ในการแก้ปัญหานี้` });
            }
        }
    }

    // 4. Banned patterns
    if (challenge.bannedPatterns) {
        for (const p of challenge.bannedPatterns) {
            try { if (new RegExp(p.regex, p.flags || 'g').test(trimmedCode)) errors.push({ en: p.message, th: p.message }); } catch (e) { }
        }
    }

    // 5. Required patterns
    if (challenge.requiredPatterns) {
        for (const p of challenge.requiredPatterns) {
            try { if (!new RegExp(p.regex, p.flags || '').test(trimmedCode)) errors.push({ en: p.message, th: p.message }); } catch (e) { }
        }
    }

    // 6. Anti hard-code
    if (challenge.expectedOutput && challenge.preventHardcode) {
        const escaped = challenge.expectedOutput.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let pat;
        if (language === 'python') pat = new RegExp(`print\\s*\\(\\s*["'\`]${escaped}["'\`]\\s*\\)`, 'g');
        else if (language === 'javascript') pat = new RegExp(`console\\.log\\s*\\(\\s*["'\`]${escaped}["'\`]\\s*\\)`, 'g');
        else pat = new RegExp(`cout\\s*<<\\s*["']${escaped}["']`, 'g');
        if (pat && pat.test(trimmedCode)) {
            errors.push({ en: 'Hard-coded output detected!', th: 'ห้าม hard-code ผลลัพธ์โดยตรง! ต้องใช้ตัวแปรและ operator ตามที่โจทย์กำหนด' });
        }
    }

    // Early fail on structural errors
    if (errors.length > 0) {
        return fail('ยังไม่ผ่านด่าน', errors, '', language, trimmedCode, null, challenge);
    }

    // 7. Execute / simulate
    let actualOutput = '';
    let executionError = null;

    if (language === 'javascript') {
        try { actualOutput = runJavaScript(trimmedCode); }
        catch (e) { executionError = e; errors.push({ en: `${e.name}: ${e.message}`, th: translateJSError(e) }); }
    }

    if (language === 'python') {
        if (!validatePythonSyntax(trimmedCode)) {
            executionError = { name: 'SyntaxError', message: 'Invalid syntax' };
            errors.push({ en: 'SyntaxError: invalid syntax', th: 'โครงสร้างโค้ดผิดพลาด — อาจลืมปิดวงเล็บ เครื่องหมายคำพูด หรือเว้น indent ไม่ถูกต้อง' });
        } else {
            actualOutput = simulatePythonOutput(trimmedCode, stdinInputs);
        }
    }

    if (language === 'cpp') {
        actualOutput = simulateCppOutput(trimmedCode);
    }

    // 8. OUTPUT COMPARISON — STRICT, NO FALLBACK
    if (challenge.expectedOutput && !executionError && errors.length === 0) {
        const expected = challenge.expectedOutput.trim();
        const actual = actualOutput.trim();

        if (actual === '') {
            // Can't determine output — DON'T auto-pass
            // For non-JS languages, we can't run code, so if we can't simulate:
            // - If the challenge HAS expectedOutput, we FAIL (can't verify)
            errors.push({
                en: `Cannot verify output. Expected: "${expected}"\nMake sure your print statement produces the correct output.`,
                th: `ไม่สามารถจำลองผลลัพธ์ได้ ตรวจสอบว่า print() แสดงผลลัพธ์ตรงกับที่ต้องการ: "${expected}"`
            });
        } else if (actual !== expected) {
            errors.push({
                en: `Output mismatch:\n  Expected: "${expected}"\n  Got:      "${actual}"`,
                th: `ผลลัพธ์ไม่ตรง:\n  ต้องการ: "${expected}"\n  ได้: "${actual}"`
            });
        }
    }

    if (errors.length > 0) {
        return fail('ยังไม่ผ่านด่าน', errors, actualOutput, language, trimmedCode, executionError, challenge);
    }

    return pass(actualOutput, language, trimmedCode, challenge);
}

function fail(feedback, errors, output, lang, code, execErr, challenge) {
    return {
        passed: false, feedback,
        details: errors.map(e => e.en),
        actualOutput: output,
        terminalOutput: buildTerminal(lang, code, output, errors, execErr, challenge),
        errorExplanations: errors.map(e => e.th)
    };
}

function pass(output, lang, code, challenge) {
    return {
        passed: true,
        feedback: '🎉 ผ่านด่านเรียบร้อย!',
        details: ['โค้ดถูกต้อง ผลลัพธ์ตรงตามที่ต้องการ'],
        actualOutput: output,
        terminalOutput: buildTerminal(lang, code, output, [], null, challenge),
        errorExplanations: []
    };
}

// ====================================================================
// Terminal Output Builder
// ====================================================================

function buildTerminal(lang, code, output, errors, execErr, challenge) {
    const lines = [];
    const file = lang === 'python' ? 'solution.py' : lang === 'javascript' ? 'solution.js' : 'solution.cpp';

    if (lang === 'cpp') {
        lines.push({ text: `$ g++ ${file} -o solution`, type: 'command' });
        if (execErr) {
            lines.push({ text: `${file}: error: ${execErr.message}`, type: 'error' });
            lines.push({ text: 'compilation terminated.', type: 'error' });
            lines.push({ text: 'Process exited with code 1', type: 'muted' });
            return lines;
        }
        lines.push({ text: '$ ./solution', type: 'command' });
    } else {
        lines.push({ text: `$ ${lang === 'python' ? 'python' : 'node'} ${file}`, type: 'command' });
    }

    if (execErr) {
        if (lang === 'python') {
            lines.push({ text: 'Traceback (most recent call last):', type: 'error' });
            lines.push({ text: `  File "${file}", line 1, in <module>`, type: 'error' });
        }
        lines.push({ text: `${execErr.name}: ${execErr.message}`, type: 'error-highlight' });
        lines.push({ text: '', type: 'output' });
        lines.push({ text: 'Process exited with code 1', type: 'muted' });
        return lines;
    }

    // Program output
    if (output) {
        output.split('\n').forEach(l => lines.push({ text: l, type: 'output' }));
    }

    // Validation errors
    if (errors.length > 0) {
        lines.push({ text: '', type: 'output' });
        lines.push({ text: '──── Validation Failed ────', type: 'separator' });
        errors.forEach(e => e.en.split('\n').forEach(l => lines.push({ text: l, type: 'warning' })));
        lines.push({ text: '', type: 'output' });
        lines.push({ text: 'Process exited with code 1', type: 'muted' });
    } else {
        if (output) lines.push({ text: '', type: 'output' });
        lines.push({ text: 'Process exited with code 0', type: 'success-dim' });
    }

    return lines;
}

// ====================================================================
// PYTHON OUTPUT SIMULATOR — Enhanced
// ====================================================================

function simulatePythonOutput(code, stdinInputs = []) {
    let stdinIdx = 0;
    const codeLines = code.split('\n');
    const vars = {};           // variable store
    const outputs = [];        // collected print outputs

    for (const rawLine of codeLines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        // --- Variable assignment: x = expr ---
        const assign = line.match(/^(\w+)\s*=\s*(.+)$/);
        if (assign && !line.includes('==') && !line.startsWith('if ') && !line.startsWith('for ') && !line.startsWith('while ') && !line.startsWith('def ') && !line.startsWith('class ')) {
            const [, name, expr] = assign;
            const r = resolveExpr(expr.trim(), vars, stdinInputs, stdinIdx);
            if (r.val !== undefined) vars[name] = r.val;
            stdinIdx = r.si;
            continue;
        }

        // --- Multiple assignment: x, y, z = 1, 2, 3 ---
        const multiAssign = line.match(/^(\w+(?:\s*,\s*\w+)+)\s*=\s*(.+)$/);
        if (multiAssign && multiAssign[1].includes(',') && !line.includes('==')) {
            const names = multiAssign[1].split(',').map(s => s.trim());
            const vals = multiAssign[2].split(',').map(s => s.trim());
            names.forEach((n, i) => {
                if (vals[i]) {
                    const r = resolveExpr(vals[i], vars, stdinInputs, stdinIdx);
                    if (r.val !== undefined) vars[n] = r.val;
                    stdinIdx = r.si;
                }
            });
            continue;
        }

        // --- print(...) ---
        const printMatch = line.match(/^print\s*\((.+)\)\s*$/);
        if (printMatch) {
            const result = resolvePrint(printMatch[1].trim(), vars);
            if (result !== null) {
                outputs.push(String(result));
            }
            // If we can't resolve, push nothing (output will be empty → fail)
        }
    }

    return outputs.join('\n');
}

// Resolve an expression to a value
function resolveExpr(expr, vars, stdin, si) {
    let e = expr.trim();
    // Strip optional surrounding parentheses: ("hello") → "hello"
    if (e.startsWith('(') && e.endsWith(')')) {
        const inner = e.slice(1, -1).trim();
        // Only strip if the parens are balanced (not a tuple/function call)
        if (!inner.includes(',') && !/^\w+\s*\(/.test(inner)) {
            e = inner;
        }
    }

    // String literal
    const str = e.match(/^["'](.*)["']$/);
    if (str) return { val: str[1], si };

    // f-string
    const fstr = e.match(/^f["'](.*)["']$/);
    if (fstr) return { val: resolveF(fstr[1], vars), si };

    // Number
    if (/^-?\d+(\.\d+)?$/.test(e)) return { val: Number(e), si };

    // Boolean
    if (e === 'True') return { val: true, si };
    if (e === 'False') return { val: false, si };

    // None
    if (e === 'None') return { val: 'None', si };

    // input("...") or input()
    if (/^input\s*\(.*\)$/.test(e)) {
        return { val: stdin[si] || '', si: si + 1 };
    }

    // int(input(...))
    if (/^int\s*\(\s*input\s*\(.*\)\s*\)$/.test(e)) {
        return { val: Number(stdin[si] || '0'), si: si + 1 };
    }

    // float(input(...))
    if (/^float\s*\(\s*input\s*\(.*\)\s*\)$/.test(e)) {
        return { val: parseFloat(stdin[si] || '0'), si: si + 1 };
    }

    // Variable reference
    if (/^\w+$/.test(e) && e in vars) return { val: vars[e], si };

    // Math: a OP b
    const math = e.match(/^(\w+)\s*([+\-*/%]|\/\/|\*\*)\s*(\w+)$/);
    if (math) {
        let [, l, op, r] = math;
        let lv = l in vars ? vars[l] : (isNaN(l) ? undefined : Number(l));
        let rv = r in vars ? vars[r] : (isNaN(r) ? undefined : Number(r));
        if (lv !== undefined && rv !== undefined && typeof lv === 'number' && typeof rv === 'number') {
            let result;
            switch (op) {
                case '+': result = lv + rv; break;
                case '-': result = lv - rv; break;
                case '*': result = lv * rv; break;
                case '/': result = lv / rv; break;
                case '%': result = lv % rv; break;
                case '//': result = Math.floor(lv / rv); break;
                case '**': result = Math.pow(lv, rv); break;
            }
            if (result !== undefined) return { val: result, si };
        }
    }

    // len(var)
    const lenM = e.match(/^len\s*\(\s*(\w+)\s*\)$/);
    if (lenM && lenM[1] in vars) {
        const v = vars[lenM[1]];
        if (typeof v === 'string') return { val: v.length, si };
    }

    // type(var)
    const typeM = e.match(/^type\s*\(\s*(\w+)\s*\)$/);
    if (typeM && typeM[1] in vars) {
        const v = vars[typeM[1]];
        if (typeof v === 'number') return { val: Number.isInteger(v) ? "<class 'int'>" : "<class 'float'>", si };
        if (typeof v === 'string') return { val: "<class 'str'>", si };
        if (typeof v === 'boolean') return { val: "<class 'bool'>", si };
    }

    // String method: text.upper(), text.lower(), text.strip()
    const methodM = e.match(/^(\w+)\.(upper|lower|strip|title|capitalize|swapcase)\(\)$/);
    if (methodM && methodM[1] in vars && typeof vars[methodM[1]] === 'string') {
        const s = vars[methodM[1]];
        switch (methodM[2]) {
            case 'upper': return { val: s.toUpperCase(), si };
            case 'lower': return { val: s.toLowerCase(), si };
            case 'strip': return { val: s.trim(), si };
            case 'title': return { val: s.replace(/\b\w/g, c => c.toUpperCase()), si };
            case 'capitalize': return { val: s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(), si };
        }
    }

    // text.replace("a", "b")
    const replaceM = e.match(/^(\w+)\.replace\(\s*["'](.+?)["']\s*,\s*["'](.*?)["']\s*\)$/);
    if (replaceM && replaceM[1] in vars && typeof vars[replaceM[1]] === 'string') {
        return { val: vars[replaceM[1]].replace(replaceM[2], replaceM[3]), si };
    }

    // text[0], text[-1] — single char indexing
    const idxM = e.match(/^(\w+)\[\s*(-?\d+)\s*\]$/);
    if (idxM && idxM[1] in vars) {
        const v = vars[idxM[1]];
        if (typeof v === 'string') {
            let idx = parseInt(idxM[2]);
            if (idx < 0) idx = v.length + idx;
            if (idx >= 0 && idx < v.length) return { val: v[idx], si };
        }
    }

    // text[a:b] — slicing
    const sliceM = e.match(/^(\w+)\[\s*(-?\d*)?\s*:\s*(-?\d*)?\s*\]$/);
    if (sliceM && sliceM[1] in vars) {
        const v = vars[sliceM[1]];
        if (typeof v === 'string') {
            let start = sliceM[2] !== '' ? parseInt(sliceM[2]) : 0;
            let end = sliceM[3] !== '' ? parseInt(sliceM[3]) : v.length;
            if (start < 0) start = v.length + start;
            if (end < 0) end = v.length + end;
            return { val: v.slice(start, end), si };
        }
    }

    return { val: undefined, si };
}

// Resolve f-string placeholders
function resolveF(template, vars) {
    return template.replace(/\{([^}]+)\}/g, (_, expr) => {
        const e = expr.trim();
        if (e in vars) return String(vars[e]);
        // Simple math inside f-string
        const math = e.match(/^(\w+)\s*([+\-*/%])\s*(\w+)$/);
        if (math) {
            const [, l, op, r] = math;
            const lv = l in vars ? Number(vars[l]) : Number(l);
            const rv = r in vars ? Number(vars[r]) : Number(r);
            if (!isNaN(lv) && !isNaN(rv)) {
                switch (op) {
                    case '+': return String(lv + rv);
                    case '-': return String(lv - rv);
                    case '*': return String(lv * rv);
                }
            }
        }
        return `{${expr}}`;
    });
}

// Resolve print() arguments (handles multiple args, concat, etc.)
function resolvePrint(arg, vars) {
    // Check for multiple comma-separated arguments: print(a, b, c)
    // Need to handle commas inside strings carefully
    const args = splitPrintArgs(arg);
    if (args.length > 1) {
        const resolved = args.map(a => resolveSinglePrintArg(a.trim(), vars));
        if (resolved.every(r => r !== null)) return resolved.join(' ');
        return null;
    }
    return resolveSinglePrintArg(arg, vars);
}

// Split print arguments respecting strings and parens
function splitPrintArgs(arg) {
    const args = [];
    let depth = 0, inStr = false, strCh = '', cur = '';
    for (let i = 0; i < arg.length; i++) {
        const ch = arg[i];
        if (inStr) {
            cur += ch;
            if (ch === strCh && arg[i - 1] !== '\\') inStr = false;
            continue;
        }
        if (ch === '"' || ch === "'") { inStr = true; strCh = ch; cur += ch; continue; }
        if (ch === '(' || ch === '[' || ch === '{') { depth++; cur += ch; continue; }
        if (ch === ')' || ch === ']' || ch === '}') { depth--; cur += ch; continue; }
        if (ch === ',' && depth === 0) { args.push(cur); cur = ''; continue; }
        cur += ch;
    }
    if (cur) args.push(cur);
    return args;
}

function resolveSinglePrintArg(arg, vars) {
    const a = arg.trim();

    // f-string
    const fStr = a.match(/^f["'](.*)["']$/);
    if (fStr) return resolveF(fStr[1], vars);

    // String literal
    const str = a.match(/^["'](.*)["']$/);
    if (str) return str[1];

    // Variable
    if (/^\w+$/.test(a) && a in vars) return String(vars[a]);

    // Number literals
    if (/^-?\d+(\.\d+)?$/.test(a)) return a;

    // len(var)
    const lenM = a.match(/^len\s*\(\s*(\w+)\s*\)$/);
    if (lenM && lenM[1] in vars) {
        const v = vars[lenM[1]];
        if (typeof v === 'string') return String(v.length);
    }

    // type(var)
    const typeM = a.match(/^type\s*\(\s*(\w+)\s*\)$/);
    if (typeM && typeM[1] in vars) {
        const v = vars[typeM[1]];
        if (typeof v === 'number') return Number.isInteger(v) ? "<class 'int'>" : "<class 'float'>";
        if (typeof v === 'string') return "<class 'str'>";
        if (typeof v === 'boolean') return "<class 'bool'>";
    }

    // String method: var.upper() etc.
    const methodM = a.match(/^(\w+)\.(upper|lower|strip|title|capitalize)\(\)$/);
    if (methodM && methodM[1] in vars && typeof vars[methodM[1]] === 'string') {
        const s = vars[methodM[1]];
        switch (methodM[2]) {
            case 'upper': return s.toUpperCase();
            case 'lower': return s.toLowerCase();
            case 'strip': return s.trim();
            case 'title': return s.replace(/\b\w/g, c => c.toUpperCase());
            case 'capitalize': return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        }
    }

    // text.replace("a","b")
    const replM = a.match(/^(\w+)\.replace\(\s*["'](.+?)["']\s*,\s*["'](.*?)["']\s*\)$/);
    if (replM && replM[1] in vars && typeof vars[replM[1]] === 'string') {
        return vars[replM[1]].replace(replM[2], replM[3]);
    }

    // var[index]
    const idxM = a.match(/^(\w+)\[\s*(-?\d+)\s*\]$/);
    if (idxM && idxM[1] in vars) {
        const v = vars[idxM[1]];
        if (typeof v === 'string') {
            let idx = parseInt(idxM[2]);
            if (idx < 0) idx = v.length + idx;
            return v[idx] || null;
        }
    }

    // var[a:b] slicing
    const sliceM = a.match(/^(\w+)\[\s*(-?\d*)?\s*:\s*(-?\d*)?\s*\]$/);
    if (sliceM && sliceM[1] in vars) {
        const v = vars[sliceM[1]];
        if (typeof v === 'string') {
            let start = sliceM[2] !== '' ? parseInt(sliceM[2]) : 0;
            let end = sliceM[3] !== '' ? parseInt(sliceM[3]) : v.length;
            if (start < 0) start = v.length + start;
            if (end < 0) end = v.length + end;
            return v.slice(start, end);
        }
    }

    // String concatenation: "str" + var or var + "str"
    if (a.includes('+') && !a.match(/^[^"']*[+\-*/]\s*$/)) {
        const parts = splitPrintArgs(a.replace(/\+/g, ','));
        const resolved = parts.map(p => {
            const t = p.trim();
            const s = t.match(/^["'](.*)["']$/);
            if (s) return s[1];
            if (t in vars) return String(vars[t]);
            return null;
        });
        if (resolved.every(r => r !== null)) return resolved.join('');
    }

    // Math expression: a OP b
    const math = a.match(/^(\w+)\s*([+\-*/%]|\/\/|\*\*)\s*(\w+)$/);
    if (math) {
        const [, l, op, r] = math;
        const lv = l in vars ? Number(vars[l]) : (isNaN(l) ? undefined : Number(l));
        const rv = r in vars ? Number(vars[r]) : (isNaN(r) ? undefined : Number(r));
        if (lv !== undefined && rv !== undefined && !isNaN(lv) && !isNaN(rv)) {
            let result;
            switch (op) {
                case '+': result = lv + rv; break;
                case '-': result = lv - rv; break;
                case '*': result = lv * rv; break;
                case '/': result = lv / rv; break;
                case '%': result = lv % rv; break;
                case '//': result = Math.floor(lv / rv); break;
                case '**': result = Math.pow(lv, rv); break;
            }
            if (result !== undefined) return String(Number.isInteger(result) ? result : result);
        }
    }

    return null;
}

// ====================================================================
// C++ Simulation
// ====================================================================

function simulateCppOutput(code) {
    const coutRegex = /cout\s*<<\s*["']([^"']*)["']/g;
    const outputs = [];
    let m;
    while ((m = coutRegex.exec(code)) !== null) outputs.push(m[1]);
    return outputs.join('');
}

// ====================================================================
// JavaScript Execution
// ====================================================================

function runJavaScript(code) {
    let output = '';
    const mock = {
        log: (...args) => { output += args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') + '\n'; },
        error: (...args) => { output += args.join(' ') + '\n'; },
        warn: (...args) => { output += args.join(' ') + '\n'; }
    };
    const fn = new Function(`"use strict";const console=arguments[0];const alert=undefined;const prompt=undefined;const fetch=undefined;${code}`);
    fn(mock);
    return output.trimEnd();
}

// ====================================================================
// Helpers
// ====================================================================

function translateJSError(e) {
    const m = e.message || '', n = e.name || 'Error';
    if (n === 'SyntaxError') {
        if (m.includes('Unexpected token')) return 'โครงสร้างโค้ดผิดพลาด: พบตัวอักษรที่ไม่ถูกต้อง';
        if (m.includes('Unexpected end')) return 'โค้ดไม่สมบูรณ์: อาจลืมปิดวงเล็บ';
        return `โครงสร้างโค้ดผิด: ${m}`;
    }
    if (n === 'ReferenceError') {
        const v = m.match(/(\w+) is not defined/);
        return v ? `ไม่พบตัวแปร "${v[1]}" — ลืมประกาศหรือสะกดผิด?` : m;
    }
    if (n === 'TypeError') return `ชนิดข้อมูลผิดประเภท: ${m}`;
    return `${n}: ${m}`;
}

function validatePythonSyntax(code) {
    const stack = [];
    const pairs = { '(': ')', '[': ']', '{': '}' };
    let inStr = false, sCh = '';
    for (let i = 0; i < code.length; i++) {
        const ch = code[i];
        if (inStr) { if (ch === sCh && code[i - 1] !== '\\') inStr = false; continue; }
        if (ch === '"' || ch === "'") { inStr = true; sCh = ch; continue; }
        if (ch === '#') { while (i < code.length && code[i] !== '\n') i++; continue; }
        if (pairs[ch]) stack.push(pairs[ch]);
        else if (ch === ')' || ch === ']' || ch === '}') {
            if (stack.length === 0 || stack.pop() !== ch) return false;
        }
    }
    return stack.length === 0;
}

/** Check if code uses input() */
export function codeNeedsInput(code) {
    return /\binput\s*\(/.test(code);
}
