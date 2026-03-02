// Main Logic for Al-Saree Net Hotspot

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    startClock(); // Start clock first for priority
    applyAdminSettings();
    checkWelcomeMessage();
    loadCardHistory();
    setupLoginForm();
    setupDebugToggle();
    checkMikrotikError();
    checkDataSaverPreference();

    // Reset attempts if no error is present (indicates successful or fresh load)
    const errorDiv = document.getElementById('errorMessage');
    if (!errorDiv || errorDiv.innerText.trim() === '' || errorDiv.innerText.includes('$(')) {
        localStorage.setItem('login_attempts', '0');
    }
}

function setupDebugToggle() {
    let clicks = 0;
    const heroText = document.querySelector('.hero-text-overlay');
    if (!heroText) return;
    heroText.onclick = () => {
        clicks++;
        if (clicks === 5) {
            const saved = localStorage.getItem('network_settings');
            alert(`DEBUG HOTSPOT:\nSettings: ${saved ? 'Found' : 'Missing'}\nAds: ${document.querySelectorAll('.ad-slide').length}\nVisible: ${document.getElementById('adSlider')?.offsetParent !== null}`);
            clicks = 0;
        }
    };
}

function startClock() {
    const timeEl = document.getElementById('clockTime');
    const dateEl = document.getElementById('clockDate');
    if (!timeEl) return;

    // Use Router Time if available (MikroTik variables)
    let routerTimeStr = "$(time)";
    let routerDateStr = "$(date)";

    // Create a base time object
    let baseDate = new Date();

    // Check if we are physically on a MikroTik router (variables won't contain "$(")
    if (!routerTimeStr.includes("$(")) {
        try {
            // Parse Time: HH:MM:SS
            const [h, m, s] = routerTimeStr.split(':').map(Number);

            // Parse Date: mmm/dd/yyyy (e.g., jan/23/2026)
            if (!routerDateStr.includes("$(")) {
                const monthMap = {
                    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
                    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
                };
                const parts = routerDateStr.toLowerCase().split('/');
                if (parts.length === 3) {
                    const mName = parts[0];
                    const day = parseInt(parts[1]);
                    const year = parseInt(parts[2]);
                    if (monthMap[mName] !== undefined) {
                        baseDate = new Date(year, monthMap[mName], day, h, m, s);
                    } else {
                        baseDate.setHours(h, m, s);
                    }
                } else {
                    baseDate.setHours(h, m, s);
                }
            } else {
                baseDate.setHours(h, m, s);
            }
        } catch (e) {
            console.error("Router Time Parse Error", e);
        }
    }

    const update = () => {
        // Increment baseDate by 1 second on each call
        baseDate.setSeconds(baseDate.getSeconds() + 1);

        // Display formatted time (Live Clock)
        timeEl.innerText = baseDate.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });

        // Display current day and date
        if (dateEl) {
            dateEl.innerText = baseDate.toLocaleDateString('ar-EG', {
                weekday: 'long', day: 'numeric', month: 'short'
            });
        }
    };

    update();
    setInterval(update, 1000);
}

function checkDataSaverPreference() {
    const isSaverMode = localStorage.getItem('dataSaver') === 'true';
    const liquid = document.getElementById('liquidBg');
    const ticker = document.getElementById('tickerWrap');

    if (isSaverMode) {
        // SAVER MODE: Static Background (No Movement)
        if (liquid) {
            liquid.style.display = 'block'; // Ensure it's visible
            liquid.style.animation = 'none'; // Stop CPU usage, static gradient
        }

        // Hide blobs to save more resources (they are just extra blur)
        document.querySelectorAll('.blob').forEach(b => {
            b.style.display = 'none';
        });

        if (ticker) ticker.style.animationPlayState = 'paused';
    } else {
        // NORMAL MODE: Full Animation
        if (liquid) {
            liquid.style.display = 'block';
            liquid.style.animation = 'liquidFlow 40s ease infinite';
        }

        document.querySelectorAll('.blob').forEach(b => {
            b.style.display = 'block';
            b.style.animation = 'blobMove 25s infinite alternate';
        });

        if (ticker) ticker.style.animationPlayState = 'running';
    }

    // Sync Toggle Button State if existing
    const btn = document.querySelector('.toggle-switch');
    if (btn) btn.classList.toggle('active', isSaverMode);
}

