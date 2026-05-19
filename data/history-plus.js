/* 星辰塔罗 - 历史档案增强模块 v1.0
 *
 * 在原 tarot_history 基础上叠加：
 *  - 收藏 (favoriteIds)
 *  - 应验追踪：fulfillment = 'pending'|'spot_on'|'partial'|'missed'|'inverse' + 心得
 *  - N 天后回访横幅候选记录
 *  - 搜索 / 主题过滤
 *
 * 公开 API：window.TarotHistoryPlus
 *   list({ q, topic, favorite, fulfillment }) -> [...record]
 *   toggleFavorite(id)
 *   isFavorite(id)
 *   setFulfillment(id, status, note)
 *   getFulfillment(id) -> { status, note }
 *   getRevisitCandidate() -> 一条还没标记应验、且发生过 7~30 天的记录（用于首页回访横幅）
 *   dismissRevisit(id)
 *   stats() -> { total, favorites, spotOn, partial, missed, accuracy }
 *
 * 数据：
 *   localStorage.tarot_history_plus_v1 = {
 *     favoriteIds: [id...],
 *     fulfillment: { [id]: { status, note, updatedAt } },
 *     dismissedRevisits: [id...]
 *   }
 *   原历史仍在 tarot_history 中。
 */
(function () {
    'use strict';

    const KEY = 'tarot_history_plus_v1';

    function defaultMeta() {
        return { favoriteIds: [], fulfillment: {}, dismissedRevisits: [] };
    }
    function loadMeta() {
        try {
            return Object.assign(defaultMeta(), JSON.parse(localStorage.getItem(KEY)) || {});
        } catch (e) { return defaultMeta(); }
    }
    function saveMeta(m) { localStorage.setItem(KEY, JSON.stringify(m)); }

    function loadHistory() {
        try { return JSON.parse(localStorage.getItem('tarot_history')) || []; }
        catch (e) { return []; }
    }

    function attachMeta(records, meta) {
        return records.map(r => Object.assign({}, r, {
            _favorite: meta.favoriteIds.includes(r.id),
            _fulfillment: meta.fulfillment[r.id] || { status: 'pending', note: '' }
        }));
    }

    function list(filter) {
        filter = filter || {};
        const meta = loadMeta();
        let arr = attachMeta(loadHistory(), meta);
        if (filter.q) {
            const q = filter.q.trim().toLowerCase();
            arr = arr.filter(r => {
                return (r.question || '').toLowerCase().includes(q)
                    || (r.summary || '').toLowerCase().includes(q)
                    || (r.advice || '').toLowerCase().includes(q)
                    || (r.cards || []).some(c => (c.name || '').toLowerCase().includes(q));
            });
        }
        if (filter.topic) arr = arr.filter(r => r.topic === filter.topic);
        if (filter.favorite) arr = arr.filter(r => r._favorite);
        if (filter.fulfillment) arr = arr.filter(r => r._fulfillment.status === filter.fulfillment);
        return arr;
    }

    function findById(id) {
        const records = loadHistory();
        return records.find(r => r.id === id);
    }

    function isFavorite(id) {
        return loadMeta().favoriteIds.includes(id);
    }
    function toggleFavorite(id) {
        const m = loadMeta();
        const i = m.favoriteIds.indexOf(id);
        if (i >= 0) m.favoriteIds.splice(i, 1);
        else m.favoriteIds.unshift(id);
        saveMeta(m);
        return i < 0;
    }

    function setFulfillment(id, status, note) {
        const m = loadMeta();
        m.fulfillment[id] = {
            status: status || 'pending',
            note: note || '',
            updatedAt: Date.now()
        };
        saveMeta(m);
    }
    function getFulfillment(id) {
        const m = loadMeta();
        return m.fulfillment[id] || { status: 'pending', note: '' };
    }

    // N 天后回访
    function getRevisitCandidate() {
        const m = loadMeta();
        const records = loadHistory();
        const now = Date.now();
        const MIN = 7 * 86400000, MAX = 30 * 86400000;
        // 找一条：发生在 7~30 天之间、未应验标注、未 dismiss
        for (const r of records) {
            if (!r.id) continue;
            const ts = parseInt(r.id, 10);
            if (isNaN(ts)) continue;
            const age = now - ts;
            if (age < MIN || age > MAX) continue;
            const f = m.fulfillment[r.id];
            if (f && f.status && f.status !== 'pending') continue;
            if (m.dismissedRevisits.includes(r.id)) continue;
            return r;
        }
        return null;
    }
    function dismissRevisit(id) {
        const m = loadMeta();
        if (!m.dismissedRevisits.includes(id)) {
            m.dismissedRevisits.unshift(id);
            if (m.dismissedRevisits.length > 100) m.dismissedRevisits.length = 100;
            saveMeta(m);
        }
    }

    function stats() {
        const m = loadMeta();
        const records = loadHistory();
        let spotOn = 0, partial = 0, missed = 0, inverse = 0, pending = 0;
        for (const id in m.fulfillment) {
            const s = m.fulfillment[id].status;
            if (s === 'spot_on') spotOn++;
            else if (s === 'partial') partial++;
            else if (s === 'missed') missed++;
            else if (s === 'inverse') inverse++;
        }
        pending = records.length - spotOn - partial - missed - inverse;
        const judged = spotOn + partial + missed + inverse;
        // 准确度 = (满分 + 半分) / 已判断
        const accuracy = judged > 0 ? Math.round((spotOn + partial * 0.5) / judged * 100) : null;
        return {
            total: records.length,
            favorites: m.favoriteIds.length,
            spotOn, partial, missed, inverse, pending,
            accuracy
        };
    }

    const STATUS_LABEL = {
        pending:  { label: '待应验', emoji: '⏳', color: 'rgba(229,226,225,0.55)' },
        spot_on:  { label: '完全应验', emoji: '🎯', color: '#f2ca50' },
        partial:  { label: '部分应验', emoji: '🌗', color: '#d09eff' },
        inverse:  { label: '反方向', emoji: '🔄', color: '#7ec8e3' },
        missed:   { label: '未应验', emoji: '🌫', color: 'rgba(229,226,225,0.4)' }
    };

    window.TarotHistoryPlus = {
        list,
        findById,
        isFavorite, toggleFavorite,
        setFulfillment, getFulfillment,
        getRevisitCandidate, dismissRevisit,
        stats,
        STATUS_LABEL
    };
    console.log('✓ Tarot HistoryPlus 模块已就绪');
})();
