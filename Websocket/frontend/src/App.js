/**************************************************************
 * 📄 FILE: App.js
 *
 * 🚀 USE CASE:
 * Frontend UI for LAN WebSocket Chat Application
 *
 * FEATURES:
 * 👤 Username join screen
 * 🟢 Online users list (real-time)
 * 💬 Real-time chat messaging
 * 🕒 Message timestamps
 * 🌍 Works across LAN (multiple devices)
 *
 * CONNECTS TO:
 * WebSocket Server → ws://<server-ip>:8080
 *************************************************************/

import { useEffect, useRef, useState } from "react";
import "./App.css";

/* ===================== 🔌 WEBSOCKET URL ===================== */
/**
 * Dynamically connect to the same host where UI is opened.
 * Example:
 * UI  → http://10.80.238.21:3000
 * WS  → ws://10.80.238.21:8080
 */
const WS_URL = `ws://${window.location.hostname}:8080`;

/* ===================== ⚛️ MAIN COMPONENT ===================== */

function App() {
  /* ===================== 🧠 STATE VARIABLES ===================== */

  // User's display name
  const [name, setName] = useState("");

  // Whether user has joined the chat
  const [joined, setJoined] = useState(false);

  // List of online users
  const [users, setUsers] = useState([]);

  // Chat messages list
  const [messages, setMessages] = useState([]);

  // Message input value
  const [input, setInput] = useState("");

  // WebSocket reference (persistent across renders)
  const socketRef = useRef(null);

  /* ===================== 🔌 WEBSOCKET CONNECTION ===================== */

  /**
   * Establish WebSocket connection after user joins
   */
  useEffect(() => {
    // Do nothing if user hasn't joined yet
    if (!joined) return;

    // Create WebSocket connection
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    /* ---------- 🟢 CONNECTION OPEN ---------- */
    socket.onopen = () => {
      console.log("🟢 [WS] Connected to server");

      // Send join event with username
      socket.send(
        JSON.stringify({
          type: "join",
          name,
        })
      );
    };

    /* ---------- 📩 MESSAGE RECEIVED ---------- */
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Update online users list
      if (data.type === "users") {
        setUsers(data.users);
      }

      // Receive chat message
      if (data.type === "message") {
        setMessages((prev) => [
          ...prev,
          {
            ...data,
            self: data.name === name, // Mark own messages
          },
        ]);
      }
    };

    /* ---------- 🔴 CONNECTION CLOSED ---------- */
    socket.onclose = () => {
      console.log("🔴 [WS] Disconnected from server");
    };

    // Cleanup on component unmount
    return () => socket.close();
  }, [joined, name]);

  /* ===================== 📤 SEND MESSAGE ===================== */

  /**
   * Send message to WebSocket server
   */
  const sendMessage = () => {
    if (!input.trim()) return;

    socketRef.current.send(
      JSON.stringify({
        type: "message",
        message: input,
      })
    );

    // Clear input field
    setInput("");
  };

  /* ===================== 👤 JOIN SCREEN ===================== */

  /**
   * Show join screen before entering chat
   */
  if (!joined) {
    return (
      <div className="join">
        <div className="join-box">
          <h2>💬 Join Chat</h2>

          <input
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button disabled={!name.trim()} onClick={() => setJoined(true)}>
            Join
          </button>
        </div>
      </div>
    );
  }

  /* ===================== 💬 CHAT UI ===================== */

  return (
    <div className="layout">
      {/* 🟢 ONLINE USERS SIDEBAR */}
      <aside className="users">
        <h3>🟢 Online</h3>
        {users.map((u) => (
          <div key={u} className="user">
            {u}
          </div>
        ))}
      </aside>

      {/* 💬 CHAT MAIN AREA */}
      <main className="chat">
        <header>💬 LAN Chat</header>

        {/* 📩 MESSAGES */}
        <div className="messages">
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.self ? "self" : ""}`}>
              <div className="meta">
                <strong>{m.name}</strong>
                <span>{m.time}</span>
              </div>
              <div>{m.message}</div>
            </div>
          ))}
        </div>

        {/* ⌨️ INPUT BOX */}
        <div className="input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </main>
    </div>
  );
}

/* ===================== 📤 EXPORT ===================== */

export default App;
