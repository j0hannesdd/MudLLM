// UI module for managing the interface
class UI {
  constructor(onQuickAction) {
    this.elements = {
      loginForm: document.getElementById('login-form'),
      gameInterface: document.getElementById('game-interface'),
      tokenInput: document.getElementById('token'),
      mudUrlInput: document.getElementById('mud-url'),
      usernameInput: document.getElementById('username'),
      passwordInput: document.getElementById('password'),
      connectBtn: document.getElementById('connect-btn'),
      llmOutput: document.getElementById('llm-output'),
      rawLog: document.getElementById('raw-log'),
      userInput: document.getElementById('user-input'),
      sendBtn: document.getElementById('send-btn'),
      connectionStatus: document.getElementById('connection-status'),
      quickActionBar: document.getElementById('quick-actions-bar')
    };
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Handle enter key in input fields
    this.elements.userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.onSendMessage();
      }
    });

    this.elements.sendBtn.addEventListener('click', () => {
      this.onSendMessage();
    });

    this.elements.connectBtn.addEventListener('click', () => {
      this.onConnect();
    });

    // Handle enter in login form fields
    [this.elements.tokenInput, this.elements.mudUrlInput, this.elements.usernameInput, this.elements.passwordInput].forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.onConnect();
        }
      });
    });
  }

  showGameInterface() {
    this.elements.loginForm.classList.add('hidden');
    this.elements.gameInterface.classList.remove('hidden');
  }

  hideGameInterface() {
    this.elements.loginForm.classList.remove('hidden');
    this.elements.gameInterface.classList.add('hidden');

    this.clearGameOutput();
  }

  updateConnectionStatus(status, isConnected = false) {
    this.elements.connectionStatus.textContent = status;
    this.elements.connectionStatus.className = isConnected
      ? 'font-medium text-green-400'
      : 'font-medium text-red-400';

    this.elements.connectBtn.disabled = false;
  }

  addRawMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'mb-2 text-xs text-gray-300 message-fade-in';
    messageDiv.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;

    this.elements.rawLog.appendChild(messageDiv);
    this.elements.rawLog.scrollTop = this.elements.rawLog.scrollHeight;
  }

  addLLMMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `mb-3 p-2 rounded message-fade-in ${isUser
      ? 'bg-blue-600 ml-8 text-right'
      : 'bg-gray-700 mr-8'
      }`;

    if (isUser) {
      messageDiv.innerHTML = `<strong>You:</strong> ${message}`;
    } else {
      messageDiv.innerHTML = `<strong>LLM:</strong> ${message}`;
    }

    this.elements.llmOutput.appendChild(messageDiv);
    this.elements.llmOutput.scrollTop = this.elements.llmOutput.scrollHeight;
  }

  clearInput() {
    this.elements.userInput.value = '';
  }

  getLoginData() {
    return {
      token: this.elements.tokenInput.value.trim(),
      mudUrl: this.elements.mudUrlInput.value.trim(),
      username: this.elements.usernameInput.value.trim(),
      password: this.elements.passwordInput.value
    };
  }

  getUserInput() {
    return this.elements.userInput.value.trim();
  }

  showError(message) {
    // Create a temporary error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  // Callback functions to be set by main.js
  onConnect() { }
  onSendMessage() { }
  onQuickAction(action) { }

  showConnecting() {
    const btn = this.elements.connectBtn
    // disable so it can't be clicked again
    btn.disabled = true
    // add a simple spinner + text
    btn.innerHTML = `
      <svg class="animate-spin inline-block mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z">
        </path>
      </svg>
      Connecting…
    `
  }

  // Call this when connection either succeeds or fails
  clearConnecting(isConnected) {
    const btn = this.elements.connectBtn
    btn.disabled = false
    btn.textContent = isConnected ? 'Disconnect' : 'Connect'
  }

  /**
   * Show a small spinner + "Thinking..."
   * Appends into #llm-output and scrolls to bottom.
   */
  showLLMLoading() {
    // always clear any old loader
    this.clearLLMLoading();

    const loader = document.createElement('div');
    loader.id = 'llm-loading';
    loader.className = 'mb-3 p-2 rounded bg-gray-700 text-center flex items-center justify-center';
    loader.innerHTML = `
      <svg class="animate-spin h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
      Thinking...
    `;
    this.elements.llmOutput.appendChild(loader);
    this.elements.llmOutput.scrollTop = this.elements.llmOutput.scrollHeight;
  }

  /**
   * Remove the loader if it’s there.
   */
  clearLLMLoading() {
    const old = this.elements.llmOutput.querySelector('#llm-loading');
    if (old) old.remove();
  }

  clearGameOutput() {
    this.elements.llmOutput.innerHTML = '';
    this.elements.rawLog.innerHTML = '';
  }

  setQuickActions(actionsMap) {
    const bar = this.elements.quickActionBar;
    bar.innerHTML = '';

    // actionsMap is an object: { command: label, ... }
    Object.entries(actionsMap).forEach(([command, label]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bg-blue-700 bg-opacity-80 hover:bg-blue-800 px-4 py-2 rounded-md text-sm font-medium';
      btn.textContent = label;
      btn.dataset.value = command;
      btn.addEventListener('click', () => {
        console.log('Quick action clicked:', command);
        if (typeof this.onQuickAction === 'function') {
          this.onQuickAction(command);
        }
      });
      bar.appendChild(btn);
    });
  }
}

export default UI;