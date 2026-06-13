document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const homeView = document.getElementById('home-view');
  const chatView = document.getElementById('chat-view');
  const startChatBtn = document.getElementById('start-chat-btn');
  const backHomeBtn = document.getElementById('back-home-btn');
  
  const themeToggleHome = document.getElementById('theme-toggle-home');
  const themeToggleChat = document.getElementById('theme-toggle-chat');
  const languageToggleHome = document.getElementById('language-toggle-home');
  const languageToggleChat = document.getElementById('language-toggle-chat');
  
  const chatBox = document.getElementById('chat-box');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  
  // Theme state & initialization (Light mode default)
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  // Language state & initialization (English default)
  let currentLang = localStorage.getItem('lang') || 'en';
  document.documentElement.setAttribute('lang', currentLang);
  
  // Chat history state initialized empty (Gemini API strictly requires first role to be 'user')
  let chatHistory = [];
  
  // Translation table for static UI elements
  const translations = {
    en: {
      subtitle: "Your loyal companion who is always ready to listen. Share whatever is on your mind safely, comfortably, and warmly. 🌿💧",
      startBtn: "Start Chatting",
      placeholder: "Type your story here...",
      initialMsg: "Hello! I'm SoulChat. Thank you for coming here. I'm ready to listen to your stories, worries, or anything you'd like to share today, casually and without judgment. How are you feeling right now? 🌿",
      backHomeLabel: "Back to Home",
      themeToggleLabel: "Toggle Theme",
      langToggleLabel: "Change Language"
    },
    id: {
      subtitle: "Teman curhat setiamu yang selalu siap mendengarkan kapan saja. Bagikan apa pun yang mengganjal di hatimu secara aman, nyaman, dan hangat. 🌿💧",
      startBtn: "Mulai Curhat",
      placeholder: "Tulis ceritamu di sini...",
      initialMsg: "Halo! Aku SoulChat. Terima kasih sudah datang ke sini. Aku siap mendengarkan cerita, beban pikiran, atau apa pun yang ingin kamu bagikan hari ini dengan santai dan tanpa menghakimi. Bagaimana perasaanmu saat ini? 🌿",
      backHomeLabel: "Kembali ke Home",
      themeToggleLabel: "Toggle Tema",
      langToggleLabel: "Ganti Bahasa"
    }
  };
  
  // Toggle theme helper function
  function toggleTheme() {
    const activeTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = activeTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  }
  
  themeToggleHome.addEventListener('click', toggleTheme);
  themeToggleChat.addEventListener('click', toggleTheme);
  
  // Toggle language helper function
  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('lang', lang);
    
    // Update language toggle text (showing active language)
    document.querySelectorAll('.lang-text').forEach(el => {
      el.textContent = lang.toUpperCase();
    });
    
    // Translate static strings
    document.getElementById('home-subtitle').textContent = translations[lang].subtitle;
    document.getElementById('start-chat-text').textContent = translations[lang].startBtn;
    messageInput.placeholder = translations[lang].placeholder;
    
    // Update accessibility tags
    document.getElementById('back-home-btn').setAttribute('aria-label', translations[lang].backHomeLabel);
    document.getElementById('theme-toggle-home').setAttribute('aria-label', translations[lang].themeToggleLabel);
    document.getElementById('theme-toggle-chat').setAttribute('aria-label', translations[lang].themeToggleLabel);
    // Accessibility tags translation
    languageToggleHome.setAttribute('aria-label', translations[lang].langToggleLabel);
    languageToggleChat.setAttribute('aria-label', translations[lang].langToggleLabel);
  }
  
  const handleLangToggle = () => {
    const nextLang = currentLang === 'en' ? 'id' : 'en';
    applyLanguage(nextLang);
  };
  
  languageToggleHome.addEventListener('click', handleLangToggle);
  languageToggleChat.addEventListener('click', handleLangToggle);
  
  // Reset chat session helper
  function resetChat() {
    const initialMsg = translations[currentLang].initialMsg;
    chatBox.innerHTML = `
      <!-- Initial Message -->
      <div class="chat-message bot">
        <div class="message-bubble neumorphic-outset">
          <div class="message-gloss"></div>
          <div class="message-text">${initialMsg}</div>
          <span class="message-time">${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    `;
    chatHistory = [];
  }
  
  // Initialize current language translation
  applyLanguage(currentLang);

  // SPA View Switcher with animations
  startChatBtn.addEventListener('click', () => {
    // Reset chat on enter just to start fresh
    resetChat();
    homeView.classList.remove('active');
    homeView.classList.add('hidden');
    chatView.classList.remove('hidden');
    chatView.classList.add('active');
    
    // Auto-focus input textarea on chat enter
    setTimeout(() => {
      messageInput.focus();
    }, 300);
  });
  
  backHomeBtn.addEventListener('click', () => {
    chatView.classList.remove('active');
    chatView.classList.add('hidden');
    homeView.classList.remove('hidden');
    homeView.classList.add('active');
    // Clear chat history on return to home
    resetChat();
  });
  
  // Auto-resize textarea to fit text length
  messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    // Max heights and adjust scroll
    const newHeight = this.scrollHeight;
    this.style.height = (newHeight > 120 ? 120 : newHeight) + 'px';
  });
  
  // Send message logic
  function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    
    // Add user bubble message to UI
    appendMessage('user', text);
    
    // Push user message to local chat history state
    chatHistory.push({
      role: 'user',
      parts: [{ text: text }]
    });

    // Reset textarea state
    messageInput.value = '';
    messageInput.style.height = 'auto';
    messageInput.focus();
    
    // Show typing indicator
    const typingIndicator = showTypingIndicator();
    
    // Try sending to Express Backend Vercel Serverless Function
    // If it fails (due to running on local Live Server without API proxy),
    // it will gracefully fall back to local simulated response list.
    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ history: chatHistory })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('API Endpoint tidak tersedia (Fallback mode aktif)');
      }
      return response.json();
    })
    .then(data => {
      removeTypingIndicator(typingIndicator);
      appendMessage('bot', data.reply);
      // Push response to local chat history state
      chatHistory.push({
        role: 'model',
        parts: [{ text: data.reply }]
      });
    })
    .catch(error => {
      console.log('%c' + error.message, 'color: #0088cc; font-weight: bold;');
      
      // Friendly API connection error/fallback messages
      const fallbackMessages = {
        en: "I'm sorry, I'm having trouble connecting to my server right now and can't respond normally. But please know that I am always here and listening to you... 🌿",
        id: "Maaf ya, koneksiku sedang terganggu sehingga aku tidak bisa merespon dengan normal. Tapi jangan khawatir, aku selalu di sini untuk mendengarkanmu... 🌿"
      };
      
      const fallbackReply = fallbackMessages[currentLang] || fallbackMessages.en;
      
      setTimeout(() => {
        removeTypingIndicator(typingIndicator);
        appendMessage('bot', fallbackReply);
        // Push fallback reply to local chat history state
        chatHistory.push({
          role: 'model',
          parts: [{ text: fallbackReply }]
        });
      }, 1200); // 1.2s delay for natural response simulation
    });
  }
    // Append message bubble to chat-box
  function appendMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
      <div class="message-bubble neumorphic-outset">
        <div class="message-gloss"></div>
        <div class="message-text">${escapeHtml(text)}</div>
        <span class="message-time">${timeString}</span>
      </div>
    `;
    
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
  
  // Create and append typing indicator
  function showTypingIndicator() {
    const indicatorDiv = document.createElement('div');
    indicatorDiv.className = 'chat-message bot';
    indicatorDiv.id = 'typing-indicator-wrapper';
    
    indicatorDiv.innerHTML = `
      <div class="message-bubble neumorphic-outset" style="padding: 10px 16px;">
        <div class="message-gloss"></div>
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    
    chatBox.appendChild(indicatorDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return indicatorDiv;
  }
  
  // Remove typing indicator from DOM
  function removeTypingIndicator(indicatorDiv) {
    if (indicatorDiv && indicatorDiv.parentNode) {
      indicatorDiv.parentNode.removeChild(indicatorDiv);
    }
  }
  
  // Basic HTML escape to prevent XSS in chat bubbles
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // Event listeners for sending message
  sendBtn.addEventListener('click', sendMessage);
  
  messageInput.addEventListener('keydown', (e) => {
    // Send message on Enter, but allow shift+Enter for multiline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});
