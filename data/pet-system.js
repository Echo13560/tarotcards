/* 星辰塔罗 - 宠物喂养系统 v1.0
 * 核心：
 *  - 每日打卡：每天首次喂养 +50 经验
 *  - 占卜喂食：每次完成占卜 +15 经验
 *  - 手动喂养：消耗"星之结晶"（占卜得到）+30 经验
 *  - 等级 / 阶段成长（Lv 1-50），每个阶段解锁新形象 / 新名字
 *  - 心情：未喂养超过 24h 心情下降，连续打卡心情上升
 *  - 已解锁形象画廊
 *
 * 与现有 state.profile.petName / pet-stage 解耦：本模块管理"成长&解锁"，
 * 显示形象通过 getCurrentAppearance() 提供。
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'tarot_pet_v1';

    // ===== 成长阶段 =====
    // 每阶段：要求 levelMin，解锁名（unlockName），emoji（形象），描述
    const STAGES = [
        { id: 'egg',       minLv: 1,  emoji: '🥚',  name: '星辰之卵',     desc: '一枚静静蛰伏的星卵，里面孕育着无限可能。' },
        { id: 'spark',     minLv: 3,  emoji: '✨',  name: '初醒之光',     desc: '蛋壳裂开了，一缕灵性微光正缓缓苏醒。' },
        { id: 'kitten',    minLv: 6,  emoji: '🐱',  name: '星灵幼崽',     desc: '调皮活泼，对一切充满好奇。' },
        { id: 'fox',       minLv: 10, emoji: '🦊',  name: '九尾灵狐',     desc: '机敏聪慧，能嗅到命运的气息。' },
        { id: 'owl',       minLv: 15, emoji: '🦉',  name: '智慧之枭',     desc: '夜空使者，洞察人心深处的秘密。' },
        { id: 'unicorn',   minLv: 22, emoji: '🦄',  name: '梦境独角兽',   desc: '行走在梦与现实的边界，能引导你穿越迷雾。' },
        { id: 'dragon',    minLv: 30, emoji: '🐉',  name: '星河神龙',     desc: '盘踞银河之上，呼吸间皆是占卜的奥义。' },
        { id: 'phoenix',   minLv: 40, emoji: '🔥',  name: '涅槃凤凰',     desc: '每一次解读都是一次重生。' },
        { id: 'celestial', minLv: 50, emoji: '👑',  name: '至高星灵',     desc: '你与它已然合一，看见宇宙真正的面貌。' }
    ];

    // 等级所需经验：等差 + 等比
    function expForLevel(lv) {
        if (lv <= 1) return 0;
        // Lv2:100, Lv3:230, Lv5:560 ... 平缓递增
        let total = 0;
        for (let i = 2; i <= lv; i++) {
            total += Math.floor(80 + (i - 1) * 30 + Math.pow(i, 1.4) * 5);
        }
        return total;
    }
    function maxLevel() {
        return 50;
    }

    // ===== 状态存取 =====
    function defaultState() {
        return {
            level: 1,
            exp: 0,
            crystals: 3,          // 星之结晶（货币）
            mood: 80,              // 0-100
            lastCheckinDate: '',  // YYYY-MM-DD
            streak: 0,             // 连续打卡
            totalFeeds: 0,
            createdAt: Date.now(),
            log: [],               // 最近 30 条
            unlockedStages: ['egg']
        };
    }
    function getState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return defaultState();
            return Object.assign(defaultState(), JSON.parse(raw));
        } catch (e) {
            return defaultState();
        }
    }
    function saveState(s) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    }

    // ===== 工具 =====
    function todayStr() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    function diffDays(a, b) {
        if (!a || !b) return 999;
        const da = new Date(a), db = new Date(b);
        return Math.round((db - da) / 86400000);
    }
    function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

    function pushLog(state, type, text, gain) {
        state.log.unshift({ type, text, gain: gain || 0, time: Date.now() });
        if (state.log.length > 30) state.log.length = 30;
    }

    // ===== 经验 → 等级提升（含解锁阶段）=====
    function applyExp(state, gain) {
        state.exp += gain;
        const before = state.level;
        let leveledUp = [];
        let newStages = [];
        while (state.level < maxLevel() && state.exp >= expForLevel(state.level + 1)) {
            state.level += 1;
            leveledUp.push(state.level);
            // 解锁阶段
            const reached = STAGES.filter(s => s.minLv === state.level);
            reached.forEach(s => {
                if (!state.unlockedStages.includes(s.id)) {
                    state.unlockedStages.push(s.id);
                    newStages.push(s);
                }
            });
        }
        return { leveledUp, newStages, before, after: state.level };
    }

    // ===== 心情衰减（按上次打卡天数）=====
    function decayMood(state) {
        const days = state.lastCheckinDate ? diffDays(state.lastCheckinDate, todayStr()) : 0;
        if (days > 1) {
            state.mood = clamp(state.mood - (days - 1) * 8, 0, 100);
        }
    }

    // ===== 每日打卡（一天首次喂养自动触发）=====
    function dailyCheckin(state) {
        const today = todayStr();
        if (state.lastCheckinDate === today) return null;
        decayMood(state);
        const yesterday = (() => {
            const d = new Date(); d.setDate(d.getDate() - 1);
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        })();
        if (state.lastCheckinDate === yesterday) {
            state.streak += 1;
        } else {
            state.streak = 1;
        }
        state.lastCheckinDate = today;
        // 连续奖励
        const streakBonus = Math.min(state.streak * 5, 50);
        const baseExp = 50 + streakBonus;
        const moodGain = clamp(15 + Math.floor(state.streak / 3) * 2, 5, 30);
        state.mood = clamp(state.mood + moodGain, 0, 100);
        // 每 7 天连续奖励 1 个结晶
        let crystalBonus = 0;
        if (state.streak > 0 && state.streak % 7 === 0) {
            state.crystals += 1;
            crystalBonus = 1;
        }
        const result = applyExp(state, baseExp);
        pushLog(state, 'checkin', `每日打卡（连续 ${state.streak} 天）`, baseExp);
        saveState(state);
        return {
            type: 'checkin',
            exp: baseExp,
            mood: moodGain,
            streak: state.streak,
            streakBonus,
            crystalBonus,
            leveledUp: result.leveledUp,
            newStages: result.newStages
        };
    }

    // ===== 占卜喂食（完成一次占卜自动）=====
    function feedFromReading(topicLabel) {
        const state = getState();
        // 每日首次先打卡
        let checkin = null;
        if (state.lastCheckinDate !== todayStr()) {
            checkin = dailyCheckin(state);
        } else {
            decayMood(state);
        }
        const gain = 15;
        const moodG = 5;
        state.totalFeeds += 1;
        state.mood = clamp(state.mood + moodG, 0, 100);
        // 占卜也有几率获得结晶（10%）
        let crystal = 0;
        if (Math.random() < 0.1) {
            state.crystals += 1;
            crystal = 1;
        }
        const result = applyExp(state, gain);
        pushLog(state, 'reading', `占卜·${topicLabel || '心灵'}`, gain);
        saveState(state);
        return {
            type: 'reading',
            checkin,
            exp: gain,
            mood: moodG,
            crystal,
            leveledUp: result.leveledUp,
            newStages: result.newStages
        };
    }

    // ===== 手动喂食（消耗结晶）=====
    function manualFeed() {
        const state = getState();
        if (state.crystals < 1) {
            return { ok: false, reason: '星之结晶不足（每次占卜有几率获得，每 7 天连续打卡 +1）' };
        }
        state.crystals -= 1;
        let checkin = null;
        if (state.lastCheckinDate !== todayStr()) {
            checkin = dailyCheckin(state);
        } else {
            decayMood(state);
        }
        const gain = 30;
        const moodG = 12;
        state.totalFeeds += 1;
        state.mood = clamp(state.mood + moodG, 0, 100);
        const result = applyExp(state, gain);
        pushLog(state, 'feed', '投喂星之结晶', gain);
        saveState(state);
        return {
            ok: true,
            type: 'feed',
            checkin,
            exp: gain,
            mood: moodG,
            leveledUp: result.leveledUp,
            newStages: result.newStages,
            crystalsLeft: state.crystals
        };
    }

    // ===== 当前形象 =====
    function getCurrentStage(state) {
        state = state || getState();
        // 找到 minLv <= state.level 中最大的
        let cur = STAGES[0];
        for (const s of STAGES) {
            if (state.level >= s.minLv) cur = s;
        }
        return cur;
    }

    // 用户手动选择已解锁的形象
    function setActiveStage(stageId) {
        const state = getState();
        if (!state.unlockedStages.includes(stageId)) return false;
        state.activeStageId = stageId;
        saveState(state);
        return true;
    }
    function getActiveStage(state) {
        state = state || getState();
        if (state.activeStageId) {
            const s = STAGES.find(x => x.id === state.activeStageId);
            if (s && state.unlockedStages.includes(s.id)) return s;
        }
        return getCurrentStage(state);
    }

    function getProgress(state) {
        state = state || getState();
        const lv = state.level;
        if (lv >= maxLevel()) {
            return { level: lv, max: true, expIntoLevel: 0, expNeed: 0, ratio: 1 };
        }
        const curBase = expForLevel(lv);
        const nextNeed = expForLevel(lv + 1);
        const into = state.exp - curBase;
        const need = nextNeed - curBase;
        return {
            level: lv,
            expIntoLevel: into,
            expNeed: need,
            ratio: clamp(into / need, 0, 1),
            max: false
        };
    }

    function getMoodInfo(state) {
        state = state || getState();
        const m = state.mood;
        if (m >= 80) return { level: 'high', label: '闪耀', icon: '✨' };
        if (m >= 50) return { level: 'mid', label: '愉悦', icon: '🌟' };
        if (m >= 25) return { level: 'low', label: '想念你', icon: '🌙' };
        return { level: 'sad', label: '黯淡', icon: '💧' };
    }

    function resetAll() {
        localStorage.removeItem(STORAGE_KEY);
    }

    // ===== 暴露 =====
    window.TarotPet = {
        STAGES,
        getState,
        saveState,
        dailyCheckin,
        feedFromReading,
        manualFeed,
        setActiveStage,
        getActiveStage,
        getCurrentStage,
        getProgress,
        getMoodInfo,
        expForLevel,
        maxLevel,
        resetAll
    };

    console.log('✓ Tarot Pet 模块已就绪');
})();
