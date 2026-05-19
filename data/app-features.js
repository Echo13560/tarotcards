/**
 * App Features 增强模块
 * - 真实牌面 HTML 生成
 * - 成就/统计/打卡系统
 * - 新手引导
 * - 数据备份导入导出
 */

(function() {
    'use strict';

    // ===== 罗马数字（用于大牌） =====
    const ROMAN = ['0','Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ','Ⅺ','Ⅻ','ⅩⅢ','ⅩⅣ','ⅩⅤ','ⅩⅥ','ⅩⅦ','ⅩⅧ','ⅩⅨ','ⅩⅩ','ⅩⅪ'];

    // ===== 大牌图片文件名映射 =====
    const MAJOR_IMAGES = {
        'major-0': '00-fool',  'major-1': '01-magician',  'major-2': '02-priestess', 'major-3': '03-empress',
        'major-4': '04-emperor','major-5': '05-hierophant','major-6': '06-lovers',   'major-7': '07-chariot',
        'major-8': '08-strength','major-9': '09-hermit',  'major-10': '10-fortune',  'major-11': '11-justice',
        'major-12': '12-hanged','major-13': '13-death',    'major-14': '14-temperance','major-15': '15-devil',
        'major-16': '16-tower', 'major-17': '17-star',     'major-18': '18-moon',     'major-19': '19-sun',
        'major-20': '20-judgement','major-21': '21-world'
    };
    function getCardImage(card) {
        if (!card || !card.id) return null;
        if (card.arcana === 'major' && MAJOR_IMAGES[card.id]) {
            return `./cards/major/${MAJOR_IMAGES[card.id]}.jpg`;
        }
        // 小牌使用 suit-number 命名
        if (card.arcana === 'minor' && card.suit && card.number) {
            return `./cards/${card.suit}/${card.suit}-${card.number}.jpg`;
        }
        return null;
    }

    // ===== 小阿尔卡纳 SVG 风格化牌面（无图片时的精致兜底）=====
    // 韦特小牌的视觉特征是「按数字摆放对应数量的花色纹章」
    // 我们用 SVG 模拟这种古典版画风格
    const SUIT_GLYPH = {
        wands:     { symbol: '🔥', name: '权杖', color: '#c44516', accent: '#ff6b35', element: '火', icon: 'M12 2 C 13 5 14 8 14 11 L 14 22 L 10 22 L 10 11 C 10 8 11 5 12 2 Z' },
        cups:      { symbol: '🍷', name: '圣杯', color: '#2a6b9c', accent: '#5ab8ff', element: '水', icon: 'M6 4 L 18 4 L 17 12 C 17 15 14.5 17 12 17 C 9.5 17 7 15 7 12 L 6 4 Z M 11 17 L 11 21 L 8 21 L 8 22 L 16 22 L 16 21 L 13 21 L 13 17 Z' },
        swords:    { symbol: '⚔', name: '宝剑', color: '#7a8aa6', accent: '#c6c4df', element: '风', icon: 'M12 1 L 14 14 L 12 16 L 10 14 Z M 12 16 L 12 20 M 9 20 L 15 20 M 11 22 L 13 22' },
        pentacles: { symbol: '⭐', name: '星币', color: '#b8851f', accent: '#f2ca50', element: '土', icon: 'M12 2 A 10 10 0 1 0 12 22 A 10 10 0 1 0 12 2 M 12 6 L 13.4 10.2 L 17.8 10.2 L 14.2 12.8 L 15.6 17 L 12 14.4 L 8.4 17 L 9.8 12.8 L 6.2 10.2 L 10.6 10.2 Z' }
    };
    // 数字 1-10 的纹章布局坐标（百分比）
    const PIP_LAYOUTS = {
        1:  [[50,50]],
        2:  [[50,28],[50,72]],
        3:  [[50,22],[28,68],[72,68]],
        4:  [[28,28],[72,28],[28,72],[72,72]],
        5:  [[28,28],[72,28],[50,50],[28,72],[72,72]],
        6:  [[28,22],[72,22],[28,50],[72,50],[28,78],[72,78]],
        7:  [[28,20],[72,20],[50,38],[28,55],[72,55],[28,80],[72,80]],
        8:  [[28,18],[72,18],[28,42],[72,42],[28,62],[72,62],[28,82],[72,82]],
        9:  [[28,18],[72,18],[28,40],[72,40],[50,52],[28,64],[72,64],[28,82],[72,82]],
        10: [[28,15],[72,15],[28,32],[72,32],[50,42],[28,55],[72,55],[50,72],[28,82],[72,82]]
    };
    // 宫廷牌（11=侍从 12=骑士 13=皇后 14=国王）的人物剪影
    const COURT_FIGURES = {
        11: { label: 'PAGE',   icon: '👤', desc: '侍从' },
        12: { label: 'KNIGHT', icon: '🐎', desc: '骑士' },
        13: { label: 'QUEEN',  icon: '👑', desc: '皇后' },
        14: { label: 'KING',   icon: '⚜', desc: '国王' }
    };
    // 渲染小牌的 SVG（替代纯文字占位）
    function renderMinorSVG(card) {
        const suit = card.suit;
        const num = card.number;
        const g = SUIT_GLYPH[suit];
        if (!g) return '';
        // 宫廷牌：单一人物剪影
        if (num >= 11) {
            const court = COURT_FIGURES[num];
            return `
                <svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block;">
                    <defs>
                        <linearGradient id="bg-${suit}-${num}" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="${g.accent}" stop-opacity="0.18"/>
                            <stop offset="100%" stop-color="${g.color}" stop-opacity="0.08"/>
                        </linearGradient>
                        <radialGradient id="halo-${suit}-${num}" cx="50%" cy="40%">
                            <stop offset="0%" stop-color="${g.accent}" stop-opacity="0.5"/>
                            <stop offset="100%" stop-color="${g.accent}" stop-opacity="0"/>
                        </radialGradient>
                    </defs>
                    <rect x="0" y="0" width="100" height="140" fill="url(#bg-${suit}-${num})"/>
                    <circle cx="50" cy="55" r="34" fill="url(#halo-${suit}-${num})"/>
                    <text x="50" y="68" text-anchor="middle" font-size="44" fill="${g.color}" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));">${court.icon}</text>
                    <text x="50" y="100" text-anchor="middle" font-family="EB Garamond, serif" font-size="11" font-weight="700" fill="${g.color}" letter-spacing="2">${court.label}</text>
                    <text x="50" y="118" text-anchor="middle" font-size="13" fill="${g.color}" opacity="0.7">${g.symbol}</text>
                    <text x="50" y="132" text-anchor="middle" font-family="EB Garamond, serif" font-size="9" fill="${g.color}" opacity="0.65">of ${g.name}</text>
                </svg>
            `;
        }
        // 数字牌（1-10）：按数字摆放对应数量的花色符号
        const layout = PIP_LAYOUTS[num] || [];
        const pips = layout.map(([cx, cy]) =>
            `<text x="${cx}" y="${cy + 3}" text-anchor="middle" font-size="14" fill="${g.color}" style="filter:drop-shadow(0 1px 1px rgba(0,0,0,0.2));">${g.symbol}</text>`
        ).join('');
        const numLabel = num === 1 ? 'ACE' : (['','','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN'][num] || num);
        return `
            <svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block;">
                <defs>
                    <linearGradient id="bg-${suit}-${num}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${g.accent}" stop-opacity="0.18"/>
                        <stop offset="100%" stop-color="${g.color}" stop-opacity="0.08"/>
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="100" height="140" fill="url(#bg-${suit}-${num})"/>
                <text x="8" y="14" font-family="EB Garamond, serif" font-size="9" font-weight="700" fill="${g.color}" opacity="0.85">${numLabel}</text>
                <text x="92" y="134" text-anchor="end" font-family="EB Garamond, serif" font-size="9" font-weight="700" fill="${g.color}" opacity="0.85" transform="rotate(180 92 130)">${numLabel}</text>
                ${pips}
                <line x1="15" y1="118" x2="85" y2="118" stroke="${g.color}" stroke-width="0.4" opacity="0.4"/>
                <text x="50" y="129" text-anchor="middle" font-family="EB Garamond, serif" font-size="8" fill="${g.color}" opacity="0.7" letter-spacing="1.5">${g.name.toUpperCase()}</text>
            </svg>
        `;
    }

    // ===== 生成专业牌面 HTML =====
    function renderRealCard(card, options) {
        options = options || {};
        const showReversed = options.showReversed !== false;
        const reversed = card.reversed && showReversed;
        const isMajor = card.arcana === 'major';
        const suit = card.suit || '';
        const number = isMajor
            ? ROMAN[card.number] || ''
            : (card.number > 10 ? ({11:'P',12:'Kn',13:'Q',14:'K'}[card.number] || '') : card.number);

        const classes = ['real-card'];
        if (reversed) classes.push('reversed');
        if (isMajor) classes.push('major');
        if (suit) classes.push(suit);

        // 使用真实图片
        const imgUrl = getCardImage(card);
        if (imgUrl) {
            return `
                <div class="${classes.join(' ')} real-card-illustrated" style="background-image:url('${imgUrl}');">
                    <div class="real-card-overlay"></div>
                </div>
            `;
        }

        // 小阿尔卡纳无图片：渲染 SVG 风格化牌面（韦特古典版画风）
        if (!isMajor && card.suit && card.number) {
            classes.push('real-card-svg');
            return `
                <div class="${classes.join(' ')}">
                    ${renderMinorSVG(card)}
                </div>
            `;
        }

        // 兜底：纯 CSS 文字牌面
        return `
            <div class="${classes.join(' ')}">
                <div class="real-card-inner">
                    <span class="real-card-corner-tl">${number}</span>
                    <span class="real-card-corner-br">${number}</span>
                    <div class="real-card-number">${number}</div>
                    <div class="real-card-symbol">${card.symbol || '✦'}</div>
                    <div class="real-card-name">${card.name}</div>
                </div>
            </div>
        `;
    }
    function renderCardBack() {
        return `
            <div class="real-card-back">
                <span class="real-card-back-star">✦</span>
            </div>
        `;
    }

    // ===== 用户统计 / 打卡 =====
    function getStats() {
        const stats = JSON.parse(localStorage.getItem('tarot_stats') || '{}');
        return Object.assign({
            totalReadings: 0,
            streakDays: 0,
            lastReadingDate: '',
            spreadCounts: {},
            cardCounts: {},
            unlocked: []
        }, stats);
    }
    function saveStats(s) { localStorage.setItem('tarot_stats', JSON.stringify(s)); }

    function recordReading(record) {
        const s = getStats();
        s.totalReadings = (s.totalReadings || 0) + 1;
        const today = new Date().toLocaleDateString('zh-CN');
        // 连续天数
        if (s.lastReadingDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('zh-CN');
            if (s.lastReadingDate === yesterday) s.streakDays = (s.streakDays || 0) + 1;
            else s.streakDays = 1;
            s.lastReadingDate = today;
        }
        // 牌阵
        s.spreadCounts[record.spread] = (s.spreadCounts[record.spread] || 0) + 1;
        // 卡牌
        (record.cards || []).forEach(c => {
            const name = typeof c === 'string' ? c : c.name;
            s.cardCounts[name] = (s.cardCounts[name] || 0) + 1;
        });

        // 触发成就
        const newAchievements = checkAchievements(s, record);
        saveStats(s);
        return newAchievements;
    }

    // ===== 成就系统 =====
    const ACHIEVEMENTS = [
        { id: 'first_reading', emoji: '🌱', name: '初次相遇', desc: '完成第一次占卜',
          check: (s) => s.totalReadings >= 1 },
        { id: 'streak_3',      emoji: '🔥', name: '三日连缘', desc: '连续3天占卜',
          check: (s) => s.streakDays >= 3 },
        { id: 'streak_7',      emoji: '⭐', name: '七日星辰', desc: '连续7天占卜',
          check: (s) => s.streakDays >= 7 },
        { id: 'streak_30',     emoji: '🌟', name: '月圆之约', desc: '连续30天占卜',
          check: (s) => s.streakDays >= 30 },
        { id: 'reading_10',    emoji: '🔮', name: '塔罗新手', desc: '累计10次占卜',
          check: (s) => s.totalReadings >= 10 },
        { id: 'reading_50',    emoji: '🃏', name: '塔罗达人', desc: '累计50次占卜',
          check: (s) => s.totalReadings >= 50 },
        { id: 'reading_100',   emoji: '👑', name: '塔罗大师', desc: '累计100次占卜',
          check: (s) => s.totalReadings >= 100 },
        { id: 'celtic_first',  emoji: '🔯', name: '凯尔特达人', desc: '完成1次凯尔特十字',
          check: (s) => (s.spreadCounts.celtic || 0) >= 1 },
        { id: 'all_spreads',   emoji: '🎴', name: '牌阵收藏家', desc: '体验所有6种牌阵',
          check: (s) => Object.keys(s.spreadCounts || {}).length >= 6 },
        { id: 'major_drawn',   emoji: '✨', name: '命运邂逅', desc: '抽到第一张大阿尔卡纳',
          check: (s, r) => r && (r.cards || []).some(c => {
              const name = typeof c === 'string' ? c : c.name;
              const card = window.TAROT_CARDS ? window.TAROT_CARDS.find(x => x.name === name) : null;
              return card && card.arcana === 'major';
          })
        },
        { id: 'journal_first', emoji: '📖', name: '心灵笔记', desc: '写下第一篇日记',
          check: () => {
              const j = JSON.parse(localStorage.getItem('tarot_journals') || '[]');
              return j.length >= 1;
          }
        },
        { id: 'all_topics',    emoji: '🌈', name: '人生百态', desc: '在5个主题各占卜1次',
          check: () => {
              const h = JSON.parse(localStorage.getItem('tarot_history') || '[]');
              const topics = new Set(h.map(x => x.topic).filter(Boolean));
              return topics.size >= 5;
          }
        }
    ];

    function checkAchievements(s, record) {
        const newly = [];
        s.unlocked = s.unlocked || [];
        for (const ach of ACHIEVEMENTS) {
            if (s.unlocked.includes(ach.id)) continue;
            try {
                if (ach.check(s, record)) {
                    s.unlocked.push(ach.id);
                    newly.push(ach);
                }
            } catch (e) {}
        }
        return newly;
    }

    function getAllAchievements() {
        const s = getStats();
        return ACHIEVEMENTS.map(a => Object.assign({}, a, { unlocked: (s.unlocked || []).includes(a.id) }));
    }

    // ===== 占卜禁忌检查 =====
    function checkRepeatedQuestion(question) {
        if (!question || !question.trim()) return null;
        const history = JSON.parse(localStorage.getItem('tarot_history') || '[]');
        const now = Date.now();
        const trimmed = question.trim();
        for (const h of history) {
            const sim = similarity(h.question || '', trimmed);
            if (sim > 0.7 && (now - h.id) < 24 * 3600 * 1000) {
                return { date: h.date, question: h.question };
            }
        }
        return null;
    }
    function similarity(a, b) {
        if (!a || !b) return 0;
        const sa = new Set(a.split(''));
        const sb = new Set(b.split(''));
        const inter = [...sa].filter(c => sb.has(c)).length;
        const union = new Set([...sa, ...sb]).size;
        return union ? inter / union : 0;
    }

    // ===== 周报数据 =====
    function getWeeklyReport() {
        const history = JSON.parse(localStorage.getItem('tarot_history') || '[]');
        const now = Date.now();
        const weekAgo = now - 7 * 24 * 3600 * 1000;
        const recent = history.filter(h => h.id >= weekAgo);

        // 主题统计
        const topics = {};
        const cards = {};
        const elements = { '火': 0, '水': 0, '风': 0, '土': 0 };
        recent.forEach(h => {
            topics[h.topic] = (topics[h.topic] || 0) + 1;
            (h.cards || []).forEach(c => {
                const name = typeof c === 'string' ? c : c.name;
                cards[name] = (cards[name] || 0) + 1;
                const cardData = window.TAROT_CARDS ? window.TAROT_CARDS.find(x => x.name === name) : null;
                if (cardData && cardData.element && elements[cardData.element] !== undefined) {
                    elements[cardData.element]++;
                }
            });
        });

        const topCards = Object.entries(cards).sort((a,b) => b[1]-a[1]).slice(0, 3);
        const topTopic = Object.entries(topics).sort((a,b) => b[1]-a[1])[0];
        const topElement = Object.entries(elements).sort((a,b) => b[1]-a[1])[0];

        return { count: recent.length, topCards, topTopic, topElement, elements, topics };
    }

    // ===== 关键词云聚合（潜意识模式洞察）=====
    // 从历史记录中聚合最常出现的牌关键词，揭示用户最近的内心主题
    function getKeywordCloud(days) {
        days = days || 30;
        const history = JSON.parse(localStorage.getItem('tarot_history') || '[]');
        const cutoff = Date.now() - days * 24 * 3600 * 1000;
        const recent = history.filter(h => h.id >= cutoff);
        if (!recent.length || !window.TAROT_CARDS) return { total: 0, words: [], cardCount: 0 };

        const cardMap = {};
        window.TAROT_CARDS.forEach(c => { cardMap[c.name] = c; });

        const wordFreq = {};
        let cardCount = 0;
        recent.forEach(h => {
            (h.cards || []).forEach(c => {
                const name = typeof c === 'string' ? c : c.name;
                const data = cardMap[name];
                if (!data || !Array.isArray(data.keywords)) return;
                cardCount++;
                data.keywords.forEach(kw => {
                    if (!kw) return;
                    wordFreq[kw] = (wordFreq[kw] || 0) + 1;
                });
            });
        });

        // 排序并取 top 20
        const words = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([word, count]) => ({ word, count }));

        return { total: recent.length, words, cardCount };
    }

    // ===== 数据导入导出 =====
    function exportAllData() {
        const data = {
            version: '1.2',
            exportedAt: new Date().toISOString(),
            profile: JSON.parse(localStorage.getItem('tarot_profile') || '{}'),
            history: JSON.parse(localStorage.getItem('tarot_history') || '[]'),
            journals: JSON.parse(localStorage.getItem('tarot_journals') || '[]'),
            stats: JSON.parse(localStorage.getItem('tarot_stats') || '{}'),
            dailyCard: JSON.parse(localStorage.getItem('tarot_daily_card') || '{}')
        };
        return JSON.stringify(data, null, 2);
    }
    function importAllData(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            if (data.profile) localStorage.setItem('tarot_profile', JSON.stringify(data.profile));
            if (data.history) localStorage.setItem('tarot_history', JSON.stringify(data.history));
            if (data.journals) localStorage.setItem('tarot_journals', JSON.stringify(data.journals));
            if (data.stats) localStorage.setItem('tarot_stats', JSON.stringify(data.stats));
            if (data.dailyCard) localStorage.setItem('tarot_daily_card', JSON.stringify(data.dailyCard));
            return true;
        } catch (e) {
            console.error('导入失败', e);
            return false;
        }
    }
    function clearAllData() {
        ['tarot_profile','tarot_history','tarot_journals','tarot_stats','tarot_daily_card','tarot_onboarded']
            .forEach(k => localStorage.removeItem(k));
    }

    // ===== 震动反馈 =====
    function vibrate(pattern) {
        if (navigator.vibrate) {
            try { navigator.vibrate(pattern); } catch (e) {}
        }
    }

    // ===== 暴露 =====
    window.AppFeatures = {
        renderRealCard,
        renderCardBack,
        getCardImage,
        getStats,
        recordReading,
        ACHIEVEMENTS,
        getAllAchievements,
        checkRepeatedQuestion,
        getWeeklyReport,
        getKeywordCloud,
        exportAllData,
        importAllData,
        clearAllData,
        vibrate
    };

    console.log('✓ AppFeatures 已就绪');
})();
