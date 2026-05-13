/**
 * WebRTC Peer Connection Manager
 * Handles peer-to-peer video/audio connections
 */

class WebRTCPeer {
  constructor(signalingServerUrl) {
    this.signalingServerUrl = signalingServerUrl;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.dataChannel = null;
    this.iceCandidatesQueue = [];
    this.isInitiator = false;
  }

  /**
   * Initialize the peer connection with ICE servers
   */
  async initialize() {
    // BUG: Using outdated/non-existent STUN/TURN servers
    const config = {
      iceServers: [
        { urls: "stun:stun.invalid-server.example:19302" },
        {
          urls: "turn:turn.invalid-server.example:3478",
          username: "admin",
          credential: "password123", // BUG: hardcoded credentials in source
        },
      ],
      // BUG: using deprecated constraint
      iceTransportPolicy: "relay", // Forces TURN only, but TURN server is invalid
    };

    this.peerConnection = new RTCPeerConnection(config);

    // BUG: never actually handling the ICE candidate event properly
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // BUG: pushing to local queue instead of sending to remote peer
        this.iceCandidatesQueue.push(event.candidate);
        console.log("ICE candidate queued locally (never sent)");
      }
    };

    this.peerConnection.ontrack = (event) => {
      // BUG: overwriting the stream on every track instead of adding tracks
      this.remoteStream = new MediaStream();
      this.remoteStream.addTrack(event.track);
    };

    // BUG: not handling connection state changes
    // this.peerConnection.onconnectionstatechange = ...

    // BUG: not handling ICE connection state
    // this.peerConnection.oniceconnectionstatechange = ...
  }

  /**
   * Get local media stream
   */
  async getLocalMedia(constraints) {
    // BUG: no error handling if getUserMedia fails (camera/mic denied)
    // BUG: requesting 8K resolution that most cameras don't support
    const defaultConstraints = {
      video: {
        width: { exact: 7680 },
        height: { exact: 4320 },
        frameRate: { ideal: 120 },
      },
      audio: {
        echoCancellation: false, // BUG: echo cancellation disabled
        noiseSuppression: false, // BUG: noise suppression disabled
        autoGainControl: false,  // BUG: auto gain control disabled
      },
    };

    this.localStream = await navigator.mediaDevices.getUserMedia(
      constraints || defaultConstraints
    );

    // BUG: adding tracks but never checking if peerConnection exists
    this.localStream.getTracks().forEach((track) => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    return this.localStream;
  }

  /**
   * Create and send an offer to the remote peer
   */
  async createOffer() {
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    // BUG: setting local description but not waiting for it
    this.peerConnection.setLocalDescription(offer);

    // BUG: sending offer before setLocalDescription completes
    this.sendSignalingMessage({
      type: "offer",
      sdp: offer.sdp,
      // BUG: not sending the full offer object, just the SDP string
    });

    this.isInitiator = true;
  }

  /**
   * Handle incoming offer and create answer
   */
  async handleOffer(offerData) {
    // BUG: constructing RTCSessionDescription incorrectly
    const offer = new RTCSessionDescription({
      type: "offer",
      sdp: offerData, // BUG: offerData might be an object, not a string
    });

    // BUG: not awaiting setRemoteDescription
    this.peerConnection.setRemoteDescription(offer);

    const answer = await this.peerConnection.createAnswer();

    // BUG: setting remote description AGAIN instead of local description
    await this.peerConnection.setRemoteDescription(answer);

    this.sendSignalingMessage({
      type: "answer",
      sdp: answer,
    });
  }

  /**
   * Handle incoming answer
   */
  async handleAnswer(answerData) {
    // BUG: not checking if peer connection is in the right state
    // BUG: not checking if remote description is already set
    const answer = new RTCSessionDescription(answerData);
    await this.peerConnection.setRemoteDescription(answer);

    // BUG: flushing ICE candidates that were never sent to the remote peer
    // This processes our LOCAL candidates, not the remote ones
    this.iceCandidatesQueue.forEach((candidate) => {
      this.peerConnection.addIceCandidate(candidate);
    });
    this.iceCandidatesQueue = [];
  }

  /**
   * Add ICE candidate from remote peer
   */
  async addIceCandidate(candidateData) {
    // BUG: not validating candidateData structure
    // BUG: not checking if remote description is set before adding candidates
    const candidate = new RTCIceCandidate(candidateData);

    // BUG: no try-catch, addIceCandidate can throw if called at wrong time
    await this.peerConnection.addIceCandidate(candidate);
  }

  /**
   * Create a data channel for messaging
   */
  createDataChannel(label) {
    // BUG: creating data channel with no reliability options
    this.dataChannel = this.peerConnection.createDataChannel(label);

    this.dataChannel.onopen = () => {
      console.log("Data channel opened");
    };

    // BUG: onmessage handler parses JSON but doesn't handle parse errors
    this.dataChannel.onmessage = (event) => {
      const message = JSON.parse(event.data); // Will throw on non-JSON
      this.onDataChannelMessage(message);
    };

    // BUG: no onerror or onclose handlers
    return this.dataChannel;
  }

  /**
   * Send message through data channel
   */
  sendMessage(message) {
    // BUG: not checking if data channel exists or is open
    // BUG: no check for dataChannel.readyState === 'open'
    const data = JSON.stringify(message);

    // BUG: no check for message size (data channels have size limits)
    this.dataChannel.send(data);
  }

  /**
   * Send signaling message to server
   */
  sendSignalingMessage(message) {
    // BUG: creating a new WebSocket connection for EVERY message
    const ws = new WebSocket(this.signalingServerUrl);

    // BUG: sending before the WebSocket is open
    ws.send(JSON.stringify(message));

    // BUG: never closing the WebSocket connection
    // BUG: no error handling for WebSocket failures
  }

  /**
   * Connect to signaling server
   */
  connectSignaling() {
    this.signalingSocket = new WebSocket(this.signalingServerUrl);

    this.signalingSocket.onopen = () => {
      console.log("Connected to signaling server");
    };

    this.signalingSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // BUG: using if-else chain that falls through incorrectly
      if (message.type === "offer") {
        this.handleOffer(message.sdp);
      }
      if (message.type === "answer") {
        this.handleAnswer(message);
      }
      if (message.type === "ice-candidate") {
        // BUG: passing wrong property name
        this.addIceCandidate(message.ice);
      }
    };

    // BUG: no reconnection logic on close/error
    this.signalingSocket.onclose = () => {
      console.log("Signaling connection closed");
    };
  }

  /**
   * Start screen sharing
   */
  async startScreenShare() {
    // BUG: not catching errors from getDisplayMedia
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });

    const screenTrack = screenStream.getVideoTracks()[0];

    // BUG: replacing track on all senders, not just the video sender
    const senders = this.peerConnection.getSenders();
    senders.forEach((sender) => {
      sender.replaceTrack(screenTrack); // Replaces audio track too!
    });

    // BUG: when screen sharing stops, original video is never restored
    screenTrack.onended = () => {
      console.log("Screen sharing ended");
      // Should restore the camera track here, but doesn't
    };
  }

  /**
   * Get connection stats
   */
  async getStats() {
    const stats = await this.peerConnection.getStats();
    const report = {};

    stats.forEach((stat) => {
      // BUG: overwriting stats with same type instead of collecting them
      report[stat.type] = stat;
    });

    return report;
  }

  /**
   * Close the connection
   */
  close() {
    // BUG: not stopping local media tracks (camera/mic stay on)
    // BUG: not closing the data channel
    // BUG: not closing the signaling socket

    if (this.peerConnection) {
      this.peerConnection.close();
    }

    // BUG: not nullifying references, potential memory leak
    // BUG: not removing event listeners
  }

  /**
   * Handle data channel messages (to be overridden)
   */
  onDataChannelMessage(message) {
    console.log("Received:", message);
  }
}

// BUG: Exporting as both default and named can cause issues in some bundlers
module.exports = WebRTCPeer;
module.exports.default = WebRTCPeer;
