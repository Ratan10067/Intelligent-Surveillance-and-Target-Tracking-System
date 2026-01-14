import React from "react";
import { SocketProvider } from "./context/SocketContext";
import RadarDisplay from "./components/RadarDisplay";
import ControlPanel from "./components/ControlPanel";

function App() {
  return (
    <SocketProvider>
      <div
        style={{
          display: "flex",
          gap: "20px",
          padding: "20px",
          height: "100vh",
          boxSizing: "border-box",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <RadarDisplay />
        <ControlPanel />
      </div>

      {/* Background Overlay for "Scanlines" effect */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          background:
            "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
          backgroundSize: "100% 2px, 3px 100%",
          zIndex: 999,
        }}
      ></div>
    </SocketProvider>
  );
}

export default App;
