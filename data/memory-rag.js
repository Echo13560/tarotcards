/* 星辰塔罗 - 长期记忆 (RAG) 模块 v1.0
 *
 * 让 AI 在每次解读/追问时"记得"用户过去的占卜：
 *   1. 占卜结束 → ingest()：把"问题 + 牌面 + AI 解读全文 + 应验情况"写入 IndexedDB
 *   2. 新一次解读前 → recall(query, k)：基于本地向量相似度找回 top-k 过往记录
 *   3. 召回结果以"用户长期画像 + 相关历史摘要"形式注入 system prompt
 *
 * 关键设计：
 *   - 完全离线：本地 hash 向量化 (64 维)，不调用任何 embedding API，省钱省隐私
 *   - 中文友好：同时使用「关键词词典 + 字 bi-gram」做特征
 *   - 渐进降级：IndexedDB 不可用 → 自动 fallback 到 localStorage
 *
 * 公开 API：window.TarotMemory
 *   await Memory.init()
 *   await Memory.ingest(record, aiText)         // record = state.history 的一条
 *   await Memory.recall(text, opts)             // opts: { k, topic, exclude:[id], maxAgeDays }
 *   await Memory.summary()                      // 长期画像
 *   await Memory.clear()
 *   Memory.buildContextSnippet(record, summary) // 把召回结果组装成 prompt 注入文本
 */
