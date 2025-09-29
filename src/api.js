// API module for LLM integration
class APIClient {
  constructor() {
    this.apiUrl = 'https://gateway.ai.devboost.com/';
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async processMessage(inputMessage) {
    if (!this.token) {
      throw new Error('API token not set');
    }

    // fire and forgett to generate an image
    this.processMessageForImage(inputMessage);

    // get the enriched text
    var result = this.enrichMudOutputText(inputMessage);

    return result;
    
  }

  async enrichMudOutputText(inputMessage) {

    try {
      const response = await fetch(this.apiUrl + 'v1/chat/completions', {
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

  async processMessageForImage(rawMessage) {
    try {
      const response = await fetch(this.apiUrl + 'v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          model: 'DevBoost/OpenAI/gpt-image-1',
          n: 1,
          quality: 'medium', // 'low', 'medium', 'high'
          size: '1536x1024', // 1024x1024, 1536x1024 (landscape), 1024x1536 (portrait), or auto (default value) for gpt-image-1
          prompt: rawMessage
        })
      });

      if (!response.ok) {
        console.log('To bad, we got no image :-(');
        return;
      }

      const responseJson = await response.json();

      const image = document.getElementById('background-image');
      image.src = 'data:image/png;base64,' + responseJson.data[0]?.b64_json;
    } catch (error) {
      console.error('API request error:', error);
    }
  }
}

export default APIClient;