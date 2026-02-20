/* ================================================
   docs.js — Documentation SPA
   Renders markdown docs from the /docs folder
   ================================================ */

'use strict';

// ── Lightweight Markdown → HTML parser ──────────────
function md(src) {
    let html = src
        // Escape HTML
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        // Headings
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // HR
        .replace(/^---$/gm, '<hr>')
        // Checklist items
        .replace(/^- \[ \] (.+)$/gm, '<li class="check-item"><span class="check-box"></span> $1</li>')
        .replace(/^- \[x\] (.+)$/gim, '<li class="check-item check-done"><span class="check-box">✓</span> $1</li>')
        // Unordered list items
        .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
        // Ordered list items
        .replace(/^\d+\. (.+)$/gm, '<li class="ol-item">$1</li>')
        // Bold + italic
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Inline code (protect from further processing)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Blockquote
        .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

    // ── Code blocks ──
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        const highlighted = highlight(code.trimEnd(), lang);
        const langLabel = lang || 'text';
        return `<div class="code-wrap"><button class="copy-btn" onclick="copyCode(this)">Copy</button><pre data-lang="${langLabel}"><code>${highlighted}</code></pre></div>`;
    });

    // ── Tables ──
    html = html.replace(/((?:^\|.+\|\s*\n)+)/gm, (block) => {
        const rows = block.trim().split('\n');
        let out = '<table>';
        rows.forEach((row, i) => {
            if (row.match(/^\|[-:| ]+\|$/)) return; // separator
            const cells = row.split('|').filter((_, ci) => ci > 0 && ci < row.split('|').length - 1);
            if (i === 0) {
                out += '<thead><tr>' + cells.map(c => `<th>${c.trim()}</th>`).join('') + '</tr></thead><tbody>';
            } else {
                out += '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
            }
        });
        out += '</tbody></table>';
        return out;
    });

    // ── Wrap list items ──
    html = html
        .replace(/((?:<li>[\s\S]*?<\/li>\n?)+)/g, m => {
            if (m.includes('ol-item')) return '<ol>' + m.replace(/ class="ol-item"/g, '') + '</ol>';
            if (m.includes('check-item')) return '<ul class="checklist">' + m + '</ul>';
            return '<ul>' + m + '</ul>';
        });

    // ── Paragraphs ──
    html = html
        .split(/\n{2,}/)
        .map(block => {
            block = block.trim();
            if (!block) return '';
            if (/^<(h[1-6]|ul|ol|li|pre|table|blockquote|hr|div)/.test(block)) return block;
            return '<p>' + block.replace(/\n/g, ' ') + '</p>';
        })
        .join('\n');

    return html;
}