(function () {
    'use strict';

    const DB_NAME = 'tarot_memory_v1';
    const DB_VERSION = 1;
    const STORE = 'readings';
    const FALLBACK_KEY = 'tarot_memory_fallback_v1';
    const VEC_DIM = 64;

    // ============== 中文文本特征提取 ==============
    // 关键词词典（手工挑选 — 塔罗占卜域常见情绪/主题词）
    const KEYWORDS_LEX = [
        // 情绪
        '焦虑','迷茫','恐惧','期待','喜悦','悲伤','愤怒','疲惫','希望','绝望','孤独',
        '安心','释怀','纠结','怀疑','信任','嫉妒','失落','释然','感激',
        // 关系
        '复合','分手','暧昧','表白','结婚','离婚','吵架','冷战','异地','背叛','三角',
        '初恋','前任','伴侣','喜欢','爱','放下','拉黑','纠缠','误会',
        // 事业
        '跳槽','升职','创业','面试','离职','加薪','失业','合伙','项目','汇报',
        '老板','同事','机会','瓶颈','转型',
        // 财运
        '投资','股票','房子','买房','存款','负债','花钱','省钱','偏财','本职',
        // 心灵
        '成长','疗愈','自我','原生家庭','放下','接纳','突破','觉醒','边界','内耗',
        // 行动
        '继续','放弃','离开','坚持','等待','开始','结束','改变','回头','前进',
        // 时间
        '今年','今天','下个月','最近','以后','将来','过去','现在'
    ];
    const KW_INDEX = (() => { const m = {}; KEYWORDS_LEX.forEach((w, i) => m[w] = i); return m; })();

    // 64 维 hash 向量化
    // 把文本切成 (a) 命中的关键词词典 (b) 中文 bi-gram 字对  (c) 牌名 token
    // 对每个特征计算 hash %  64，累加权重，最后 L2 归一化
    function tokenize(text) {
        const toks = [];
        if (!text) return toks;
        // 关键词
        for (const kw in KW_INDEX) {
            if (text.indexOf(kw) >= 0) toks.push({ t: '#kw:' + kw, w: 2.0 });
        }
        // 中文 bi-gram（去除非中文字符前的纯字符序列）
        const cleaned = String(text).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
        for (let i = 0; i < cleaned.length - 1; i++) {
            const bg = cleaned.substr(i, 2);
            if (/[\u4e00-\u9fa5]/.test(bg)) toks.push({ t: '#bg:' + bg, w: 1.0 });
        }
        return toks;
    }
    // 简单字符串 hash → uint32
    function hash32(str) {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }
        return h;
    }
    function embed(text) {
        const v = new Float32Array(VEC_DIM);
        const toks = tokenize(text);
        toks.forEach(({ t, w }) => {
            const h = hash32(t);
            const idx = h % VEC_DIM;
            // 用 hash 第二字节决定符号，让特征有正有负
            const sign = ((h >> 16) & 1) ? 1 : -1;
            v[idx] += sign * w;
        });
        // L2 归一化
        let s = 0; for (let i = 0; i < VEC_DIM; i++) s += v[i] * v[i];
        const n = Math.sqrt(s) || 1;
        for (let i = 0; i < VEC_DIM; i++) v[i] /= n;
        return Array.from(v);
    }
    function cosine(a, b) {
        if (!a || !b || a.length !== b.length) return 0;
        let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i];
        return s; // 已归一化，点积即余弦
    }

    // ============== 把 record + AI 文本压缩成可索引的"记忆条目" ==============
    function buildMemoryDoc(record, aiText) {
        const cards = (record.cards || []).map(c => `${c.name}${c.reversed ? '逆' : ''}`);
        const fulfillment = (record._fulfillment && record._fulfillment.status) || 'pending';
        // 用于向量化的文本：问题 + 牌名 + AI 解读浓缩
        const indexText = [
            record.question || '',
            record.topicLabel || record.topic || '',
            cards.join(' '),
            (record.summary || '').slice(0, 200),
            (record.advice || '').slice(0, 200),
            (aiText || '').slice(0, 800)
        ].join(' ');

        return {
            id: record.id,
            t: record.id, // 时间戳（id 即时间）
            date: record.date,
            topic: record.topic || 'spiritual',
            topicLabel: record.topicLabel || '心灵',
            question: record.question || '',
            spread: record.spread,
            cards: cards,           // 简化字符串数组
            cardsRaw: record.cards, // 原结构（含 element / suit）
            summary: (record.summary || '').slice(0, 400),
            advice: (record.advice || '').slice(0, 400),
            aiText: (aiText || '').slice(0, 1500),
            fulfillment,
            vec: embed(indexText)
        };
    }

    // ============== IndexedDB 包装（带 fallback） ==============
    let dbPromise = null;
    function openDB() {
        if (dbPromise) return dbPromise;
        if (!('indexedDB' in window)) {
            dbPromise = Promise.resolve(null);
            return dbPromise;
        }
        dbPromise = new Promise((resolve) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    const os = db.createObjectStore(STORE, { keyPath: 'id' });
                    os.createIndex('topic', 'topic', { unique: false });
                    os.createIndex('t', 't', { unique: false });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => { console.warn('Memory: IndexedDB 打开失败，使用 localStorage 回退'); resolve(null); };
        });
        return dbPromise;
    }
    async function dbPut(doc) {
        const db = await openDB();
        if (!db) return fallbackPut(doc);
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, 'readwrite');
            tx.objectStore(STORE).put(doc);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    }
    async function dbAll() {
        const db = await openDB();
        if (!db) return fallbackAll();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE, 'readonly');
            const req = tx.objectStore(STORE).getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([]);
        });
    }
    async function dbClear() {
        const db = await openDB();
        if (!db) { try { localStorage.removeItem(FALLBACK_KEY); } catch(_){} return; }
        return new Promise((resolve) => {
            const tx = db.transaction(STORE, 'readwrite');
            tx.objectStore(STORE).clear();
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        });
    }
    // localStorage fallback（最多 50 条）
    function fallbackPut(doc) {
        try {
            const arr = JSON.parse(localStorage.getItem(FALLBACK_KEY) || '[]');
            const idx = arr.findIndex(x => x.id === doc.id);
            if (idx >= 0) arr[idx] = doc; else arr.unshift(doc);
            if (arr.length > 50) arr.length = 50;
            localStorage.setItem(FALLBACK_KEY, JSON.stringify(arr));
        } catch (_) {}
        return true;
    }
    function fallbackAll() {
        try { return JSON.parse(localStorage.getItem(FALLBACK_KEY) || '[]'); }
        catch (_) { return []; }
    }

    // ============== 公开方法 ==============
    async function init() {
        await openDB();
        // 首次 init 时，自动把现有 tarot_history 中尚未索引的记录补一遍（无 aiText）
        try {
            const hist = JSON.parse(localStorage.getItem('tarot_history') || '[]');
            const existing = await dbAll();
            const have = new Set(existing.map(x => x.id));
            const toAdd = hist.filter(r => !have.has(r.id));
            if (toAdd.length) {
                for (const r of toAdd.slice(0, 30)) { // 上限 30 防卡顿
                    const aiText = (r.followups && r.followups.length)
                        ? r.followups.map(f => f.answer).join('\n')
                        : '';
                    await dbPut(buildMemoryDoc(r, aiText));
                }
                console.log(`✓ Memory: 已补建 ${toAdd.length} 条历史记忆索引`);
            }
        } catch (e) { console.warn('Memory init backfill failed:', e); }
    }

    async function ingest(record, aiText) {
        if (!record || !record.id) return;
        const doc = buildMemoryDoc(record, aiText);
        await dbPut(doc);
    }

    // 召回 top-k 相关记忆
    // text: 用户当前的问题或追问
    // opts: { k=3, topic, exclude=[], maxAgeDays, minSim=0.18 }
    async function recall(text, opts) {
        opts = opts || {};
        const k = opts.k || 3;
        const all = await dbAll();
        if (!all.length) return [];
        const qVec = embed(text || '');
        const exclude = new Set(opts.exclude || []);
        const cutoff = opts.maxAgeDays
            ? Date.now() - opts.maxAgeDays * 86400000
            : 0;

        const scored = [];
        for (const doc of all) {
            if (exclude.has(doc.id)) continue;
            if (cutoff && doc.t < cutoff) continue;
            if (opts.topic && doc.topic !== opts.topic) continue;
            const sim = cosine(qVec, doc.vec);
            if (sim < (opts.minSim != null ? opts.minSim : 0.15)) continue;
            scored.push({ doc, sim });
        }
        scored.sort((a, b) => b.sim - a.sim);
        return scored.slice(0, k).map(x => ({
            id: x.doc.id,
            sim: +x.sim.toFixed(3),
            date: x.doc.date,
            topic: x.doc.topicLabel || x.doc.topic,
            question: x.doc.question,
            cards: x.doc.cards,
            summary: x.doc.summary,
            advice: x.doc.advice,
            fulfillment: x.doc.fulfillment,
            t: x.doc.t
        }));
    }

    // 长期画像
    async function summary() {
        const all = await dbAll();
        const total = all.length;
        if (!total) return { total: 0 };
        // Top 牌（含正逆位计数）
        const cardCount = {};
        const elementCount = { 火: 0, 水: 0, 风: 0, 土: 0 };
        const topicCount = {};
        const reversedRate = { r: 0, total: 0 };
        const kwCount = {};
        let firstT = Infinity, lastT = 0;

        for (const d of all) {
            firstT = Math.min(firstT, d.t);
            lastT  = Math.max(lastT, d.t);
            (d.cardsRaw || []).forEach(c => {
                if (!c || !c.name) return;
                const key = c.name + (c.reversed ? '·逆' : '·正');
                cardCount[key] = (cardCount[key] || 0) + 1;
                if (c.element && elementCount[c.element] != null) elementCount[c.element]++;
                reversedRate.total++;
                if (c.reversed) reversedRate.r++;
            });
            topicCount[d.topicLabel || d.topic] = (topicCount[d.topicLabel || d.topic] || 0) + 1;
            // 关键词
            const txt = `${d.question} ${d.summary} ${d.advice}`;
            for (const kw in KW_INDEX) {
                if (txt.indexOf(kw) >= 0) kwCount[kw] = (kwCount[kw] || 0) + 1;
            }
        }
        const topCards = Object.entries(cardCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topTopics = Object.entries(topicCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const topKws = Object.entries(kwCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
        const dominantEl = Object.entries(elementCount).sort((a, b) => b[1] - a[1])[0];

        return {
            total,
            firstAt: firstT,
            lastAt: lastT,
            spanDays: Math.max(1, Math.round((lastT - firstT) / 86400000)),
            topCards: topCards.map(([k, v]) => ({ name: k, count: v })),
            topTopics: topTopics.map(([k, v]) => ({ name: k, count: v })),
            topKeywords: topKws.map(([k, v]) => ({ word: k, count: v })),
            dominantElement: dominantEl && dominantEl[1] > 0 ? dominantEl[0] : null,
            elementDistribution: elementCount,
            reversedRate: reversedRate.total ? +(reversedRate.r / reversedRate.total).toFixed(2) : 0
        };
    }

    async function clear() {
        await dbClear();
    }

    // 把召回结果 + 画像组装成可注入 prompt 的中文文本
    // recalls: recall() 的返回数组
    // sumry:   summary() 的返回对象
    function buildContextSnippet(recalls, sumry) {
        const lines = [];
        if (sumry && sumry.total >= 3) {
            const days = sumry.spanDays;
            const topT = (sumry.topTopics || []).map(x => `${x.name}×${x.count}`).join('、');
            const topC = (sumry.topCards || []).slice(0, 3).map(x => x.name).join('、');
            const topK = (sumry.topKeywords || []).slice(0, 4).map(x => x.word).join('、');
            const segs = [`共 ${sumry.total} 次占卜，跨度 ${days} 天`];
            if (topT) segs.push(`常关注：${topT}`);
            if (topC) segs.push(`反复出现的牌：${topC}`);
            if (topK) segs.push(`高频议题词：${topK}`);
            if (sumry.dominantElement) segs.push(`主导元素：${sumry.dominantElement}`);
            if (sumry.reversedRate >= 0.45) segs.push(`逆位率较高（${Math.round(sumry.reversedRate*100)}%），近期能量偏阻滞`);
            lines.push(`【用户长期画像】${segs.join('；')}`);
        }
        if (recalls && recalls.length) {
            lines.push(`【相关过往占卜（按相似度）】`);
            recalls.forEach((r, i) => {
                const ago = humanAgo(r.t);
                const ff = r.fulfillment && r.fulfillment !== 'pending'
                    ? `｜应验:${FULFILL_LABEL[r.fulfillment] || r.fulfillment}` : '';
                const cards = (r.cards || []).slice(0, 4).join('·');
                const q = (r.question || '').slice(0, 30) || '（无明确问题）';
                lines.push(`${i + 1}. ${ago}｜${r.topic}｜问：${q}｜牌：${cards}${ff}`);
                if (r.summary) lines.push(`   摘要：${r.summary.slice(0, 80)}`);
            });
        }
        if (!lines.length) return '';
        // 给模型的指令
        lines.push('');
        lines.push('请在解读时**自然地**呼应过往（例如"上次你抽到 xx，现在又出现了 yy"），让用户感到被记得；不要列举原文，不要说"根据数据"。');
        return lines.join('\n');
    }

    const FULFILL_LABEL = {
        spot_on: '完全应验', partial: '部分应验',
        missed: '未应验', inverse: '反方向'
    };
    function humanAgo(ts) {
        if (!ts) return '';
        const d = Math.round((Date.now() - ts) / 86400000);
        if (d <= 0) return '今天';
        if (d === 1) return '昨天';
        if (d < 7)  return d + ' 天前';
        if (d < 30) return Math.round(d / 7) + ' 周前';
        if (d < 365) return Math.round(d / 30) + ' 个月前';
        return Math.round(d / 365) + ' 年前';
    }

    // 暴露
    window.TarotMemory = {
        init, ingest, recall, summary, clear,
        buildContextSnippet,
        // 调试用
        _embed: embed,
        _all: dbAll
    };

    // 自动 init（不阻塞）
    init().then(() => console.log('✓ Tarot Memory (RAG) 模块已就绪'));
})();
