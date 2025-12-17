import { useEffect, useRef, useState } from "react";
import "./App.css";

const WS_URL = `ws://${window.location.hostname}:8080`;
// 🔁 CHANGE TO YOUR SERVER IP

function App() {
  /* ===================== 🧠 STATE ===================== */

  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const socketRef = useRef(null);

  /* ===================== 🔌 WEBSOCKET ===================== */

  useEffect(() => {
    if (!joined) return;

    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("🟢 Connected to server");

      socket.send(
        JSON.stringify({
          type: "join",
          name,
        })
      );
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "users") {
        setUsers(data.users);
      }

      if (data.type === "message") {
        setMessages((prev) => [...prev, { ...data, self: data.name === name }]);
      }
    };

    socket.onclose = () => {
      console.log("🔴 Disconnected from server");
    };

    return () => socket.close();
  }, [joined, name]);

  /* ===================== 📤 SEND MESSAGE ===================== */

  const sendMessage = () => {
    if (!input.trim()) return;

    socketRef.current.send(
      JSON.stringify({
        type: "message",
        message: input,
      })
    );

    setInput("");
  };

  /* ===================== 👤 JOIN SCREEN ===================== */

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
      {/* 🟢 ONLINE USERS */}
      <aside className="users">
        <h3>🟢 Online</h3>
        {users.map((u) => (
          <div key={u} className="user">
            {u}
          </div>
        ))}
      </aside>

      {/* 💬 CHAT AREA */}
      <main className="chat">
        <header>💬 LAN Chat</header>

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

export default App;
