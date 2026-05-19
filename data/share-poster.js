/* 星辰塔罗 - 分享海报生成器 v1.0
 *
 * 用纯 Canvas 绘制精美海报（深色奇幻风），输出 PNG。
 * 不依赖外部库，离线可用。
 *
 * 公开 API：window.TarotPoster
 *   render(payload) -> Promise<{ dataUrl, blob, canvas }>
 *   download(dataUrl, filename)
 *   share(blob, payload)    // 调用 Web Share API（移动端原生分享）
 *
 * payload 示例：
 * {
 *   title: '今日塔罗指引',
 *   topic: '事业',
 *   topicEmoji: '⚙️',
 *   userName: '旅行者',
 *   petStage: { name:'星河神龙', emoji:'🐉', level: 12 },
 *   cards: [{ name:'魔术师', symbol:'✨', reversed:false }],
 *   advice: '相信你的内在力量……',
 *   keywords: ['行动', '机遇'],
 *   date: '2026/5/18',
 *   type: 'daily' | 'reading'
 * }
 */
(function () {
    'use strict';

    const W = 720, H = 1280; // 海报尺寸 9:16
    const PADDING = 48;

    // ===== 工具：包绕文本 =====
    function wrapText(ctx, text, maxWidth) {
        const lines = [];
        let line = '';
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const test = line + ch;
            if (ctx.measureText(test).width > maxWidth && line) {
                lines.push(line);
                line = ch;
            } else {
                line = test;
            }
            if (ch === '\n') { lines.push(line.slice(0, -1)); line = ''; }
        }
        if (line) lines.push(line);
        return lines;
    }

    // ===== 工具：圆角矩形 =====
    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    // ===== 背景：深色 + 星空 + 光晕 =====
    function drawBackground(ctx) {
        // 主色基底
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#0c0918');
        g.addColorStop(0.5, '#15101e');
        g.addColorStop(1, '#0a0712');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        // 顶部光晕
        const halo = ctx.createRadialGradient(W / 2, 80, 30, W / 2, 80, 600);
        halo.addColorStop(0, 'rgba(242, 202, 80, 0.25)');
        halo.addColorStop(0.4, 'rgba(242, 202, 80, 0.08)');
        halo.addColorStop(1, 'rgba(242, 202, 80, 0)');
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, W, H);

        // 底部紫晕
        const halo2 = ctx.createRadialGradient(W / 2, H - 100, 40, W / 2, H - 100, 500);
        halo2.addColorStop(0, 'rgba(208, 158, 255, 0.18)');
        halo2.addColorStop(1, 'rgba(208, 158, 255, 0)');
        ctx.fillStyle = halo2;
        ctx.fillRect(0, 0, W, H);

        // 星点
        for (let i = 0; i < 80; i++) {
            const x = Math.random() * W;
            const y = Math.random() * H;
            const r = Math.random() * 1.4 + 0.3;
            const op = Math.random() * 0.6 + 0.2;
            ctx.fillStyle = `rgba(255, 240, 180, ${op})`;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // 边框光环
        ctx.strokeStyle = 'rgba(242, 202, 80, 0.35)';
        ctx.lineWidth = 2;
        roundRect(ctx, PADDING / 2, PADDING / 2, W - PADDING, H - PADDING, 32);
        ctx.stroke();

        // 内边框
        ctx.strokeStyle = 'rgba(242, 202, 80, 0.12)';
        ctx.lineWidth = 1;
        roundRect(ctx, PADDING / 2 + 8, PADDING / 2 + 8, W - PADDING - 16, H - PADDING - 16, 28);
        ctx.stroke();
    }

    function drawCenteredText(ctx, text, y, opts) {
        opts = opts || {};
        ctx.font = opts.font || '24px sans-serif';
        ctx.fillStyle = opts.color || '#e5e2e1';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        if (opts.shadow) {
            ctx.shadowColor = opts.shadow;
            ctx.shadowBlur = opts.shadowBlur || 12;
        }
        ctx.fillText(text, W / 2, y);
        ctx.shadowBlur = 0;
    }

    function drawCardIcon(ctx, x, y, w, h, card) {
        // 卡牌背景（紫金渐变，与抽牌页一致）
        ctx.save();
        const bgG = ctx.createLinearGradient(x, y, x, y + h);
        bgG.addColorStop(0, '#3a2952');
        bgG.addColorStop(0.55, '#1a0f2a');
        bgG.addColorStop(1, '#0e0e0e');
        ctx.fillStyle = bgG;
        roundRect(ctx, x, y, w, h, 12);
        ctx.fill();

        // 内描边
        ctx.strokeStyle = 'rgba(242, 202, 80, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 卡牌内容裁切区
        ctx.save();
        roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 10);
        ctx.clip();

        // === 优先方案 1：真实牌面图 ===
        if (card._image && card._image.complete && card._image.naturalWidth > 0) {
            ctx.save();
            if (card.reversed) {
                ctx.translate(x + w / 2, y + h / 2);
                ctx.rotate(Math.PI);
                ctx.drawImage(card._image, -w / 2, -h / 2, w, h);
            } else {
                ctx.drawImage(card._image, x, y, w, h);
            }
            // 顶/底渐变，便于压字（这里仅顶部留 logo 区透气）
            const gradient = ctx.createLinearGradient(0, y, 0, y + h);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(0.85, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, 'rgba(0,0,0,0.35)');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, w, h);
            ctx.restore();
        }
        // === 方案 2：小牌 SVG 风格化绘制 ===
        else if (card.arcana === 'minor' && card.suit && card.number) {
            drawMinorCardCanvas(ctx, x, y, w, h, card);
        }
        // === 方案 3：纯文字兜底（古典金色字母）===
        else {
            // 中央显示罗马数字 + 牌名首字母
            const ROMAN = ['0','Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ','Ⅺ','Ⅻ','ⅩⅢ','ⅩⅣ','ⅩⅤ','ⅩⅥ','ⅩⅦ','ⅩⅧ','ⅩⅨ','ⅩⅩ','ⅩⅪ'];
            const num = ROMAN[card.number] || '';
            ctx.save();
            if (card.reversed) {
                ctx.translate(x + w / 2, y + h / 2);
                ctx.rotate(Math.PI);
                ctx.translate(-(x + w / 2), -(y + h / 2));
            }
            // 大罗马数字居中
            ctx.fillStyle = 'rgba(242, 202, 80, 0.85)';
            ctx.font = (h * 0.32) + 'px "EB Garamond", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(num, x + w / 2, y + h / 2 - 6);
            // 装饰星点
            ctx.fillStyle = 'rgba(242, 202, 80, 0.4)';
            ctx.font = (h * 0.10) + 'px serif';
            ctx.fillText('✦', x + w / 2, y + h / 2 + h * 0.22);
            ctx.restore();
        }
        ctx.restore(); // 解除裁切

        // 右下角逆位标记（图上叠加，更专业）
        if (card.reversed) {
            ctx.fillStyle = 'rgba(208, 158, 255, 0.85)';
            ctx.font = '600 11px sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText('↺ REV', x + w - 8, y + h - 8);
        }

        ctx.restore();

        // 牌名（卡牌下方）
        ctx.font = '18px sans-serif';
        ctx.fillStyle = '#e5e2e1';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(card.name, x + w / 2, y + h + 10);

        // 正逆位标签
        ctx.font = '13px sans-serif';
        ctx.fillStyle = card.reversed ? 'rgba(208, 158, 255, 0.8)' : 'rgba(242, 202, 80, 0.75)';
        ctx.fillText(card.reversed ? '逆位' : '正位', x + w / 2, y + h + 34);
    }

    // ===== 小牌 SVG 风格的 Canvas 实现（韦特古典版画风）=====
    const SUIT_GLYPH_POSTER = {
        wands:     { symbol: '🔥', name: 'WANDS',     color: '#ff8855' },
        cups:      { symbol: '🍷', name: 'CUPS',      color: '#7ac6ff' },
        swords:    { symbol: '⚔',  name: 'SWORDS',    color: '#c6c4df' },
        pentacles: { symbol: '⭐', name: 'PENTACLES', color: '#f2ca50' }
    };
    const PIP_LAYOUTS_POSTER = {
        1:[[50,50]], 2:[[50,30],[50,70]], 3:[[50,24],[30,68],[70,68]],
        4:[[30,30],[70,30],[30,70],[70,70]],
        5:[[30,28],[70,28],[50,50],[30,72],[70,72]],
        6:[[30,24],[70,24],[30,50],[70,50],[30,76],[70,76]],
        7:[[30,22],[70,22],[50,38],[30,56],[70,56],[30,80],[70,80]],
        8:[[30,20],[70,20],[30,40],[70,40],[30,60],[70,60],[30,80],[70,80]],
        9:[[30,20],[70,20],[30,40],[70,40],[50,52],[30,64],[70,64],[30,82],[70,82]],
        10:[[30,15],[70,15],[30,32],[70,32],[50,42],[30,55],[70,55],[50,72],[30,82],[70,82]]
    };
    const COURT_LABELS = { 11:'PAGE', 12:'KNIGHT', 13:'QUEEN', 14:'KING' };
    function drawMinorCardCanvas(ctx, x, y, w, h, card) {
        const g = SUIT_GLYPH_POSTER[card.suit];
        if (!g) return;
        ctx.save();
        if (card.reversed) {
            ctx.translate(x + w / 2, y + h / 2);
            ctx.rotate(Math.PI);
            ctx.translate(-(x + w / 2), -(y + h / 2));
        }
        const num = card.number;
        // 宫廷牌
        if (num >= 11) {
            const label = COURT_LABELS[num] || '';
            // 中心光晕
            const halo = ctx.createRadialGradient(x + w/2, y + h*0.4, 4, x + w/2, y + h*0.4, w * 0.45);
            halo.addColorStop(0, 'rgba(242,202,80,0.30)');
            halo.addColorStop(1, 'rgba(242,202,80,0)');
            ctx.fillStyle = halo;
            ctx.fillRect(x, y, w, h);
            // 符号
            ctx.font = (h * 0.35) + 'px serif';
            ctx.fillStyle = g.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(g.symbol, x + w / 2, y + h * 0.4);
            // 角标
            ctx.font = '600 11px "EB Garamond", serif';
            ctx.fillStyle = 'rgba(242,202,80,0.85)';
            ctx.textAlign = 'left';
            ctx.fillText(label, x + 8, y + 14);
            // 花色名
            ctx.textAlign = 'center';
            ctx.font = '500 10px "EB Garamond", serif';
            ctx.fillStyle = 'rgba(242,202,80,0.6)';
            ctx.fillText('OF ' + g.name, x + w / 2, y + h - 14);
            ctx.restore();
            return;
        }
        // 数字牌
        const layout = PIP_LAYOUTS_POSTER[num] || [];
        ctx.fillStyle = g.color;
        ctx.font = (Math.min(w, h) * 0.13) + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        layout.forEach(([px, py]) => {
            ctx.fillText(g.symbol, x + w * px / 100, y + h * py / 100);
        });
        // 数字角标
        const numLabel = num === 1 ? 'ACE' : (['','','II','III','IV','V','VI','VII','VIII','IX','X'][num] || String(num));
        ctx.font = '600 11px "EB Garamond", serif';
        ctx.fillStyle = 'rgba(242,202,80,0.85)';
        ctx.textAlign = 'left';
        ctx.fillText(numLabel, x + 8, y + 14);
        // 花色名
        ctx.textAlign = 'center';
        ctx.font = '500 10px "EB Garamond", serif';
        ctx.fillStyle = 'rgba(242,202,80,0.55)';
        ctx.fillText(g.name, x + w / 2, y + h - 14);
        ctx.restore();
    }

    // ===== 卡牌图片预加载 =====
    function getCardImagePath(card) {
        if (window.AppFeatures && typeof window.AppFeatures.getCardImage === 'function') {
            return window.AppFeatures.getCardImage(card);
        }
        return null;
    }
    function loadImage(src, timeout) {
        return new Promise((resolve) => {
            if (!src) { resolve(null); return; }
            const img = new Image();
            img.crossOrigin = 'anonymous';
            let done = false;
            const finish = (val) => { if (!done) { done = true; resolve(val); } };
            img.onload = () => finish(img);
            img.onerror = () => finish(null);
            setTimeout(() => finish(null), timeout || 4000);
            img.src = src;
        });
    }
    async function preloadCardImages(cards) {
        if (!Array.isArray(cards)) return;
        await Promise.all(cards.map(async (c) => {
            if (!c) return;
            // 已经预加载过 / 无 id 跳过
            if (c._image || !c.id) return;
            const path = getCardImagePath(c);
            if (!path) return;
            const img = await loadImage(path);
            if (img) c._image = img;
        }));
    }

    function render(payload) {
        return new Promise(async (resolve, reject) => {
            try {
                // 预加载所有牌面真实图片（带 4s 超时，失败自动降级）
                if (payload && Array.isArray(payload.cards)) {
                    await preloadCardImages(payload.cards);
                }
                const canvas = document.createElement('canvas');
                canvas.width = W;
                canvas.height = H;
                const ctx = canvas.getContext('2d');

                drawBackground(ctx);

                // 顶部 Logo
                drawCenteredText(ctx, '✦  C E L E S T I A L   A R C A N A  ✦', 96, {
                    font: '500 22px "EB Garamond", serif',
                    color: 'rgba(242, 202, 80, 0.85)'
                });
                drawCenteredText(ctx, '星 辰 塔 罗', 132, {
                    font: '600 28px "EB Garamond", serif',
                    color: '#f2ca50',
                    shadow: 'rgba(242, 202, 80, 0.6)',
                    shadowBlur: 16
                });
                drawCenteredText(ctx, payload.date || '', 176, {
                    font: '14px sans-serif',
                    color: 'rgba(229, 226, 225, 0.4)'
                });

                // 主题徽章
                if (payload.topicLabel || payload.topic) {
                    const label = `${payload.topicEmoji || '✨'}  ${payload.topicLabel || payload.topic}`;
                    ctx.font = '500 18px sans-serif';
                    const tw = ctx.measureText(label).width + 36;
                    const tx = (W - tw) / 2;
                    const ty = 210;
                    ctx.fillStyle = 'rgba(242, 202, 80, 0.14)';
                    roundRect(ctx, tx, ty, tw, 36, 18);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(242, 202, 80, 0.4)';
                    ctx.stroke();
                    ctx.fillStyle = '#f2ca50';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(label, W / 2, ty + 18);
                }

                // 标题（问题 / today's card）
                ctx.font = '600 38px "EB Garamond", serif';
                ctx.fillStyle = '#e5e2e1';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                const title = payload.title || '今日塔罗指引';
                const titleLines = wrapText(ctx, title, W - PADDING * 2 - 40);
                let ty = 268;
                titleLines.slice(0, 2).forEach((ln, i) => {
                    ctx.fillText(ln, W / 2, ty + i * 46);
                });
                ty += titleLines.length * 46 + 20;

                // 装饰横线
                ctx.strokeStyle = 'rgba(242, 202, 80, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(W / 2 - 60, ty + 8);
                ctx.lineTo(W / 2 + 60, ty + 8);
                ctx.stroke();
                ctx.fillStyle = 'rgba(242, 202, 80, 0.6)';
                ctx.font = '14px serif';
                ctx.fillText('✦', W / 2, ty);

                ty += 36;

                // 卡牌区
                const cards = (payload.cards || []).slice(0, 3);
                if (cards.length) {
                    const cardW = 130, cardH = 200;
                    const gap = 24;
                    const total = cards.length * cardW + (cards.length - 1) * gap;
                    let cx = (W - total) / 2;
                    cards.forEach(c => {
                        drawCardIcon(ctx, cx, ty, cardW, cardH, c);
                        cx += cardW + gap;
                    });
                    ty += cardH + 70;
                }

                // 关键词
                if (payload.keywords && payload.keywords.length) {
                    const tags = payload.keywords.slice(0, 4);
                    ctx.font = '500 16px sans-serif';
                    let totalW = 0;
                    const widths = tags.map(k => {
                        const w = ctx.measureText(k).width + 28;
                        totalW += w;
                        return w;
                    });
                    totalW += (tags.length - 1) * 12;
                    let kx = (W - totalW) / 2;
                    tags.forEach((k, i) => {
                        ctx.fillStyle = 'rgba(208, 158, 255, 0.12)';
                        roundRect(ctx, kx, ty, widths[i], 30, 15);
                        ctx.fill();
                        ctx.strokeStyle = 'rgba(208, 158, 255, 0.35)';
                        ctx.stroke();
                        ctx.fillStyle = 'rgba(227, 194, 255, 0.9)';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(k, kx + widths[i] / 2, ty + 15);
                        kx += widths[i] + 12;
                    });
                    ty += 60;
                }

                // 建议正文（长文）
                if (payload.advice) {
                    ctx.font = '20px sans-serif';
                    ctx.fillStyle = 'rgba(229, 226, 225, 0.92)';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    const lines = wrapText(ctx, payload.advice, W - PADDING * 2 - 40);
                    const maxLines = 8;
                    const showLines = lines.slice(0, maxLines);
                    if (lines.length > maxLines) {
                        showLines[maxLines - 1] = showLines[maxLines - 1].slice(0, -3) + '...';
                    }
                    // 中央居中的段落框
                    const boxH = showLines.length * 34 + 36;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
                    roundRect(ctx, PADDING + 20, ty, W - PADDING * 2 - 40, boxH, 16);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(242, 202, 80, 0.15)';
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(229, 226, 225, 0.95)';
                    showLines.forEach((ln, i) => {
                        ctx.fillText(ln, PADDING + 40, ty + 18 + i * 34);
                    });
                    ty += boxH + 24;
                }

                // 底部签名区
                const footY = H - 200;

                // 分割线
                ctx.strokeStyle = 'rgba(242, 202, 80, 0.2)';
                ctx.beginPath();
                ctx.moveTo(PADDING + 40, footY);
                ctx.lineTo(W - PADDING - 40, footY);
                ctx.stroke();

                // 用户 + 宠物
                const userLine = `— ${payload.userName || '旅行者'} 的塔罗时刻 —`;
                drawCenteredText(ctx, userLine, footY + 24, {
                    font: '500 18px "EB Garamond", serif',
                    color: 'rgba(229, 226, 225, 0.7)'
                });

                if (payload.petStage) {
                    const pet = payload.petStage;
                    const petLine = `${pet.emoji}  ${pet.name}  · Lv.${pet.level || '?'}`;
                    drawCenteredText(ctx, petLine, footY + 56, {
                        font: '500 20px sans-serif',
                        color: '#f2ca50'
                    });
                }

                // 末端品牌
                drawCenteredText(ctx, '✦  星辰塔罗 · 心灵指引  ✦', H - 80, {
                    font: '500 14px sans-serif',
                    color: 'rgba(242, 202, 80, 0.55)'
                });
                drawCenteredText(ctx, 'celestial-arcana', H - 56, {
                    font: '12px sans-serif',
                    color: 'rgba(229, 226, 225, 0.3)'
                });

                // 输出
                canvas.toBlob(blob => {
                    const dataUrl = canvas.toDataURL('image/png');
                    resolve({ canvas, dataUrl, blob });
                }, 'image/png', 0.95);
            } catch (e) {
                reject(e);
            }
        });
    }

    // ===== 收藏夹长图导出（"我的塔罗冥想录"）=====
    // payload: { records: [...], userName: '', generatedAt: 'YYYY-MM-DD' }
    async function renderFavoritesPoster(payload) {
        const records = (payload && payload.records) || [];
        if (!records.length) throw new Error('收藏夹为空');
        // 预加载所有牌面图
        const allCards = [];
        records.forEach(r => (r.cards || []).slice(0, 4).forEach(c => allCards.push(c)));
        await preloadCardImages(allCards);

        const cw = 720;
        const headerH = 240; const footerH = 100;
        const itemH = 200;
        const gap = 16;
        const totalH = headerH + records.length * (itemH + gap) - gap + footerH + 32;
        const canvas = document.createElement('canvas');
        canvas.width = cw; canvas.height = totalH;
        const ctx = canvas.getContext('2d');

        // 背景渐变
        const bg = ctx.createLinearGradient(0, 0, 0, totalH);
        bg.addColorStop(0, '#1a0f2a');
        bg.addColorStop(0.5, '#0e0e0e');
        bg.addColorStop(1, '#1a0f2a');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, cw, totalH);
        // 顶部光晕
        const glow = ctx.createRadialGradient(cw/2, 120, 30, cw/2, 120, 320);
        glow.addColorStop(0, 'rgba(242,202,80,0.18)');
        glow.addColorStop(1, 'rgba(242,202,80,0)');
        ctx.fillStyle = glow; ctx.fillRect(0, 0, cw, headerH);
        // 星点装饰
        ctx.fillStyle = 'rgba(255,245,200,0.5)';
        for (let i = 0; i < 80; i++) {
            const x = Math.random() * cw, yy = Math.random() * totalH;
            const r = Math.random() * 1.2 + 0.3;
            ctx.beginPath(); ctx.arc(x, yy, r, 0, Math.PI * 2); ctx.fill();
        }

        // 标题
        ctx.fillStyle = 'rgba(242,202,80,0.85)';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.font = '500 18px "EB Garamond", serif';
        ctx.fillText('✦  C E L E S T I A L   A R C A N A  ✦', cw / 2, 60);
        ctx.fillStyle = '#f2ca50';
        ctx.font = '600 32px "EB Garamond", serif';
        ctx.shadowColor = 'rgba(242,202,80,0.6)'; ctx.shadowBlur = 14;
        ctx.fillText('我 的 塔 罗 冥 想 录', cw / 2, 100);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(229,226,225,0.6)';
        ctx.font = '14px sans-serif';
        ctx.fillText(`${(payload.userName || '旅行者')} · ${payload.generatedAt || ''} · 共 ${records.length} 次心灵对话`, cw / 2, 156);
        // 分隔线
        const lineG = ctx.createLinearGradient(60, 0, cw - 60, 0);
        lineG.addColorStop(0, 'rgba(242,202,80,0)');
        lineG.addColorStop(0.5, 'rgba(242,202,80,0.6)');
        lineG.addColorStop(1, 'rgba(242,202,80,0)');
        ctx.fillStyle = lineG;
        ctx.fillRect(60, 198, cw - 120, 1);
        ctx.fillStyle = '#f2ca50';
        ctx.font = '14px serif';
        ctx.fillText('✦', cw / 2, 192);

        // 每条记录
        let y = headerH + 8;
        for (const rec of records) {
            const cardX = 32, cardW = cw - 64;
            ctx.save();
            roundRect(ctx, cardX, y, cardW, itemH, 14);
            ctx.fillStyle = 'rgba(32,31,31,0.7)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(242,202,80,0.22)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = 'rgba(229,226,225,0.5)';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(rec.date || '', cardX + 18, y + 18);
            if (rec.topicLabel) {
                ctx.fillStyle = 'rgba(242,202,80,0.85)';
                ctx.fillText('· ' + rec.topicLabel, cardX + 100, y + 18);
            }
            ctx.fillStyle = '#f2ca50';
            ctx.font = '600 18px sans-serif';
            const q = (rec.question || '无题占卜');
            const qLines = wrapText(ctx, q, cardW - 200);
            ctx.fillText(qLines[0] + (qLines.length > 1 ? '…' : ''), cardX + 18, y + 42);

            const cards = (rec.cards || []).slice(0, 3);
            const miniW = 50, miniH = 76, miniGap = 8;
            let mx = cardX + cardW - (cards.length * (miniW + miniGap)) - 4;
            cards.forEach(c => {
                drawCardIcon(ctx, mx, y + 16, miniW, miniH, {
                    id: c.id, name: c.name, symbol: c.symbol,
                    arcana: c.arcana, suit: c.suit, number: c.number,
                    reversed: c.reversed, _image: c._image
                });
                mx += miniW + miniGap;
            });

            ctx.fillStyle = 'rgba(229,226,225,0.78)';
            ctx.font = '13px sans-serif';
            const advice = (rec.advice || rec.summary || '').replace(/\s+/g, ' ').trim();
            const lines = wrapText(ctx, advice, cardW - 36).slice(0, 3);
            lines.forEach((l, i) => {
                ctx.fillText(l, cardX + 18, y + 102 + i * 22);
            });

            if (rec._fulfillment && rec._fulfillment.status) {
                const STATUS_MAP = { spot_on: ['🎯', '应验', '#52c47e'], missed: ['🌫', '未应验', '#7a8aa6'], partial: ['◐', '部分应验', '#d4af37'] };
                const fs = STATUS_MAP[rec._fulfillment.status];
                if (fs) {
                    ctx.fillStyle = fs[2];
                    ctx.font = '11px sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText(fs[0] + ' ' + fs[1], cardX + cardW - 18, y + itemH - 18);
                }
            }
            if (rec._favorite) {
                ctx.fillStyle = '#f2ca50';
                ctx.font = '14px serif';
                ctx.textAlign = 'left';
                ctx.fillText('⭐', cardX + 18, y + itemH - 18);
            }
            y += itemH + gap;
        }

        // 页脚
        ctx.fillStyle = 'rgba(242,202,80,0.55)';
        ctx.font = '500 14px "EB Garamond", serif';
        ctx.textAlign = 'center';
        ctx.fillText('✦  星辰塔罗 · Celestial Arcana  ✦', cw / 2, totalH - 56);
        ctx.fillStyle = 'rgba(229,226,225,0.35)';
        ctx.font = '10px sans-serif';
        ctx.fillText('保留这份心灵档案，回望你走过的路', cw / 2, totalH - 32);

        return new Promise(resolve => {
            const dataUrl = canvas.toDataURL('image/png');
            canvas.toBlob(blob => resolve({ dataUrl, blob, canvas }), 'image/png');
        });
    }

    function download(dataUrl, filename) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename || ('星辰塔罗_' + Date.now() + '.png');
        document.body.appendChild(a);
        a.click();
        setTimeout(() => a.remove(), 100);
    }

    async function share(blob, payload) {
        if (!navigator.canShare || !blob) return false;
        try {
            const file = new File([blob], '星辰塔罗.png', { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: '星辰塔罗',
                    text: (payload && payload.title) || '我的塔罗时刻 ✦'
                });
                return true;
            }
        } catch (e) {
            // 用户取消或不支持
        }
        return false;
    }

    function canNativeShare() {
        try {
            return !!(navigator.canShare && navigator.canShare({
                files: [new File([new Blob([''])], 't.png', { type: 'image/png' })]
            }));
        } catch (e) { return false; }
    }

    window.TarotPoster = { render, renderFavoritesPoster, download, share, canNativeShare, W, H };
    console.log('✓ Tarot Poster 模块已就绪');
})();
