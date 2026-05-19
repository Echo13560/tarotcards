/* 星辰塔罗 - 每日塔罗系统 v1.0
 *
 * 核心：
 *  1. 每天首次进入 App 自动抽一张「今日之牌」并持久化（24h 内不会变）
 *  2. 浏览器通知 / PWA 推送：早 8 点提醒「今日之牌已就位」
 *  3. 错过当天 → 宠物心情 -1（生效在 pet-system 的 decayMood 已经实现）
 *  4. 提供短运势文案（依据正逆位 + 主题随机）
 *
 * 数据存储：localStorage.tarot_daily_v1
 *  {
 *    date: 'YYYY-MM-DD',
 *    cardId, reversed, fortune, advice,
 *    revealed: bool,    // 是否已被用户翻开查看
 *    streak: number,    // 连续抽牌天数
 *  }
 *
 * 公开 API：window.TarotDaily
 *   getToday()              -> 返回今日卡（若没有则生成）
 *   reveal()                -> 标记已翻开
 *   getStreak()             -> 连续抽牌天数
 *   requestPermission()     -> 申请通知权限
 *   scheduleDailyReminder() -> 注册定时提醒（页面打开时调度）
 *   notifyNow(opts)         -> 立即发送通知
 *   getDays()               -> 总抽牌天数
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'tarot_daily_v1';
    const HISTORY_KEY = 'tarot_daily_history_v1';  // 抽过的卡日期记录，用于 streak 与回顾
    const SETTINGS_KEY = 'tarot_daily_settings_v1';
    const NOTIFY_TIME_DEFAULT = '08:00';

    function todayStr() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    function yesterdayStr() {
        const d = new Date(); d.setDate(d.getDate() - 1);
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function loadCard() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) { return null; }
    }
    function saveCard(c) { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }

    function loadHistory() {
        try {
            return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
        } catch (e) { return []; }
    }
    function saveHistory(arr) {
        if (arr.length > 365) arr = arr.slice(0, 365);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
    }

    function loadSettings() {
        try {
            return Object.assign(
                { enableNotify: false, notifyTime: NOTIFY_TIME_DEFAULT, lastNotifyDate: '' },
                JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}
            );
        } catch (e) { return { enableNotify: false, notifyTime: NOTIFY_TIME_DEFAULT, lastNotifyDate: '' }; }
    }
    function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }

    // ===== 随机抽一张（依日期种子，所以同一天会得到同一张）=====
    function dailyHash(str) {
        let h = 5381;
        for (let i = 0; i < str.length; i++) { h = ((h << 5) + h) + str.charCodeAt(i); h |= 0; }
        return Math.abs(h);
    }

    function pickCardForDate(dateKey, userSalt) {
        if (!window.TAROT_CARDS || !window.TAROT_CARDS.length) return null;
        const seed = dailyHash(dateKey + '|' + (userSalt || ''));
        const idx = seed % window.TAROT_CARDS.length;
        const reversed = (seed >> 8) % 4 === 0; // 25% 概率逆位
        return { card: window.TAROT_CARDS[idx], reversed };
    }

    // ===== 简短运势文案 =====
    const SHORT_TEMPLATES_UP = [
        '今天，{kw1}是关键词。{advice}',
        '宇宙暗示：{kw1}。请把焦点放在{kw2}上。',
        '一张{name}牌，提醒你：{advice}',
        '{kw1}的能量正在升起，是时候{action}。'
    ];
    const SHORT_TEMPLATES_REV = [
        '逆位的{name}提醒：留意{kw1}带来的阴影。',
        '今日宜慢不宜快——{kw1}可能正在反噬。',
        '{name}逆位，意味着{kw1}需要被重新审视。',
        '别急着推进，先回看{kw2}的部分。'
    ];
    const ACTIONS = ['迈出第一步', '深呼吸三次再行动', '主动表达需求', '允许自己慢一点', '为内心留出空间', '记下闪过脑海的念头'];

    function pick(arr, seed) { return arr[seed % arr.length]; }

    function buildFortune(c, reversed, dateKey) {
        const seed = dailyHash(dateKey + ':' + c.id + (reversed ? 'r' : 'u'));
        const tpls = reversed ? SHORT_TEMPLATES_REV : SHORT_TEMPLATES_UP;
        const kws = c.keywords || [];
        const kw1 = kws[seed % Math.max(1, kws.length)] || '内在';
        const kw2 = kws[(seed >> 3) % Math.max(1, kws.length)] || '直觉';
        const action = pick(ACTIONS, seed >> 5);
        const meaning = reversed ? c.reversed : c.upright;
        // 取 meaning 的前一句
        const firstSent = (meaning || '').split(/[。!.!]/)[0];
        let line = pick(tpls, seed);
        line = line
            .replace('{kw1}', kw1)
            .replace('{kw2}', kw2)
            .replace('{name}', c.name)
            .replace('{action}', action)
            .replace('{advice}', firstSent || '相信此刻的安排');
        return { fortune: line, kw1, kw2 };
    }

    // ===== 今日宜忌（基于牌面 + 元素 + 正逆位 + 星座/流年牌微调）=====
    // 输出：{ dos: ['宜A', '宜B', '宜C'], donts: ['忌A', '忌B'] }
    const DO_POOL = {
        '火': ['主动出击','开启新计划','锻炼身体','表达真实想法','尝试一件想做很久的事','发起一次邀约','大胆开口要资源'],
        '水': ['倾听内心','写日记','给重要的人发条消息','听一首治愈的歌','泡一个长澡','陪伴自己','允许情绪流动'],
        '风': ['整理思路','列清单','认真读 10 页书','和老朋友聊聊','复盘最近的决策','学一个新概念','清理收件箱'],
        '土': ['整理房间','理财记账','规划下周的事','认真吃一顿饭','和家人说说话','早睡 1 小时','把待办按优先级排序']
    };
    const DONT_POOL = {
        '火': ['冲动消费','和人正面冲突','立刻回复让你生气的消息','喝太多咖啡'],
        '水': ['压抑情绪','刷别人的朋友圈','深夜下决定','看让人精神内耗的内容'],
        '风': ['过度思考','把猜测当事实','签长期合同','在群聊里发牢骚'],
        '土': ['熬夜','点外卖凑合','拖延一件简单事','把生活塞太满']
    };
    const DO_REVERSED = ['先停 24 小时再行动','找一个信任的人聊聊','回到一件早已搁置的小事','给自己留半天空白','重读一遍合同 / 协议'];
    const DONT_REVERSED = ['强行推进','把"应该"放在"想要"前面','和过去的自己比较','在情绪里做决定','给别人交代你不该交代的事'];

    function generateTodos(c, reversed, dateKey, profile) {
        const seed = dailyHash(dateKey + ':' + c.id + (reversed ? 'r' : 'u'));
        const el = c.element || '风';
        const dos = []; const donts = [];
        // 主：元素池
        const elDos = (DO_POOL[el] || DO_POOL['风']).slice();
        const elDonts = (DONT_POOL[el] || DONT_POOL['风']).slice();
        // 简易洗牌
        function pickN(arr, n, s) {
            const out = []; const used = new Set();
            for (let i = 0; out.length < n && i < arr.length * 3; i++) {
                const idx = (s + i * 7) % arr.length;
                if (used.has(idx)) continue;
                used.add(idx); out.push(arr[idx]);
            }
            return out;
        }
        // 牌的关键词追加一条
        const kws = c.keywords || [];
        if (reversed) {
            dos.push(...pickN(DO_REVERSED, 1, seed));
            dos.push(...pickN(elDos, 2, seed >> 3));
            donts.push(...pickN(DONT_REVERSED, 1, seed >> 5));
            donts.push(...pickN(elDonts, 1, seed >> 7));
        } else {
            dos.push(...pickN(elDos, 3, seed));
            donts.push(...pickN(elDonts, 2, seed >> 5));
        }
        // 用一个关键词替换文案中的"一件想做很久的事"等占位（让文案更个性化）
        const flavorKw = kws[0] || '';
        if (flavorKw && dos[0]) {
            // 在第一条前面加上一句小提示
            dos[0] = dos[0] + `（顺着「${flavorKw}」的能量）`;
        }
        return { dos: dos.slice(0, 3), donts: donts.slice(0, 2) };
    }

    // ===== 主接口 =====
    function getToday(userSalt) {
        const today = todayStr();
        let rec = loadCard();
        if (rec && rec.date === today) {
            // 已存在：补齐 cardObj
            const co = (window.TAROT_CARDS || []).find(c => c.id === rec.cardId);
            return Object.assign({}, rec, { card: co });
        }
        // 生成新的
        const picked = pickCardForDate(today, userSalt);
        if (!picked) return null;
        const f = buildFortune(picked.card, picked.reversed, today);
        // streak 计算
        const history = loadHistory();
        const lastDate = history[0];
        let streak = 1;
        if (lastDate === yesterdayStr()) {
            const prevRec = loadCard();
            streak = (prevRec && prevRec.streak ? prevRec.streak : 0) + 1;
        }
        const newRec = {
            date: today,
            cardId: picked.card.id,
            reversed: picked.reversed,
            fortune: f.fortune,
            kw1: f.kw1, kw2: f.kw2,
            revealed: false,
            streak,
            createdAt: Date.now()
        };
        saveCard(newRec);
        if (history[0] !== today) {
            history.unshift(today);
            saveHistory(history);
        }
        return Object.assign({}, newRec, { card: picked.card });
    }

    function reveal() {
        const rec = loadCard();
        if (!rec) return false;
        rec.revealed = true;
        saveCard(rec);
        return true;
    }

    function getStreak() {
        const rec = loadCard();
        return rec && rec.streak ? rec.streak : 0;
    }
    function getDays() { return loadHistory().length; }
    function getHistory() { return loadHistory(); }

    // ===== 通知系统 =====
    function isNotifySupported() {
        return typeof window !== 'undefined' && 'Notification' in window;
    }
    function getPermission() {
        return isNotifySupported() ? Notification.permission : 'unsupported';
    }
    async function requestPermission() {
        if (!isNotifySupported()) return 'unsupported';
        if (Notification.permission === 'granted') return 'granted';
        if (Notification.permission === 'denied') return 'denied';
        try {
            const p = await Notification.requestPermission();
            return p;
        } catch (e) { return 'denied'; }
    }

    function getSettings() { return loadSettings(); }
    function setSettings(patch) {
        const s = Object.assign(loadSettings(), patch || {});
        saveSettings(s);
        return s;
    }

    function notifyNow(opts) {
        if (!isNotifySupported() || Notification.permission !== 'granted') return false;
        try {
            const title = (opts && opts.title) || '⭐ 今日之牌已就位';
            const body = (opts && opts.body) || '宇宙为你准备的今日指引，点击查看。';
            const icon = (opts && opts.icon) || './icons/icon-192x192.png';
            // 优先用 SW 推送
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistration().then(reg => {
                    if (reg && reg.showNotification) {
                        reg.showNotification(title, {
                            body, icon, badge: icon,
                            tag: 'tarot-daily',
                            requireInteraction: false,
                            data: { url: location.href }
                        });
                    } else {
                        new Notification(title, { body, icon });
                    }
                });
            } else {
                new Notification(title, { body, icon });
            }
            return true;
        } catch (e) { return false; }
    }

    let _timer = null;
    function scheduleDailyReminder() {
        if (_timer) clearTimeout(_timer);
        const settings = loadSettings();
        if (!settings.enableNotify) return;
        if (!isNotifySupported() || Notification.permission !== 'granted') return;
        const [hh, mm] = (settings.notifyTime || NOTIFY_TIME_DEFAULT).split(':').map(n => parseInt(n, 10));
        const now = new Date();
        const target = new Date();
        target.setHours(hh || 8, mm || 0, 0, 0);
        if (target <= now) target.setDate(target.getDate() + 1);
        const delay = target.getTime() - now.getTime();
        _timer = setTimeout(() => {
            const s = loadSettings();
            const today = todayStr();
            if (s.lastNotifyDate !== today) {
                const t = getToday();
                const body = t && t.card
                    ? `今日 · ${t.card.name}${t.reversed ? '(逆位)' : ''} —— ${t.fortune.slice(0, 36)}`
                    : '宇宙为你准备的今日指引，点击查看。';
                notifyNow({ body });
                setSettings({ lastNotifyDate: today });
            }
            // 递归下一日
            scheduleDailyReminder();
        }, Math.min(delay, 0x7fffffff));
    }

    // ===== 暴露 =====
    window.TarotDaily = {
        getToday,
        generateTodos,
        reveal,
        getStreak,
        getDays,
        getHistory,
        isNotifySupported,
        getPermission,
        requestPermission,
        getSettings,
        setSettings,
        notifyNow,
        scheduleDailyReminder
    };

    console.log('✓ Tarot Daily 模块已就绪');
})();
