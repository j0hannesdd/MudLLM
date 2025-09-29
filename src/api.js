// API module for LLM integration
class APIClient {
  constructor() {
    this.apiUrl = 'https://gateway.ai.devboost.com/v1/chat/completions';
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async processMessage(inputMessage) {
    if (!this.token) {
      throw new Error('API token not set');
    }

    var result = this.enrichMudOutputText(inputMessage);

    return result;
    
  }

  async enrichMudOutputText(inputMessage) {

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          model: 'DevBoost/OpenAI/gpt-4.1-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that processes MUD (Multi-User Dungeon) game output messages. Your job is to translate, summarize, and wrap the raw MUD output into more readable and engaging format for the player. Keep responses concise and focus on the most important information.'
            },
            {
              role: 'user',
              content: `Please process this MUD message and provide a clear, engaging summary: ${inputMessage}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'No response from LLM';
    } catch (error) {
      console.error('API request error:', error);
      return `Error processing message: ${error.message}`;
    }

  }

}

export default APIClient;