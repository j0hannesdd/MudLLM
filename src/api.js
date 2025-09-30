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

  async transformUserInputToMudCommand(inputMessage) {

    debugger;

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