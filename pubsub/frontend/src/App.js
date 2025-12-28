/**************************************************************
 * 📄 FILE: App.js
 *
 * 🚀 USE CASE:
 * Mini-LeetCode Frontend UI (React)
 *
 * FEATURES:
 * 👤 Username join screen
 * 🆔 Frontend-generated userId
 * 📤 Code submission via HTTP
 * 🔌 Live verdict via WebSocket
 * 🕒 Real-time result updates
 *************************************************************/

import { useEffect, useRef, useState } from "react";
import "./App.css";

/* ===================== 🔌 SERVER URLS ===================== */

/**
 * Same-host LAN support
 * Backend HTTP → http://<ip>:4000
 * Backend WS   → ws://<ip>:4000
 */
const HTTP_URL = `http://${window.location.hostname}:4000`;
const WS_URL = `ws://${window.location.hostname}:4000`;

/* ===================== ⚛️ MAIN COMPONENT ===================== */

function App() {
  /* ===================== 🧠 STATE ===================== */

  // Username entered by user
  const [username, setUsername] = useState("");

  // Whether user has joined
  const [joined, setJoined] = useState(false);

  // Problem ID
  const [problemId, setProblemId] = useState("");

  // Code input
  const [code, setCode] = useState("");

  // Result logs
  const [logs, setLogs] = useState([]);

  // Persistent userId (generated once)
  const userIdRef = useRef(
    localStorage.getItem("userId") || crypto.randomUUID()
  );

  // WebSocket reference
  const socketRef = useRef(null);

  /* ===================== 🔐 INIT USER ID ===================== */

  useEffect(() => {
    localStorage.setItem("userId", userIdRef.current);
  }, []);

  /* ===================== 🔌 WEBSOCKET ===================== */

  useEffect(() => {
    if (!joined) return;

    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    /* ---------- 🟢 CONNECT ---------- */
    socket.onopen = () => {
      console.log("🟢 [WS] Connected");

      // Register user
      socket.send(
        JSON.stringify({
          type: "register",
          userId: userIdRef.current,
          username,
        })
      );
    };

    /* ---------- 📩 RESULT ---------- */
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      setLogs((prev) => [...prev, `✅ ${data.problemTd} → ${data.status}`]);
    };

    /* ---------- 🔴 CLOSE ---------- */
    socket.onclose = () => {
      console.log("🔴 [WS] Disconnected");
    };

    return () => socket.close();
  }, [joined, username]);

  /* ===================== 📤 SUBMIT ===================== */

  const submitCode = async () => {
    if (!problemId || !code) return;

    setLogs((prev) => [...prev, "📤 Submitted… waiting for result"]);

    await fetch(`${HTTP_URL}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userIdRef.current,
        username,
        problemTd: problemId,
        language: "js",
        code,
      }),
    });
  };

  /* ===================== 👤 JOIN SCREEN ===================== */

  if (!joined) {
    return (
      <div className="join">
        <div className="join-box">
          <h2>🚀 Mini LeetCode</h2>

          <input
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <button disabled={!username.trim()} onClick={() => setJoined(true)}>
            Join
          </button>
        </div>
      </div>
    );
  }

  /* ===================== 🧑‍💻 MAIN UI ===================== */

  return (
    <div className="layout">
      <main className="chat">
        <header>
          👤 {username}
          <small style={{ marginLeft: 10 }}>
            ({userIdRef.current.slice(0, 6)})
          </small>
        </header>

        {/* 🧠 INPUTS */}
        <div className="input">
          <input
            placeholder="Problem ID (e.g. two_sum)"
            value={problemId}
            onChange={(e) => setProblemId(e.target.value)}
          />
        </div>

        <div className="input">
          <textarea
            placeholder="Write your code here..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <div className="input">
          <button onClick={submitCode}>Submit</button>
        </div>

        {/* 📩 RESULTS */}
        <div className="messages">
          {logs.map((log, i) => (
            <div key={i} className="bubble self">
              {log}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
