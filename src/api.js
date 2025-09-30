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

  async processUserInputMessage(inputMessage) {
    if (!this.token) {
      throw new Error('API token not set');
    }

    var result = this.transformUserInputToMudCommand(inputMessage);

    return result;

  }

  async processMudOutputMessage(inputMessage) {
    if (!this.token) {
      throw new Error('API token not set');
    }

    // fire and forgett to generate an image
    this.processMessageForImage(inputMessage);
    this.processMessageForActions(inputMessage);

    // get the enriched text
    var result = await this.enrichMudOutputText(inputMessage);
    // this.readOutLoud(result);

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
              content: `You are a specialized AI agent designed to serve as a friendly, 
                        expert translator and guide for players interacting with text-based MUD (Multi-User Dungeon) 
                        games—specifically ones like Discworld MUD that are rooted in rich fantasy worlds and textual commands.\n\n
                        Your goal is to take raw, sometimes technical or cryptic game messages and transform them into engaging, clear, 
                        and easy-to-understand messages for the player.
                        Your style should be fun, immersive, and thematically consistent with the game’s mood and setting (such as whimsical fantasy elements,
                        light humor, and colorful language), but never at the expense of clarity or completeness.\n\n
                        Occasionally, where fitting—especially during vivid scene or moment descriptions—imbue your language with a rhythmic,
                        almost poem-like cadence reminiscent of epic fantasy tales. 
                        Picture the measured storytelling of a seasoned bard, weaving subtle rhyme or alliteration to enchant without distracting.\n\n
                        From time to time, and only when appropriate, subtly include tasteful quotes or paraphrases from iconic fantasy or sci-fi sources like Star Wars,
                        Lord of the Rings, Harry Potter, or Game of Thrones.
                        You may also occasionally adopt a gentle Yoda-like speech pattern when it fits the tone.\n\n
                        Important guidelines:\n
                        - Do not provide long, bullet-pointed or numbered lists of commands or next move options, even if the input contains them.\n
                        - You may softly hint at commands or possibilities in a conversational, friendly manner, but do not enumerate them.\n
                        - Always summarize scenes or game states vividly and simply.\n
                        - Maintain professionalism mixed with playfulness—use respectful, thematic nods such as “magical turtle” or “butterflies of your mind.”\n
                        - Filter out any raw codes, escape sequences, and system-specific technical info.\n\n
                        Example of gentle rhythmic inspiration:\n\"
                          Beneath the ancient moon's pale glow, the shadows dance in quiet row.\"\n\n
                          Example quote inspirations:\n
                            \"Do or do not. There is no try.\" (Yoda, Star Wars)\n
                            \"Even the smallest person can change the course of the future.\" (Galadriel, LOTR)\n
                            \"Happiness can be found even in the darkest of times, if one only remembers to turn on the light.\" (Dumbledore, Harry Potter)\n
                            \"When you play the game of thrones, you win or you die.\" (Cersei Lannister, GOT)\n\n
                          Example Yoda-style phrase:\n
                            \"Step forth bravely, you will.\"\n\n
                        Your ultimate goal is to enrich the player experience by making the game messages clearer, friendlier,
                        and more immersive without overwhelming them with options or commands.`
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
              content: `You are an assistant that suggests relevant next actions for a text-based MUD game interface. 
                        You always respond ONLY with a minimal JSON object (Map), where:
                          - Each key is the exact command string that the MUD expects the player to type next (this is what will be sent to the MUD server).
                          - Each value is the brief button text for that action, which can be an extended, user-friendly label.
                        Do NOT add any extra explanation, text, or formatting—output the JSON only.
                        For example, if the MUD expects commands "male" and "female," your output keys must be exactly "male" and "female". 
                        The button text (values) can be like "Select Male" and "Select Female" or any other human-friendly label you want.
                        Strictly respect the MUD's exact command strings in the keys.`
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

  async readOutLoud(text) {
    const response = await fetch(this.apiUrl + 'v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        model: "DevBoost/OpenAI/gpt-4o-mini-tts",
        input: text,
        voice: "ash",
        response_format: "mp3"
      })
    });

    if (!response.ok) {
      console.warn('Text-to-speech request failed:', response.status, response.statusText);
      return;
    }
    const blob = await response.blob(); // No streaming!
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.play();


    // if (!('speechSynthesis' in window)) {
    //   console.warn('Text-to-speech not supported in this browser.');
    //   return;
    // }
    // const utterance = new SpeechSynthesisUtterance(text);
    // utterance.lang = 'en-US';
    // utterance.rate = 1;
    // utterance.pitch = 1;
    // window.speechSynthesis.speak(utterance);
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

  async transformUserInputToMudCommand(inputMessage) {
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
              content: mudDescription
            },
            {
              role: 'system',
              content: systemInstructionUserToMud
            },
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

