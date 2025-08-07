// Internationalization (i18n) System
class I18n {
    constructor() {
        this.currentLang = 'en';
        this.translations = {};
        this.fallbackLang = 'en';
    }

    async init() {
        // Detect user's preferred language
        this.currentLang = this.detectLanguage();
        
        // Load translation files
        await this.loadTranslations();
        
        // Apply translations to the page
        this.applyTranslations();
        
        // Update HTML lang attribute
        document.documentElement.lang = this.currentLang;
    }

    detectLanguage() {
        // Check URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        if (langParam && this.isSupported(langParam)) {
            localStorage.setItem('preferredLang', langParam);
            return langParam;
        }

        // Check localStorage
        const savedLang = localStorage.getItem('preferredLang');
        if (savedLang && this.isSupported(savedLang)) {
            return savedLang;
        }

        // Check browser language
        const browserLang = navigator.language.slice(0, 2);
        if (this.isSupported(browserLang)) {
            return browserLang;
        }

        // Default to English
        return this.fallbackLang;
    }

    isSupported(lang) {
        return ['en', 'zh', 'de', 'fr', 'it', 'es', 'tr', 'id', 'pt-br', 'ru'].includes(lang);
    }

    async loadTranslations() {
        try {
            const response = await fetch(`/i18n/${this.currentLang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${this.currentLang} translations`);
            }
            this.translations = await response.json();
        } catch (error) {
            console.error('Error loading translations:', error);
            
            // Fallback to English if current language fails
            if (this.currentLang !== this.fallbackLang) {
                try {
                    const fallbackResponse = await fetch(`/i18n/${this.fallbackLang}.json`);
                    this.translations = await fallbackResponse.json();
                    this.currentLang = this.fallbackLang;
                } catch (fallbackError) {
                    console.error('Error loading fallback translations:', fallbackError);
                }
            }
        }
    }

    applyTranslations() {
        // Update page title and meta tags
        this.updateMeta();
        
        // Update text content with data-i18n attributes
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getNestedValue(this.translations, key);
            if (translation) {
                element.textContent = translation;
            }
        });

        // Update placeholders
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.getNestedValue(this.translations, key);
            if (translation) {
                element.placeholder = translation;
            }
        });

        // Update aria-label attributes
        const ariaElements = document.querySelectorAll('[data-i18n-aria]');
        ariaElements.forEach(element => {
            const key = element.getAttribute('data-i18n-aria');
            const translation = this.getNestedValue(this.translations, key);
            if (translation) {
                element.setAttribute('aria-label', translation);
            }
        });

        // Update dynamic content
        this.updateDynamicContent();
    }

    updateMeta() {
        if (!this.translations.meta) return;

        const meta = this.translations.meta;
        
        // Update title
        if (meta.title) {
            document.title = meta.title;
        }

        // Update meta description
        const descMeta = document.querySelector('meta[name="description"]');
        if (descMeta && meta.description) {
            descMeta.content = meta.description;
        }

        // Update meta keywords
        const keywordsMeta = document.querySelector('meta[name="keywords"]');
        if (keywordsMeta && meta.keywords) {
            keywordsMeta.content = meta.keywords;
        }

        // Update Open Graph tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && meta.ogTitle) {
            ogTitle.content = meta.ogTitle;
        }

        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc && meta.ogDescription) {
            ogDesc.content = meta.ogDescription;
        }
    }

    updateDynamicContent() {
        // Update FAQ items
        this.updateFAQ();
        
        // Update user reviews
        this.updateReviews();
        
        // Update any other dynamic content
        this.updateModalContent();
    }

    updateFAQ() {
        if (!this.translations.faq || !this.translations.faq.items) return;

        const faqItems = document.querySelectorAll('#faq .card');
        faqItems.forEach((item, index) => {
            const faqData = this.translations.faq.items[index];
            if (faqData) {
                const question = item.querySelector('h3');
                const answer = item.querySelector('p');
                
                if (question && faqData.question) {
                    // Keep the icon and update the text
                    const icon = question.querySelector('i');
                    if (icon) {
                        question.innerHTML = '';
                        question.appendChild(icon);
                        question.appendChild(document.createTextNode(faqData.question));
                    } else {
                        question.textContent = faqData.question;
                    }
                }
                
                if (answer && faqData.answer) {
                    answer.textContent = faqData.answer;
                }
            }
        });
    }

    updateReviews() {
        if (!this.translations.reviews || !this.translations.reviews.users) return;

        const reviewItems = document.querySelectorAll('#reviews .comment-card');
        reviewItems.forEach((item, index) => {
            const userData = this.translations.reviews.users[index];
            if (userData) {
                const name = item.querySelector('h4');
                const time = item.querySelector('.text-sm.text-gray-500');
                const content = item.querySelector('p:last-child');
                
                if (name && userData.name) {
                    name.textContent = userData.name;
                }
                
                if (time && userData.time) {
                    time.textContent = userData.time;
                }
                
                if (content && userData.content) {
                    content.textContent = userData.content;
                }
            }
        });
    }

    updateModalContent() {
        // Update modal elements that don't have data-i18n attributes
        const closeButton = document.querySelector('#closeModal');
        if (closeButton && this.translations.modal && this.translations.modal.close) {
            closeButton.setAttribute('title', this.translations.modal.close);
        }
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }

    t(key) {
        return this.getNestedValue(this.translations, key) || key;
    }

    async switchLanguage(lang) {
        if (!this.isSupported(lang) || lang === this.currentLang) {
            return;
        }

        this.currentLang = lang;
        localStorage.setItem('preferredLang', lang);
        
        // Update URL parameter
        const url = new URL(window.location);
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url);

        await this.loadTranslations();
        this.applyTranslations();
        
        // Update HTML lang attribute
        document.documentElement.lang = this.currentLang;
        
        // Update language selector if it exists
        this.updateLanguageSelector();
    }

    updateLanguageSelector() {
        const langButtons = document.querySelectorAll('[data-lang]');
        langButtons.forEach(button => {
            const lang = button.getAttribute('data-lang');
            if (lang === this.currentLang) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    getCurrentLang() {
        return this.currentLang;
    }

    getSupportedLanguages() {
        return [
            { code: 'en', name: 'English', nativeName: 'English' },
            { code: 'zh', name: 'Chinese', nativeName: '中文' },
            { code: 'de', name: 'German', nativeName: 'Deutsch' },
            { code: 'fr', name: 'French', nativeName: 'Français' },
            { code: 'it', name: 'Italian', nativeName: 'Italiano' },
            { code: 'es', name: 'Spanish', nativeName: 'Español' },
            { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
            { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
            { code: 'pt-br', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
            { code: 'ru', name: 'Russian', nativeName: 'Русский' }
        ];
    }
}

// Global i18n instance
window.i18n = new I18n();