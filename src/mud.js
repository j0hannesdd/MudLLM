
function stripAnsi(str) {
    // Matches all ANSI escape codes
    return str.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}

const noInternetz = false;

class Mud {
    constructor(ui, api, onMessage) {
        this.socket = null;
        this.isConnected = false;
        this.ui = ui;
        this.api = api;
        this.onMessage = onMessage;
    }

    async connect(loginData) {
        this.ui.updateConnectionStatus('Connecting...', false);

        try {
            // Set API token
            this.api.setToken(loginData.token);

            if (noInternetz) {
                this.isConnected = true;
                this.ui.updateConnectionStatus('Connected', true);
                this.ui.showGameInterface();
                this.onMessage("You find yourself standing upon the familiar, improbable landscape of the Discworld—resting atop four elephants, themselves perched on the great shell of Great A’Tuin, the cosmic turtle. But something is amiss: the colors seem faded, sounds muffled, and the air tinged with the subtle scent of L-Space after a particularly long shelving session. Landmarks blur at the edges, and even the city of Ankh-Morpork looms only as a distant suggestion through the fog. For now, the details elude you, as if the Disc itself is awaiting the return of outside inspiration. Adventure is still possible, but with the world shrouded in the peculiar stillness that only comes when the Clacks are down.");
                return;
            }

            // Create WebSocket connection
            this.socket = new WebSocket(loginData.mudUrl);

            this.socket.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.ui.updateConnectionStatus('Connected', true);
                this.ui.showGameInterface();
            };

            this.socket.onmessage = async (event) => {
                const buffer = await event.data.arrayBuffer();
                const bytes = new Uint8Array(buffer);
                if (bytes[0] === 255) {
                    return;
                }
                let text = await event.data.text();
                text = stripAnsi(text);
                console.log(event, text);
                this.onMessage(text);
            };

            this.socket.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.ui.updateConnectionStatus('Disconnected', false);
                this.ui.hideGameInterface();
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.ui.showError('WebSocket connection error');
                this.isConnected = false;
                this.ui.updateConnectionStatus('Connection Error', false);
                this.ui.clearConnecting(false);
            };

        } catch (error) {
            this.ui.updateConnectionStatus('Connection Failed', false);
            throw error;
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.isConnected = false;
        this.ui.updateConnectionStatus('Disconnected', false);
        this.ui.hideGameInterface();
    }

    sendToMUD(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message + '\n');
            console.log('Sent to MUD:', message);
        } else {
            this.ui.showError('Cannot send message: not connected');
        }
    }
}

export default Mud;