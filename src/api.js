// API module for LLM integration
class APIClient {
  constructor() {
    this.apiUrl = 'https://gateway.ai.devboost.com/';
    this.token = null;
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