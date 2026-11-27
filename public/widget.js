"use strict";(()=>{(function(){let O="widget.js",v=document.currentScript,g=v?.getAttribute("data-clinic-id")||new URL(v?.src||window.location.href).searchParams.get("clinicId")||"clinic_alpha",w="http://localhost:3000";if(v?.src)try{w=new URL(v.src).origin}catch{}if(document.getElementById("comedkares-widget-root"))return;let b=document.createElement("div");b.id="comedkares-widget-root",document.body.appendChild(b);let i=b.attachShadow({mode:"open"}),S=document.createElement("style");S.textContent=`/* Scoped CSS for ComedKares Shadow DOM Widget */
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #1e293b;
  font-size: 14px;
  line-height: 1.5;
  box-sizing: border-box;
}

*, *::before, *::after {
  box-sizing: inherit;
}

.comedkares-launcher {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 999999;
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: var(--clinic-theme, #4f46e5);
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  font-weight: 600;
  font-size: 14px;
}

.comedkares-launcher:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

.comedkares-launcher-pulse {
  width: 10px;
  height: 10px;
  background-color: #22c55e;
  border-radius: 50%;
  animation: pulse 1.8s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

.comedkares-window {
  position: fixed;
  bottom: 84px;
  right: 24px;
  width: 400px;
  max-width: calc(100vw - 32px);
  height: 620px;
  max-height: calc(100vh - 110px);
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 999999;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: bottom right;
}

.comedkares-window.hidden {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
  pointer-events: none;
}

/* Header */
.comedkares-header {
  background: var(--clinic-theme, #4f46e5);
  color: #ffffff;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comedkares-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.comedkares-clinic-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.comedkares-avatar {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.comedkares-clinic-title {
  font-weight: 700;
  font-size: 15px;
  line-height: 1.2;
}

.comedkares-clinic-status {
  font-size: 11px;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 4px;
}

.comedkares-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.comedkares-icon-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #ffffff;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background 0.2s;
}

.comedkares-icon-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Language selector */
.comedkares-lang-bar {
  display: flex;
  background: rgba(0, 0, 0, 0.15);
  padding: 3px;
  border-radius: 8px;
  gap: 2px;
}

.comedkares-lang-btn {
  flex: 1;
  padding: 4px 6px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.85);
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.comedkares-lang-btn.active {
  background: #ffffff;
  color: var(--clinic-theme, #4f46e5);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Timer Banner */
.comedkares-timer-banner {
  background: #fef3c7;
  color: #92400e;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #fde68a;
  animation: slideDown 0.3s ease;
}

/* Emergency Alert Banner */
.comedkares-emergency-banner {
  background: #fee2e2;
  color: #991b1b;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #fecaca;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Messages area */
.comedkares-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8fafc;
}

.comedkares-msg {
  display: flex;
  flex-direction: column;
  max-width: 85%;
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.comedkares-msg.user {
  align-self: flex-end;
}

.comedkares-msg.assistant {
  align-self: flex-start;
}

.comedkares-bubble {
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 13.5px;
  line-height: 1.45;
  word-break: break-word;
}

.comedkares-msg.user .comedkares-bubble {
  background: var(--clinic-theme, #4f46e5);
  color: #ffffff;
  border-bottom-right-radius: 2px;
}

.comedkares-msg.assistant .comedkares-bubble {
  background: #ffffff;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-bottom-left-radius: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.comedkares-tool-pill {
  font-size: 10px;
  background: #e2e8f0;
  color: #475569;
  padding: 2px 8px;
  border-radius: 12px;
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
}

.comedkares-card {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 12px;
  margin-top: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.comedkares-card-title {
  font-weight: 700;
  font-size: 13px;
  color: #0f172a;
  margin-bottom: 4px;
}

.comedkares-pay-btn {
  display: block;
  width: 100%;
  margin-top: 8px;
  background: #2563eb;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  transition: background 0.2s;
}

.comedkares-pay-btn:hover {
  background: #1d4ed8;
}

/* Voice indicator */
.comedkares-voice-active {
  padding: 8px 14px;
  background: #ecfdf5;
  color: #065f46;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-top: 1px solid #d1fae5;
}

.comedkares-waves {
  display: flex;
  gap: 3px;
  align-items: center;
  height: 14px;
}

.comedkares-waves span {
  display: inline-block;
  width: 3px;
  height: 100%;
  background: #059669;
  border-radius: 3px;
  animation: soundwave 1.2s infinite ease-in-out;
}

.comedkares-waves span:nth-child(2) { animation-delay: 0.2s; }
.comedkares-waves span:nth-child(3) { animation-delay: 0.4s; }
.comedkares-waves span:nth-child(4) { animation-delay: 0.6s; }

@keyframes soundwave {
  0%, 100% { height: 4px; }
  50% { height: 14px; }
}

/* Input area */
.comedkares-input-area {
  padding: 12px 14px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.comedkares-input {
  flex: 1;
  border: 1px solid #cbd5e1;
  border-radius: 9999px;
  padding: 8px 14px;
  font-size: 13.5px;
  outline: none;
  transition: border-color 0.2s;
}

.comedkares-input:focus {
  border-color: var(--clinic-theme, #4f46e5);
}

.comedkares-mic-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  color: #334155;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s;
}

.comedkares-mic-btn.recording {
  background: #ef4444;
  color: #ffffff;
  animation: pulse 1.2s infinite;
}

.comedkares-send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--clinic-theme, #4f46e5);
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: opacity 0.2s;
}

.comedkares-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comedkares-typing {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  background: #f1f5f9;
  border-radius: 12px;
  width: fit-content;
}

.comedkares-typing span {
  width: 6px;
  height: 6px;
  background: #94a3b8;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.comedkares-typing span:nth-child(1) { animation-delay: 0s; }
.comedkares-typing span:nth-child(2) { animation-delay: 0.2s; }
.comedkares-typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
`,i.appendChild(S);let c="en",N=`sess_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,o=null,h=!1,E=!1,d=null,f=!0,k=null,T=[],L=window.SpeechRecognition||window.webkitSpeechRecognition;L&&(d=new L,d.continuous=!1,d.interimResults=!1,d.lang="en-IN");let _=document.createElement("div");_.className="comedkares-container",i.appendChild(_);function I(e){switch(e){case"hi":return"hi-IN";case"kn":return"kn-IN";default:return"en-IN"}}function C(e,n){if(!(!f||!window.speechSynthesis))try{window.speechSynthesis.cancel();let t=e.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[⚠️🔒🔍🚨💡]/gu,""),a=new SpeechSynthesisUtterance(t);a.lang=I(n),a.rate=1,window.speechSynthesis.speak(a)}catch(t){console.warn("[ComedKares TTS error]",t)}}function $(){return new Promise(e=>{if(window.Razorpay){e();return}let n=document.createElement("script");n.src="https://checkout.razorpay.com/v1/checkout.js",n.async=!0,n.onload=()=>e(),n.onerror=()=>{console.warn("Failed to load Razorpay remote script. Demo mode will be active."),e()},document.head.appendChild(n)})}async function R(){try{let e=await fetch(`${w}/api/widget/config?clinicId=${g}`);if(!e.ok)throw new Error("Clinic config not found");o=await e.json(),B()}catch(e){console.error("[ComedKares Widget] Init error:",e),o={clinic:{id:g,slug:g,name:g==="clinic_beta"?"Sahyadri Ortho & Spine Center":"Sparsh Dental & Maxillofacial Clinic",theme_color:g==="clinic_beta"?"#059669":"#4f46e5",supported_languages:["en","hi","kn"],emergency_contact:"+91 80 2345 6789"},departments:[],doctors:[],welcomePrompts:{en:"Hello! I am your AI receptionist. How can I assist you with appointments today?",hi:"\u0928\u092E\u0938\u094D\u0924\u0947! \u092E\u0948\u0902 \u0906\u092A\u0915\u093E AI \u0930\u093F\u0938\u0947\u092A\u094D\u0936\u0928\u093F\u0938\u094D\u091F \u0939\u0942\u0901\u0964 \u0906\u091C \u0905\u092A\u0949\u0907\u0902\u091F\u092E\u0947\u0902\u091F \u092C\u0941\u0915 \u0915\u0930\u0928\u0947 \u092E\u0947\u0902 \u092E\u0948\u0902 \u0906\u092A\u0915\u0940 \u0915\u0948\u0938\u0947 \u0938\u0939\u093E\u092F\u0924\u093E \u0915\u0930 \u0938\u0915\u0924\u093E \u0939\u0942\u0901?",kn:"\u0CA8\u0CAE\u0CB8\u0CCD\u0C95\u0CBE\u0CB0! \u0CA8\u0CBE\u0CA8\u0CC1 \u0CA8\u0CBF\u0CAE\u0CCD\u0CAE AI \u0CB8\u0CCD\u0CB5\u0CBE\u0C97\u0CA4\u0C95\u0CBE\u0CB0. \u0C87\u0C82\u0CA6\u0CC1 \u0C85\u0CAA\u0CBE\u0CAF\u0CBF\u0C82\u0C9F\u0CCD\u200C\u0CAE\u0CC6\u0C82\u0C9F\u0CCD \u0CAC\u0CC1\u0C95\u0CCD \u0CAE\u0CBE\u0CA1\u0CB2\u0CC1 \u0CA8\u0CBE\u0CA8\u0CC1 \u0CA8\u0CBF\u0CAE\u0C97\u0CC6 \u0CB9\u0CC7\u0C97\u0CC6 \u0CB8\u0CB9\u0CBE\u0CAF \u0CAE\u0CBE\u0CA1\u0CB2\u0CBF?"}},B()}}function B(){if(!o)return;let e=o.clinic.theme_color||"#4f46e5";i.host.style.setProperty("--clinic-theme",e),_.innerHTML=`
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
              <div class="comedkares-avatar">\u{1F3E5}</div>
              <div>
                <div class="comedkares-clinic-title">${o.clinic.name}</div>
                <div class="comedkares-clinic-status">
                  <span style="display:inline-block;width:6px;height:6px;background:#4ade80;border-radius:50%"></span>
                  AI Receptionist Online
                </div>
              </div>
            </div>
            <div class="comedkares-header-actions">
              <button class="comedkares-icon-btn" id="tts-toggle" title="Toggle Voice Output">
                ${f?"\u{1F50A}":"\u{1F507}"}
              </button>
              <button class="comedkares-icon-btn" id="close-btn" title="Close Window">\u2715</button>
            </div>
          </div>

          <!-- Language Selector -->
          <div class="comedkares-lang-bar">
            <button class="comedkares-lang-btn ${c==="en"?"active":""}" data-lang="en">English</button>
            <button class="comedkares-lang-btn ${c==="hi"?"active":""}" data-lang="hi">\u0939\u093F\u0902\u0926\u0940</button>
            <button class="comedkares-lang-btn ${c==="kn"?"active":""}" data-lang="kn">\u0C95\u0CA8\u0CCD\u0CA8\u0CA1</button>
          </div>
        </div>

        <!-- Timer / Hold Banner (Hidden initially) -->
        <div class="comedkares-timer-banner" id="timer-banner" style="display:none;">
          <span>\u{1F512} Slot Held For You</span>
          <span id="timer-countdown">05:00</span>
        </div>

        <!-- Emergency Banner (Hidden initially) -->
        <div class="comedkares-emergency-banner" id="emergency-banner" style="display:none;">
          <span>\u{1F6A8}</span>
          <div>
            <strong>EMERGENCY ALERT ESCALATED</strong>
            <div style="font-size:11px;font-weight:normal;">Clinic staff notified. Call ${o.clinic.emergency_contact||"112"} immediately.</div>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="comedkares-messages" id="messages-container"></div>

        <!-- Voice Active Indicator (Hidden initially) -->
        <div class="comedkares-voice-active" id="voice-indicator" style="display:none;">
          <div class="comedkares-waves">
            <span></span><span></span><span></span><span></span>
          </div>
          <span>Listening... Speak in ${c==="hi"?"Hindi":c==="kn"?"Kannada":"English"}</span>
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
    `,A();let n=o.welcomePrompts[c]||o.welcomePrompts.en;y("assistant",n)}function A(){let e=i.getElementById("launcher-btn"),n=i.getElementById("close-btn"),t=i.getElementById("chat-window"),a=i.getElementById("input-form"),s=i.getElementById("chat-input"),r=i.getElementById("mic-btn"),p=i.getElementById("tts-toggle"),u=i.querySelectorAll(".comedkares-lang-btn");e.addEventListener("click",()=>{h=!h,t.classList.toggle("hidden",!h),h&&setTimeout(()=>s.focus(),200)}),n.addEventListener("click",()=>{h=!1,t.classList.add("hidden")}),p.addEventListener("click",()=>{f=!f,p.textContent=f?"\u{1F50A}":"\u{1F507}"}),u.forEach(l=>{l.addEventListener("click",()=>{if(u.forEach(m=>m.classList.remove("active")),l.classList.add("active"),c=l.getAttribute("data-lang"),d&&(d.lang=I(c)),o){let m=o.welcomePrompts[c]||o.welcomePrompts.en;y("assistant",m),C(m,c)}})}),a.addEventListener("submit",l=>{l.preventDefault();let m=s.value.trim();m&&(s.value="",M(m))}),d?(d.onstart=()=>{E=!0,r.classList.add("recording");let l=i.getElementById("voice-indicator");l&&(l.style.display="flex")},d.onresult=l=>{let m=l.results[0][0].transcript;m&&M(m)},d.onerror=l=>{console.warn("[Web Speech Error]",l),x()},d.onend=()=>{x()},r.addEventListener("click",()=>{if(E)d.stop();else{d.lang=I(c);try{d.start()}catch(l){console.warn("[Speech Recognition Start]",l)}}})):(r.style.opacity="0.5",r.title="Speech Recognition not supported in this browser")}function x(){E=!1;let e=i.getElementById("mic-btn");e&&e.classList.remove("recording");let n=i.getElementById("voice-indicator");n&&(n.style.display="none")}function y(e,n,t){let a=i.getElementById("messages-container");if(!a)return;T.push({role:e,content:n});let s=document.createElement("div");s.className=`comedkares-msg ${e}`;let r=document.createElement("div");r.className="comedkares-bubble",r.textContent=n,s.appendChild(r),t&&t.length>0&&t.forEach(p=>{let u=document.createElement("div");u.className="comedkares-tool-pill",u.innerHTML=`\u26A1 ${p.replace(/_/g," ")}`,s.appendChild(u)}),a.appendChild(s),a.scrollTop=a.scrollHeight}function D(){let e=i.getElementById("messages-container"),n=document.createElement("div");return n.className="comedkares-msg assistant",n.id="typing-indicator",n.innerHTML=`
      <div class="comedkares-typing">
        <span></span><span></span><span></span>
      </div>
    `,e&&(e.appendChild(n),e.scrollTop=e.scrollHeight),n}function P(){let e=i.getElementById("typing-indicator");e&&e.remove()}function z(e){let n=i.getElementById("timer-banner"),t=i.getElementById("timer-countdown");if(!n||!t)return;n.style.display="flex",k&&clearInterval(k);let a=new Date(e).getTime(),s=()=>{let r=a-Date.now();if(r<=0){clearInterval(k),t.textContent="EXPIRED",n.style.background="#fecaca",n.style.color="#991b1b";return}let p=Math.floor(r/6e4),u=Math.floor(r%6e4/1e3);t.textContent=`${p.toString().padStart(2,"0")}:${u.toString().padStart(2,"0")}`};s(),k=setInterval(s,1e3)}async function F(e){await $();let n={key:e.key_id,amount:e.amount,currency:e.currency||"INR",name:o?.clinic.name||"ComedKares Clinic",description:"Appointment Consultation Fee",order_id:e.order_id,theme:{color:o?.clinic.theme_color||"#4f46e5"},handler:async function(t){try{if((await(await fetch(`${w}/api/payments/verify-client`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clinic_id:o?.clinic.id||g,appointment_id:e.appointment_id,order_id:e.order_id,payment_id:t.razorpay_payment_id||`pay_${Date.now()}`,signature:t.razorpay_signature||"demo_verified_signature"})})).json()).success){let r=`\u{1F389} Payment verified successfully! Your appointment has been confirmed (Ref: ${e.appointment_id}). A confirmation receipt has been sent to your phone.`;y("assistant",r),C(r,c);let p=i.getElementById("timer-banner");p&&(p.style.display="none")}}catch(a){console.error("[Payment Verification Error]",a)}},modal:{ondismiss:function(){y("assistant","Payment checkout was closed. Your slot remains held for the duration of the 5-minute timer.")}}};if(window.Razorpay)try{new window.Razorpay(n).open()}catch(t){console.warn("Razorpay open failed, showing demo card:",t),H(e,n.handler)}else H(e,n.handler)}function H(e,n){let t=i.getElementById("messages-container");if(!t)return;let a=document.createElement("div");a.className="comedkares-msg assistant",a.innerHTML=`
      <div class="comedkares-bubble">
        <div class="comedkares-card">
          <div class="comedkares-card-title">\u{1F4B3} Razorpay Test Payment</div>
          <div style="font-size:12px;color:#475569;">
            <div>Order ID: <code>${e.order_id}</code></div>
            <div>Consultation Fee: <strong>\u20B9${(e.amount/100).toFixed(2)}</strong></div>
          </div>
          <button class="comedkares-pay-btn" id="demo-pay-trigger">
            Pay \u20B9${(e.amount/100).toFixed(2)} & Confirm Booking
          </button>
        </div>
      </div>
    `,t.appendChild(a),t.scrollTop=t.scrollHeight;let s=a.querySelector("#demo-pay-trigger");s?.addEventListener("click",()=>{s.textContent="Processing Payment...",setTimeout(()=>{n({razorpay_payment_id:`pay_demo_${Date.now()}`,razorpay_order_id:e.order_id,razorpay_signature:"demo_verified_signature"})},800)})}async function M(e){y("user",e),D();try{let n=await fetch(`${w}/api/agent/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clinic_id:o?.clinic.id||g,session_id:N,message:e,language:c,history:T.slice(-8)})});if(P(),!n.ok)throw new Error(`Server returned ${n.status}`);let t=await n.json(),a=(t.toolsExecuted||[]).map(s=>s.name);if(y("assistant",t.reply,a),C(t.reply,c),t.actionRequired==="EMERGENCY_ALERT"||t.escalationPayload?.severity==="EMERGENCY"){let s=i.getElementById("emergency-banner");s&&(s.style.display="flex")}t.slotHeldPayload?.expires_at&&z(t.slotHeldPayload.expires_at),t.actionRequired==="PAYMENT_CHECKOUT"&&t.paymentPayload&&setTimeout(()=>F(t.paymentPayload),500)}catch(n){P(),console.error("[ComedKares Turn Error]",n);let t=`I'm having trouble connecting right now. Please call ${o?.clinic.emergency_contact||"the reception"} directly.`;y("assistant",t)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",R):R()})();})();
