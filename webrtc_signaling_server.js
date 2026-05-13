/**
 * WebRTC Signaling Server
 * Handles signaling between peers for establishing WebRTC connections
 */

const WebSocket = require("ws");
const http = require("http");

class SignalingServer {
  constructor(port) {
    this.port = port;
    this.rooms = {}; // BUG: rooms grow indefinitely, never cleaned up
    this.clients = new Map();
  }

  start() {
    // BUG: no HTTPS, signaling data sent in plaintext
    const server = http.createServer();
    this.wss = new WebSocket.Server({ server });

    this.wss.on("connection", (ws, req) => {
      // BUG: no authentication or validation of connecting clients
      // BUG: no rate limiting
      const clientId = Math.random().toString(36).substr(2, 9); // BUG: weak ID generation
      this.clients.set(clientId, ws);

      console.log(`Client connected: ${clientId}`);

      ws.on("message", (data) => {
        // BUG: no input validation or sanitization
        // BUG: no try-catch for JSON.parse
        const message = JSON.parse(data);

        this.handleMessage(clientId, ws, message);
      });

      ws.on("close", () => {
        // BUG: removing client from map but not from rooms
        this.clients.delete(clientId);
        console.log(`Client disconnected: ${clientId}`);
      });

      // BUG: no error handler on the websocket
    });

    server.listen(this.port, () => {
      console.log(`Signaling server running on port ${this.port}`);
    });

    // BUG: no graceful shutdown handler
    // BUG: server reference not stored for cleanup
  }

  handleMessage(clientId, ws, message) {
    switch (message.type) {
      case "join":
        this.handleJoin(clientId, ws, message.room);
        break;
      case "offer":
      case "answer":
      case "ice-candidate":
        this.relayMessage(clientId, message);
        break;
      case "leave":
        this.handleLeave(clientId, message.room);
        break;
      // BUG: no default case — unknown message types silently ignored
    }
  }

  handleJoin(clientId, ws, roomId) {
    // BUG: no limit on room size — could have thousands of peers
    if (!this.rooms[roomId]) {
      this.rooms[roomId] = [];
    }

    this.rooms[roomId].push(clientId);

    // BUG: sending the full client list including the joining client
    ws.send(
      JSON.stringify({
        type: "room-joined",
        room: roomId,
        peers: this.rooms[roomId], // Includes self
        clientId: clientId,
      })
    );

    // BUG: notifying ALL clients in room, even clients that already know about each other
    this.rooms[roomId].forEach((peerId) => {
      const peerWs = this.clients.get(peerId);
      // BUG: not checking if peerWs exists or is open
      peerWs.send(
        JSON.stringify({
          type: "peer-joined",
          peerId: clientId,
        })
      );
    });
  }

  relayMessage(senderId, message) {
    // BUG: message.target could be undefined — no validation
    const targetWs = this.clients.get(message.target);

    if (targetWs) {
      // BUG: not checking WebSocket readyState before sending
      targetWs.send(
        JSON.stringify({
          ...message,
          from: senderId,
        })
      );
    }
    // BUG: silently drops message if target not found, no error to sender
  }

  handleLeave(clientId, roomId) {
    if (this.rooms[roomId]) {
      // BUG: uses indexOf + splice which only removes first occurrence
      // If client somehow joined twice, second entry remains
      const index = this.rooms[roomId].indexOf(clientId);
      this.rooms[roomId].splice(index, 1);

      // BUG: not checking if index is -1 before splicing
      // splice(-1, 1) removes the LAST element

      // BUG: empty rooms are never deleted from the rooms object
    }
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(message) {
    // BUG: iterating over Map values but not checking connection state
    this.clients.forEach((ws, clientId) => {
      // BUG: this will throw if any client has disconnected
      ws.send(JSON.stringify(message));
    });
  }

  /**
   * Get room info
   */
  getRoomInfo(roomId) {
    return {
      room: roomId,
      // BUG: returns undefined if room doesn't exist, not an empty array
      peers: this.rooms[roomId],
      count: this.rooms[roomId].length, // BUG: will throw if room is undefined
    };
  }
}

// BUG: starts server immediately on require/import with hardcoded port
const server = new SignalingServer(8080);
server.start();

module.exports = SignalingServer;
