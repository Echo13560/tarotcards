/* 星辰塔罗 - AI 解读模块 v2.0
 * 兼容 OpenAI Chat Completions 协议，支持：
 *   - SiliconFlow （硅基流动，免费额度大，国内可用）
 *   - DeepSeek
 *   - OpenAI
 *   - 任何兼容 /v1/chat/completions 的端点
 *
 * v2 升级：
 *   - 4 种解读人格（温柔姐姐 / 毒舌闺蜜 / 理性顾问 / 神秘巫女）
 *   - 多轮追问（streamFollowup）：基于首轮牌面+解读，进行连续对话
 *   - 24h 解读缓存：同一组牌+同一问题+同一人格 → 本地命中（关键省钱点）
 *
 * 配置仅保存在 localStorage，不上传任何服务器。
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'tarot_ai_config_v1';
    const CACHE_KEY = 'tarot_ai_cache_v1';
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 小时

    // ===== 预设的服务商 =====
    const PROVIDERS = {
        siliconflow: {
            name: '硅基流动 SiliconFlow',
            baseUrl: 'https://api.siliconflow.cn/v1',
            defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
            tip: '免费！注册即送 14 元额度（够用几千次）→ 点下方按钮一键获取',
            signupUrl: 'https://cloud.siliconflow.cn/account/ak',
            models: [
                'Qwen/Qwen2.5-7B-Instruct',
                'Qwen/Qwen2-7B-Instruct',
                'THUDM/glm-4-9b-chat',
                'internlm/internlm2_5-7b-chat',
                'Qwen/Qwen2.5-32B-Instruct',
                'deepseek-ai/DeepSeek-V2.5'
            ]
        },
        deepseek: {
            name: 'DeepSeek',
            baseUrl: 'https://api.deepseek.com/v1',
            defaultModel: 'deepseek-chat',
            tip: '注册 platform.deepseek.com → 获取 API Key（注册赠送 token）',
            signupUrl: 'https://platform.deepseek.com/api_keys',
            models: ['deepseek-chat', 'deepseek-reasoner']
        },
        openai: {
            name: 'OpenAI',
            baseUrl: 'https://api.openai.com/v1',
            defaultModel: 'gpt-4o-mini',
            tip: '需要海外 API Key，访问 platform.openai.com',
            signupUrl: 'https://platform.openai.com/api-keys',
            models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo']
        },
        custom: {
            name: '自定义（OpenAI 兼容）',
            baseUrl: '',
            defaultModel: '',
            tip: '填入任何兼容 /v1/chat/completions 的端点',
            signupUrl: '',
            models: []
        }
    };

    // ===== 4 种解读人格 =====
    const PERSONAS = {
        gentle: {
            key: 'gentle',
            name: '温柔姐姐',
            emoji: '🌸',
            desc: '温暖、共情、像姐姐一样陪你慢慢看清问题',
            voice: '温柔、富有诗意，多用"亲爱的""慢慢来"这样的语气；不评判，给情感支持。',
            tone: '柔和共情，重情绪安抚，结尾给鼓励'
        },
        savage: {
            key: 'savage',
            name: '毒舌闺蜜',
            emoji: '💅',
            desc: '直白、犀利、像闺蜜一样戳破你的逃避',
            voice: '直接、犀利、有点刺，会戳破美化与自我欺骗。允许使用网络口语（如"姐妹""真的吗你"），但不人身攻击。重在打醒。',
            tone: '辛辣直接但底色温暖，敢说"你在骗自己"'
        },
        rational: {
            key: 'rational',
            name: '理性顾问',
            emoji: '🧭',
            desc: '冷静、逻辑、像咨询师一样分析利弊',
            voice: '冷静、克制、结构化。把牌面当作"心理投射"，给出可量化、可执行的方案。避免诗意修辞。',
            tone: '理性中立，先分析现状，再给清单式建议'
        },
        mystic: {
            key: 'mystic',
            name: '神秘巫女',
            emoji: '🌙',
            desc: '玄妙、古典、像古老巫女带你看命运纹路',
            voice: '玄妙、古典、富有宇宙感。多用"星辰""月相""命运之轮""秘仪"等意象，长句、低语调。',
            tone: '神秘庄严，强调能量与共时性，结尾以一句箴言收束'
        }
    };
    function getPersona(key) {
        return PERSONAS[key] || PERSONAS.gentle;
    }

    // ===== 配置存取 =====
    // 简单混淆：防止 API Key 明文暴露在 localStorage
    function obfuscate(str) {
        if (!str) return '';
        try { return btoa(str.split('').reverse().join('')); } catch (_) { return str; }
    }
    function deobfuscate(str) {
        if (!str) return '';
        try { return atob(str).split('').reverse().join(''); } catch (_) { return str; }
    }

    function getConfig() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return defaultConfig();
            const cfg = JSON.parse(raw);
            const merged = Object.assign(defaultConfig(), cfg);
            // 解混淆 Key
            if (merged.apiKey && !merged.apiKey.startsWith('sk-')) {
                merged.apiKey = deobfuscate(merged.apiKey);
            }
            return merged;
        } catch (e) {
            return defaultConfig();
        }
    }
    function defaultConfig() {
        return {
            enabled: true,
            provider: 'siliconflow',
            apiKey: '',
            baseUrl: PROVIDERS.siliconflow.baseUrl,
            model: PROVIDERS.siliconflow.defaultModel,
            temperature: 0.85,
            persona: 'gentle',
            cacheEnabled: true
        };
    }
    function saveConfig(cfg) {
        const merged = Object.assign(getConfig(), cfg || {});
        // 存储时混淆 Key
        const toSave = Object.assign({}, merged);
        if (toSave.apiKey && toSave.apiKey.startsWith('sk-')) {
            toSave.apiKey = obfuscate(toSave.apiKey);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        return merged;
    }
    function isEnabled() {
        const c = getConfig();
        return !!(c.enabled && c.apiKey && c.baseUrl && c.model);
    }

    // ===== 缓存层 =====
    function loadCache() {
        try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch (_) { return {}; }
    }
    function saveCache(obj) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(obj)); } catch (_) {}
    }
    function pruneCache() {
        const all = loadCache();
        const now = Date.now();
        let dirty = false;
        Object.keys(all).forEach(k => {
            if (!all[k] || now - all[k].t > CACHE_TTL) { delete all[k]; dirty = true; }
        });
        if (dirty) saveCache(all);
    }
    function cacheKey(payload, persona) {
        // 牌面 + 问题 + 人格 + 主题 + 模型
        const cards = (payload.cards || []).map(c => `${c.name}|${c.reversed?1:0}|${c.positionName||''}`).join('/');
        const cfg = getConfig();
        return [payload.question || '', payload.spreadName || '', payload.topic || '',
                cards, persona || cfg.persona, cfg.model].join('::');
    }
    function getCachedReading(payload, persona) {
        if (!getConfig().cacheEnabled) return null;
        pruneCache();
        const all = loadCache();
        const k = cacheKey(payload, persona);
        const v = all[k];
        if (v && Date.now() - v.t < CACHE_TTL) return v.text;
        return null;
    }
    function setCachedReading(payload, persona, text) {
        if (!getConfig().cacheEnabled) return;
        const all = loadCache();
        const k = cacheKey(payload, persona);
        all[k] = { t: Date.now(), text };
        saveCache(all);
    }

    // ===== Prompt 构造 =====
    function buildSystemPrompt(personaKey) {
        const p = getPersona(personaKey || getConfig().persona);
        return `你是一位资深的塔罗牌占卜师，名为「星辰」。
当前你的角色定位是「${p.name}」：${p.desc}。
说话风格：${p.voice}
整体基调：${p.tone}

请严格遵守：
1. 用中文回答，严格基于用户给出的牌面、正逆位、牌阵位置进行解读，不要编造其他牌。
2. 回答结构：先逐张解读（结合位置含义），再给出整体能量分析，最后给出 2-3 条具体可执行的行动建议。
3. 不使用"会发生""一定""绝对"等绝对化语言，强调概率与可能性，尊重用户的自主选择。
4. 语言精炼，每段不超过 80 字，使用 Markdown 列表 / 加粗使要点突出。
5. 不要任何免责声明、不要提及"我是 AI"、不要"作为塔罗占卜师"开场。
6. 请始终保持「${p.name}」的语气与风格，不要中途切换。`;
    }

    // 读取用户画像（来自 Onboarding 心理画像）
    function getUserProfile() {
        try { return JSON.parse(localStorage.getItem('tarot_profile') || '{}') || {}; }
        catch (_) { return {}; }
    }
    function buildProfileHint() {
        const p = getUserProfile();
        const hints = [];
        if (p.name) hints.push(`称呼：${p.name}`);
        if (p.zodiac) {
            const ZH = {aries:'白羊',taurus:'金牛',gemini:'双子',cancer:'巨蟹',leo:'狮子',virgo:'处女',libra:'天秤',scorpio:'天蝎',sagittarius:'射手',capricorn:'摩羯',aquarius:'水瓶',pisces:'双鱼'};
            hints.push(`星座：${ZH[p.zodiac] || p.zodiac}`);
        }
        if (p.focus) {
            const FL = {love:'感情',career:'事业',money:'财运',spiritual:'心灵成长',mixed:'综合'};
            hints.push(`最关注：${FL[p.focus] || p.focus}`);
        }
        if (p.level) {
            const LL = {beginner:'塔罗新手（请多解释术语）',intermediate:'有一定塔罗基础',advanced:'塔罗熟练玩家（可以直接深入）'};
            hints.push(`熟悉度：${LL[p.level] || p.level}`);
        }
        return hints.length ? hints.join('；') : '';
    }

    function buildUserPrompt(payload) {
        const { question, spreadName, cards, topic } = payload;
        const lines = [];
        const profileHint = buildProfileHint();
        if (profileHint) lines.push(`【用户画像】${profileHint}`);
        lines.push(`【问题】${question || '（用户未填写明确问题，请就当下能量做整体洞察）'}`);
        lines.push(`【主题领域】${topic || '心灵成长'}`);
        lines.push(`【牌阵】${spreadName || '自由牌阵'}`);
        lines.push(`【抽到的牌】`);
        cards.forEach((c, i) => {
            const orient = c.reversed ? '逆位' : '正位';
            const pos = c.positionName ? `「${c.positionName}」（${c.positionDesc || ''}）` : `第 ${i + 1} 张`;
            const kw = (c.keywords || []).slice(0, 4).join('、');
            lines.push(`${i + 1}. ${pos} → ${c.name}（${orient}）｜关键词：${kw}`);
        });
        lines.push('');
        lines.push('请按以下结构输出 Markdown：');
        lines.push('### 🔮 逐张解读');
        lines.push('（每张牌一段）');
        lines.push('');
        lines.push('### 🌌 整体能量');
        lines.push('（综合所有牌面的能量走向，3-5 句）');
        lines.push('');
        lines.push('### ✨ 行动建议');
        lines.push('（2-3 条 bullet，每条具体可执行）');
        return lines.join('\n');
    }

    // 多轮追问的 system 提示
    function buildFollowupSystem(personaKey) {
        const p = getPersona(personaKey || getConfig().persona);
        return `你是塔罗占卜师「星辰」，现在的人格是「${p.name}」：${p.voice}

当前正处于一次塔罗解读的"追问"阶段。用户在你之前给出的牌面与解读基础上继续提问。
请遵守：
1. 必须基于先前已经摊开的牌面（不要再抽新牌、不要编造新牌）。
2. 回答简洁，2-4 段，每段不超过 60 字。
3. 可以引用一两张关键牌强化论据，但不要重复完整解读。
4. 始终保持「${p.name}」的语气。`;
    }

    // ===== 通用调用底层 =====
    async function callChat(messages, onDelta, opts) {
        if (!isEnabled()) throw new Error('AI 解读未启用或未配置 API Key');
        const cfg = getConfig();
        const url = (cfg.baseUrl.replace(/\/$/, '')) + '/chat/completions';
        const body = {
            model: cfg.model,
            stream: true,
            temperature: (opts && opts.temperature != null) ? opts.temperature : cfg.temperature,
            messages
        };
        const ctrl = (opts && opts.signal) ? opts.signal : null;
        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + cfg.apiKey
            },
            body: JSON.stringify(body),
            signal: ctrl || undefined
        });
        if (!resp.ok) {
            const txt = await resp.text().catch(() => '');
            throw new Error(`AI 服务返回 ${resp.status}：${txt.slice(0, 200)}`);
        }
        if (!resp.body || !resp.body.getReader) {
            const data = await resp.json();
            const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
            if (onDelta) onDelta(text);
            return text;
        }
        const reader = resp.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let full = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let idx;
            while ((idx = buffer.indexOf('\n')) >= 0) {
                const line = buffer.slice(0, idx).trim();
                buffer = buffer.slice(idx + 1);
                if (!line) continue;
                if (!line.startsWith('data:')) continue;
                const data = line.slice(5).trim();
                if (data === '[DONE]') return full;
                try {
                    const json = JSON.parse(data);
                    const delta = json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content;
                    if (delta) {
                        full += delta;
                        if (onDelta) onDelta(delta);
                    }
                } catch (e) { /* 忽略不合法行 */ }
            }
        }
        return full;
    }

    // ===== 首轮解读（含缓存）=====
    async function streamReading(payload, onDelta, opts) {
        opts = opts || {};
        const personaKey = opts.persona || getConfig().persona;
        // 命中缓存：直接逐段播放
        const cached = getCachedReading(payload, personaKey);
        if (cached && !opts.skipCache) {
            // 模拟流式输出，提升一致体验
            if (onDelta) {
                const chunkSize = 4;
                for (let i = 0; i < cached.length; i += chunkSize) {
                    onDelta(cached.slice(i, i + chunkSize));
                    await new Promise(r => setTimeout(r, 12));
                }
            }
            return cached;
        }
        const messages = [
            { role: 'system', content: buildSystemPrompt(personaKey) },
            { role: 'user',   content: buildUserPrompt(payload) }
        ];
        const full = await callChat(messages, onDelta, opts);
        if (full) setCachedReading(payload, personaKey, full);
        return full;
    }

    // ===== 多轮追问 =====
    // history: [{ role: 'user'|'assistant', content: '...' }, ...]
    //   会自动在前面 prepend：system + 首轮 user prompt + 首轮 assistant 解读
    // payload: 同 streamReading（用于构造首轮上下文）
    // firstAnswer: 首轮 AI 给出的完整解读文本
    // followupQuestion: 用户新一轮的问题
    async function streamFollowup({ payload, firstAnswer, history, followupQuestion }, onDelta, opts) {
        opts = opts || {};
        const personaKey = opts.persona || getConfig().persona;
        const messages = [
            { role: 'system', content: buildFollowupSystem(personaKey) },
            { role: 'user', content: buildUserPrompt(payload) },
            { role: 'assistant', content: firstAnswer || '（无）' }
        ];
        // 之前的追问历史
        if (Array.isArray(history)) {
            history.forEach(m => {
                if (m && (m.role === 'user' || m.role === 'assistant') && m.content) {
                    messages.push({ role: m.role, content: m.content });
                }
            });
        }
        // 本轮新问题
        messages.push({ role: 'user', content: followupQuestion });
        return callChat(messages, onDelta, opts);
    }

    // ===== 周复盘：基于近期日记 + 抽牌组合生成情绪/主题摘要 =====
    // payload: { journals: [{date, text, cardName}], readings: [{date, topic, cards, question}], days, persona }
    function buildRecapSystem(personaKey) {
        const p = getPersona(personaKey || getConfig().persona);
        return `你是塔罗占卜师「星辰」，现在的人格是「${p.name}」：${p.voice}

现在你的任务是为用户做"近期心灵复盘"。基于他/她最近的日记片段与抽牌记录，识别：
1. 反复出现的情绪主题（如"等待""焦虑""自我怀疑"）
2. 抽牌组合呈现的能量模式（如多张逆位 / 圣杯密集 / 重复出现的牌）
3. 日记文字与塔罗牌面之间的呼应关系
4. 一句温柔却直击核心的洞察

请严格遵守：
- 全程使用「${p.name}」的语气（${p.tone}）。
- 输出 Markdown，结构精炼：先三个最强信号（用 emoji + 加粗短句），再一段不超过 80 字的整体洞察。
- 不要罗列日记原文，只做模式识别。
- 不超过 220 字总长。
- 不要"作为 AI"开场，不要免责声明。`;
    }
    function buildRecapUser(payload) {
        const lines = [];
        lines.push(`【时间范围】最近 ${payload.days || 7} 天`);
        if (payload.journals && payload.journals.length) {
            lines.push(`【日记片段】共 ${payload.journals.length} 篇`);
            payload.journals.slice(0, 8).forEach((j, i) => {
                const card = j.cardName ? `[${j.cardName}] ` : '';
                lines.push(`${i + 1}. ${j.date} ${card}${(j.text || '').slice(0, 90)}`);
            });
        } else {
            lines.push(`【日记片段】无`);
        }
        if (payload.readings && payload.readings.length) {
            lines.push(`【抽牌记录】共 ${payload.readings.length} 次`);
            payload.readings.slice(0, 6).forEach((r, i) => {
                const cardList = (r.cards || []).slice(0, 4).map(c => `${c.name}${c.reversed ? '逆' : ''}`).join('·');
                lines.push(`${i + 1}. ${r.date}｜${r.topic || '心灵'}｜${cardList}${r.question ? '｜问：' + r.question.slice(0, 30) : ''}`);
            });
        }
        lines.push('');
        lines.push('请输出 Markdown：');
        lines.push('### 三个最强信号');
        lines.push('- 🌀 **xx** —— 一句描述');
        lines.push('- 🌙 **xx** —— 一句描述');
        lines.push('- ✨ **xx** —— 一句描述');
        lines.push('');
        lines.push('### 整体洞察');
        lines.push('（一段不超过 80 字的核心洞察）');
        return lines.join('\n');
    }
    async function streamRecap(payload, onDelta, opts) {
        opts = opts || {};
        const personaKey = opts.persona || getConfig().persona;
        const messages = [
            { role: 'system', content: buildRecapSystem(personaKey) },
            { role: 'user',   content: buildRecapUser(payload) }
        ];
        return callChat(messages, onDelta, opts);
    }

    // ===== 测试连接 =====
    async function testConnection(tempCfg) {
        const cfg = Object.assign(getConfig(), tempCfg || {});
        if (!cfg.apiKey || !cfg.baseUrl || !cfg.model) {
            throw new Error('请先填写 API Key / Base URL / 模型');
        }
        const url = (cfg.baseUrl.replace(/\/$/, '')) + '/chat/completions';
        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + cfg.apiKey
            },
            body: JSON.stringify({
                model: cfg.model,
                stream: false,
                max_tokens: 20,
                messages: [{ role: 'user', content: '说"连接成功"四个字' }]
            })
        });
        if (!resp.ok) {
            const txt = await resp.text().catch(() => '');
            throw new Error(`HTTP ${resp.status}：${txt.slice(0, 200)}`);
        }
        const data = await resp.json();
        const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
        return reply || '（无回复）';
    }

    // ===== 准备 payload（从 reading 对象提取 LLM 需要的信息）=====
    function buildPayloadFromReading(reading, question, spread) {
        const cards = (reading.singleReadings || []).map(r => ({
            name: r.card.name,
            reversed: r.card.reversed,
            keywords: r.card.keywords,
            positionName: r.position && r.position.name,
            positionDesc: r.position && r.position.desc
        }));
        return {
            question,
            spreadName: spread && spread.name,
            cards,
            topic: reading.topicLabel
        };
    }

    // 清空缓存
    function clearCache() {
        try { localStorage.removeItem(CACHE_KEY); } catch (_) {}
    }

    // 暴露
    window.TarotAI = {
        PROVIDERS,
        PERSONAS,
        getPersona,
        getConfig,
        saveConfig,
        isEnabled,
        streamReading,
        streamFollowup,
        streamRecap,
        testConnection,
        buildPayloadFromReading,
        clearCache
    };

    console.log('✓ Tarot AI 模块 v2 已就绪');
})();
