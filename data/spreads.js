/**
 * 塔罗牌阵数据
 */

window.TAROT_SPREADS = {
    // 1 张牌
    single: {
        key: 'single', name: '单牌指引', subtitle: '快速获得一个答案',
        emoji: '🎴', cards: 1, level: 'beginner',
        positions: [
            { idx: 0, name: '指引', desc: '此刻你最需要知道的讯息' }
        ],
        howTo: '当你需要简单直接的答案时，单牌是最佳选择。专注于问题，凭直觉抽取一张。',
        suitableFor: ['日常指引', '今日运势', '快速决策']
    },
    // 3 张牌 - 时间流
    three: {
        key: 'three', name: '三牌时光', subtitle: '过去·现在·未来',
        emoji: '🔮', cards: 3, level: 'beginner',
        positions: [
            { idx: 0, name: '过去', desc: '影响当下的过往因素' },
            { idx: 1, name: '现在', desc: '此刻的核心能量' },
            { idx: 2, name: '未来', desc: '即将到来的趋势' }
        ],
        howTo: '经典的时间流牌阵，了解事件的来龙去脉。',
        suitableFor: ['了解事件全貌', '感情走向', '决策影响']
    },
    // 3 张牌 - 爱情
    love: {
        key: 'love', name: '爱情牌阵', subtitle: '你·TA·关系走向',
        emoji: '💫', cards: 3, level: 'beginner',
        positions: [
            { idx: 0, name: '你', desc: '你在这段关系中的状态' },
            { idx: 1, name: 'TA', desc: '对方在关系中的状态' },
            { idx: 2, name: '关系', desc: '关系的发展方向' }
        ],
        howTo: '专注于双方的内心状态和关系的走向。',
        suitableFor: ['感情困惑', '了解对方', '关系评估']
    },
    // 3 张牌 - 决策
    decision: {
        key: 'decision', name: '决策牌阵', subtitle: '选项A · 选项B · 建议',
        emoji: '⚖️', cards: 3, level: 'intermediate',
        positions: [
            { idx: 0, name: '选项A', desc: '第一个选择的能量' },
            { idx: 1, name: '选项B', desc: '第二个选择的能量' },
            { idx: 2, name: '建议', desc: '宇宙给你的建议' }
        ],
        howTo: '在面对二选一的难题时使用，对比两个选择的能量。',
        suitableFor: ['二选一', '工作决定', '是否分手']
    },
    // 5 张牌 - 十字牌阵
    cross: {
        key: 'cross', name: '十字牌阵', subtitle: '深度分析全局',
        emoji: '✦', cards: 5, level: 'intermediate',
        positions: [
            { idx: 0, name: '当前', desc: '当下的核心状态' },
            { idx: 1, name: '挑战', desc: '需要面对的课题' },
            { idx: 2, name: '过去', desc: '影响现在的过往' },
            { idx: 3, name: '未来', desc: '近期的趋势' },
            { idx: 4, name: '建议', desc: '宇宙的指引' }
        ],
        howTo: '对单一问题做较深入的分析，看到事件的全貌与建议。',
        suitableFor: ['复杂问题', '人生方向', '深度反思']
    },
    // 10 张牌 - 凯尔特十字
    celtic: {
        key: 'celtic', name: '凯尔特十字', subtitle: '塔罗最经典的牌阵',
        emoji: '🔯', cards: 10, level: 'advanced',
        positions: [
            { idx: 0, name: '现状',     desc: '问题的核心状态' },
            { idx: 1, name: '阻碍',     desc: '横亘在前的挑战或助力' },
            { idx: 2, name: '潜意识',   desc: '深层的根源动机' },
            { idx: 3, name: '过去',     desc: '逐渐淡出的影响' },
            { idx: 4, name: '显意识',   desc: '你期望或意识到的目标' },
            { idx: 5, name: '未来',     desc: '即将到来的能量' },
            { idx: 6, name: '自我',     desc: '你对此事的真实态度' },
            { idx: 7, name: '环境',     desc: '外界他人的影响' },
            { idx: 8, name: '希望恐惧', desc: '你的期待与担忧' },
            { idx: 9, name: '最终结果', desc: '问题的最终走向' }
        ],
        howTo: '塔罗中最完整、最深入的牌阵。适合人生重大议题的全方位探索。',
        suitableFor: ['重大议题', '人生十字路口', '深度心灵探索']
    },
    // 7 张牌 - 关系合盘
    relationship: {
        key: 'relationship', name: '关系合盘', subtitle: '两人关系的深度解读',
        emoji: '💞', cards: 7, level: 'advanced',
        positions: [
            { idx: 0, name: '我',       desc: '你在这段关系中的状态与能量' },
            { idx: 1, name: '对方',     desc: '对方在关系中的状态与感受' },
            { idx: 2, name: '关系现状', desc: '两人关系的当前能量与氛围' },
            { idx: 3, name: '挑战',     desc: '关系中需要面对的课题与阻碍' },
            { idx: 4, name: '机会',     desc: '关系中的成长空间与机会' },
            { idx: 5, name: '建议',     desc: '宇宙给这段关系的建议' },
            { idx: 6, name: '可能的结果', desc: '关系可能的发展方向' }
        ],
        howTo: '适合已有对象或暧昧中的两人，从灵魂层面解读关系的能量流动与未来可能。',
        suitableFor: ['恋爱关系', '婚姻关系', '合作伙伴', '深度友情']
    }
};
console.log(`✓ 已加载 ${Object.keys(window.TAROT_SPREADS).length} 个牌阵`);
