import { zh } from './translations-zh.mjs';
import { posesZh } from './poses-zh.mjs';
import { poses } from './exercises.mjs';

for (const pose of poses) {
    const [name, area, description, ...cues] = posesZh[pose.id];
    zh[pose.name] = name;
    zh[pose.area] = area;
    zh[pose.description] = description;
    pose.cues.forEach((cue, index) => { zh[cue] = cues[index]; });
}
export function getLanguage() {
    return typeof document === 'undefined' ? 'en' : document.documentElement.lang === 'zh-CN' ? 'zh' : 'en';
}
export function t(source, language = getLanguage()) {
    if (language !== 'zh') return source;
    const text = source.replace(/\s+/g, ' ').trim();
    if (zh[text]) return zh[text];
    let match;
    if ((match = text.match(/^(\d+) sec$/))) return `${match[1]} 秒`;
    if ((match = text.match(/^(\d+) movements? (found|to explore)$/))) return match[2] === 'found' ? `找到 ${match[1]} 个动作` : `${match[1]} 个动作`;
    if ((match = text.match(/^Hold steady · (\d+)$/))) return `保持稳定 · ${match[1]}`;
    if ((match = text.match(/^Keep steady · (\d+) seconds remaining$/))) return `保持稳定 · 剩余 ${match[1]} 秒`;
    if (text.endsWith(' · try a small adjustment')) return `${t(text.slice(0, -' · try a small adjustment'.length), language)} · 稍作调整`;
    if (text.endsWith(', only within a comfortable range.')) return `${t(text.slice(0, -', only within a comfortable range.'.length), language)}，保持舒适的幅度。`;
    if (text.startsWith('Adjust gently toward the reference silhouette. ')) return `轻轻向参考轮廓调整。${t(text.slice('Adjust gently toward the reference silhouette. '.length), language)}`;
    // Preserve decorative symbols and translate composite status messages.
    if ((match = text.match(/^([○●◈↔⇄↻↶✓])\s*(.+)$/))) return `${match[1]} ${t(match[2], language)}`;
    for (const separator of [' — ', ' · ']) {
        if (text.includes(separator)) return text.split(separator).map(part => t(part, language)).join(separator);
    }
    return source;
}
export function poseSearchText(pose) {
    const local = posesZh[pose.id];
    return `${pose.name} ${pose.type} ${pose.area} ${local[0]} ${local[1]} ${pose.type === 'yoga' ? '瑜伽' : '拉伸'}`.toLowerCase();
}

// Keep the original English text for each DOM node. This presentation adapter
// also covers asynchronous camera feedback without changing tracking state.
export function initLanguage() {
    let language = 'en';
    try { if (localStorage.getItem('align-studio-language') === 'zh') language = 'zh'; } catch {}
    const originals = new WeakMap();
    const attributes = new WeakMap();
    const ignored = node => node.parentElement?.closest('script, style, [data-language-switch]');
    function localizeText(node) {
        if (ignored(node) || !node.data.trim()) return;
        let entry = originals.get(node);
        if (!entry || node.data !== entry.rendered) entry = { source: node.data };
        const leading = entry.source.match(/^\s*/)[0];
        const trailing = entry.source.match(/\s*$/)[0];
        entry.rendered = language === 'zh' ? leading + t(entry.source.trim(), language) + trailing : entry.source;
        originals.set(node, entry);
        if (node.data !== entry.rendered) node.data = entry.rendered;
    }
    function localizeElement(el) {
        if (el.closest('script, style, [data-language-switch]')) return;
        const saved = attributes.get(el) || {};
        for (const name of ['aria-label', 'placeholder', 'title']) {
            if (!el.hasAttribute(name)) continue;
            const value = el.getAttribute(name);
            let entry = saved[name];
            if (!entry || value !== entry.rendered) entry = { source: value };
            entry.rendered = t(entry.source, language);
            saved[name] = entry;
            if (value !== entry.rendered) el.setAttribute(name, entry.rendered);
        }
        attributes.set(el, saved);
    }
    function localize(root) {
        if (root.nodeType === 3) { localizeText(root); return; }
        if (root.nodeType !== 1 || root.closest('script, style, [data-language-switch]')) return;
        localizeElement(root);
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
            if (walker.currentNode.nodeType === 3) localizeText(walker.currentNode);
            else localizeElement(walker.currentNode);
        }
    }
    function apply(next, persist) {
        language = next;
        document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
        document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === next)));
        localize(document.body);
        if (persist) {
            try { localStorage.setItem('align-studio-language', next); } catch {}
            window.dispatchEvent(new Event('languagechange'));
        }
    }
    document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => apply(button.dataset.language, true)));
    apply(language, false);
    const observer = new MutationObserver(records => {
        const roots = new Set();
        for (const record of records) {
            if (record.type === 'childList') record.addedNodes.forEach(node => roots.add(node));
            else roots.add(record.target);
        }
        roots.forEach(localize);
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'placeholder', 'title'] });
}
