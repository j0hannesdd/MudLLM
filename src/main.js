import './styles.css'
import UI from './ui.js'
import APIClient from './api.js'

function stripAnsi(str) {
  // Matches all ANSI escape codes
  return str.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}

class MudLLMClient {
  constructor() {
    this.ui = new UI();
    this.api = new APIClient();
    this.socket = null;
    this.isConnected = false;
    
    // Bind UI callbacks
    this.ui.onConnect = this.handleConnect.bind(this);
    this.ui.onSendMessage = this.handleSendMessage.bind(this);
    
    console.log('MudLLM Client initialized');
  }

  async handleConnect() {
    if (this.isConnected) {
      this.disconnect();
      return;
    }

    this.ui.showConnecting();

    // delay execution to be able to see loading indicator
    setTimeout(async () => {
      const loginData = this.ui.getLoginData();
      
      // Validate inputs
      if (!loginData.token) {
        this.ui.showError('API token is required');
        this.ui.clearConnecting(false);
        return;
      }
      
      if (!loginData.mudUrl) {
        this.ui.showError('MUD URL is required');
        this.ui.clearConnecting(false);
        return;
      }
      
      if (!loginData.username || !loginData.password) {
        this.ui.showError('Username and password are required');
        this.ui.clearConnecting(false);
        return;
      }

      try {
        await this.connect(loginData);
      } catch (error) {
        this.ui.clearConnecting(false);
        this.ui.showError(`Connection failed: ${error.message}`);
      }
    }, 100)
  }

  async connect(loginData) {
    this.ui.updateConnectionStatus('Connecting...', false);
    
    try {
      // Set API token
      this.api.setToken(loginData.token);
      
      // Create WebSocket connection
      this.socket = new WebSocket(loginData.mudUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.ui.updateConnectionStatus('Connected', true);
        this.ui.showGameInterface();
      };
      
      this.socket.onmessage = async (event) => {
        const buffer = await event.data.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        if(bytes[0] === 255) {
          return;
        }
        let text = await event.data.text();
        text = stripAnsi(text);
        console.log(event, text);
        this.handleMudMessage(text);
      };
      
      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.ui.updateConnectionStatus('Disconnected', false);
        this.ui.hideGameInterface();
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.ui.showError('WebSocket connection error');
        this.isConnected = false;
        this.ui.updateConnectionStatus('Connection Error', false);
        this.ui.clearConnecting(false);
      };
      
    } catch (error) {
      this.ui.updateConnectionStatus('Connection Failed', false);
      throw error;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.ui.updateConnectionStatus('Disconnected', false);
    this.ui.hideGameInterface();
  }

  async handleMudMessage(rawMessage) {
    // Log raw message
    this.ui.addRawMessage(rawMessage);

    // Skip empty messages
    if (!rawMessage.trim()) return;

    // show spinner / "Thinking..."
    this.ui.showLLMLoading();

    try {
      const llmResponse = await this.api.processMessage(rawMessage);

      // remove spinner
      this.ui.clearLLMLoading();

      // then append the real LLM output
      this.ui.addLLMMessage(llmResponse, false);

    } catch (error) {
      this.ui.clearLLMLoading();
      this.ui.addLLMMessage(`Error: ${error.message}`, false);
    }
  }

  handleSendMessage() {
    const message = this.ui.getUserInput();
    
    if (!message) return;
    
    if (!this.isConnected) {
      this.ui.showError('Not connected to MUD');
      return;
    }
    
    // Show user message in LLM output
    this.ui.addLLMMessage(message, true);
    
    // Send to MUD
    this.sendToMUD(message);
    
    // Clear input
    this.ui.clearInput();
  }

  sendToMUD(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message + '\n');
      console.log('Sent to MUD:', message);
    } else {
      this.ui.showError('Cannot send message: not connected');
    }
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  new MudLLMClient();
});