import './styles.css'
import UI from './ui.js'
import APIClient from './api.js'

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

    const loginData = this.ui.getLoginData();
    
    // Validate inputs
    if (!loginData.token) {
      this.ui.showError('API token is required');
      return;
    }
    
    if (!loginData.mudUrl) {
      this.ui.showError('MUD URL is required');
      return;
    }
    
    if (!loginData.username || !loginData.password) {
      this.ui.showError('Username and password are required');
      return;
    }

    try {
      await this.connect(loginData);
    } catch (error) {
      this.ui.showError(`Connection failed: ${error.message}`);
    }
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
        
        // Send authentication
        this.sendToMUD(loginData.username);
        setTimeout(() => {
          this.sendToMUD(loginData.password);
        }, 1000);
      };
      
      this.socket.onmessage = (event) => {
        this.handleMudMessage(event.data);
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
    
    try {
      // Process with LLM
      const llmResponse = await this.api.processMessage(rawMessage);
      this.ui.addLLMMessage(llmResponse, false);
    } catch (error) {
      console.error('Error processing message with LLM:', error);
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