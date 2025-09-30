import './styles.css'
import UI from './ui.js'
import APIClient from './api.js'
import Mud from './mud.js'

class MudLLMClient {
  constructor() {
    this.ui = new UI();
    this.api = new APIClient(this.ui);
    this.mud = new Mud(this.ui, this.api, this.handleMudMessage.bind(this));
    
    // Bind UI callbacks
    this.ui.onConnect = this.handleConnect.bind(this);
    this.ui.onSendMessage = this.handleSendMessage.bind(this);
    this.ui.onQuickAction = this.handleAction.bind(this);
    
    console.log('MudLLM Client initialized');
  }

  async handleConnect() {
    if (this.mud.isConnected) {
      this.mud.disconnect();
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

      try {
        await this.mud.connect(loginData);
      } catch (error) {
        this.ui.clearConnecting(false);
        this.ui.showError(`Connection failed: ${error.message}`);
      }
    }, 100)
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
    
    if (!this.mud.isConnected) {
      this.ui.showError('Not connected to MUD');
      return;
    }
    
    // Show user message in LLM output
    this.ui.addLLMMessage(message, true);
    
    // Send to MUD
    this.mud.sendToMUD(message);
    
    // Clear input
    this.ui.clearInput();
  }

  handleAction(action) {
    console.log('Action triggered:', action);
    if (!this.mud.isConnected) {
      this.ui.showError('Not connected to MUD');
      return;
    }
    
    // Show user message in LLM output
    this.ui.addLLMMessage(action, true);
    
    // Send to MUD
    this.mud.sendToMUD(action);
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  new MudLLMClient();
});