// ── Very simple syntax highlighter ──────────────────
function highlight(code, lang) {
    if (!lang || lang === 'text' || lang === 'bash' || lang === 'shell') {
        // Bash: comments and strings
        return code
            .replace(/(#.+)$/gm, '<span class="tok-comment">$1</span>')
            .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="tok-string">$1</span>');
    }
    if (lang === 'json') {
        return code
            .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="tok-property">$1</span>:')
            .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="tok-string">$1</span>')
            .replace(/:\s*(\d+\.?\d*)/g, ': <span class="tok-number">$1</span>')
            .replace(/:\s*(true|false|null)/g, ': <span class="tok-keyword">$1</span>');
    }
    if (lang === 'javascript' || lang === 'js') {
        return code
            .replace(/(\/\/.+)$/gm, '<span class="tok-comment">$1</span>')
            .replace(/\b(const|let|var|function|class|return|async|await|import|export|from|if|else|switch|case|break|new|this|typeof|instanceof|try|catch|throw)\b/g,
                '<span class="tok-keyword">$1</span>')
            .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '<span class="tok-string">$1</span>')
            .replace(/\b(\d+\.?\d*)\b/g, '<span class="tok-number">$1</span>');
    }
    if (lang === 'sql') {
        return code
            .replace(/\b(SELECT|FROM|WHERE|CREATE|TABLE|PRIMARY KEY|NOT NULL|DEFAULT|FOREIGN KEY|REFERENCES|INSERT|INTO|VALUES|INDEX|ON|UNIQUE|CHECK|DATETIME|TEXT|REAL|BLOB|INTEGER)\b/gi,
                '<span class="tok-keyword">$1</span>');
    }
    if (lang === 'typescript' || lang === 'ts') {
        return code
            .replace(/\b(string|number|boolean|object|null|undefined|any|void|interface|type|enum)\b/g, '<span class="tok-type">$1</span>')
            .replace(/\b(const|let|var|function|class|return|async|await|import|export|from)\b/g, '<span class="tok-keyword">$1</span>');
    }
    if (lang === 'nginx') {
        return code
            .replace(/(#.+)$/gm, '<span class="tok-comment">$1</span>')
            .replace(/\b(server|location|proxy_pass|listen|listen|server_name|proxy_set_header)\b/g, '<span class="tok-keyword">$1</span>');
    }
    return code;
}

// ── Copy to clipboard ────────────────────────────────
window.copyCode = (btn) => {
    const code = btn.nextElementSibling.querySelector('code').innerText;
    navigator.clipboard.writeText(code).then(() => {
        btn.classList.add('copied');
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.classList.remove('copied'); btn.textContent = 'Copy'; }, 2000);
    });
};

// ── Doc registry (fetched from server) ──────────────
const DOCS = [
    { id: 'design', file: '/docs/design.md', title: 'Design Document', icon: '🎨', subtitle: 'System overview, architecture & correctness properties' },
    { id: 'architecture', file: '/docs/ARCHITECTURE.md', title: 'Architecture', icon: '🏗️', subtitle: 'Three-tier architecture, components, data flows & patterns' },
    { id: 'api-contract', file: '/docs/API-CONTRACT.md', title: 'API Contract', icon: '🔌', subtitle: 'All REST endpoints, schemas, function calling & error codes' },
    { id: 'deployment', file: '/docs/DEPLOYMENT.md', title: 'Deployment', icon: '🚀', subtitle: 'VPS, Heroku, Docker, Vercel, monitoring & rollback strategies' },
    { id: 'testing', file: '/docs/TESTING-GUIDE.md', title: 'Testing Guide', icon: '🧪', subtitle: 'Manual, automated, curl, rate limit & frontend testing' },
    { id: 'features', file: '/docs/UNIQUE-FEATURES.md', title: 'Unique Features', icon: '✨', subtitle: 'Innovations, competitive advantages & future enhancements' },
];

// ── State ────────────────────────────────────────────
let activeId = 'design';
const cache = {};

// ── DOM refs ─────────────────────────────────────────
const docContainer = document.getElementById('docContainer');
const topbarTitle = document.getElementById('topbarTitle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const menuBtn = document.getElementById('menuBtn');
const sidebarClose = document.getElementById('sidebarClose');

// ── Render a doc ─────────────────────────────────────
async function renderDoc(id) {
    const doc = DOCS.find(d => d.id === id);
    if (!doc) return;
    activeId = id;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.doc === id);
    });

    // Update topbar title
    topbarTitle.textContent = doc.title;

    // Show loading
    docContainer.innerHTML = `<div class="loading-state">
    <div class="spinner-wrap"><div class="loader-ring"></div></div>
    <p>Loading documentation…</p>
  </div>`;

    try {
        let markdownText;
        if (cache[id]) {
            markdownText = cache[id];
        } else {
            const res = await fetch(doc.file);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            markdownText = await res.text();
            cache[id] = markdownText;
        }

        const bodyHtml = md(markdownText);
        docContainer.innerHTML = `
      <div class="doc-body">
        <div class="doc-hero">
          <div class="doc-hero-badge">${doc.icon} ${doc.title}</div>
          <div class="doc-hero-subtitle">${doc.subtitle}</div>
        </div>
        ${bodyHtml}
      </div>`;

        // Scroll to top
        window.scrollTo({ top: 0 });
        docContainer.parentElement.scrollTo({ top: 0 });

    } catch (err) {
        docContainer.innerHTML = `<div class="loading-state">
      <p style="color:#ef4444">⚠️ Failed to load "${doc.title}": ${err.message}</p>
      <p style="margin-top:8px;font-size:0.85rem;color:#94a3b8">Make sure the server is running on port 3000.</p>
    </div>`;
    }
}

// ── Nav click handler ─────────────────────────────────
document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const id = link.dataset.doc;
        if (id) {
            renderDoc(id);
            closeSidebar();
            history.replaceState(null, '', `#${id}`);
        }
    });
});

// ── Mobile sidebar ────────────────────────────────────
function openSidebar() { sidebar.classList.add('open'); overlay.classList.add('visible'); }
function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('visible'); }

menuBtn.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);

// ── Initial load ──────────────────────────────────────
const hash = location.hash.replace('#', '');
const startId = DOCS.find(d => d.id === hash) ? hash : 'design';
renderDoc(startId);
