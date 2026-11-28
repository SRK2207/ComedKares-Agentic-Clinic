/**
 * ComedKares Standalone Shadow DOM Embeddable Widget
 * Bundled via esbuild into public/widget.js
 */

// Injected CSS string replaced by esbuild define
declare const __INLINE_WIDGET_CSS__: string;

interface ClinicConfig {
  clinic: {
    id: string;
    slug: string;
    name: string;
    theme_color: string;
    supported_languages: string[];
    booking_policy?: string;
    emergency_contact?: string;
  };
  departments: Array<{ id: string; name: string }>;
  doctors: Array<{ id: string; name: string; department: string; fee_inr: number }>;
  welcomePrompts: Record<string, string>;
}

(function () {
  const SCRIPT_NAME = 'widget.js';
  const currentScript = document.currentScript as HTMLScriptElement;
  
  // Extract clinic_id from script attribute or query params
  const clinicId = 
    currentScript?.getAttribute('data-clinic-id') || 
    new URL(currentScript?.src || window.location.href).searchParams.get('clinicId') || 
    'clinic_alpha';

  // Base API origin (relative or absolute from script location)
  let apiOrigin = 'http://localhost:3000';
  if (currentScript?.src) {
    try {
      const parsedUrl = new URL(currentScript.src);
      apiOrigin = parsedUrl.origin;
    } catch {}
  }

  // Prevent multiple initializations
  if (document.getElementById('comedkares-widget-root')) {
    return;
  }

  const container = document.createElement('div');
  container.id = 'comedkares-widget-root';
  document.body.appendChild(container);

  const shadow = container.attachShadow({ mode: 'open' });

  // Inject CSS into Shadow DOM
  const styleEl = document.createElement('style');
  styleEl.textContent = typeof __INLINE_WIDGET_CSS__ !== 'undefined' ? __INLINE_WIDGET_CSS__ : '';
  shadow.appendChild(styleEl);

  let currentLang: 'en' | 'hi' | 'kn' = 'en';
  let sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let clinicConfig: ClinicConfig | null = null;
  let isOpen = false;
  let isRecording = false;
  let speechRecognition: any = null;
  let ttsEnabled = true;
  let timerInterval: any = null;
  let chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // Speech Recognition Setup
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (SpeechRecognition) {
    speechRecognition = new SpeechRecognition();
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;
    speechRecognition.lang = 'en-IN';
  }

  // Render Skeleton UI
  const widgetWrapper = document.createElement('div');
  widgetWrapper.className = 'comedkares-container';
  shadow.appendChild(widgetWrapper);

  function getLanguageSpeechCode(lang: 'en' | 'hi' | 'kn'): string {
    switch (lang) {
      case 'hi': return 'hi-IN';
      case 'kn': return 'kn-IN';
      default: return 'en-IN';
    }
  }

  // Speak response using Web Speech Synthesis
  function speakResponse(text: string, lang: 'en' | 'hi' | 'kn') {
    if (!ttsEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      // Clean emojis and icons for speech
      const cleaned = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[⚠️🔒🔍🚨💡]/gu, '');
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = getLanguageSpeechCode(lang);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[ComedKares TTS error]', e);
    }
  }

  // Dynamically load Razorpay checkout script
  function ensureRazorpayScript(): Promise<void> {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve();
        return;
      }
      const rzpScript = document.createElement('script');
      rzpScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
      rzpScript.async = true;
      rzpScript.onload = () => resolve();
      rzpScript.onerror = () => {
        console.warn('Failed to load Razorpay remote script. Demo mode will be active.');
        resolve();
      };
      document.head.appendChild(rzpScript);
    });
  }

  // Initialize and Fetch Clinic Branding
  async function init() {
    try {
      const res = await fetch(`${apiOrigin}/api/widget/config?clinicId=${clinicId}`);
      if (!res.ok) throw new Error('Clinic config not found');
      clinicConfig = await res.json();
      renderWidget();
    } catch (err) {
      console.error('[ComedKares Widget] Init error:', err);
      // Fallback demo config
      clinicConfig = {
        clinic: {
          id: clinicId,
          slug: clinicId,
          name: clinicId === 'clinic_beta' ? 'Sahyadri Ortho & Spine Center' : 'Sparsh Dental & Maxillofacial Clinic',
          theme_color: clinicId === 'clinic_beta' ? '#059669' : '#4f46e5',
          supported_languages: ['en', 'hi', 'kn'],
          emergency_contact: '+91 80 2345 6789',
        },
        departments: [],
        doctors: [],
        welcomePrompts: {
          en: 'Hello! I am your AI receptionist. How can I assist you with appointments today?',
          hi: 'नमस्ते! मैं आपका AI रिसेप्शनिस्ट हूँ। आज अपॉइंटमेंट बुक करने में मैं आपकी कैसे सहायता कर सकता हूँ?',
          kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ಸ್ವಾಗತಕಾರ. ಇಂದು ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಲು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
        },
      };
      renderWidget();
    }
  }

  function renderWidget() {
    if (!clinicConfig) return;
    const theme = clinicConfig.clinic.theme_color || '#4f46e5';
    (shadow.host as HTMLElement).style.setProperty('--clinic-theme', theme);

    widgetWrapper.innerHTML = `
      <!-- Launcher Button -->
      <button class="comedkares-launcher" id="launcher-btn" aria-label="Open AI Receptionist">
        <span class="comedkares-launcher-pulse"></span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="22"></line>
        </svg>
        <span>AI Receptionist</span>
      </button>

      <!-- Chat Window -->
      <div class="comedkares-window hidden" id="chat-window">
        <!-- Header -->
        <div class="comedkares-header">
          <div class="comedkares-header-top">
            <div class="comedkares-clinic-info">
              <div class="comedkares-avatar">🏥</div>
              <div>
                <div class="comedkares-clinic-title">${clinicConfig.clinic.name}</div>
                <div class="comedkares-clinic-status">
                  <span style="display:inline-block;width:6px;height:6px;background:#4ade80;border-radius:50%"></span>
                  AI Receptionist Online
                </div>
              </div>
            </div>
            <div class="comedkares-header-actions">
              <button class="comedkares-icon-btn" id="tts-toggle" title="Toggle Voice Output">
                ${ttsEnabled ? '🔊' : '🔇'}
              </button>
              <button class="comedkares-icon-btn" id="close-btn" title="Close Window">✕</button>
            </div>
          </div>

          <!-- Language Selector -->
          <div class="comedkares-lang-bar">
            <button class="comedkares-lang-btn ${currentLang === 'en' ? 'active' : ''}" data-lang="en">English</button>
            <button class="comedkares-lang-btn ${currentLang === 'hi' ? 'active' : ''}" data-lang="hi">हिंदी</button>
            <button class="comedkares-lang-btn ${currentLang === 'kn' ? 'active' : ''}" data-lang="kn">ಕನ್ನಡ</button>
          </div>
        </div>

        <!-- Timer / Hold Banner (Hidden initially) -->
        <div class="comedkares-timer-banner" id="timer-banner" style="display:none;">
          <span>🔒 Slot Held For You</span>
          <span id="timer-countdown">05:00</span>
        </div>

        <!-- Emergency Banner (Hidden initially) -->
        <div class="comedkares-emergency-banner" id="emergency-banner" style="display:none;">
          <span>🚨</span>
          <div>
            <strong>EMERGENCY ALERT ESCALATED</strong>
            <div style="font-size:11px;font-weight:normal;">Clinic staff notified. Call ${clinicConfig.clinic.emergency_contact || '112'} immediately.</div>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="comedkares-messages" id="messages-container"></div>

        <!-- Voice Active Indicator (Hidden initially) -->
        <div class="comedkares-voice-active" id="voice-indicator" style="display:none;">
          <div class="comedkares-waves">
            <span></span><span></span><span></span><span></span>
          </div>
          <span>Listening... Speak in ${currentLang === 'hi' ? 'Hindi' : currentLang === 'kn' ? 'Kannada' : 'English'}</span>
        </div>

        <!-- Input Area -->
        <form class="comedkares-input-area" id="input-form">
          <input 
            type="text" 
            class="comedkares-input" 
            id="chat-input" 
            placeholder="Type or click mic to speak..." 
            autocomplete="off"
          />
          <button type="button" class="comedkares-mic-btn" id="mic-btn" title="Voice Input">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
          </button>
          <button type="submit" class="comedkares-send-btn" id="send-btn" title="Send Message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    `;

    bindEvents();
    // Add initial welcome message
    const welcome = clinicConfig.welcomePrompts[currentLang] || clinicConfig.welcomePrompts.en;
    addMessage('assistant', welcome);
  }

  function bindEvents() {
    const launcherBtn = shadow.getElementById('launcher-btn')!;
    const closeBtn = shadow.getElementById('close-btn')!;
    const chatWindow = shadow.getElementById('chat-window')!;
    const inputForm = shadow.getElementById('input-form') as HTMLFormElement;
    const chatInput = shadow.getElementById('chat-input') as HTMLInputElement;
    const micBtn = shadow.getElementById('mic-btn')!;
    const ttsBtn = shadow.getElementById('tts-toggle')!;
    const langBtns = shadow.querySelectorAll('.comedkares-lang-btn');

    launcherBtn.addEventListener('click', () => {
      isOpen = !isOpen;
      chatWindow.classList.toggle('hidden', !isOpen);
      if (isOpen) {
        setTimeout(() => chatInput.focus(), 200);
      }
    });

    closeBtn.addEventListener('click', () => {
      isOpen = false;
      chatWindow.classList.add('hidden');
    });

    ttsBtn.addEventListener('click', () => {
      ttsEnabled = !ttsEnabled;
      ttsBtn.textContent = ttsEnabled ? '🔊' : '🔇';
    });

    langBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        langBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLang = btn.getAttribute('data-lang') as 'en' | 'hi' | 'kn';
        if (speechRecognition) {
          speechRecognition.lang = getLanguageSpeechCode(currentLang);
        }
        if (clinicConfig) {
          const prompt = clinicConfig.welcomePrompts[currentLang] || clinicConfig.welcomePrompts.en;
          addMessage('assistant', prompt);
          speakResponse(prompt, currentLang);
        }
      });
    });

    // Form submission
    inputForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      chatInput.value = '';
      handleUserTurn(text);
    });

    // Voice Input via Web Speech API
    if (speechRecognition) {
      speechRecognition.onstart = () => {
        isRecording = true;
        micBtn.classList.add('recording');
        const voiceInd = shadow.getElementById('voice-indicator');
        if (voiceInd) voiceInd.style.display = 'flex';
      };

      speechRecognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleUserTurn(transcript);
        }
      };

      speechRecognition.onerror = (e: any) => {
        console.warn('[Web Speech Error]', e);
        stopRecording();
      };

      speechRecognition.onend = () => {
        stopRecording();
      };

      micBtn.addEventListener('click', () => {
        if (isRecording) {
          speechRecognition.stop();
        } else {
          speechRecognition.lang = getLanguageSpeechCode(currentLang);
          try {
            speechRecognition.start();
          } catch (err) {
            console.warn('[Speech Recognition Start]', err);
          }
        }
      });
    } else {
      micBtn.style.opacity = '0.5';
      micBtn.title = 'Speech Recognition not supported in this browser';
    }
  }

  function stopRecording() {
    isRecording = false;
    const micBtn = shadow.getElementById('mic-btn');
    if (micBtn) micBtn.classList.remove('recording');
    const voiceInd = shadow.getElementById('voice-indicator');
    if (voiceInd) voiceInd.style.display = 'none';
  }

  function addMessage(role: 'user' | 'assistant', text: string, tools?: string[]) {
    const container = shadow.getElementById('messages-container');
    if (!container) return;

    chatHistory.push({ role, content: text });

    const msgDiv = document.createElement('div');
    msgDiv.className = `comedkares-msg ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'comedkares-bubble';
    bubble.textContent = text;
    msgDiv.appendChild(bubble);

    if (tools && tools.length > 0) {
      tools.forEach(t => {
        const pill = document.createElement('div');
        pill.className = 'comedkares-tool-pill';
        pill.innerHTML = `⚡ ${t.replace(/_/g, ' ')}`;
        msgDiv.appendChild(pill);
      });
    }

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  }

  function showTypingIndicator(): HTMLElement {
    const container = shadow.getElementById('messages-container');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'comedkares-msg assistant';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="comedkares-typing">
        <span></span><span></span><span></span>
      </div>
    `;
    if (container) {
      container.appendChild(typingDiv);
      container.scrollTop = container.scrollHeight;
    }
    return typingDiv;
  }

  function removeTypingIndicator() {
    const el = shadow.getElementById('typing-indicator');
    if (el) el.remove();
  }

  // Start 5-Minute Slot Hold Countdown Timer
  function startHoldTimer(expiresAtIso: string) {
    const banner = shadow.getElementById('timer-banner');
    const countdown = shadow.getElementById('timer-countdown');
    if (!banner || !countdown) return;

    banner.style.display = 'flex';
    if (timerInterval) clearInterval(timerInterval);

    const targetTime = new Date(expiresAtIso).getTime();

    const update = () => {
      const remaining = targetTime - Date.now();
      if (remaining <= 0) {
        clearInterval(timerInterval);
        countdown.textContent = 'EXPIRED';
        banner.style.background = '#fecaca';
        banner.style.color = '#991b1b';
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      countdown.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    update();
    timerInterval = setInterval(update, 1000);
  }

  // Open Razorpay Checkout modal
  async function launchRazorpay(payload: any) {
    await ensureRazorpayScript();

    const options = {
      key: payload.key_id,
      amount: payload.amount,
      currency: payload.currency || 'INR',
      name: clinicConfig?.clinic.name || 'ComedKares Clinic',
      description: 'Appointment Consultation Fee',
      order_id: payload.order_id,
      theme: { color: clinicConfig?.clinic.theme_color || '#4f46e5' },
      handler: async function (response: any) {
        // Send client verification
        try {
          const verifyRes = await fetch(`${apiOrigin}/api/payments/verify-client`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clinic_id: clinicConfig?.clinic.id || clinicId,
              appointment_id: payload.appointment_id,
              order_id: payload.order_id,
              payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              signature: response.razorpay_signature || 'demo_verified_signature',
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            const successText = `🎉 Payment verified successfully! Your appointment has been confirmed (Ref: ${payload.appointment_id}). A confirmation receipt has been sent to your phone.`;
            addMessage('assistant', successText);
            speakResponse(successText, currentLang);
            // Hide timer banner
            const banner = shadow.getElementById('timer-banner');
            if (banner) banner.style.display = 'none';
          }
        } catch (err) {
          console.error('[Payment Verification Error]', err);
        }
      },
      modal: {
        ondismiss: function () {
          addMessage('assistant', 'Payment checkout was closed. Your slot remains held for the duration of the 5-minute timer.');
          renderDemoPaymentCard(payload, options.handler);
        },
      },
    };

    if ((window as any).Razorpay) {
      try {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (e) {
        console.warn('Razorpay open failed, showing demo card:', e);
        renderDemoPaymentCard(payload, options.handler);
      }
    } else {
      renderDemoPaymentCard(payload, options.handler);
    }
  }

  function renderDemoPaymentCard(payload: any, onConfirm: (res: any) => void) {
    const container = shadow.getElementById('messages-container');
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'comedkares-msg assistant';
    card.innerHTML = `
      <div class="comedkares-bubble">
        <div class="comedkares-card">
          <div class="comedkares-card-title">💳 Razorpay Test Payment</div>
          <div style="font-size:12px;color:#475569;">
            <div>Order ID: <code>${payload.order_id}</code></div>
            <div>Consultation Fee: <strong>₹${(payload.amount / 100).toFixed(2)}</strong></div>
          </div>
          <button class="comedkares-pay-btn" id="demo-pay-trigger">
            Pay ₹${(payload.amount / 100).toFixed(2)} & Confirm Booking
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
    container.scrollTop = container.scrollHeight;

    const btn = card.querySelector('#demo-pay-trigger');
    btn?.addEventListener('click', () => {
      btn.textContent = 'Processing Payment...';
      setTimeout(() => {
        onConfirm({
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_order_id: payload.order_id,
          razorpay_signature: 'demo_verified_signature',
        });
      }, 800);
    });
  }

  // Handle Conversational Turn
  async function handleUserTurn(userText: string) {
    addMessage('user', userText);
    showTypingIndicator();

    try {
      const res = await fetch(`${apiOrigin}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: clinicConfig?.clinic.id || clinicId,
          session_id: sessionId,
          message: userText,
          language: currentLang,
          history: chatHistory.slice(-8),
        }),
      });

      removeTypingIndicator();

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const toolNames = (data.toolsExecuted || []).map((t: any) => t.name);

      addMessage('assistant', data.reply, toolNames);
      speakResponse(data.reply, currentLang);

      // Handle Emergency Alert Banner
      if (data.actionRequired === 'EMERGENCY_ALERT' || data.escalationPayload?.severity === 'EMERGENCY') {
        const emergencyBanner = shadow.getElementById('emergency-banner');
        if (emergencyBanner) emergencyBanner.style.display = 'flex';
      }

      // Handle 5-Minute Slot Hold
      if (data.slotHeldPayload?.expires_at) {
        startHoldTimer(data.slotHeldPayload.expires_at);
      }

      // Handle Razorpay Payment Checkout
      if (data.actionRequired === 'PAYMENT_CHECKOUT' && data.paymentPayload) {
        setTimeout(() => launchRazorpay(data.paymentPayload), 500);
      }
    } catch (err: any) {
      removeTypingIndicator();
      console.error('[ComedKares Turn Error]', err);
      const fallback = `I'm having trouble connecting right now. Please call ${clinicConfig?.clinic.emergency_contact || 'the reception'} directly.`;
      addMessage('assistant', fallback);
    }
  }

  // Auto initialize on script load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