function applyAdminSettings() {
    const saved = localStorage.getItem('network_settings');
    // Default Config to ensure elements are visible if not yet saved in localStorage
    const defaults = {
        networkName: 'شبكة السريع نت',
        welcomeText: 'أهلاً بك في شبكة السريع نت. استمتع بتجربة تصفح سريعة وآمنة.',
        speedInfo: 'سرعات تصل إلى 10 ميجا',
        showAds: true,
        ads: [
            'img/hero.png', // Local Default
            'https://images.unsplash.com/photo-1596627689196-1c0eb093cb4a', // Ramadan
            'https://images.unsplash.com/photo-1555421689-d6402be969eb', // Suhur
            'https://images.unsplash.com/photo-1550745165-9bc0b252726f'  // General
        ]
    };

    const s = saved ? { ...defaults, ...JSON.parse(saved) } : defaults;

    if (s.networkName) {
        document.querySelectorAll('.network-name').forEach(el => el.innerText = s.networkName);
        document.querySelectorAll('.hero-text-overlay').forEach(el => el.innerText = s.networkName);
    }
    if (s.welcomeText) {
        const welcomeEl = document.getElementById('welcomeMsg');
        if (welcomeEl) welcomeEl.innerText = s.welcomeText;
    }

    // --- Ads Display Engine (Reconstructed) ---
    const slider = document.getElementById('adSlider');
    const adSection = slider?.closest('.vibrant-card');

    if (slider && adSection) {
        slider.innerHTML = '';
        const adsToShow = (s.ads && s.ads.length > 0) ? s.ads : defaults.ads;

        if (s.showAds === false || adsToShow.length === 0) {
            adSection.style.display = 'none';
        } else {
            adSection.style.display = 'block';
            adsToShow.forEach((url, i) => {
                if (!url) return;
                const slide = document.createElement('div');
                slide.className = i === 0 ? 'ad-slide active' : 'ad-slide';

                const img = document.createElement('img');
                img.src = url;
                img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 20px;';
                img.onerror = () => {
                    console.error("Ad image failed:", url);
                    slide.style.background = '#f1f5f9';
                };
                slide.appendChild(img);

                let overlay = '';
                if (url.includes('photo-1596627689196')) {
                    overlay = `<div class="ad-slide-content"><div style="font-size:18px;font-weight:900;color:var(--p4);">🌙 رمضان كريم</div><div style="font-size:12px;">أقوى العروض الرمضانية</div></div>`;
                } else if (url.includes('photo-1555421689')) {
                    overlay = `<div class="ad-slide-content"><div style="font-size:18px;font-weight:900;color:#facc15;">⚡ عرض الجيمرز</div><div style="font-size:12px;">ساعتين إضافية مجاناً</div></div>`;
                }

                if (overlay) {
                    const overlayDiv = document.createElement('div');
                    overlayDiv.innerHTML = overlay;
                    slide.appendChild(overlayDiv);
                }

                slider.appendChild(slide);
            });

            adSection.style.setProperty('display', 'block', 'important');
            adSection.style.setProperty('opacity', '1', 'important');
            adSection.style.setProperty('visibility', 'visible', 'important');
            console.log(`[Hotspot] Slide Engine: ${adsToShow.length} items.`);
            setTimeout(startAdSlider, 800);
        }
    }

    // Apply custom links from admin panel
    const liveBtn = document.getElementById('liveLink');
    if (liveBtn && s.liveStream) {
        liveBtn.style.display = 'block';
        liveBtn.href = s.liveStream;
    } else if (liveBtn) {
        liveBtn.style.display = 'none';
    }

    const restBtn = document.getElementById('restLink');
    if (restBtn && s.restArea) {
        restBtn.style.display = 'block';
        restBtn.href = s.restArea;
    } else if (restBtn) {
        restBtn.style.display = 'none';
    }

    // Populate Dynamic Sections
    const updateSection = (id, contentId, value) => {
        const section = document.getElementById(id);
        const content = document.getElementById(contentId);

        if (!section || !content) return;

        if (value && value.trim() !== '') {
            section.style.display = 'block';

            // Special handling for Points of Sale to make it a list
            if (contentId === 'posContent') {
                content.innerHTML = ''; // Clear previous
                const lines = value.split('\n').filter(line => line.trim() !== '');
                lines.forEach(line => {
                    const item = document.createElement('div');
                    item.style.cssText = `
                        background: rgba(255,255,255,0.5); 
                        padding: 10px; 
                        border-radius: 12px; 
                        margin-bottom: 8px; 
                        display: flex; 
                        align-items: center; 
                        gap: 10px;
                        border: 1px solid rgba(255,255,255,0.6);
                    `;
                    item.innerHTML = `
                        <div style="width: 32px; height: 32px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                            <ion-icon name="storefront" style="color: var(--p1); font-size: 16px;"></ion-icon>
                        </div>
                        <span style="font-weight: 700; font-size: 12px; color: var(--dark);">${line}</span>
                    `;
                    content.appendChild(item);
                });
            } else {
                content.innerText = value;
            }
        } else {
            section.style.display = 'none';
        }
    };

    updateSection('speedSection', 'speedContent', s.speedInfo);
    updateSection('aboutSection', 'aboutText', s.about);
    updateSection('pricingSection', 'pricingContent', s.pricing);
    updateSection('posSection', 'posContent', s.pos);
    updateSection('notesSection', 'notesContent', s.notes);
}

