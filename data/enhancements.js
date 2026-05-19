/* 星辰塔罗 - 增强模块 v1.3
 * 包含：本命牌测算（生日数字学）、主题氛围切换、语音朗读、每日运势提醒
 */
(function () {
    'use strict';

    // ===== 1. 本命牌（生日数字学：Birth Card / Soul Card / Personality Card）=====
    // 经典塔罗数字学：将生日所有数字相加，缩减到 1-22 之间
    function calcBirthCards(birthday) {
        if (!birthday) return null;
        // birthday 格式 yyyy-mm-dd
        const digits = birthday.replace(/[^0-9]/g, '');
        if (digits.length < 8) return null;
        let sum = 0;
        for (const ch of digits) sum += parseInt(ch, 10);
        // Personality Card：数字相加结果（若 > 22 则继续缩减一次）
        let personality = sum;
        while (personality > 22) {
            personality = String(personality).split('').reduce((a, b) => a + parseInt(b, 10), 0);
        }
        // Soul Card：将 Personality 各位再相加（个位数）
        let soul = personality;
        if (soul > 9) {
            soul = String(soul).split('').reduce((a, b) => a + parseInt(b, 10), 0);
        }
        // 0 -> 22（愚者）；其他保留
        if (personality === 0) personality = 22;
        if (soul === 0) soul = 22;

        // 找对应大牌（major-N）
        const cards = (window.TAROT_CARDS || []).filter(c => c.arcana === 'major');
        const findByNum = n => cards.find(c => c.number === n) || cards.find(c => c.id === 'major-' + n);
        return {
            personality: findByNum(personality === 22 ? 0 : personality),
            soul: findByNum(soul === 22 ? 0 : soul),
            personalityNum: personality,
            soulNum: soul,
            sum: sum
        };
    }
    // 命运数字（个位数 1-9）
    function calcLifePathNumber(birthday) {
        if (!birthday) return null;
        const digits = birthday.replace(/[^0-9]/g, '');
        if (digits.length < 8) return null;
        let sum = digits.split('').reduce((a, b) => a + parseInt(b, 10), 0);
        // 大师数 11/22/33 保留
        const masters = [11, 22, 33];
        while (sum > 9 && !masters.includes(sum)) {
            sum = String(sum).split('').reduce((a, b) => a + parseInt(b, 10), 0);
        }
        return sum;
    }
    const LIFE_PATH_DESC = {
        1: { title: '开拓者', desc: '独立、果敢、富有领导力，命中注定要走出自己的路。', element: '🔥' },
        2: { title: '调和者', desc: '敏感细腻、富有同理心，是天生的合作伙伴和倾听者。', element: '💧' },
        3: { title: '表达者', desc: '充满创造力与魅力，文字、艺术与社交是你的能量场。', element: '🌬' },
        4: { title: '建设者', desc: '务实稳健、有耐心，擅长把梦想一砖一瓦建成现实。', element: '🌱' },
        5: { title: '探索者', desc: '渴望自由与变化，旅行、冒险与新鲜事物会点亮你。', element: '⚡' },
        6: { title: '守护者', desc: '温柔、负责，重视家庭与情感，是身边人的避风港。', element: '🌹' },
        7: { title: '寻道者', desc: '深思、神秘，对真理与精神世界有天然的洞察力。', element: '🌙' },
        8: { title: '掌权者', desc: '野心勃勃、目标导向，物质与权力都是你的考场。', element: '👑' },
        9: { title: '奉献者', desc: '宽广、慈悲，命中带着利他的使命感，向世界发光。', element: '✨' },
        11: { title: '直觉先知', desc: '高敏体质，灵感与梦境是你的导航。大师数 11 自带光环。', element: '🔮' },
        22: { title: '现实建造师', desc: '能将宏大愿景落地为现实，大师数 22 担负重任。', element: '🏛' },
        33: { title: '大爱导师', desc: '稀有的大师数 33，以无条件的爱去服务世界。', element: '💖' }
    };
    function getLifePathInfo(n) { return LIFE_PATH_DESC[n] || null; }

    // ===== 1.5 流年牌（Year Card）：每年都不同的指引牌 =====
    // 算法：出生月 + 出生日 + 当前年份 → 缩减到 1-22 之间 → 对应大阿尔卡纳
    // 这是 Mary K. Greer 等塔罗大师推广的经典「Personal Year Card」方法
    function calcYearCard(birthday, year) {
        if (!birthday) return null;
        const m = birthday.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) return null;
        const month = parseInt(m[2], 10);
        const day = parseInt(m[3], 10);
        const yr = year || new Date().getFullYear();
        // 各位数字相加
        let sum = 0;
        const str = String(month) + String(day) + String(yr);
        for (const ch of str) sum += parseInt(ch, 10);
        // 缩减到 1-22
        while (sum > 22) {
            sum = String(sum).split('').reduce((a, b) => a + parseInt(b, 10), 0);
        }
        if (sum === 0) sum = 22;
        const cards = (window.TAROT_CARDS || []).filter(c => c.arcana === 'major');
        const yearCard = cards.find(c => c.number === (sum === 22 ? 0 : sum)) || cards.find(c => c.id === 'major-' + (sum === 22 ? 0 : sum));
        // 计算当前所处的"年龄周期阶段"
        const dob = new Date(birthday);
        const now = new Date();
        let age = now.getFullYear() - dob.getFullYear();
        const beforeBirthday = (now.getMonth() < dob.getMonth()) ||
            (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
        if (beforeBirthday) age--;
        // 距离下一个生日的天数
        const nextBd = new Date(yr, dob.getMonth(), dob.getDate());
        if (nextBd < now) nextBd.setFullYear(yr + 1);
        const daysToNextBd = Math.ceil((nextBd - now) / (1000 * 60 * 60 * 24));
        return { card: yearCard, number: sum, year: yr, age, daysToNextBd };
    }
    // 流年主题描述（22 张大牌各自的"一年指引"）
    const YEAR_CARD_THEMES = {
        0:  { theme: '崭新启程', focus: '放下既有框架，相信直觉，跳入未知的可能。今年是开启全新人生章节的一年。', advice: '保持初心，少计较得失，让自由与好奇引领你。' },
        1:  { theme: '主动出击', focus: '你的意志力与创造力被点燃，是把想法变成现实的一年。', advice: '设定明确目标，主动开口、主动行动、主动连接资源。' },
        2:  { theme: '内在倾听', focus: '今年的智慧藏在直觉与梦境里，不急于决策，先沉淀。', advice: '多冥想、写日记，相信内在的声音胜过外界的喧嚣。' },
        3:  { theme: '丰盛绽放', focus: '感性、创造、爱与美的能量正在涌动，是表达自我的好时机。', advice: '滋养身边的人和事，也滋养自己，绽放是最好的回馈。' },
        4:  { theme: '稳固根基', focus: '建立秩序、规则、长期结构的一年，适合存钱、立规、扎根。', advice: '别怕枯燥，地基打得越稳，未来的高楼越高。' },
        5:  { theme: '寻求指引', focus: '回归内在的信仰、传统与智慧，向师者学习的一年。', advice: '阅读经典、寻找导师、加入有传承的圈子。' },
        6:  { theme: '抉择与爱', focus: '关系、伴侣、价值观的重大抉择会浮现，遵循内心而非外界。', advice: '把"我真正想要的"想清楚，再做承诺。' },
        7:  { theme: '驾驭前行', focus: '凭意志力突破阻碍的一年，外在战场会让你蜕变。', advice: '不退让、不妥协，但要学会驾驭情绪这匹野马。' },
        8:  { theme: '柔韧之力', focus: '用温柔战胜刚强，今年的功课是耐心与内在力量。', advice: '面对挑战别硬碰硬，用爱和温柔慢慢瓦解阻力。' },
        9:  { theme: '独处沉思', focus: '一段向内退守的时光，独处是为了听见更深的智慧。', advice: '减少社交、远离喧嚣，给灵魂一段安静的旅程。' },
        10: { theme: '命运转轮', focus: '人生迎来重大转折，机会与变化交织。', advice: '保持开放，无论顺逆都是因缘，顺势而为。' },
        11: { theme: '公正抉择', focus: '法律、契约、责任、因果的一年，所有的选择都将被衡量。', advice: '诚实面对自己的言行，种善因得善果。' },
        12: { theme: '换个视角', focus: '主动牺牲与转变视角的一年，旧的不放下新的进不来。', advice: '暂停、悬挂、换位思考，答案会从倒过来的角度浮现。' },
        13: { theme: '蜕变重生', focus: '一段必要的告别与重塑，旧的自我正在消亡。', advice: '别抗拒，让它走，新生的你会更轻盈。' },
        14: { theme: '平衡调和', focus: '回归中道，融合矛盾，是身心整合的一年。', advice: '不极端、不偏激，慢慢调和工作与生活的比例。' },
        15: { theme: '直面欲望', focus: '诚实面对欲望、上瘾、阴影的一年，看见即是解脱。', advice: '不必否认欲望，但要看清是你在驾驭它还是它在驾驭你。' },
        16: { theme: '破而后立', focus: '旧结构会以猛烈的方式崩塌，但崩塌之后是真正的自由。', advice: '别死守旧的安全感，倒下的本就该倒。' },
        17: { theme: '希望与愈合', focus: '一段疗愈与梦想重燃的时光，是灵魂吸吮甘露的一年。', advice: '相信宇宙的善意，许下真实的愿望，让光照进你。' },
        18: { theme: '迷雾穿越', focus: '梦境、潜意识、情绪起伏交织的一年，能量诡谲。', advice: '不被恐惧绑架，凭直觉慢慢穿越，月明终会出现。' },
        19: { theme: '光明绽放', focus: '能量饱满、喜悦、成功显化的一年，是塔罗里最好的流年牌之一。', advice: '尽情享受、尽情表达、尽情发光，这是属于你的高光时刻。' },
        20: { theme: '觉醒召唤', focus: '听见使命的召唤、重大评判与重生的一年。', advice: '回应内心深处的声音，做真正想做的事，时候到了。' },
        21: { theme: '圆满成就', focus: '一段周期的完整收官，世界向你展开新的格局。', advice: '庆祝你走过的路，然后准备好开启下一个 22 年循环。' }
    };
    function getYearCardTheme(num) { return YEAR_CARD_THEMES[num === 22 ? 0 : num] || null; }

    // ===== 2. 主题氛围 =====
    const THEMES = {
        midnight:  { name: '深夜星辰', emoji: '🌌', desc: '默认神秘紫金' },
        bloodmoon: { name: '血月之夜', emoji: '🌑', desc: '深红与暗金' },
        dawn:      { name: '黎明微光', emoji: '🌅', desc: '柔和金粉色调' },
        forest:    { name: '翡翠秘境', emoji: '🌿', desc: '深绿与铜金' },
        daylight:  { name: '日光羊皮', emoji: '☀', desc: '白天友好的浅色' }
    };
    function applyTheme(themeKey) {
        const body = document.body;
        Object.keys(THEMES).forEach(k => body.classList.remove('theme-' + k));
        body.classList.add('theme-' + themeKey);
        try { localStorage.setItem('tarot_theme', themeKey); } catch (_) {}
        // 更新 PWA theme-color
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            const colors = {
                midnight: '#131313', bloodmoon: '#1a0808', dawn: '#1f1418', forest: '#0c1612', daylight: '#f7f1e1'
            };
            meta.setAttribute('content', colors[themeKey] || '#131313');
        }
    }
    function getCurrentTheme() {
        try { return localStorage.getItem('tarot_theme') || 'midnight'; } catch (_) { return 'midnight'; }
    }

    // ===== 3. 语音朗读 =====
    let currentUtterance = null;
    let isSpeaking = false;
    function isSpeechSupported() {
        return typeof window !== 'undefined' && 'speechSynthesis' in window;
    }
    function pickVoice() {
        if (!isSpeechSupported()) return null;
        const voices = window.speechSynthesis.getVoices();
        // 优先中文女声
        const zhFemale = voices.find(v => /zh|cmn/i.test(v.lang) && /female|女|Yating|Tingting|Mei-Jia|Sin-ji/i.test(v.name));
        const zhAny = voices.find(v => /zh|cmn/i.test(v.lang));
        return zhFemale || zhAny || voices[0] || null;
    }
    function speak(text, opts) {
        if (!isSpeechSupported() || !text) return false;
        opts = opts || {};
        stopSpeaking();
        const u = new SpeechSynthesisUtterance(text);
        const voice = pickVoice();
        if (voice) u.voice = voice;
        u.lang = (voice && voice.lang) || 'zh-CN';
        u.rate = opts.rate || 0.85;     // 慢一点更有仪式感
        u.pitch = opts.pitch || 1.0;
        u.volume = opts.volume || 1.0;
        u.onstart = () => { isSpeaking = true; if (opts.onStart) opts.onStart(); };
        u.onend = () => { isSpeaking = false; currentUtterance = null; if (opts.onEnd) opts.onEnd(); };
        u.onerror = () => { isSpeaking = false; currentUtterance = null; if (opts.onEnd) opts.onEnd(); };
        currentUtterance = u;
        try { window.speechSynthesis.speak(u); return true; } catch (_) { return false; }
    }
    function stopSpeaking() {
        if (!isSpeechSupported()) return;
        try { window.speechSynthesis.cancel(); } catch (_) {}
        isSpeaking = false;
        currentUtterance = null;
    }
    function speakingActive() { return isSpeaking; }

    // 预热语音列表（部分浏览器异步加载）
    if (isSpeechSupported()) {
        try { window.speechSynthesis.getVoices(); } catch (_) {}
        try { window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices(); } catch (_) {}
    }

    // ===== 4. 通知 / 每日提醒 =====
    function notificationSupported() {
        return typeof window !== 'undefined' && 'Notification' in window;
    }
    async function requestNotifyPermission() {
        if (!notificationSupported()) return 'unsupported';
        if (Notification.permission === 'granted') return 'granted';
        if (Notification.permission === 'denied') return 'denied';
        try { return await Notification.requestPermission(); } catch (_) { return 'denied'; }
    }
    function setDailyReminder(enabled, hourMinute) {
        const cfg = { enabled: !!enabled, time: hourMinute || '09:00' };
        try { localStorage.setItem('tarot_daily_reminder', JSON.stringify(cfg)); } catch (_) {}
        scheduleNextReminder();
        return cfg;
    }
    function getDailyReminder() {
        try { return JSON.parse(localStorage.getItem('tarot_daily_reminder') || 'null') || { enabled: false, time: '09:00' }; }
        catch (_) { return { enabled: false, time: '09:00' }; }
    }
    let reminderTimer = null;
    function scheduleNextReminder() {
        if (reminderTimer) { clearTimeout(reminderTimer); reminderTimer = null; }
        const cfg = getDailyReminder();
        if (!cfg.enabled || !notificationSupported() || Notification.permission !== 'granted') return;
        const [h, m] = (cfg.time || '09:00').split(':').map(Number);
        const now = new Date();
        const next = new Date();
        next.setHours(h || 9, m || 0, 0, 0);
        if (next <= now) next.setDate(next.getDate() + 1);
        const delay = next - now;
        reminderTimer = setTimeout(() => {
            try {
                new Notification('✦ 星辰塔罗', {
                    body: '今日的塔罗指引已为你准备好了，来翻一张牌看看吧～',
                    icon: './icons/icon-192x192.png',
                    badge: './icons/icon-96x96.png',
                    tag: 'tarot-daily'
                });
            } catch (_) {}
            scheduleNextReminder(); // 排下一次
        }, Math.min(delay, 2147483000)); // setTimeout 上限保护
    }

    // ===== 5. 朗读塔罗解读的格式化 =====
    function buildSpeechFromReading(reading) {
        if (!reading) return '';
        const lines = [];
        const list = reading.singleReadings || reading.cardReads;
        if (Array.isArray(list)) {
            list.forEach((cr, i) => {
                const pos = cr.position || `第${i + 1}张`;
                const card = cr.card || {};
                const name = card.name || cr.cardName || '';
                const reversed = card.reversed ? '（逆位）' : '';
                lines.push(`${pos}：${name}${reversed}。`);
                if (cr.text) lines.push(cr.text);
                if (cr.interpretation) lines.push(cr.interpretation);
            });
        }
        if (reading.summary) lines.push('综合解读：' + reading.summary);
        if (reading.advice) lines.push('给你的建议是：' + reading.advice);
        return lines.join(' ');
    }

    // 暴露
    window.TarotEnhance = {
        // 本命牌
        calcBirthCards,
        calcLifePathNumber,
        getLifePathInfo,
        LIFE_PATH_DESC,
        // 流年牌
        calcYearCard,
        getYearCardTheme,
        YEAR_CARD_THEMES,
        // 主题
        THEMES,
        applyTheme,
        getCurrentTheme,
        // 语音
        isSpeechSupported,
        speak,
        stopSpeaking,
        speakingActive,
        buildSpeechFromReading,
        // 通知
        notificationSupported,
        requestNotifyPermission,
        setDailyReminder,
        getDailyReminder,
        scheduleNextReminder
    };

    // 启动时应用上次主题 + 启动提醒调度
    document.addEventListener('DOMContentLoaded', () => {
        applyTheme(getCurrentTheme());
        scheduleNextReminder();
    });
})();
