// UI module for managing the interface
class UI {
  constructor() {
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
      connectionStatus: document.getElementById('connection-status')
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
  }

  updateConnectionStatus(status, isConnected = false) {
    this.elements.connectionStatus.textContent = status;
    this.elements.connectionStatus.className = isConnected 
      ? 'font-medium text-green-400' 
      : 'font-medium text-red-400';
    
    this.elements.connectBtn.textContent = isConnected ? 'Disconnect' : 'Connect';
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
    messageDiv.className = `mb-3 p-2 rounded message-fade-in ${
      isUser 
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
  onConnect() {}
  onSendMessage() {}
}

export default UI;