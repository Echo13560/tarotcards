/* 星辰塔罗 - 音效 & 触感模块 v1.0
 *
 * 设计目标：
 *   - 不依赖任何外部音频文件（保持 PWA 体积、离线即用）
 *   - 用 Web Audio 振荡器合成水晶钵 / 钟声 / 翻牌声 / 沙沙洗牌声
 *   - 统一封装 navigator.vibrate，遵从用户开关
 *   - 开关持久化在 localStorage：tarot_sound_on / tarot_haptic_on
 *
 * 调用示例：
 *   window.TarotSFX.flip();         // 翻牌：短促木质 click + 30ms 震动
 *   window.TarotSFX.shuffle(1.4);   // 1.4 秒洗牌沙沙声
 *   window.TarotSFX.chime();        // 抽满 / AI 完成：水晶钵 3 秒余韵
 *   window.TarotSFX.bell();         // 应验灵验：轻钟
 *   window.TarotSFX.haptic('select')// 仅震动
 */
(function () {
    'use strict';

    const SOUND_KEY = 'tarot_sound_on';
    const HAPTIC_KEY = 'tarot_haptic_on';
    const VOLUME_KEY = 'tarot_sound_volume';

    // ===== 开关 =====
    function isSoundOn() {
        try {
            const v = localStorage.getItem(SOUND_KEY);
            return v === null ? true : v === '1'; // 默认开
        } catch (_) { return true; }
    }
    function setSoundOn(on) {
        try { localStorage.setItem(SOUND_KEY, on ? '1' : '0'); } catch (_) {}
    }
    function isHapticOn() {
        try {
            const v = localStorage.getItem(HAPTIC_KEY);
            return v === null ? true : v === '1'; // 默认开
        } catch (_) { return true; }
    }
    function setHapticOn(on) {
        try { localStorage.setItem(HAPTIC_KEY, on ? '1' : '0'); } catch (_) {}
    }
    function getVolume() {
        try {
            const v = parseFloat(localStorage.getItem(VOLUME_KEY) || '0.45');
            return isNaN(v) ? 0.45 : Math.max(0, Math.min(1, v));
        } catch (_) { return 0.45; }
    }
    function setVolume(v) {
        try { localStorage.setItem(VOLUME_KEY, String(Math.max(0, Math.min(1, v)))); } catch (_) {}
    }

    // ===== AudioContext 懒加载（满足浏览器手势策略）=====
    let ctx = null;
    let masterGain = null;
    function ensureCtx() {
        if (!isSoundOn()) return null;
        if (ctx && ctx.state !== 'closed') {
            if (ctx.state === 'suspended') { try { ctx.resume(); } catch (_) {} }
            return ctx;
        }
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            ctx = new AC();
            masterGain = ctx.createGain();
            masterGain.gain.value = getVolume();
            masterGain.connect(ctx.destination);
        } catch (_) { ctx = null; }
        return ctx;
    }
    function applyVolume() {
        if (masterGain && ctx) {
            try { masterGain.gain.setValueAtTime(getVolume(), ctx.currentTime); } catch (_) {}
        }
    }

    // 用户首次手势后唤醒 AudioContext（iOS Safari 需要）
    function unlockOnGesture() {
        const wake = () => {
            try { ensureCtx(); if (ctx && ctx.state === 'suspended') ctx.resume(); } catch (_) {}
            document.removeEventListener('touchstart', wake, { passive: true });
            document.removeEventListener('click', wake);
        };
        document.addEventListener('touchstart', wake, { passive: true });
        document.addEventListener('click', wake);
    }

    // ===== 低层工具 =====
    function tone(opts) {
        const c = ensureCtx(); if (!c) return;
        const {
            freq = 440, type = 'sine', dur = 0.3,
            gain = 0.3, attack = 0.01, release = 0.2,
            detune = 0
        } = opts || {};
        const now = c.currentTime;
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (detune) osc.detune.setValueAtTime(detune, now);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(gain, now + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(g).connect(masterGain);
        osc.start(now);
        osc.stop(now + dur + 0.05);
        // release
        setTimeout(() => { try { osc.disconnect(); g.disconnect(); } catch (_) {} }, (dur + 0.1) * 1000);
    }

    // 多泛音水晶钵（钟磬）
    function bowl(opts) {
        const c = ensureCtx(); if (!c) return;
        const { fundamental = 528, dur = 3.2, gain = 0.35 } = opts || {};
        // 钟磬泛音比：1, 2.4, 3.9, 5.4, 6.8（近似非谐波）
        const ratios = [1, 2.4, 3.9, 5.4];
        const decays = [dur, dur * 0.7, dur * 0.5, dur * 0.35];
        const gains = [gain, gain * 0.45, gain * 0.25, gain * 0.15];
        ratios.forEach((r, i) => {
            tone({
                freq: fundamental * r,
                type: 'sine',
                dur: decays[i],
                gain: gains[i],
                attack: 0.005,
                release: decays[i]
            });
        });
        // 起手敲击瞬态
        tone({ freq: fundamental * 6, type: 'triangle', dur: 0.08, gain: gain * 0.3, attack: 0.001 });
    }

    // 短促翻牌"咔哒"——木质打击
    function flipSound() {
        const c = ensureCtx(); if (!c) return;
        // 一个白噪声短包络模拟卡片摩擦
        const now = c.currentTime;
        const dur = 0.06;
        const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        const src = c.createBufferSource();
        src.buffer = buf;
        const g = c.createGain();
        g.gain.setValueAtTime(0.45, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        // 高通让它更像"啪"而不是"嗡"
        const hp = c.createBiquadFilter();
        hp.type = 'highpass'; hp.frequency.value = 1200;
        src.connect(hp).connect(g).connect(masterGain);
        src.start(now);
        src.stop(now + dur + 0.01);
        // 叠一个低音 thump 增加质感
        tone({ freq: 180, type: 'triangle', dur: 0.08, gain: 0.18, attack: 0.001 });
    }

    // 洗牌沙沙声：白噪声 + 带通滤波 + 慢调制
    function shuffleSound(duration) {
        const c = ensureCtx(); if (!c) return;
        const dur = Math.max(0.4, Math.min(3, duration || 1.4));
        const now = c.currentTime;
        const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource();
        src.buffer = buf;
        const bp = c.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 2400;
        bp.Q.value = 0.8;
        const g = c.createGain();
        // 包络：淡入 → 起伏 → 淡出
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.18, now + 0.12);
        // 模拟卡片快速摆动的强弱
        const steps = Math.floor(dur * 8);
        for (let i = 1; i < steps; i++) {
            const t = now + (i / steps) * dur;
            g.gain.linearRampToValueAtTime(0.10 + Math.random() * 0.12, t);
        }
        g.gain.linearRampToValueAtTime(0, now + dur);
        src.connect(bp).connect(g).connect(masterGain);
        src.start(now);
        src.stop(now + dur + 0.05);
    }

    // 轻钟（应验/灵验）
    function bell() {
        bowl({ fundamental: 880, dur: 1.6, gain: 0.28 });
    }

    // 占卜准备：低沉 hum（静心阶段循环背景，可选）
    let _humSource = null;
    function startHum() {
        const c = ensureCtx(); if (!c) return;
        stopHum();
        const o1 = c.createOscillator(); o1.type = 'sine'; o1.frequency.value = 110;
        const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = 110 * 1.5; // 五度
        o2.detune.value = -8;
        const g = c.createGain();
        g.gain.value = 0;
        g.gain.linearRampToValueAtTime(0.08, c.currentTime + 1.5);
        o1.connect(g); o2.connect(g); g.connect(masterGain);
        o1.start(); o2.start();
        _humSource = { o1, o2, g };
    }
    function stopHum() {
        if (!_humSource) return;
        try {
            const c = ctx;
            const now = c.currentTime;
            _humSource.g.gain.cancelScheduledValues(now);
            _humSource.g.gain.linearRampToValueAtTime(0, now + 0.6);
            const ref = _humSource;
            setTimeout(() => {
                try { ref.o1.stop(); ref.o2.stop(); } catch (_) {}
                try { ref.o1.disconnect(); ref.o2.disconnect(); ref.g.disconnect(); } catch (_) {}
            }, 700);
        } catch (_) {}
        _humSource = null;
    }

    // ===== 触感封装 =====
    const HAPTIC_PATTERNS = {
        tap:       15,
        select:    [20, 30, 20],
        flip:      18,
        complete:  [40, 30, 60],
        success:   [10, 40, 10, 40, 30],
        warning:   [60, 40, 60],
        gentle:    10
    };
    function haptic(kind) {
        if (!isHapticOn()) return;
        if (!navigator.vibrate) return;
        const pattern = (typeof kind === 'string') ? HAPTIC_PATTERNS[kind] : kind;
        if (!pattern) return;
        try { navigator.vibrate(pattern); } catch (_) {}
    }

    // ===== 高层"事件触发"——同时管声音+震动 =====
    function flip() {
        flipSound();
        haptic('flip');
    }
    function shuffleFx(duration) {
        shuffleSound(duration);
        haptic([20, 60, 20, 60, 20, 60]);
    }
    function chime() {
        bowl();
        haptic('success');
    }
    function pick() {
        // 选牌的清脆点击
        tone({ freq: 1320, type: 'triangle', dur: 0.14, gain: 0.22, attack: 0.002 });
        tone({ freq: 1980, type: 'sine',     dur: 0.18, gain: 0.10, attack: 0.002 });
        haptic('tap');
    }
    function dealComplete() {
        // 抽满
        bowl({ fundamental: 660, dur: 2.2, gain: 0.3 });
        haptic('complete');
    }
    function meditateStart() {
        // 静心开场：一记低钟
        bowl({ fundamental: 220, dur: 3.0, gain: 0.32 });
    }
    function aiDone() {
        // AI 解读完毕：轻钟
        tone({ freq: 1760, type: 'sine', dur: 0.18, gain: 0.18, attack: 0.002 });
        tone({ freq: 2640, type: 'sine', dur: 0.30, gain: 0.10, attack: 0.005 });
        haptic('gentle');
    }
    function error() {
        tone({ freq: 220, type: 'sawtooth', dur: 0.18, gain: 0.18 });
        haptic('warning');
    }

    // ===== 暴露 =====
    window.TarotSFX = {
        // 开关
        isSoundOn, setSoundOn,
        isHapticOn, setHapticOn,
        getVolume, setVolume, applyVolume,
        // 触感
        haptic,
        // 事件
        flip, shuffleFx, chime, pick, dealComplete,
        meditateStart, aiDone, bell, error,
        // 背景 hum
        startHum, stopHum,
        // 低层（高级用法）
        tone, bowl, flipSound, shuffleSound
    };

    // 启动时挂载手势解锁
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', unlockOnGesture);
    } else {
        unlockOnGesture();
    }

    console.log('✓ Tarot SFX 模块已就绪');
})();
