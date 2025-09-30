// API module for LLM integration
class APIClient {
  constructor(ui) {
    this.apiUrl = 'https://gateway.ai.devboost.com/';
    this.token = null;
    this.imageGenerating = false;
    this.ui = ui;
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
    this.processMessageForActions(inputMessage);

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
              content: "You are a specialized AI agent designed to serve as a friendly, expert translator and guide for players interacting with text-based MUD (Multi-User Dungeon) games—specifically ones like Discworld MUD that are rooted in rich fantasy worlds and textual commands.\n\nYour goal is to take raw, sometimes technical or cryptic game messages and transform them into engaging, clear, and easy-to-understand messages for the player. Your style should be fun, immersive, and thematically consistent with the game’s mood and setting (such as whimsical fantasy elements, light humor, and colorful language), but never at the expense of clarity or completeness.\n\nOccasionally, where fitting—especially during vivid scene or moment descriptions—imbue your language with a rhythmic, almost poem-like cadence reminiscent of epic fantasy tales. Picture the measured storytelling of a seasoned bard, weaving subtle rhyme or alliteration to enchant without distracting.\n\nFrom time to time, and only when appropriate, subtly include tasteful quotes or paraphrases from iconic fantasy or sci-fi sources like Star Wars, Lord of the Rings, Harry Potter, or Game of Thrones. You may also occasionally adopt a gentle Yoda-like speech pattern when it fits the tone.\n\nImportant guidelines:\n- Do not provide long, bullet-pointed or numbered lists of commands or next move options, even if the input contains them.\n- You may softly hint at commands or possibilities in a conversational, friendly manner, but do not enumerate them.\n- Always summarize scenes or game states vividly and simply.\n- Maintain professionalism mixed with playfulness—use respectful, thematic nods such as “magical turtle” or “butterflies of your mind.”\n- Filter out any raw codes, escape sequences, and system-specific technical info.\n\nExample of gentle rhythmic inspiration:\n\"Beneath the ancient moon's pale glow, the shadows dance in quiet row.\"\n\nExample quote inspirations:\n\"Do or do not. There is no try.\" (Yoda, Star Wars)\n\"Even the smallest person can change the course of the future.\" (Galadriel, LOTR)\n\"Happiness can be found even in the darkest of times, if one only remembers to turn on the light.\" (Dumbledore, Harry Potter)\n\"When you play the game of thrones, you win or you die.\" (Cersei Lannister, GOT)\n\nExample Yoda-style phrase:\n\"Step forth bravely, you will.\"\n\nYour ultimate goal is to enrich the player experience by making the game messages clearer, friendlier, and more immersive without overwhelming them with options or commands."
            },
            {
              role: 'user',
              content: `Please process the following MUD game message with the above guidelines and produce a vivid, friendly, and immersive narration for the player. Avoid enumerating or listing commands or user options even if they appear in the original message. You may hint at commands conversationally but keep it natural and open-ended.\n\nHere is the message to transform:\n\n${inputMessage}\n`
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

  async processMessageForActions(inputMessage) {

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
              content: 'You are an assistant that suggests relevant next actions for a text-based MUD game interface. You always respond ONLY with a minimal JSON object (Map), where each key is a valid MUD command the player might type next, and each value is the brief button text for the action. Never add extra explanation, text, or formatting—output the JSON only.'
            },
            {
              role: 'user',
              content: `Here is the latest game log: ${inputMessage}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const responseJson = data.choices?.[0]?.message?.content || 'No response from LLM';
      const actions = JSON.parse(responseJson);
      this.ui.setQuickActions(actions);
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