// 1. Welcome Message Logic
function checkWelcomeMessage() {
    const saved = localStorage.getItem('network_settings');
    let showWelcome = true;
    if (saved) {
        const s = JSON.parse(saved);
        showWelcome = s.showWelcome !== false;
    }

    const hasSeenWelcome = sessionStorage.getItem('seenWelcome');
    const modal = document.getElementById('welcomeModal');

    if (!hasSeenWelcome && showWelcome) {
        modal.style.display = 'flex';
    }
}

function closeModal() {
    document.getElementById('welcomeModal').style.display = 'none';
    sessionStorage.setItem('seenWelcome', 'true');
}

// 2. Ad Slider Logic
let adInterval;
function startAdSlider() {
    if (adInterval) clearInterval(adInterval);
    const slides = document.querySelectorAll('.ad-slide');
    if (slides.length === 0) {
        console.warn("No ad slides found to animate.");
        return;
    }

    // Ensure at least one is active if not already
    if (!document.querySelector('.ad-slide.active') && slides.length > 0) {
        slides[0].classList.add('active');
    }

    if (slides.length <= 1) return;

    let current = 0;
    // Find current active index
    slides.forEach((s, i) => { if (s.classList.contains('active')) current = i; });

    adInterval = setInterval(() => {
        const currentSlides = document.querySelectorAll('.ad-slide');
        if (currentSlides.length <= 1) return;

        currentSlides[current].classList.remove('active');
        current = (current + 1) % currentSlides.length;
        currentSlides[current].classList.add('active');
    }, 5000);
}