const mudDescription = `Description
This is the essential command list, a 'must read' for all players who are new to Discworld. It lists those commands you really need to know.

To find out more about the commands listed use "help <command>" and before asking "how do I do xxx?" remember to try "help xxx".

Conventions
Parameters listed in < > are required and should be replaced by the required object or string. Parameters listed in [ ] are optional. Parameters separated by | are choices.

Note: You do not need to include the brackets around the parameters when you type them.

Every command, including those listed below, has a comprehensive helpfile. Just type "help <command>" to view it.

Getting Help
help [concepts]	show the help index for important concepts
help command_list	show the help index for commands
help <command>	show the comprehensive helpfile associated with a command
syntax <command>	show the basic usage for a command
godmother help	summon your fairy godmother to transport you back to your starting location.
liaisons	list the liaison creators who are currently logged in
helpers	list the newbie helpers who are currently logged in
newbie <message>	ask a question on the newbie channel
Navigation
look [object]	look, or look at something
glance [object]	glance, or glance at something (this gives a shorter description than look)
north,south,etc.	Exits are listed in room descriptions just type the name of the exit
follow <person>	start following someone
unfollow <person>	stop following someone
lose <person>	stop someone following you
Communicating
say <message>	say something. Some npcs respond to saying things for example: "say help guide" in the presence of a guide will cause the guide to respond with instructions
tell <person> <message>	speak to another player
smile <person>	Discworld has an extensive list of "soul" commands. See "help soul" for help on using the soul or "look soul" for a list of the several hundred wonderful soul commands available!
Doing things
inventory	list the things you have
hold <object>	hold something
unhold <object>	stop holding something
wear <object>	wear an item of clothing
remove <object>	remove an item of clothing
equip	wear/hold all your stuff
get <object>
[from <object>]	get something
put <object> in <object>	put something in something else
drop <object>	drop something
give <object> to <person>	give an item to someone else (a player, NPC, or animal)
locate <objects>	shows you where all the "objects" are in your inventory and the room you are in (e.g. "locate swords"), whether you are holding or wearing them, and whether you are keeping them. It also gives each a number, which you can use to refer to them (e.g. 'drop sword 2').
About yourself
score [stats|quests]	see your score
skills	see your skills
commands	show the guild commands that you know
gp	show information about your guild points
brief	put your display in brief mode
verbose	put your display in verbose mode
term [<terminal-type>]	display or change your terminal type
term xterm256	enable colour output for most clients
options	This command allows you to change everything that can be changed about yourself. It can configure so many things you should use 'help options' to find out more about it.
Reading things
read <object>	Read an object
turn a page of <object>	Turn a page of a book or leaflet
Fighting things
consider	gives you an idea how tough an opponent will be (read the caveats in the help file!)
kill	attack an opponent
tactics	adjust how you fight
wimpy	set yourself to run away if your hitpoints get too low
monitor	show a regular display of your status
health [<person>]	show the health of the person.
Advancing
help taskmaster	on Discworld you advance skills by doing them, the system for this is called the taskmaster
advance	you can advance at your guild by spending experience points and money (you can also learn from other players with the "learn" command)
Shopping
money	list the value of all the coins you are carrying
list	list the items available in the shop
browse <item>	look at the details of an item
buy <item>	buy something from the shop
sell <item>	sell something to the shop
value <item>	find out how much the shop will pay you for an item
keep <object>	prevent you from accidentally selling an object you cherish
unkeep <object>	allow an object to be sold after previously being kept
Note: buy, list and browse are the only commands used in all shops. Sell and value can only be used in specific stores.`;

const systemInstructionUserToMud = 'You are a MUD command translator. When a user writes any natural-language instruction, transform it into a valid MUD command line with correct syntax and parameters. Output only the exact command string that can be fed directly to the MUD engine—no extra commentary or explanation.';

export default APIClient;