class EventHandlers {
    constructor(app) {
        this.app = app;
    }

    bindStyleButtons() {
        document.querySelectorAll('.style-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const style = e.target.dataset.style;
                await this.applyStyle(style);
                this.app.generatePreview();
            });
        });
    }

    async applyStyle(styleName) {
        this.app.currentStyle = styleName;
        
        document.querySelectorAll('.style-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-style="${styleName}"]`).classList.add('active');
        
        const style = HandwritingStyles[styleName];
        if (!style) return;
        
        const options = { ...style };
        delete options.name;
        delete options.description;
        delete options.fontKey;
        
        if (style.fontKey && style.fontKey !== 'custom') {
            await FontLoader.loadGoogleFont(style.fontKey);
            options.fontFamily = FontLoader.getFontFamily(style.fontKey);
        } else if (styleName === 'custom' && this.app.customFontFamily) {
            options.fontFamily = this.app.customFontFamily;
        }
        
        this.app.renderer.setOptions(options);
        this.updateUIFromOptions(options);
    }

    bindColorButtons() {
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.app.renderer.setOptions({ paperColor: e.target.dataset.color });
                this.app.generatePreview();
            });
        });

        document.querySelectorAll('.ink-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.closest('.ink-btn').classList.contains('picker-btn')) return;
                this.setInkColor(e.target.closest('.ink-btn').dataset.color);
            });
        });
    }

    setInkColor(color) {
        document.querySelectorAll('.ink-btn').forEach(b => {
            if (!b.classList.contains('picker-btn')) {
                b.classList.remove('active');
            }
        });

        const presetBtn = document.querySelector(`.ink-btn[data-color="${color}"]:not(.picker-btn)`);
        if (presetBtn) {
            presetBtn.classList.add('active');
        }

        this.app.renderer.setOptions({ inkColor: color });
        this.updateColorDisplay(color);
        document.getElementById('customColorPicker').value = color;
        this.app.generatePreview();
    }

    updateColorDisplay(color) {
        document.getElementById('currentColorPreview').style.background = color;
        document.getElementById('currentColorHex').textContent = color;
    }

    bindColorPicker() {
        const pickerBtn = document.getElementById('colorPickerBtn');
        const colorPicker = document.getElementById('customColorPicker');

        pickerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            colorPicker.click();
        });

        colorPicker.addEventListener('input', (e) => {
            this.setInkColor(e.target.value);
        });

        colorPicker.addEventListener('change', (e) => {
            this.setInkColor(e.target.value);
        });
    }

    bindImageUpload() {
        const imageFile = document.getElementById('imageFile');
        const imageUploadArea = document.getElementById('imageUploadArea');
        const imageUploadLabel = imageUploadArea.querySelector('.image-upload-label');
        const previewContainer = document.getElementById('imagePreviewContainer');
        const previewImg = document.getElementById('uploadedImagePreview');
        const removeBtn = document.getElementById('removeImageBtn');
        const extractedColors = document.getElementById('extractedColors');
        const extractedColorList = document.getElementById('extractedColorList');

        imageFile.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.handleImageUpload(e.target.files[0]);
            }
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            imageUploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                imageUploadLabel.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            imageUploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                imageUploadLabel.classList.remove('dragover');
            });
        });

        imageUploadArea.addEventListener('drop', (e) => {
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageUpload(file);
            }
        });

        removeBtn.addEventListener('click', () => {
            previewContainer.style.display = 'none';
            extractedColors.style.display = 'none';
            imageFile.value = '';
            previewImg.src = '';
            extractedColorList.innerHTML = '';
        });
    }

    async handleImageUpload(file) {
        const previewContainer = document.getElementById('imagePreviewContainer');
        const previewImg = document.getElementById('uploadedImagePreview');
        const extractedColors = document.getElementById('extractedColors');
        const extractedColorList = document.getElementById('extractedColorList');

        try {
            const img = await ColorUtils.loadImageFromFile(file);
            previewImg.src = img.src;
            previewContainer.style.display = 'block';

            const dominantColors = await ColorUtils.extractDominantColors(img, 6, 8);

            extractedColorList.innerHTML = '';
            dominantColors.forEach((colorInfo, index) => {
                const isSuitable = ColorUtils.isColorSuitableForInk(colorInfo.hex);
                const adjustedColor = isSuitable ? colorInfo.hex : ColorUtils.adjustColorForInk(colorInfo.hex);

                const item = document.createElement('div');
                item.className = 'extracted-color-item';
                item.title = `原始: ${colorInfo.hex} (${colorInfo.percentage}%)${isSuitable ? '' : ' - 已调整为墨迹适配色'}`;
                item.innerHTML = `
                    <div class="extracted-color-swatch" style="background: ${adjustedColor}">
                        <div class="extracted-color-percentage">${colorInfo.percentage}%</div>
                    </div>
                `;

                item.addEventListener('click', () => {
                    this.setInkColor(adjustedColor);
                });

                extractedColorList.appendChild(item);

                if (index === 0) {
                    setTimeout(() => {
                        this.setInkColor(adjustedColor);
                    }, 300);
                }
            });

            extractedColors.style.display = 'block';

        } catch (error) {
            console.error('处理图片失败:', error);
            alert('图片处理失败，请尝试其他图片');
        }
    }

    bindSentimentAnalysis() {
        const analyzeBtn = document.getElementById('analyzeBtn');

        analyzeBtn.addEventListener('click', () => {
            this.analyzeAndRecommend();
        });
    }

    analyzeAndRecommend() {
        const text = document.getElementById('textInput').value;
        const sentimentInfo = document.getElementById('sentimentInfo');
        const recommendedColors = document.getElementById('recommendedColors');
        const recommendTitle = document.getElementById('recommendTitle');
        const recommendedColorList = document.getElementById('recommendedColorList');
        const analyzeBtn = document.getElementById('analyzeBtn');

        analyzeBtn.classList.add('analyzing');
        analyzeBtn.textContent = '分析中...';

        setTimeout(() => {
            const sentiment = ColorUtils.analyzeSentiment(text);

            let icon, labelText, description;
            switch (sentiment.label) {
                case 'positive':
                    icon = '😊';
                    labelText = '积极情感';
                    description = '文本传达出喜悦、温暖或热情的情感倾向';
                    break;
                case 'negative':
                    icon = '😢';
                    labelText = '消极情感';
                    description = '文本传达出忧伤、沉静或思念的情感倾向';
                    break;
                default:
                    icon = '😐';
                    labelText = '中性情感';
                    description = '文本情感较为平稳，偏向叙事或思考';
            }

            const barWidth = Math.min(Math.abs(sentiment.score) * 100 + 30, 100);

            sentimentInfo.innerHTML = `
                <div class="sentiment-result">
                    <div class="sentiment-icon">${icon}</div>
                    <div class="sentiment-details">
                        <div class="sentiment-label ${sentiment.label}">${labelText}</div>
                        <div class="sentiment-desc">${description}</div>
                        <div class="sentiment-stats">
                            <span>正面词: ${sentiment.positiveCount}</span>
                            <span>负面词: ${sentiment.negativeCount}</span>
                            <span>置信度: ${Math.round(sentiment.confidence * 100)}%</span>
                        </div>
                        <div class="sentiment-bar">
                            <div class="sentiment-bar-fill ${sentiment.label}" style="width: ${barWidth}%"></div>
                        </div>
                    </div>
                </div>
            `;

            const recommendation = ColorUtils.getRecommendedColors(sentiment);
            recommendTitle.textContent = `${recommendation.name} · ${recommendation.description}`;

            recommendedColorList.innerHTML = '';
            recommendation.colors.forEach(color => {
                const item = document.createElement('div');
                item.className = 'recommended-color-item';
                item.innerHTML = `
                    <div class="recommended-color-swatch" style="background: ${color.hex}"></div>
                    <div class="recommended-color-name">${color.name}</div>
                    <div class="recommended-color-reason">${color.reason}</div>
                `;

                item.addEventListener('click', () => {
                    this.setInkColor(color.hex);
                });

                recommendedColorList.appendChild(item);
            });

            recommendedColors.style.display = 'block';

            analyzeBtn.classList.remove('analyzing');
            analyzeBtn.textContent = '✨ 重新分析';
        }, 500);
    }

    bindParamSliders() {
        const params = ['fontSize', 'charSpacing', 'lineHeight', 'slantAngle', 'inkDensity', 'randomOffset', 'strokeNoise', 'pageWidth', 'pageHeight', 'padding'];
        
        params.forEach(param => {
            const input = document.getElementById(param);
            const valueDisplay = document.getElementById(param + 'Value');
            
            if (input && valueDisplay) {
                input.addEventListener('input', (e) => {
                    this.updateParamDisplay(param, e.target.value);
                    this.updateRendererOption(param, e.target.value);
                    this.app.debouncedGenerate();
                });
            }
        });
    }

    bindTextInput() {
        document.getElementById('textInput').addEventListener('input', () => {
            this.app.debouncedGenerate();
        });
    }

    bindActionButtons() {
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.app.renderer.seed = Math.random();
            this.app.generatePreview();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.app.exportCurrentPage();
        });

        document.getElementById('exportAllBtn').addEventListener('click', () => {
            this.app.exportAllPages();
        });

        document.getElementById('exportLongBtn').addEventListener('click', () => {
            this.app.exportLongImage();
        });
    }

    bindPageNavigation() {
        document.getElementById('prevPage').addEventListener('click', () => {
            this.app.changePage(-1);
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            this.app.changePage(1);
        });
    }

    bindFontUpload() {
        document.getElementById('fontFile').addEventListener('change', (e) => {
            this.handleFontUpload(e.target.files[0]);
        });
    }

    async handleFontUpload(file) {
        if (!file) return;
        
        const validExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
        const fileName = file.name.toLowerCase();
        const isValid = validExtensions.some(ext => fileName.endsWith(ext));
        
        if (!isValid) {
            alert('请上传TTF、OTF、WOFF或WOFF2格式的字体文件');
            return;
        }
        
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('字体文件过大（最大50MB），请选择较小的字体文件');
            return;
        }
        
        let useServer = true;
        try {
            const response = await fetch('http://localhost:5000/api/fonts', {
                method: 'HEAD'
            });
            useServer = response.ok;
        } catch (error) {
            useServer = false;
        }
        
        if (useServer && this.app.fontManager) {
            try {
                this.app.exportManager.showProgressModal('正在上传字体...');
                
                const fontInfo = await this.app.fontManager.uploadFont(file, (progress, message) => {
                    this.app.exportManager.updateProgressModal(progress, message);
                });
                
                this.app.exportManager.hideProgressModal();
                
                this.app.customFontFamily = `'${fontInfo.fontFamily}', serif`;
                document.getElementById('fontName').textContent = `✓ ${fontInfo.name} (已保存到服务端)`;
                
                await this.applyStyle('custom');
                this.app.renderer.setOptions({ fontFamily: this.app.customFontFamily });
                this.app.generatePreview();
                
            } catch (error) {
                this.app.exportManager.hideProgressModal();
                console.warn('服务端上传失败，使用浏览器本地上传:', error);
                this.handleFontUploadBrowser(file);
            }
        } else {
            this.handleFontUploadBrowser(file);
        }
    }

    handleFontUploadBrowser(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const fontData = e.target.result;
            const fontName = 'CustomHandwritingFont';
            
            const fontFace = new FontFace(fontName, fontData);
            fontFace.load().then((loadedFace) => {
                document.fonts.add(loadedFace);
                
                this.app.customFontFamily = `'${fontName}', serif`;
                
                document.getElementById('fontName').textContent = `✓ ${file.name} (本地临时)`;
                
                this.applyStyle('custom');
                this.app.renderer.setOptions({ fontFamily: this.app.customFontFamily });
                this.app.generatePreview();
            }).catch((err) => {
                console.error('字体加载失败:', err);
                alert('字体加载失败，请检查文件格式');
            });
        };
        reader.readAsArrayBuffer(file);
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.app.renderer.seed = Math.random();
                this.app.generatePreview();
            }
        });
    }

    updateParamDisplay(param, value) {
        const valueDisplay = document.getElementById(param + 'Value');
        if (!valueDisplay) return;
        
        switch (param) {
            case 'fontSize':
            case 'charSpacing':
            case 'randomOffset':
            case 'pageWidth':
            case 'pageHeight':
            case 'padding':
                valueDisplay.textContent = value + 'px';
                break;
            case 'lineHeight':
                valueDisplay.textContent = parseFloat(value).toFixed(1);
                break;
            case 'slantAngle':
                valueDisplay.textContent = value + '°';
                break;
            case 'inkDensity':
            case 'strokeNoise':
                valueDisplay.textContent = value + '%';
                break;
            default:
                valueDisplay.textContent = value;
        }
    }

    updateRendererOption(param, value) {
        const numValue = parseFloat(value);
        this.app.renderer.setOptions({ [param]: numValue });
    }

    updateUIFromOptions(options) {
        const paramMap = {
            fontSize: 'fontSize',
            charSpacing: 'charSpacing',
            lineHeight: 'lineHeight',
            slantAngle: 'slantAngle',
            inkDensity: 'inkDensity',
            randomOffset: 'randomOffset',
            strokeNoise: 'strokeNoise'
        };
        
        for (const [optionKey, inputId] of Object.entries(paramMap)) {
            const input = document.getElementById(inputId);
            if (input && options[optionKey] !== undefined) {
                input.value = options[optionKey];
                this.updateParamDisplay(inputId, options[optionKey]);
            }
        }
    }

    bindAll() {
        this.bindStyleButtons();
        this.bindColorButtons();
        this.bindColorPicker();
        this.bindImageUpload();
        this.bindSentimentAnalysis();
        this.bindParamSliders();
        this.bindTextInput();
        this.bindActionButtons();
        this.bindPageNavigation();
        this.bindFontUpload();
        this.bindKeyboardShortcuts();
    }
}

if (typeof window !== 'undefined') {
    window.EventHandlers = EventHandlers;
}
