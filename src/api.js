// API module for LLM integration
class APIClient {
  constructor() {
    this.apiUrl = 'https://gateway.ai.devboost.com/';
    this.token = null;
    this.imageGenerating = false;
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
              content: 'You are a helpful assistant that processes MUD (Multi-User Dungeon) game messages. Your job is to translate, summarize, and wrap the raw MUD output into more readable and engaging format for the player. Keep responses concise and focus on the most important information. Be precise in what options user can choose. Act as a game, do not say to the user that games says something, user see you and you are a game already to him.'
            },
            {
              role: 'user',
              content: `Please process this MUD message and provide a clear, engaging summary, with clear message to the user what are the options for next interaction: ${inputMessage}`
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
    if (this.imageGenerating) {
      return;
    }
    this.imageGenerating = true;
    try {
      // should we actually generate a new image?
      const shouldGenerate = await this.helperPrompt('Does this message describe a new scene or location in a fantasy MUD game, suitable for generating a background image? Respond with "yes" or "no". Message: ' + rawMessage);

      if (!shouldGenerate.toLowerCase().includes('yes')) {
        console.log('No new image needed.');
        return;
      }

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
          prompt: `Create a detailed fantasy landscape background image based on the following MUD game description. Ignore any Menu items and UI elements: ${rawMessage}`.trim()
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
    } finally {
      this.imageGenerating = false;
    }
  }

  async helperPrompt(inputMessage) {
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
              role: 'user',
              content: inputMessage
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