/**
 * 塔罗解读引擎
 * - 根据牌面 / 正逆位 / 牌阵位置 / 问题领域 生成专业解读
 * - 综合多张牌生成牌阵整体解读
 */

(function() {
    'use strict';

    // ===== 问题领域识别 =====
    const TOPIC_KEYWORDS = {
        love:    ['感情','爱情','恋人','男友','女友','喜欢','分手','复合','暧昧','婚姻','结婚','TA','他','她','缘分','心动','暗恋','单身','约会'],
        career:  ['工作','事业','职业','跳槽','面试','升职','加薪','老板','同事','创业','项目','团队','离职','辞职','岗位','机会','转行'],
        money:   ['财','钱','投资','股票','理财','收入','花钱','买','卖房','贷款','债','基金','收益','创业'],
        health:  ['健康','身体','病','医生','治疗','疼','睡眠','失眠','压力','焦虑','减肥','运动'],
        spiritual:['心灵','灵性','信仰','迷茫','意义','人生','觉醒','成长','自我','内心','冥想','直觉']
    };
    function detectTopic(question) {
        if (!question) return 'spiritual';
        const scores = {};
        for (const [topic, kws] of Object.entries(TOPIC_KEYWORDS)) {
            scores[topic] = kws.filter(k => question.includes(k)).length;
        }
        let best = 'spiritual', max = 0;
        for (const [t, s] of Object.entries(scores)) { if (s > max) { max = s; best = t; } }
        return max > 0 ? best : 'spiritual';
    }

    // 中文主题展示
    const TOPIC_LABEL = {
        love: '感情', career: '事业', money: '财务', health: '健康', spiritual: '心灵'
    };

    // ===== 抽牌逻辑（含正逆位）=====
    // 逆位概率可在设置中调节：localStorage['tarot_reversal_rate']，默认 0.3
    function getReversalRate() {
        try {
            const v = parseFloat(localStorage.getItem('tarot_reversal_rate'));
            if (isNaN(v)) return 0.3;
            return Math.max(0, Math.min(1, v));
        } catch (_) { return 0.3; }
    }
    function drawCards(count) {
        const pool = [...window.TAROT_CARDS];
        const out = [];
        const rate = getReversalRate();
        for (let i = 0; i < count; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            const card = pool.splice(idx, 1)[0];
            const isRev = rate > 0 && Math.random() < rate;
            out.push({
                ...card,
                reversedMeaning: card.reversed,  // 保留原始逆位含义文本
                reversed: isRev                   // 布尔值：是否逆位
            });
        }
        return out;
    }

    // ===== 单张牌解读 =====
    function readSingleCard(card, position, topic) {
        const orientation = card.reversed ? '逆位' : '正位';
        const meaning = card.reversed ? (card.reversedMeaning || '') : (card.upright || '');
        const topicMeaning = (card.meanings && card.meanings[topic]) || '';

        const positionContext = position ? `「${position.name}」位置（${position.desc}）` : '';
        const topicContext = topic && TOPIC_LABEL[topic] ? `${TOPIC_LABEL[topic]}面` : '';

        let reading = '';
        if (positionContext) reading += `在${positionContext}出现`;
        reading += `${card.name}（${orientation}），`;
        reading += `这意味着${meaning}`;
        if (topicMeaning) {
            reading += ` 在${topicContext}：${topicMeaning}${card.reversed ? '。但当下能量略受阻，需要内观' : '。'}`;
        }
        return reading;
    }

    // ===== 牌阵综合解读 =====
    function generateSpreadReading(cards, spread, question) {
        const topic = detectTopic(question);
        const topicLabel = TOPIC_LABEL[topic] || '心灵';

        // 单张解读
        const singleReadings = cards.map((card, i) => {
            const pos = spread.positions[i];
            return {
                position: pos,
                card: card,
                text: readSingleCard(card, pos, topic)
            };
        });

        // 整体能量分析
        const summary = analyzeOverall(cards, spread, topic);

        // 行动建议
        const advice = generateAdvice(cards, spread, topic);

        return {
            topic,
            topicLabel,
            singleReadings,
            summary,
            advice
        };
    }

    // ===== 整体能量分析 =====
    function analyzeOverall(cards, spread, topic) {
        // 元素统计
        const elements = { '火': 0, '水': 0, '风': 0, '土': 0 };
        let majorCount = 0, reversedCount = 0;
        cards.forEach(c => {
            if (c.element && elements[c.element] !== undefined) elements[c.element]++;
            if (c.arcana === 'major') majorCount++;
            if (c.reversed) reversedCount++;
        });

        const totalCards = cards.length;
        const dominantElement = Object.entries(elements).sort((a,b) => b[1]-a[1])[0];
        const elementName = { '火': '火（行动激情）', '水': '水（情感直觉）', '风': '风（思想沟通）', '土': '土（物质实践）' };

        let analysis = '';

        // 大牌占比
        if (majorCount >= Math.ceil(totalCards * 0.5)) {
            analysis += '✦ 牌阵中**大阿尔卡纳占主导**，预示着重要的人生议题或命运层面的转折——这不是一件可轻视的小事。';
        } else if (majorCount === 0) {
            analysis += '✦ 全部是小阿尔卡纳，事件停留在日常生活的层面，可以通过具体行动调整。';
        } else {
            analysis += `✦ 牌阵中有 ${majorCount} 张大牌，事件中既有命运指引也有生活实践层面。`;
        }

        analysis += '\n\n';

        // 主导元素
        if (dominantElement[1] > 0) {
            analysis += `✦ 主导能量为**${elementName[dominantElement[0]]}**：`;
            const elementAdvice = {
                '火': '当下你处在行动与激情的能量场，适合主动出击、开创局面。',
                '水': '情绪与直觉是关键线索，多倾听内心而非分析。',
                '风': '理性思考与有效沟通会带来突破，列清思路。',
                '土': '脚踏实地，关注具体的资源、健康、物质层面。'
            };
            analysis += elementAdvice[dominantElement[0]];
        }

        analysis += '\n\n';

        // 逆位占比
        const reversedRatio = reversedCount / totalCards;
        if (reversedRatio >= 0.6) {
            analysis += '⚠ 多张牌呈逆位，提示当下能量受阻，问题更多源于内在的抗拒或未察觉的盲点。';
        } else if (reversedRatio >= 0.3) {
            analysis += '◯ 部分牌为逆位，事件有一些需要调整与反思的地方。';
        } else if (reversedRatio === 0) {
            analysis += '✓ 所有牌为正位，能量畅通，是行动的好时机。';
        }

        return analysis;
    }

    // ===== 行动建议生成 =====
    function generateAdvice(cards, spread, topic) {
        const lastCard = cards[cards.length - 1];
        const adviceMap = {
            love: {
                positive: '在感情上，敞开心扉、表达真实感受。爱不是控制，而是流动。',
                negative: '感情需要冷静期，先与自己和解，外在的关系才会平稳。',
                neutral: '保持当下的节奏，不强求也不放弃，让缘分自然流转。'
            },
            career: {
                positive: '事业上是积极行动的时刻，把握机会，主动展现能力。',
                negative: '工作中的瓶颈是成长的契机，慢下来重新审视方向。',
                neutral: '稳扎稳打，专注眼前的任务，长远的规划自然显现。'
            },
            money: {
                positive: '财务运势上扬，可以考虑稳健的扩张或投资。',
                negative: '当前不宜大动作，先守住本金，避免冲动消费。',
                neutral: '理性记账，开源节流，财富会缓慢增长。'
            },
            health: {
                positive: '身心状态良好，是养成新习惯、增强体能的好时机。',
                negative: '注意身体发出的信号，必要时寻求专业帮助，不要硬撑。',
                neutral: '保持作息规律、均衡饮食、适度运动，是基础也是关键。'
            },
            spiritual: {
                positive: '灵性能量在觉醒中，相信内心的引导，去做让你内心欢愉的事。',
                negative: '你正处在心灵的过渡期，允许自己迷茫，答案会在静默中浮现。',
                neutral: '在日常中保持觉察与冥想，宇宙正以微妙的方式回应你。'
            }
        };

        // 简单判断牌的能量倾向
        const tone = judgeCardTone(lastCard);
        return adviceMap[topic][tone];
    }

    function judgeCardTone(card) {
        // 正能量牌
        const positiveCards = ['愚者','魔术师','皇后','恋人','战车','力量','命运之轮','节制','星辰','太阳','审判','世界',
                                '权杖三','权杖四','权杖六','圣杯一','圣杯二','圣杯三','圣杯六','圣杯九','圣杯十',
                                '宝剑一','宝剑六','星币一','星币三','星币六','星币九','星币十'];
        // 挑战类牌
        const negativeCards = ['死神','恶魔','塔','月亮','权杖五','权杖七','权杖九','权杖十',
                                '圣杯四','圣杯五','圣杯七','圣杯八',
                                '宝剑三','宝剑五','宝剑七','宝剑八','宝剑九','宝剑十',
                                '星币四','星币五'];
        if (card.reversed) {
            // 逆位翻转能量
            if (positiveCards.includes(card.name)) return 'negative';
            if (negativeCards.includes(card.name)) return 'positive';
            return 'neutral';
        }
        if (positiveCards.includes(card.name)) return 'positive';
        if (negativeCards.includes(card.name)) return 'negative';
        return 'neutral';
    }

    // ===== 追问解读 =====
    function generateFollowupAnswer(question, originalCards) {
        const topic = detectTopic(question);
        const topicLabel = TOPIC_LABEL[topic];
        // 从原牌阵中随机选一张做关键信号
        const sigCard = originalCards[Math.floor(Math.random() * originalCards.length)];

        const templates = [
            `从${sigCard.name}（${sigCard.reversed ? '逆位' : '正位'}）的能量来看：${sigCard.reversed ? sigCard.reversed : sigCard.upright}`,
            `${topicLabel}方面的回应：${(sigCard.meanings && sigCard.meanings[topic]) || sigCard.upright}。`,
            `塔罗补充指引：你感受到的不安来自${sigCard.keywords[0] || '内在'}，但${sigCard.keywords[1] || '答案'}就在不远处。`,
            `这张${sigCard.name}告诉你：${sigCard.upright.split('，')[0]}。耐心倾听内在的声音。`,
            `换个角度看，宇宙正用「${sigCard.keywords.join('·')}」的能量回应你的疑问。`
        ];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    // ===== 暴露 API =====
    window.TarotEngine = {
        detectTopic,
        drawCards,
        getReversalRate,
        generateSpreadReading,
        generateFollowupAnswer,
        TOPIC_LABEL,
        getTopicEmoji: (topic) => ({
            love: '💕', career: '💼', money: '🌟', health: '🌿', spiritual: '🧘'
        }[topic] || '✨')
    };

    console.log('✓ Tarot Engine 已就绪');
})();
