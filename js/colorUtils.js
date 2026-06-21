const ColorUtils = (() => {
    // ==================== 颜色空间转换 ====================

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    function rgbToHex(r, g, b) {
        r = Math.max(0, Math.min(255, Math.round(r)));
        g = Math.max(0, Math.min(255, Math.round(g)));
        b = Math.max(0, Math.min(255, Math.round(b)));
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    function rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;
        let h;
        const s = max === 0 ? 0 : d / max;
        const v = max;

        if (max === min) {
            h = 0;
        } else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s * 100, v: v * 100 };
    }

    function hsvToRgb(h, s, v) {
        h /= 360; s /= 100; v /= 100;
        let r, g, b;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);

        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s;
        const l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    function hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    // ==================== 情感分析 ====================

    const sentimentLexicon = {
        positive: [
            '喜', '爱', '乐', '欢', '美', '好', '甜', '暖', '阳', '光',
            '明', '亮', '灿', '烂', '绚', '丽', '芬', '芳', '香', '甜',
            '幸', '福', '快', '愉', '兴', '奋', '激', '情', '热', '烈',
            '温', '柔', '安', '宁', '祥', '和', '平', '静', '舒', '畅',
            '自', '由', '希', '望', '梦', '想', '憧', '憬', '期', '待',
            '信', '任', '宽', '容', '善', '良', '真', '诚', '友', '谊',
            '爱', '情', '亲', '情', '团', '圆', '和', '睦', '融', '洽',
            '繁', '荣', '昌', '盛', '兴', '旺', '发', '达', '辉', '煌',
            'happy', 'love', 'joy', 'sun', 'bright', 'warm', 'sweet',
            'beautiful', 'wonderful', 'amazing', 'great', 'good', 'nice'
        ],
        negative: [
            '悲', '伤', '哀', '愁', '苦', '痛', '泪', '哭', '忧', '虑',
            '焦', '躁', '烦', '闷', '压', '抑', '沮', '丧', '失', '望',
            '绝', '望', '孤', '独', '寂', '寞', '冷', '冰', '寒', '霜',
            '雪', '风', '雨', '阴', '暗', '黑', '夜', '昏', '暗', '灰',
            '死', '亡', '毁', '灭', '消', '亡', '破', '碎', '残', '缺',
            '离', '别', '分', '散', '流', '亡', '流', '浪', '漂', '泊',
            '怨', '恨', '愤', '怒', '憎', '恶', '妒', '嫉', '贪', '婪',
            '虚', '假', '欺', '骗', '狡', '猾', '残', '忍', '凶', '狠',
            'sad', 'cry', 'pain', 'dark', 'cold', 'hate', 'angry',
            'lonely', 'alone', 'broken', 'lost', 'fear', 'afraid'
        ],
        neutral: [
            '天', '地', '山', '水', '云', '风', '雨', '花', '草', '树',
            '鸟', '鱼', '虫', '石', '路', '桥', '房', '屋', '窗', '门',
            '书', '画', '诗', '词', '歌', '曲', '琴', '棋', '茶', '酒',
            '春', '夏', '秋', '冬', '朝', '暮', '晨', '昏', '日', '月',
            '星', '河', '江', '湖', '海', '洋', '洲', '岛', '城', '乡'
        ]
    };

    function analyzeSentiment(text) {
        if (!text || text.trim().length === 0) {
            return { score: 0, label: 'neutral', positiveCount: 0, negativeCount: 0, confidence: 0 };
        }

        const lowerText = text.toLowerCase();
        let positiveCount = 0;
        let negativeCount = 0;

        sentimentLexicon.positive.forEach(word => {
            const regex = new RegExp(word, 'gi');
            const matches = lowerText.match(regex);
            if (matches) positiveCount += matches.length;
        });

        sentimentLexicon.negative.forEach(word => {
            const regex = new RegExp(word, 'gi');
            const matches = lowerText.match(regex);
            if (matches) negativeCount += matches.length;
        });

        const total = positiveCount + negativeCount;
        let score = 0;
        let confidence = 0;

        if (total > 0) {
            score = (positiveCount - negativeCount) / total;
            confidence = Math.min(total / 5, 1);
        }

        let label;
        if (score > 0.2) label = 'positive';
        else if (score < -0.2) label = 'negative';
        else label = 'neutral';

        return { score, label, positiveCount, negativeCount, confidence };
    }

    // ==================== 色彩心理学推荐 ====================

    const colorPalettes = {
        positive: {
            name: '暖色系 · 积极情感',
            description: '适合表达喜悦、热情、温暖的情感',
            colors: [
                { hex: '#c0392b', name: '赤红', reason: '热情、活力、强烈情感' },
                { hex: '#e74c3c', name: '朱红', reason: '激情、能量、爱' },
                { hex: '#e67e22', name: '橙黄', reason: '温暖、欢乐、创造力' },
                { hex: '#f39c12', name: '金黄', reason: '阳光、希望、幸福' },
                { hex: '#d68910', name: '琥珀', reason: '温馨、怀旧、舒适' },
                { hex: '#b9770e', name: '暖棕', reason: '稳重、踏实、可靠' }
            ]
        },
        negative: {
            name: '冷色系 · 消极情感',
            description: '适合表达忧伤、沉静、思念的情感',
            colors: [
                { hex: '#1e3a5f', name: '藏青', reason: '深邃、沉静、稳重' },
                { hex: '#2c3e50', name: '深蓝', reason: '忧郁、理性、冷静' },
                { hex: '#34495e', name: '岩蓝', reason: '沉稳、内敛、思考' },
                { hex: '#2980b9', name: '天蓝', reason: '清澈、开阔、自由' },
                { hex: '#16a085', name: '青绿', reason: '宁静、平和、生命' },
                { hex: '#4a3728', name: '墨棕', reason: '深沉、怀旧、厚重' }
            ]
        },
        neutral: {
            name: '中和系 · 平静情感',
            description: '适合表达平和、叙事、思考的情感',
            colors: [
                { hex: '#2c2c2c', name: '墨黑', reason: '经典、纯粹、有力' },
                { hex: '#34495e', name: '深灰蓝', reason: '稳重、专业、克制' },
                { hex: '#5d4e37', name: '深褐', reason: '古朴、典雅、书卷气' },
                { hex: '#4834d4', name: '靛蓝', reason: '神秘、高贵、创造' },
                { hex: '#6c5ce7', name: '紫罗兰', reason: '优雅、浪漫、梦幻' },
                { hex: '#2d3436', name: '炭黑', reason: '现代、简洁、有力' }
            ]
        }
    };

    function getRecommendedColors(sentiment) {
        const palette = colorPalettes[sentiment.label] || colorPalettes.neutral;
        const shuffled = [...palette.colors].sort(() => Math.random() - 0.5);
        return {
            ...palette,
            colors: shuffled.slice(0, 4),
            sentiment: sentiment
        };
    }

    // ==================== 图片主色调提取 ====================

    function extractDominantColors(imageElement, colorCount = 5, quality = 10) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const maxSize = 200;
            let width = imageElement.naturalWidth || imageElement.width;
            let height = imageElement.naturalHeight || imageElement.height;

            if (width > height) {
                if (width > maxSize) {
                    height = (height / width) * maxSize;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = (width / height) * maxSize;
                    height = maxSize;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(imageElement, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, width, height);
            const pixels = imageData.data;
            const pixelCount = width * height;

            const colorMap = new Map();

            for (let i = 0; i < pixelCount; i += quality) {
                const offset = i * 4;
                const r = pixels[offset];
                const g = pixels[offset + 1];
                const b = pixels[offset + 2];
                const a = pixels[offset + 3];

                if (a < 125) continue;

                const bucketR = Math.floor(r / 16) * 16;
                const bucketG = Math.floor(g / 16) * 16;
                const bucketB = Math.floor(b / 16) * 16;
                const key = `${bucketR},${bucketG},${bucketB}`;

                if (!colorMap.has(key)) {
                    colorMap.set(key, { r: 0, g: 0, b: 0, count: 0 });
                }
                const bucket = colorMap.get(key);
                bucket.r += r;
                bucket.g += g;
                bucket.b += b;
                bucket.count++;
            }

            const sortedColors = Array.from(colorMap.values())
                .filter(c => c.count > pixelCount * 0.005)
                .map(c => ({
                    r: Math.round(c.r / c.count),
                    g: Math.round(c.g / c.count),
                    b: Math.round(c.b / c.count),
                    count: c.count
                }))
                .sort((a, b) => b.count - a.count);

            const filteredColors = filterSimilarColors(sortedColors, 40);
            const dominantColors = filteredColors.slice(0, colorCount).map(c => ({
                hex: rgbToHex(c.r, c.g, c.b),
                rgb: { r: c.r, g: c.g, b: c.b },
                hsv: rgbToHsv(c.r, c.g, c.b),
                percentage: (c.count / pixelCount * quality * 100).toFixed(1)
            }));

            resolve(dominantColors);
        });
    }

    function filterSimilarColors(colors, threshold) {
        const result = [];

        for (const color of colors) {
            let isSimilar = false;

            for (const existing of result) {
                const dr = color.r - existing.r;
                const dg = color.g - existing.g;
                const db = color.b - existing.b;
                const distance = Math.sqrt(dr * dr + dg * dg + db * db);

                if (distance < threshold) {
                    isSimilar = true;
                    if (color.count > existing.count) {
                        const idx = result.indexOf(existing);
                        result[idx] = color;
                    }
                    break;
                }
            }

            if (!isSimilar) {
                result.push(color);
            }
        }

        return result;
    }

    function loadImageFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('图片加载失败'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsDataURL(file);
        });
    }

    // ==================== 颜色适用性判断 ====================

    function isColorSuitableForInk(hexColor) {
        const rgb = hexToRgb(hexColor);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

        const isDarkEnough = hsl.l < 45;
        const hasEnoughSaturation = hsl.s > 15 || hsl.l < 30;

        return isDarkEnough && hasEnoughSaturation;
    }

    function adjustColorForInk(hexColor) {
        const rgb = hexToRgb(hexColor);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

        let newL = hsl.l;
        if (newL > 45) {
            newL = Math.max(20, 45 - (newL - 45) * 0.5);
        }

        let newS = hsl.s;
        if (newS < 20 && newL > 30) {
            newS = Math.min(60, newS + 15);
        }

        const adjustedRgb = hslToRgb(hsl.h, newS, newL);
        return rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b);
    }

    function getContrastColor(hexColor) {
        const rgb = hexToRgb(hexColor);
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }

    return {
        hexToRgb,
        rgbToHex,
        rgbToHsv,
        hsvToRgb,
        rgbToHsl,
        hslToRgb,
        analyzeSentiment,
        getRecommendedColors,
        extractDominantColors,
        loadImageFromFile,
        isColorSuitableForInk,
        adjustColorForInk,
        getContrastColor,
        colorPalettes
    };
})();

if (typeof window !== 'undefined') {
    window.ColorUtils = ColorUtils;
}
