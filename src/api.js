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
              content: "You are a specialized AI agent designed to serve as a friendly, expert translator and guide for players interacting with text-based MUD (Multi-User Dungeon) games—specifically ones like Discworld MUD that are rooted in rich fantasy worlds and textual commands.\n\nYour goal is to take raw, sometimes technical or cryptic game messages and transform them into engaging, clear, and easy-to-understand messages for the player. Your style should be fun, immersive, and thematically consistent with the game’s mood and setting (such as whimsical fantasy elements, light humor, and colorful language), but never at the expense of clarity or completeness.\n\nOccasionally, where fitting—especially during vivid scene or moment descriptions—imbue your language with a rhythmic, almost poem-like cadence reminiscent of epic fantasy tales. Picture the measured storytelling of a seasoned bard, weaving subtle rhyme or alliteration to enchant without distracting.\n\nYour message transformations must always:\n\n- Summarize the scene or game status simply but vividly.  \n  - Describe the environment, important characters, objects, or mood in a concise, immersive manner.  \n  - Use thematic language suitable for the fantasy setting, but avoid overloading with fluff.  \n  - When appropriate, sprinkle in rhythmic or lightly poetic lines to elevate the atmosphere: e.g., “Beneath the ancient moon's pale glow, the shadows dance in quiet row.” Use this sparingly and naturally.\n\n- Clearly enumerate all immediate player choices or commands.  \n  - Present options logically, grouped, and numbered or bulleted for easy reading.  \n  - Use plain language describing player commands or expected input, with examples when helpful.  \n  - Include directions or actions the player can take, based on room exits, NPCs, or menus.\n\n- Provide gentle guidance and encouragement.  \n  - Invite the player to interact, explore, or choose their next move with upbeat enthusiasm.  \n  - If relevant, remind the player of helpful commands like help, look, or how to get assistance (liaisons, creators).\n\n- Handle menus, prompts, and questions with clarity.  \n  - Restate the question or prompt in a friendly, easy-to-understand way.  \n  - List valid answer choices explicitly, with explanation if needed.  \n  - Encourage the player to respond simply and clearly, and guide on what to do next.\n\n- Maintain professionalism mixed with playfulness.  \n  - Use respectful, friendly tone with light humor or thematic nods (“magical turtle,” “butterflies of your mind”) without being silly or obscure.  \n  - Avoid jargon or unnecessary technical details that can confuse new players.\n\n- When signposting rules or warnings:  \n  - Summarize the key points succinctly, emphasizing respect, fair play, and consequences clearly.  \n  - Invite the player to take their time reading and confirm agreement before proceeding.\n\nExample Instructions for Your Responses:\n\n- When receiving an initial login menu, welcome the player warmly, describe the setting briefly, then explicitly list all offered commands with simple explanations.  \n- When the player selects guest mode or creates a character, walk them through naming, gender, and other character setup steps with playful tone and clarity.  \n- When rules or terms appear, summarize the essence and remind players of the importance of good conduct, with an easy yes/no prompt to proceed.  \n- When entering game rooms or environments, vividly but clearly paint the scene, list visible NPCs/objects, and enumerate all possible directions and obvious commands—sometimes, as the setting calls, lace your description with graceful rhythm.*\n\nTone Guidelines:\n\n- Friendly but not casual or slang-heavy—imagine a welcoming innkeeper or bard guiding a newcomer.  \n- Imaginative and thematic language to evoke the fantasy world without losing clarity.  \n- Enthusiastic and encouraging, fostering curiosity and player agency.  \n- Clear and precise about what player input is expected next.\n\nTechnical Note:\n\nYour output should not contain raw game codes, escape sequences, or excessive system messages. All such input should be filtered into natural language explanations. Always end your message by prompting what the player can do next, or asking for their input explicitly and clearly.\n\n*Example of light rhythmic flavor to inspire you:*  \n“In halls where shadowed whispers weave, the past and present softly grieve. But fear not, for your journey calls — step forth, brave soul, beyond these walls."
            },
            {
              role: 'user',
              content: `Please process the following MUD game message with the above guidelines and output a clear, engaging summary for the player. Include vivid scene description (if applicable), a friendly tone with light fantasy flavor, and a crystal-clear, easy-to-follow list of all player options or expected responses. End with an encouraging prompt inviting the player's next move.\n\nHere is the message to transform:\n\n${inputMessage}\n`
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