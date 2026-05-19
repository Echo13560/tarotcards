/**
 * 完整 78 张韦特塔罗牌数据
 * - 22 张大阿尔卡纳（Major Arcana）
 * - 56 张小阿尔卡纳（Minor Arcana）：权杖/圣杯/宝剑/星币 各 14 张
 *
 * 字段说明：
 * - id: 唯一标识
 * - name: 中文名
 * - nameEn: 英文名
 * - number: 牌面数字
 * - arcana: 'major' | 'minor'
 * - suit: 仅小牌有 - 'wands'(权杖/火) | 'cups'(圣杯/水) | 'swords'(宝剑/风) | 'pentacles'(星币/土)
 * - symbol: 显示用的 emoji/符号
 * - keywords: 关键词数组
 * - upright: 正位含义
 * - reversed: 逆位含义
 * - element: 元素属性
 * - meanings: 按主题分类的含义 { love, career, money, health, spiritual }
 */

window.TAROT_CARDS = [
    // ========== 大阿尔卡纳 22 张 ==========
    {
        id: 'major-0', name: '愚者', nameEn: 'The Fool', number: 0, arcana: 'major',
        symbol: '🌟', element: '风', keywords: ['新开始', '冒险', '纯真', '无限可能'],
        upright: '充满好奇与勇气，无畏地踏上新旅程。相信直觉，跳跃信任的悬崖。',
        reversed: '鲁莽行事，缺乏规划。可能错过重要细节或承担不必要的风险。',
        meanings: {
            love: '一段全新的感情即将开启，敞开心扉拥抱未知',
            career: '勇敢尝试新方向，机会属于敢于冒险的人',
            money: '可能有意外收获，但要避免冲动消费',
            health: '保持轻松心态，新的健康习惯值得尝试',
            spiritual: '回归赤子之心，宇宙正引领你走向意想不到的旅程'
        }
    },
    {
        id: 'major-1', name: '魔术师', nameEn: 'The Magician', number: 1, arcana: 'major',
        symbol: '✨', element: '风', keywords: ['创造力', '意志力', '行动', '才能'],
        upright: '你拥有实现目标所需的一切资源，是时候将想法化为现实。',
        reversed: '才能被滥用或误导，可能存在欺骗或自我怀疑。',
        meanings: {
            love: '主动出击的时刻，你拥有吸引爱情的魅力',
            career: '将技能与机会结合，这是大展身手的时机',
            money: '善用资源，财富来自你的行动力',
            health: '心念决定身体，积极意念能带来疗愈',
            spiritual: '你是自己命运的创造者'
        }
    },
    {
        id: 'major-2', name: '女祭司', nameEn: 'The High Priestess', number: 2, arcana: 'major',
        symbol: '🌙', element: '水', keywords: ['直觉', '潜意识', '神秘', '内在智慧'],
        upright: '聆听内心深处的声音，答案藏在你的潜意识里。',
        reversed: '忽视直觉，被表象蒙蔽。需要重新连接内在智慧。',
        meanings: {
            love: '感情中存在未说出口的真相，用心感受',
            career: '不要只看表面信息，深入挖掘隐藏的机会',
            money: '相信你对财务的直觉判断',
            health: '关注身心连接，冥想会带来洞察',
            spiritual: '神秘智慧正在向你敞开'
        }
    },
    {
        id: 'major-3', name: '皇后', nameEn: 'The Empress', number: 3, arcana: 'major',
        symbol: '🌺', element: '土', keywords: ['丰饶', '母性', '感性', '创造'],
        upright: '丰盛与滋养的能量环绕你，是孕育美好事物的时机。',
        reversed: '过度依赖或情感窒息，需要重新找回自我空间。',
        meanings: {
            love: '充满爱与关怀的时期，可能有怀孕或新生命',
            career: '创意工作有重大突破，团队协作顺畅',
            money: '财富稳定增长，投资可考虑长期项目',
            health: '关注身体的感性需求，享受美食与按摩',
            spiritual: '与大地母亲的能量连接'
        }
    },
    {
        id: 'major-4', name: '皇帝', nameEn: 'The Emperor', number: 4, arcana: 'major',
        symbol: '👑', element: '火', keywords: ['权威', '稳固', '秩序', '保护'],
        upright: '建立稳固的根基，用理性和领导力掌控局面。',
        reversed: '权力滥用或过度控制，可能遭遇专横的人或事。',
        meanings: {
            love: '关系需要明确的承诺与边界',
            career: '领导能力受认可，适合担任管理角色',
            money: '理财需要纪律，长期规划是关键',
            health: '建立规律作息，结构化的健身计划有效',
            spiritual: '内在权威的觉醒，做自己生活的国王'
        }
    },
    {
        id: 'major-5', name: '教皇', nameEn: 'The Hierophant', number: 5, arcana: 'major',
        symbol: '📿', element: '土', keywords: ['传统', '教导', '信仰', '指引'],
        upright: '寻求智者指引，遵循传统智慧。学习与传承的时刻。',
        reversed: '挑战传统，打破规则。需要找到自己的道路。',
        meanings: {
            love: '考虑承诺的关系或正式的结合',
            career: '导师或培训会带来重要成长',
            money: '保守理财策略，不要轻易尝试投机',
            health: '尝试传统疗法或寻求专业医师',
            spiritual: '加入精神社群，跟随灵性导师'
        }
    },
    {
        id: 'major-6', name: '恋人', nameEn: 'The Lovers', number: 6, arcana: 'major',
        symbol: '💕', element: '风', keywords: ['爱情', '选择', '结合', '价值观'],
        upright: '面临重要的人生选择，跟随心的声音。深刻的连接正在发生。',
        reversed: '关系失衡，价值观冲突。可能是错误的选择或诱惑。',
        meanings: {
            love: '灵魂伴侣的相遇或关系升华到新阶段',
            career: '面对重要的职业选择，遵循内心',
            money: '财务决定要兼顾理智与情感',
            health: '伴侣的支持有助于康复',
            spiritual: '内外合一的整合时刻'
        }
    },
    {
        id: 'major-7', name: '战车', nameEn: 'The Chariot', number: 7, arcana: 'major',
        symbol: '⚡', element: '水', keywords: ['决心', '胜利', '前进', '掌控'],
        upright: '凭借强烈的意志力征服困难，胜利就在前方。',
        reversed: '失去方向或控制，内心冲突阻碍前行。',
        meanings: {
            love: '克服感情障碍，坚定追求所爱',
            career: '事业突破的关键时刻，全力以赴',
            money: '财务目标即将达成，保持纪律',
            health: '战胜疾病的意志力强大',
            spiritual: '驾驭内在二元对立，走向合一'
        }
    },
    {
        id: 'major-8', name: '力量', nameEn: 'Strength', number: 8, arcana: 'major',
        symbol: '🦁', element: '火', keywords: ['勇气', '柔和', '内在力量', '耐心'],
        upright: '以柔克刚，用爱和耐心驯服恐惧。真正的力量来自内心。',
        reversed: '自我怀疑，被恐惧主导。需要重建自信。',
        meanings: {
            love: '用温柔与理解化解关系中的紧张',
            career: '保持自信但不咄咄逼人，赢得尊重',
            money: '用耐心和智慧应对财务挑战',
            health: '身心都在恢复力量，慢慢来',
            spiritual: '驯服内在的野性能量'
        }
    },
    {
        id: 'major-9', name: '隐者', nameEn: 'The Hermit', number: 9, arcana: 'major',
        symbol: '🏔', element: '土', keywords: ['内省', '独处', '智慧', '寻求真相'],
        upright: '独自上路寻找答案，内在的灯将照亮前方。',
        reversed: '过度孤立或固执己见。该走出洞穴拥抱世界了。',
        meanings: {
            love: '需要独处时间审视感情真相',
            career: '深入研究专业领域，闭关修炼',
            money: '审慎评估财务状况，独立判断',
            health: '休息和自我观察很重要',
            spiritual: '内在智慧的觉醒之路'
        }
    },
    {
        id: 'major-10', name: '命运之轮', nameEn: 'Wheel of Fortune', number: 10, arcana: 'major',
        symbol: '☸', element: '火', keywords: ['转变', '命运', '循环', '机遇'],
        upright: '命运的转折点，幸运降临，把握住机会。',
        reversed: '运势下行或抗拒变化。臣服于宇宙的安排。',
        meanings: {
            love: '感情进入新阶段，意外缘分出现',
            career: '事业转折，幸运之神眷顾',
            money: '财运起伏明显，把握时机',
            health: '健康状况转好，新的疗法见效',
            spiritual: '理解因果与循环的智慧'
        }
    },
    {
        id: 'major-11', name: '正义', nameEn: 'Justice', number: 11, arcana: 'major',
        symbol: '⚖', element: '风', keywords: ['公平', '真相', '因果', '决断'],
        upright: '做出公正的决定，真相将水落石出。承担责任。',
        reversed: '不公正或逃避责任。可能有法律纠纷或失衡。',
        meanings: {
            love: '感情中需要公平对待，承担应有的责任',
            career: '合同或法律事宜进展顺利',
            money: '财务问题得到公正解决',
            health: '生活方式需要平衡',
            spiritual: '业力清算，因果分明'
        }
    },
    {
        id: 'major-12', name: '倒吊人', nameEn: 'The Hanged Man', number: 12, arcana: 'major',
        symbol: '🔄', element: '水', keywords: ['牺牲', '换角度', '暂停', '顿悟'],
        upright: '换个角度看世界，暂停带来新的领悟。臣服中有自由。',
        reversed: '抗拒改变，停滞不前。无谓的牺牲。',
        meanings: {
            love: '从对方角度理解，可能需要暂时退让',
            career: '放慢脚步，从不同角度规划',
            money: '暂时的财务困境带来反思',
            health: '需要打破旧模式，尝试新的疗愈方式',
            spiritual: '通过臣服获得灵性顿悟'
        }
    },
    {
        id: 'major-13', name: '死神', nameEn: 'Death', number: 13, arcana: 'major',
        symbol: '🦋', element: '水', keywords: ['结束', '转化', '蜕变', '重生'],
        upright: '一个阶段的彻底结束，为新生让路。深刻的转化。',
        reversed: '抗拒改变，停留在过去。需要主动放手。',
        meanings: {
            love: '一段关系的结束或质变，蝴蝶破茧',
            career: '职业大转向，告别旧角色',
            money: '财务模式彻底改变',
            health: '不健康的习惯需要终结',
            spiritual: '小我的死亡，灵魂的重生'
        }
    },
    {
        id: 'major-14', name: '节制', nameEn: 'Temperance', number: 14, arcana: 'major',
        symbol: '🌈', element: '火', keywords: ['调和', '耐心', '平衡', '节度'],
        upright: '找到生活的中道，耐心调和不同元素。流动的平衡。',
        reversed: '失衡或过度。需要重新校准节奏。',
        meanings: {
            love: '关系中的和谐与调和',
            career: '团队协作流畅，资源整合得当',
            money: '财务平衡，量入为出',
            health: '身心平衡，节制饮食',
            spiritual: '炼金术般的内在融合'
        }
    },
    {
        id: 'major-15', name: '恶魔', nameEn: 'The Devil', number: 15, arcana: 'major',
        symbol: '😈', element: '土', keywords: ['束缚', '执念', '诱惑', '阴影'],
        upright: '识别自己的执念与束缚，那些枷锁其实是自己戴上的。',
        reversed: '挣脱束缚，重获自由。觉醒于成瘾或不健康关系。',
        meanings: {
            love: '关系中的依赖或控制，需要反思',
            career: '工作变成枷锁，重新审视价值',
            money: '物质执念或债务困扰',
            health: '不良习惯或成瘾问题',
            spiritual: '拥抱阴影，整合阴暗面'
        }
    },
    {
        id: 'major-16', name: '塔', nameEn: 'The Tower', number: 16, arcana: 'major',
        symbol: '⚡', element: '火', keywords: ['突变', '崩塌', '觉醒', '解放'],
        upright: '虚假的根基崩塌，真相如闪电般降临。破而后立。',
        reversed: '避免突变，但崩溃只是延迟。内在动荡。',
        meanings: {
            love: '关系经历震撼性事件，真相浮现',
            career: '职场剧变，可能失业或大调整',
            money: '财务突发状况，需做好准备',
            health: '突发健康警讯，重新审视生活',
            spiritual: '幻象破灭，灵魂觉醒'
        }
    },
    {
        id: 'major-17', name: '星辰', nameEn: 'The Star', number: 17, arcana: 'major',
        symbol: '⭐', element: '风', keywords: ['希望', '灵感', '疗愈', '指引'],
        upright: '黑暗后的星光，希望之火重燃。宇宙在指引你。',
        reversed: '失去信心或希望破灭。需要重新连接灵感源头。',
        meanings: {
            love: '感情中的疗愈与希望',
            career: '梦想中的事业方向显现',
            money: '财务前景光明，慢慢恢复',
            health: '身心疗愈，重获活力',
            spiritual: '与高我的连接更紧密'
        }
    },
    {
        id: 'major-18', name: '月亮', nameEn: 'The Moon', number: 18, arcana: 'major',
        symbol: '🌓', element: '水', keywords: ['幻象', '潜意识', '直觉', '迷雾'],
        upright: '走过迷雾，面对潜藏的恐惧。真相在月光下显现。',
        reversed: '迷雾散去，幻象破灭。情绪逐渐稳定。',
        meanings: {
            love: '感情迷茫或隐藏的真相',
            career: '工作中存在欺骗或不明朗',
            money: '财务有不确定性，谨慎判断',
            health: '心理或潜意识层面的困扰',
            spiritual: '深入潜意识探索'
        }
    },
    {
        id: 'major-19', name: '太阳', nameEn: 'The Sun', number: 19, arcana: 'major',
        symbol: '☀', element: '火', keywords: ['喜悦', '光明', '成功', '活力'],
        upright: '生命的光辉时刻，喜悦与成功并至。展现真我。',
        reversed: '暂时的乌云遮蔽，但光明仍在。需重燃热情。',
        meanings: {
            love: '阳光般的爱情，公开庆祝',
            career: '事业大放光彩，认可与奖励',
            money: '财运亨通，丰盛充裕',
            health: '健康状况极佳，活力满满',
            spiritual: '内在之光的彰显'
        }
    },
    {
        id: 'major-20', name: '审判', nameEn: 'Judgement', number: 20, arcana: 'major',
        symbol: '🎺', element: '火', keywords: ['觉醒', '召唤', '宽恕', '重生'],
        upright: '听从内心的召唤，做出重要决定。过去得以释怀。',
        reversed: '自我批判过度，无法宽恕。错过觉醒的机会。',
        meanings: {
            love: '关系的复活或彻底放下',
            career: '回应天命般的职业召唤',
            money: '清算过去的财务问题',
            health: '彻底康复或全新的生活方式',
            spiritual: '灵魂的觉醒与召唤'
        }
    },
    {
        id: 'major-21', name: '世界', nameEn: 'The World', number: 21, arcana: 'major',
        symbol: '🌍', element: '土', keywords: ['圆满', '完成', '成就', '整合'],
        upright: '一个旅程的圆满完成，世界向你敞开。整合一切。',
        reversed: '差一步未能完成，需要补上最后一块拼图。',
        meanings: {
            love: '关系达到圆满状态，灵魂伴侣',
            career: '重大项目成功完成，国际机会',
            money: '财务目标实现，丰盛圆满',
            health: '身心整合的完整状态',
            spiritual: '灵魂功课的完成'
        }
    },

    // ========== 小阿尔卡纳 56 张 ==========
    // === 权杖（Wands）火 创造、激情、行动 ===
    { id: 'wands-1', name: '权杖一', nameEn: 'Ace of Wands', number: 1, arcana: 'minor', suit: 'wands', symbol: '🔥', element: '火', keywords: ['灵感', '新机会', '热情', '种子'],
      upright: '创造的火花点燃，新机会带来激情。', reversed: '灵感受阻，热情消退。',
      meanings: { love: '强烈的吸引力突现', career: '新项目的灵感降临', money: '新的赚钱想法', health: '活力恢复', spiritual: '创造能量觉醒' } },
    { id: 'wands-2', name: '权杖二', nameEn: 'Two of Wands', number: 2, arcana: 'minor', suit: 'wands', symbol: '🌍', element: '火', keywords: ['规划', '决策', '远见'],
      upright: '站在十字路口规划未来，世界等你探索。', reversed: '犹豫不决或恐惧改变。',
      meanings: { love: '关系发展的规划期', career: '思考下一步的方向', money: '投资规划', health: '制定健康计划', spiritual: '展望灵性旅程' } },
    { id: 'wands-3', name: '权杖三', nameEn: 'Three of Wands', number: 3, arcana: 'minor', suit: 'wands', symbol: '⛵', element: '火', keywords: ['扩展', '远航', '机会'],
      upright: '前期努力开始结果，机会向远方延伸。', reversed: '计划延迟或视野受限。',
      meanings: { love: '远距离恋情或感情发展', career: '事业版图扩张', money: '收入开始增加', health: '康复进展顺利', spiritual: '视野更加开阔' } },
    { id: 'wands-4', name: '权杖四', nameEn: 'Four of Wands', number: 4, arcana: 'minor', suit: 'wands', symbol: '🎉', element: '火', keywords: ['庆祝', '稳固', '回家'],
      upright: '阶段性成果值得庆祝，归属感与喜悦。', reversed: '内部的不和谐或庆祝延期。',
      meanings: { love: '订婚或同居的喜事', career: '团队庆功，达成里程碑', money: '财务进入稳定期', health: '康复达成阶段', spiritual: '找到归属感' } },
    { id: 'wands-5', name: '权杖五', nameEn: 'Five of Wands', number: 5, arcana: 'minor', suit: 'wands', symbol: '⚔', element: '火', keywords: ['冲突', '竞争', '混乱'],
      upright: '良性竞争或意见不合，从中学习。', reversed: '化解冲突，找到共识。',
      meanings: { love: '关系中的小摩擦', career: '职场竞争激烈', money: '财务上的小争执', health: '身心冲突', spiritual: '内在的不同声音' } },
    { id: 'wands-6', name: '权杖六', nameEn: 'Six of Wands', number: 6, arcana: 'minor', suit: 'wands', symbol: '🏆', element: '火', keywords: ['胜利', '认可', '凯旋'],
      upright: '凯旋归来，公开的认可与赞誉。', reversed: '成功延迟或自我怀疑。',
      meanings: { love: '感情得到祝福', career: '获得晋升或表彰', money: '投资获利', health: '战胜疾病', spiritual: '内在凯旋' } },
    { id: 'wands-7', name: '权杖七', nameEn: 'Seven of Wands', number: 7, arcana: 'minor', suit: 'wands', symbol: '🛡', element: '火', keywords: ['防御', '坚持', '挑战'],
      upright: '坚守立场，捍卫所信。处于优势但需努力维持。', reversed: '屈服于压力或过度防御。',
      meanings: { love: '为感情而战', career: '面对竞争坚守岗位', money: '保护财务利益', health: '坚持治疗', spiritual: '坚守信念' } },
    { id: 'wands-8', name: '权杖八', nameEn: 'Eight of Wands', number: 8, arcana: 'minor', suit: 'wands', symbol: '💨', element: '火', keywords: ['迅速', '行动', '消息'],
      upright: '事情快速推进，重要消息传来。', reversed: '延迟或失去节奏。',
      meanings: { love: '感情进展迅速', career: '工作快节奏推进', money: '快速的资金流动', health: '快速康复', spiritual: '能量流动加速' } },
    { id: 'wands-9', name: '权杖九', nameEn: 'Nine of Wands', number: 9, arcana: 'minor', suit: 'wands', symbol: '🛡', element: '火', keywords: ['坚韧', '警觉', '最后一搏'],
      upright: '在最后关头保持警觉，胜利就在眼前。', reversed: '过度防御或筋疲力尽。',
      meanings: { love: '关系中的疲惫与坚持', career: '项目接近完成，再坚持一下', money: '财务挑战的最后阶段', health: '康复的最后冲刺', spiritual: '修行的关键期' } },
    { id: 'wands-10', name: '权杖十', nameEn: 'Ten of Wands', number: 10, arcana: 'minor', suit: 'wands', symbol: '📦', element: '火', keywords: ['重担', '责任', '过劳'],
      upright: '肩负沉重责任，需要学会分担。', reversed: '放下重担，寻求帮助。',
      meanings: { love: '关系责任过重', career: '工作负担过大', money: '财务压力沉重', health: '过度劳累影响健康', spiritual: '业力的承担' } },
    { id: 'wands-page', name: '权杖侍从', nameEn: 'Page of Wands', number: 11, arcana: 'minor', suit: 'wands', symbol: '🎯', element: '火', keywords: ['探索', '热情', '消息'],
      upright: '充满好奇与热情的初学者，新的冒险讯息。', reversed: '幼稚或缺乏方向。',
      meanings: { love: '充满激情的新恋情', career: '令人兴奋的新机会', money: '小额的好消息', health: '尝试新的健康方式', spiritual: '灵性探索的起点' } },
    { id: 'wands-knight', name: '权杖骑士', nameEn: 'Knight of Wands', number: 12, arcana: 'minor', suit: 'wands', symbol: '🏇', element: '火', keywords: ['冒险', '冲动', '热情'],
      upright: '充满激情地追逐目标，勇往直前。', reversed: '鲁莽或半途而废。',
      meanings: { love: '热情的追求者', career: '冒险的事业举动', money: '冒险投资', health: '高强度运动', spiritual: '热烈的灵性追求' } },
    { id: 'wands-queen', name: '权杖皇后', nameEn: 'Queen of Wands', number: 13, arcana: 'minor', suit: 'wands', symbol: '👸', element: '火', keywords: ['自信', '魅力', '独立'],
      upright: '充满魅力的领导者，自信而温暖。', reversed: '嫉妒或缺乏自信。',
      meanings: { love: '吸引力四射', career: '领导力受认可', money: '自信地管理财务', health: '活力与魅力', spiritual: '内在的女性力量' } },
    { id: 'wands-king', name: '权杖国王', nameEn: 'King of Wands', number: 14, arcana: 'minor', suit: 'wands', symbol: '🤴', element: '火', keywords: ['领袖', '远见', '魄力'],
      upright: '富有远见的领导者，魄力与魅力并存。', reversed: '专横或冲动决策。',
      meanings: { love: '充满激情的伴侣', career: '事业领袖', money: '大胆的财务决策', health: '需要释放过剩能量', spiritual: '内在国王的觉醒' } },

    // === 圣杯（Cups）水 情感、关系、直觉 ===
    { id: 'cups-1', name: '圣杯一', nameEn: 'Ace of Cups', number: 1, arcana: 'minor', suit: 'cups', symbol: '🥤', element: '水', keywords: ['新感情', '溢出', '爱'],
      upright: '爱与情感的新起点，心扉敞开。', reversed: '情感堵塞或失望。',
      meanings: { love: '心动的开始', career: '工作中的情感连接', money: '感性的财务决定', health: '情绪疗愈', spiritual: '心轮开启' } },
    { id: 'cups-2', name: '圣杯二', nameEn: 'Two of Cups', number: 2, arcana: 'minor', suit: 'cups', symbol: '💑', element: '水', keywords: ['连接', '伙伴', '合一'],
      upright: '深刻的情感连接，灵魂层面的相遇。', reversed: '关系失衡或分歧。',
      meanings: { love: '灵魂伴侣的连接', career: '完美的合作伙伴', money: '合伙投资', health: '伴侣式的康复', spiritual: '阴阳合一' } },
    { id: 'cups-3', name: '圣杯三', nameEn: 'Three of Cups', number: 3, arcana: 'minor', suit: 'cups', symbol: '🥂', element: '水', keywords: ['友谊', '庆祝', '社群'],
      upright: '与挚友共享喜悦，社交的美好时光。', reversed: '社交疲惫或友谊裂痕。',
      meanings: { love: '感情得到朋友的祝福', career: '团队庆功', money: '聚会消费', health: '通过社交得到疗愈', spiritual: '灵性社群' } },
    { id: 'cups-4', name: '圣杯四', nameEn: 'Four of Cups', number: 4, arcana: 'minor', suit: 'cups', symbol: '😔', element: '水', keywords: ['冷漠', '反思', '错失'],
      upright: '对眼前事物失去热情，沉浸在自己的世界。', reversed: '重新打开心扉，接受新机会。',
      meanings: { love: '感情倦怠期', career: '工作热情不足', money: '对财务漠不关心', health: '情绪低落', spiritual: '需要内在反思' } },
    { id: 'cups-5', name: '圣杯五', nameEn: 'Five of Cups', number: 5, arcana: 'minor', suit: 'cups', symbol: '😢', element: '水', keywords: ['失落', '悲伤', '遗憾'],
      upright: '聚焦于失去的，但仍有未洒的圣杯。', reversed: '从悲伤中走出，看到希望。',
      meanings: { love: '感情的失落与遗憾', career: '错失机会的失望', money: '财务损失', health: '需要疗愈情绪创伤', spiritual: '哀悼与释放' } },
    { id: 'cups-6', name: '圣杯六', nameEn: 'Six of Cups', number: 6, arcana: 'minor', suit: 'cups', symbol: '🌸', element: '水', keywords: ['怀旧', '童心', '故人'],
      upright: '甜美的回忆，与过去的人或事重逢。', reversed: '困在过去无法前进。',
      meanings: { love: '旧爱重逢或纯真之恋', career: '与老同事重聚', money: '回报过去的投资', health: '童年模式的疗愈', spiritual: '回归本真' } },
    { id: 'cups-7', name: '圣杯七', nameEn: 'Seven of Cups', number: 7, arcana: 'minor', suit: 'cups', symbol: '🌫', element: '水', keywords: ['幻想', '选择', '诱惑'],
      upright: '太多选择令人眼花缭乱，分清现实与幻想。', reversed: '看清真相，做出选择。',
      meanings: { love: '感情中的不切实际幻想', career: '面对多个机会的选择', money: '投资选项过多', health: '过度沉浸幻想', spiritual: '幻象与真实' } },
    { id: 'cups-8', name: '圣杯八', nameEn: 'Eight of Cups', number: 8, arcana: 'minor', suit: 'cups', symbol: '🚶', element: '水', keywords: ['离开', '寻找意义', '转身'],
      upright: '放下不再适合的，去寻找更有意义的事物。', reversed: '害怕离开或被困其中。',
      meanings: { love: '离开不健康的关系', career: '辞去无意义的工作', money: '放弃不再有效的投资', health: '告别坏习惯', spiritual: '踏上灵性追寻之旅' } },
    { id: 'cups-9', name: '圣杯九', nameEn: 'Nine of Cups', number: 9, arcana: 'minor', suit: 'cups', symbol: '😊', element: '水', keywords: ['满足', '愿望', '丰盛'],
      upright: '愿望成真的卡，情感的满足与幸福。', reversed: '物质满足但内心空虚。',
      meanings: { love: '感情心想事成', career: '工作满意度高', money: '财务愿望实现', health: '身心健康满足', spiritual: '愿望显化' } },
    { id: 'cups-10', name: '圣杯十', nameEn: 'Ten of Cups', number: 10, arcana: 'minor', suit: 'cups', symbol: '🌈', element: '水', keywords: ['圆满', '家庭', '幸福'],
      upright: '情感的彻底圆满，家庭与爱的完美和谐。', reversed: '家庭不和或表面幸福。',
      meanings: { love: '童话般的幸福', career: '理想的工作环境', money: '富足的家庭生活', health: '全家健康', spiritual: '心灵的彩虹' } },
    { id: 'cups-page', name: '圣杯侍从', nameEn: 'Page of Cups', number: 11, arcana: 'minor', suit: 'cups', symbol: '🐟', element: '水', keywords: ['敏感', '创意', '惊喜'],
      upright: '充满童心与创造力，意外的情感讯息。', reversed: '过度情绪化或不成熟。',
      meanings: { love: '浪漫的小惊喜', career: '创意的火花', money: '小额意外之财', health: '艺术疗法', spiritual: '直觉的萌发' } },
    { id: 'cups-knight', name: '圣杯骑士', nameEn: 'Knight of Cups', number: 12, arcana: 'minor', suit: 'cups', symbol: '🌹', element: '水', keywords: ['浪漫', '理想', '艺术'],
      upright: '带着圣杯前来的浪漫骑士，理想主义者。', reversed: '不切实际的浪漫或情绪化。',
      meanings: { love: '浪漫的追求者', career: '艺术或创意工作', money: '感性的财务决定', health: '情绪疗愈', spiritual: '心的追寻' } },
    { id: 'cups-queen', name: '圣杯皇后', nameEn: 'Queen of Cups', number: 13, arcana: 'minor', suit: 'cups', symbol: '👸', element: '水', keywords: ['共情', '直觉', '滋养'],
      upright: '极富同理心的母性能量，深刻的直觉。', reversed: '情绪过载或操控。',
      meanings: { love: '富有爱心的伴侣', career: '咨询或疗愈工作', money: '直觉式理财', health: '情感疗愈师', spiritual: '深度直觉力' } },
    { id: 'cups-king', name: '圣杯国王', nameEn: 'King of Cups', number: 14, arcana: 'minor', suit: 'cups', symbol: '🤴', element: '水', keywords: ['平衡', '智慧', '掌控情绪'],
      upright: '情感成熟的智者，在波涛中保持镇定。', reversed: '情绪压抑或操控。',
      meanings: { love: '成熟稳定的伴侣', career: '富有情商的领导者', money: '理性而温和的理财', health: '心理健康专家', spiritual: '情感大师' } },

    // === 宝剑（Swords）风 思想、沟通、挑战 ===
    { id: 'swords-1', name: '宝剑一', nameEn: 'Ace of Swords', number: 1, arcana: 'minor', suit: 'swords', symbol: '⚔', element: '风', keywords: ['真相', '突破', '清晰'],
      upright: '思维清晰的突破时刻，真相如剑般锋利。', reversed: '混淆或被误导。',
      meanings: { love: '关系真相显现', career: '清晰的事业方向', money: '财务策略明确', health: '诊断清晰', spiritual: '心智觉醒' } },
    { id: 'swords-2', name: '宝剑二', nameEn: 'Two of Swords', number: 2, arcana: 'minor', suit: 'swords', symbol: '⚖', element: '风', keywords: ['两难', '回避', '决定'],
      upright: '面对艰难抉择，蒙住眼也无法逃避。', reversed: '做出决定，移开蒙眼布。',
      meanings: { love: '感情中的两难选择', career: '职业决策困难', money: '财务取舍', health: '治疗方案的选择', spiritual: '内在冲突' } },
    { id: 'swords-3', name: '宝剑三', nameEn: 'Three of Swords', number: 3, arcana: 'minor', suit: 'swords', symbol: '💔', element: '风', keywords: ['心碎', '悲伤', '背叛'],
      upright: '心被刺穿的痛，但雨后会有彩虹。', reversed: '从心碎中疗愈，宽恕。',
      meanings: { love: '心碎与背叛', career: '工作打击', money: '财务损失带来痛苦', health: '心理创伤', spiritual: '通过痛苦成长' } },
    { id: 'swords-4', name: '宝剑四', nameEn: 'Four of Swords', number: 4, arcana: 'minor', suit: 'swords', symbol: '🛏', element: '风', keywords: ['休息', '冥想', '恢复'],
      upright: '战斗暂停，需要休息和恢复。', reversed: '应该重新出发了。',
      meanings: { love: '感情需要冷静期', career: '工作需要休息', money: '暂停财务行动', health: '需要充分休养', spiritual: '冥想与静修' } },
    { id: 'swords-5', name: '宝剑五', nameEn: 'Five of Swords', number: 5, arcana: 'minor', suit: 'swords', symbol: '🗡', element: '风', keywords: ['冲突', '失败', '小人'],
      upright: '惨痛的胜利或失败，得不偿失的争斗。', reversed: '和解或从冲突中走出。',
      meanings: { love: '关系中的争吵', career: '职场政治斗争', money: '小亏小赢', health: '身心冲突', spiritual: '小我之战' } },
    { id: 'swords-6', name: '宝剑六', nameEn: 'Six of Swords', number: 6, arcana: 'minor', suit: 'swords', symbol: '⛵', element: '风', keywords: ['过渡', '远行', '平静'],
      upright: '从动荡走向平静的过渡，迈向更好的彼岸。', reversed: '抗拒变化或停留困境。',
      meanings: { love: '关系的平稳过渡', career: '工作的转换期', money: '财务从困境走出', health: '康复中的平稳期', spiritual: '走出心灵风暴' } },
    { id: 'swords-7', name: '宝剑七', nameEn: 'Seven of Swords', number: 7, arcana: 'minor', suit: 'swords', symbol: '🥷', element: '风', keywords: ['策略', '欺骗', '隐瞒'],
      upright: '需要策略性思考，警惕欺骗。', reversed: '坦诚相对，揭露真相。',
      meanings: { love: '感情中的欺瞒', career: '职场暗中操作', money: '注意财务欺诈', health: '隐瞒症状', spiritual: '自欺' } },
    { id: 'swords-8', name: '宝剑八', nameEn: 'Eight of Swords', number: 8, arcana: 'minor', suit: 'swords', symbol: '🪢', element: '风', keywords: ['受困', '受限', '自我设限'],
      upright: '感觉被困其实是自己的思维束缚。', reversed: '挣脱束缚，重获自由。',
      meanings: { love: '感觉被关系困住', career: '工作中的无力感', money: '财务受限', health: '心理障碍', spiritual: '思维的牢笼' } },
    { id: 'swords-9', name: '宝剑九', nameEn: 'Nine of Swords', number: 9, arcana: 'minor', suit: 'swords', symbol: '😰', element: '风', keywords: ['焦虑', '失眠', '恐惧'],
      upright: '夜晚的恐惧与焦虑，但很多是心魔。', reversed: '走出恶梦，黎明将至。',
      meanings: { love: '感情焦虑', career: '工作压力大', money: '财务恐惧', health: '失眠焦虑', spiritual: '面对内心阴影' } },
    { id: 'swords-10', name: '宝剑十', nameEn: 'Ten of Swords', number: 10, arcana: 'minor', suit: 'swords', symbol: '🌅', element: '风', keywords: ['终结', '谷底', '黎明'],
      upright: '最深的低谷，但同时也是黎明前的黑暗。', reversed: '正在恢复，重新站起。',
      meanings: { love: '关系的彻底结束', career: '事业谷底', money: '财务最低点', health: '健康问题严重', spiritual: '小我的彻底死亡' } },
    { id: 'swords-page', name: '宝剑侍从', nameEn: 'Page of Swords', number: 11, arcana: 'minor', suit: 'swords', symbol: '🌪', element: '风', keywords: ['好奇', '直率', '探索'],
      upright: '思维敏捷的探索者，渴望真相。', reversed: '言语伤人或多疑。',
      meanings: { love: '言语真诚的关系', career: '研究学习', money: '理性分析投资', health: '查找疾病原因', spiritual: '思维的觉醒' } },
    { id: 'swords-knight', name: '宝剑骑士', nameEn: 'Knight of Swords', number: 12, arcana: 'minor', suit: 'swords', symbol: '🏇', element: '风', keywords: ['冲锋', '果断', '激进'],
      upright: '快速行动的战士，目标明确。', reversed: '过于鲁莽或攻击性强。',
      meanings: { love: '激进的追求或离开', career: '事业的果断行动', money: '快速财务决策', health: '高强度治疗', spiritual: '心智的勇士' } },
    { id: 'swords-queen', name: '宝剑皇后', nameEn: 'Queen of Swords', number: 13, arcana: 'minor', suit: 'swords', symbol: '👸', element: '风', keywords: ['睿智', '独立', '客观'],
      upright: '清晰睿智的智者，独立而有洞见。', reversed: '冷酷或苛刻。',
      meanings: { love: '理性的伴侣', career: '清晰的策略家', money: '理性理财', health: '客观面对健康', spiritual: '智慧的女性' } },
    { id: 'swords-king', name: '宝剑国王', nameEn: 'King of Swords', number: 14, arcana: 'minor', suit: 'swords', symbol: '🤴', element: '风', keywords: ['权威', '理性', '律法'],
      upright: '理性的领导者，凭借智慧和原则统治。', reversed: '专制或操控。',
      meanings: { love: '理性的伴侣', career: '专业权威', money: '理性财务大师', health: '理性面对治疗', spiritual: '心智的国王' } },

    // === 星币（Pentacles）土 物质、工作、健康 ===
    { id: 'pentacles-1', name: '星币一', nameEn: 'Ace of Pentacles', number: 1, arcana: 'minor', suit: 'pentacles', symbol: '💰', element: '土', keywords: ['新机会', '物质', '种子'],
      upright: '物质或财务上的新机会，富足的种子。', reversed: '机会错失或物质匮乏。',
      meanings: { love: '稳固关系的开始', career: '稳定工作机会', money: '财富的种子', health: '健康投资的开始', spiritual: '物质灵性的整合' } },
    { id: 'pentacles-2', name: '星币二', nameEn: 'Two of Pentacles', number: 2, arcana: 'minor', suit: 'pentacles', symbol: '🤹', element: '土', keywords: ['平衡', '杂耍', '适应'],
      upright: '在多个事项间寻找平衡，灵活应对变化。', reversed: '失衡或不堪重负。',
      meanings: { love: '平衡感情与生活', career: '兼顾多项工作', money: '收支平衡的努力', health: '工作生活平衡', spiritual: '物质灵性的平衡' } },
    { id: 'pentacles-3', name: '星币三', nameEn: 'Three of Pentacles', number: 3, arcana: 'minor', suit: 'pentacles', symbol: '🛠', element: '土', keywords: ['团队', '技艺', '合作'],
      upright: '与他人合作，发挥专业技能。', reversed: '团队失衡或技能不足。',
      meanings: { love: '关系需要共同努力', career: '团队合作出成果', money: '合作型财务', health: '团队治疗', spiritual: '集体修行' } },
    { id: 'pentacles-4', name: '星币四', nameEn: 'Four of Pentacles', number: 4, arcana: 'minor', suit: 'pentacles', symbol: '🏛', element: '土', keywords: ['保守', '占有', '安全'],
      upright: '紧握所有，重视安全感。', reversed: '过度紧张或慷慨过头。',
      meanings: { love: '关系中的占有欲', career: '保守的事业策略', money: '过度储蓄', health: '保守的医疗选择', spiritual: '执着于物质' } },
    { id: 'pentacles-5', name: '星币五', nameEn: 'Five of Pentacles', number: 5, arcana: 'minor', suit: 'pentacles', symbol: '🥶', element: '土', keywords: ['匮乏', '困境', '孤立'],
      upright: '物质或情感的匮乏感，但温暖就在身旁。', reversed: '走出困境，重获希望。',
      meanings: { love: '关系中的孤独感', career: '失业或事业低谷', money: '财务困难', health: '健康危机', spiritual: '灵性的低谷' } },
    { id: 'pentacles-6', name: '星币六', nameEn: 'Six of Pentacles', number: 6, arcana: 'minor', suit: 'pentacles', symbol: '🤝', element: '土', keywords: ['给予', '慈善', '互助'],
      upright: '财富的流动，给予与接收的平衡。', reversed: '给予不公或接受困难。',
      meanings: { love: '相互滋养的关系', career: '互利的合作', money: '财富的良性流动', health: '接受帮助', spiritual: '能量的交换' } },
    { id: 'pentacles-7', name: '星币七', nameEn: 'Seven of Pentacles', number: 7, arcana: 'minor', suit: 'pentacles', symbol: '🌱', element: '土', keywords: ['耐心', '评估', '播种'],
      upright: '播种后的等待与评估，长期投资的耐心。', reversed: '焦虑或缺乏耐心。',
      meanings: { love: '关系需要耐心培育', career: '长期项目的成果', money: '长期投资', health: '健康习惯的养成', spiritual: '修行的耐心' } },
    { id: 'pentacles-8', name: '星币八', nameEn: 'Eight of Pentacles', number: 8, arcana: 'minor', suit: 'pentacles', symbol: '⚒', element: '土', keywords: ['勤勉', '专精', '工艺'],
      upright: '专注磨练技艺，工匠精神。', reversed: '懒散或追求完美。',
      meanings: { love: '为关系投入时间精力', career: '专业技能精进', money: '通过努力赚钱', health: '健康习惯的坚持', spiritual: '修行的专注' } },
    { id: 'pentacles-9', name: '星币九', nameEn: 'Nine of Pentacles', number: 9, arcana: 'minor', suit: 'pentacles', symbol: '🍇', element: '土', keywords: ['独立', '丰盛', '享受'],
      upright: '独立的丰盛，享受自己创造的成果。', reversed: '物质依赖或挥霍。',
      meanings: { love: '享受单身或自给自足的关系', career: '独立成就', money: '财务独立', health: '健康富足', spiritual: '物质富足中的灵性' } },
    { id: 'pentacles-10', name: '星币十', nameEn: 'Ten of Pentacles', number: 10, arcana: 'minor', suit: 'pentacles', symbol: '🏰', element: '土', keywords: ['传承', '富足', '家族'],
      upright: '物质的彻底圆满，家族的财富与传承。', reversed: '财务纠纷或家族问题。',
      meanings: { love: '稳固的长期关系', career: '事业稳定传承', money: '财富传承', health: '健康长寿', spiritual: '物质灵性的圆满' } },
    { id: 'pentacles-page', name: '星币侍从', nameEn: 'Page of Pentacles', number: 11, arcana: 'minor', suit: 'pentacles', symbol: '📚', element: '土', keywords: ['学习', '机会', '务实'],
      upright: '务实的学习者，新机会的到来。', reversed: '不切实际或拖延。',
      meanings: { love: '稳重的新关系', career: '学习新技能', money: '务实的财务规划', health: '健康的新方法', spiritual: '脚踏实地的修行' } },
    { id: 'pentacles-knight', name: '星币骑士', nameEn: 'Knight of Pentacles', number: 12, arcana: 'minor', suit: 'pentacles', symbol: '🐎', element: '土', keywords: ['可靠', '勤奋', '稳健'],
      upright: '稳扎稳打的工作者，可靠值得信赖。', reversed: '停滞或过于保守。',
      meanings: { love: '可靠稳定的伴侣', career: '稳步推进', money: '稳健投资', health: '规律的健康习惯', spiritual: '稳定的修行' } },
    { id: 'pentacles-queen', name: '星币皇后', nameEn: 'Queen of Pentacles', number: 13, arcana: 'minor', suit: 'pentacles', symbol: '👸', element: '土', keywords: ['丰盛', '滋养', '务实'],
      upright: '丰盛的滋养者，物质灵性兼具。', reversed: '物质沉迷或自我忽视。',
      meanings: { love: '滋养型伴侣', career: '务实的领导', money: '丰盛的女主人', health: '注重身体保养', spiritual: '大地母亲能量' } },
    { id: 'pentacles-king', name: '星币国王', nameEn: 'King of Pentacles', number: 14, arcana: 'minor', suit: 'pentacles', symbol: '🤴', element: '土', keywords: ['富足', '稳健', '权威'],
      upright: '物质丰盛的成功者，慷慨而稳健。', reversed: '物质主义或贪婪。',
      meanings: { love: '富足稳重的伴侣', career: '事业大成', money: '财富大师', health: '健康长寿', spiritual: '物质大师' } }
];

// 78 张牌总数验证
console.log(`✓ 已加载 ${window.TAROT_CARDS.length} 张塔罗牌`);
