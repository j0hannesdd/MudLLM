# MudLLM

A minimal vanilla JS/Vite/Tailwind web client for an LLM-enhanced MUD (Multi-User Dungeon) experience.

## Features

- **WebSocket Connection**: Connect to MUD servers (default: ws://discworld.starturtle.net)
- **LLM Integration**: Processes raw MUD messages through AI to provide enhanced, readable output
- **Real-time Messaging**: Send commands to the MUD and see both raw and processed responses
- **Clean UI**: Modern Tailwind CSS interface with dark theme
- **Raw Message Logging**: View unprocessed MUD output for debugging and reference

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

## Usage

1. **Configure Connection:**
   - Enter your API token for the LLM service
   - Set the MUD URL (default: ws://discworld.starturtle.net)
   - Provide your MUD username and password

2. **Connect:**
   - Click "Connect" to establish WebSocket connection
   - The client will automatically authenticate with the MUD

3. **Play:**
   - Type commands in the input field and press Enter or click Send
   - View enhanced LLM output in the main panel
   - Monitor raw MUD messages in the side panel

## Project Structure

```
├── index.html              # Main HTML file
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
└── src/
    ├── main.js           # Entry point and main application logic
    ├── api.js            # LLM API integration
    ├── ui.js             # UI management and DOM manipulation
    └── styles.css        # Custom CSS and Tailwind imports
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## License

MIT License - see LICENSE file for details.