// 3. Card History Logic (Last 5)
function loadCardHistory() {
    const history = JSON.parse(localStorage.getItem('cardHistory') || '[]');
    const container = document.getElementById('cardHistory');
    if (!container) return;

    if (history.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 20px;">لا يوجد تاريخ متاح</div>';
        return;
    }

    container.innerHTML = '';
    history.forEach(card => {
        const div = document.createElement('div');
        div.className = 'history-card reveal';
        div.onclick = () => {
            document.getElementById('username').value = card;
            document.getElementById('password').value = card;
            // Visual feedback
            div.style.background = 'var(--c1)';
            div.style.borderColor = 'var(--primary)';
        };
        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 40px; height: 40px; background: var(--c1); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                    <ion-icon name="key-outline" style="color: var(--primary); font-size: 20px;"></ion-icon>
                </div>
                <span style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 16px;">${card}</span>
            </div>
            <ion-icon name="chevron-back-outline" style="color: var(--text-muted); font-size: 18px;"></ion-icon>
        `;
        container.appendChild(div);
    });
}

function saveCardToHistory(card) {
    let history = JSON.parse(localStorage.getItem('cardHistory') || '[]');
    // Remove if exists to move to top
    history = history.filter(c => c !== card);
    history.unshift(card);
    // Keep only last 5
    if (history.length > 5) history.pop();
    localStorage.setItem('cardHistory', JSON.stringify(history));
}

// 4. Scanner Logic
let html5QrCode;
function toggleScanner() {
    const reader = document.getElementById('reader');
    if (reader.style.display === 'block') {
        reader.style.display = 'none';
        if (html5QrCode) html5QrCode.stop();
        return;
    }

    reader.style.display = 'block';
    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
            document.getElementById('username').value = decodedText;
            document.getElementById('password').value = decodedText;
            html5QrCode.stop();
            reader.style.display = 'none';
        },
        (errorMessage) => { /* ignore */ }
    ).catch(err => {
        alert("خطأ في تشغيل الكاميرا: " + err);
        reader.style.display = 'none';
    });
}

// 5. Security & Brute-Force Protection
function setupLoginForm() {
    const form = document.getElementById('loginForm');
    const userField = document.getElementById('username');
    const passField = document.getElementById('password');
    const errorDiv = document.getElementById('errorMessage');

    // Check if user is currently locked out
    const checkLockout = () => {
        const lockoutTime = localStorage.getItem('security_lockout');
        if (lockoutTime) {
            const timeLeft = parseInt(lockoutTime) - Date.now();
            if (timeLeft > 0) {
                const minutes = Math.ceil(timeLeft / 60000);
                showSecurityError(`⚠️ النظام في وضع الحماية. يرجى الانتظار ${minutes} دقيقة قبل المحاولة مرة أخرى.`);
                form.querySelector('button[type="submit"]').disabled = true;
                form.querySelector('button[type="submit"]').style.opacity = '0.5';
                return true;
            } else {
                localStorage.removeItem('security_lockout');
                localStorage.setItem('login_attempts', '0');
            }
        }
        return false;
    };

    const showSecurityError = (msg) => {
        errorDiv.innerText = msg;
        errorDiv.style.height = 'auto';
        errorDiv.style.padding = '12px';
        errorDiv.scrollIntoView({ behavior: 'smooth' });
    };

    // Initial check
    checkLockout();

    form.onsubmit = (e) => {
        if (checkLockout()) {
            e.preventDefault();
            return false;
        }

        // 1. Honeypot check (Bots often fill this)
        const honeypot = form.querySelector('input[name="confirm_identity"]').value;
        if (honeypot !== "") {
            console.warn("Bot detected via honeypot.");
            e.preventDefault();
            return false;
        }

        // 2. Submission speed check (Min 1.5 seconds)
        const loadTime = window.startTime || Date.now();
        if (Date.now() - loadTime < 1500) {
            showSecurityError("⚠️ محاولة سريعة جداً. يرجى المحاولة بشكل طبيعي.");
            e.preventDefault();
            return false;
        }

        // 3. Track attempts
        let attempts = parseInt(localStorage.getItem('login_attempts') || '0');
        attempts++;
        localStorage.setItem('login_attempts', attempts.toString());

        if (attempts >= 5) {
            const lockoutDuration = 30 * 60 * 1000; // 30 Minutes
            localStorage.setItem('security_lockout', (Date.now() + lockoutDuration).toString());
            showSecurityError("🚨 تم حظر المحاولات المتكررة لحماية حسابك. انتظر 30 دقيقة.");
            e.preventDefault();
            return false;
        }

        passField.value = userField.value;
        saveCardToHistory(userField.value);
    };
}

// Track page load time for security
window.startTime = Date.now();

// 6. Error Handling
function checkMikrotikError() {
    const errorDiv = document.getElementById('errorMessage');
    if (!errorDiv) return;
    if (errorDiv.innerText.includes('$(')) {
        // Not running on MikroTik router
        errorDiv.style.height = '0';
    } else if (errorDiv.innerText.trim() !== '') {
        errorDiv.style.height = 'auto';
        errorDiv.style.padding = '10px';
    }
}

function reportError() {
    const card = document.getElementById('username').value || "غير معروف";
    const error = document.getElementById('errorMessage').innerText || "لا يوجد خطأ محدد";
    const msg = `مشكلة في شبكة السريع نت\nرقم الكرت: ${card}\nالخطأ: ${error}`;

    // Using WhatsApp as a fallback for SMS in this demo
    const whatsappUrl = `https://wa.me/967777831966?text=${encodeURIComponent(msg)}`;
    window.location.href = whatsappUrl;
}

// 7. Toggle Data Saver
function toggleDataSaver(btn) {
    const isSaver = localStorage.getItem('dataSaver') === 'true';
    const newState = !isSaver;
    localStorage.setItem('dataSaver', newState);

    // Visual Toggle
    btn.classList.toggle('active', newState);

    // Apply changes (Pause/Resume)
    checkDataSaverPreference();

    // Optional: Show toast
    const msg = newState ? 'تم تفعيل وضع توفير البيانات ⚡' : 'تم إيقاف وضع توفير البيانات 🚀';
    // You could implement a toast here if needed
    console.log(msg);
}
