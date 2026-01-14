import React, { useContext, useEffect, useRef, useState } from "react";
import { SocketContext } from "../context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";

const ControlPanel = () => {
  const {
    isConnected,
    systemState,
    startSimulation,
    stopSimulation,
    resetSimulation,
  } = useContext(SocketContext);

  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Simulate System Logs
  useEffect(() => {
    if (isConnected) {
      addLog("SYSTEM CONNECTION ESTABLISHED");
    } else {
      addLog("CONNECTION LOST - RETRYING...");
    }
  }, [isConnected]);

  useEffect(() => {
    if (systemState) {
      if (Math.random() > 0.95) {
        // Random telemetry logs
        addLog(
          `TELEMETRY UPDATE: TGT_POS [${systemState.estimated_target.x.toFixed(
            1
          )}, ${systemState.estimated_target.y.toFixed(1)}]`
        );
      }
      if (systemState.threat_level === "HIGH" && Math.random() > 0.9) {
        addLog("WARNING: HIGH SPEED TARGET DETECTED");
      }
    }
  }, [systemState]);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
    setLogs((prev) => [...prev.slice(-15), `[${timestamp}] ${message}`]); // Keep last 15 logs
  };

  if (!systemState) {
    return (
      <div className="hud-panel" style={{ minWidth: "350px" }}>
        <h3>SYSTEM STATUS</h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            margin: "20px 0",
            color: isConnected ? "var(--color-primary)" : "var(--color-danger)",
          }}
        >
          <div
            className="status-indicator"
            style={{
              background: isConnected ? "currentColor" : "var(--color-danger)",
            }}
          ></div>
          <span>{isConnected ? "ONLINE" : "OFFLINE"}</span>
        </div>
        {isConnected && (
          <button onClick={startSimulation} style={{ width: "100%" }}>
            INITIALIZE SIM
          </button>
        )}
      </div>
    );
  }

  const { threat_level, threat_color } = systemState;
  const threatColorHex =
    threat_color === "red"
      ? "var(--color-danger)"
      : threat_color === "orange"
      ? "var(--color-warning)"
      : "var(--color-success)";

  return (
    <div
      className="hud-panel"
      style={{
        minWidth: "400px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        height: "740px",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(0, 243, 255, 0.2)",
          paddingBottom: "10px",
        }}
      >
        <h3 style={{ fontSize: "1.2em" }}>COMMAND & CONTROL</h3>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.8em",
            color: "rgba(0, 243, 255, 0.7)",
            marginTop: "5px",
          }}
        >
          <span>UNIT_ID: A-01</span>
          <span>BATTERY: 98%</span>
        </div>
      </div>

      {/* Threat Display */}
      <motion.div
        animate={{
          boxShadow:
            threat_level === "HIGH"
              ? [
                  "0 0 0px var(--color-danger)",
                  "0 0 20px var(--color-danger)",
                  "0 0 0px var(--color-danger)",
                ]
              : "none",
          background:
            threat_level === "HIGH"
              ? "rgba(234, 0, 55, 0.1)"
              : "rgba(0, 0, 0, 0.2)",
        }}
        transition={{ duration: 0.5, repeat: Infinity }}
        style={{
          border: `1px solid ${threatColorHex}`,
          padding: "20px",
          textAlign: "center",
          borderRadius: "4px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontSize: "0.8em",
            letterSpacing: "4px",
            marginBottom: "10px",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          THREAT ANALYSIS
        </div>
        <div
          style={{
            fontSize: "2.5em",
            fontWeight: "bold",
            color: threatColorHex,
            fontFamily: "var(--font-display)",
          }}
        >
          {threat_level}
        </div>

        {threat_level === "HIGH" && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background:
                "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(234,0,55,0.1) 10px, rgba(234,0,55,0.1) 20px)",
            }}
          ></div>
        )}
      </motion.div>

      {/* Telemetry Data Grid */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}
      >
        <DataBox
          label="TARGET X"
          value={systemState.estimated_target.x.toFixed(2)}
          unit="m"
        />
        <DataBox
          label="TARGET Y"
          value={systemState.estimated_target.y.toFixed(2)}
          unit="m"
        />
        <DataBox
          label="AZIMUTH"
          value={systemState.turret_angle.toFixed(1)}
          unit="deg"
        />
        <DataBox
          label="VELOCITY"
          value={(Math.random() * 5 + 2).toFixed(1)}
          unit="m/s"
        />
      </div>

      {/* Scrolling Logs Terminal */}
      <div
        style={{
          flex: 1,
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(0, 243, 255, 0.1)",
          padding: "10px",
          fontFamily: "monospace",
          fontSize: "0.75em",
          overflowY: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.8)",
        }}
      >
        <div
          style={{
            color: "var(--color-primary)",
            opacity: 0.5,
            borderBottom: "1px dashed var(--color-primary)",
            paddingBottom: "2px",
            marginBottom: "5px",
          }}
        >
          // SYSTEM_LOGS
        </div>
        {logs.map((log, i) => (
          <div
            key={i}
            style={{
              marginBottom: "2px",
              color: log.includes("WARNING")
                ? "var(--color-danger)"
                : "var(--color-primary)",
            }}
          >
            <span style={{ opacity: 0.5 }}>{"> "}</span>
            {log}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={startSimulation} style={{ flex: 1 }}>
          ENGAGE
        </button>
        <button
          onClick={stopSimulation}
          style={{
            flex: 1,
            borderColor: "var(--color-warning)",
            color: "var(--color-warning)",
          }}
        >
          HALT
        </button>
        <button
          onClick={resetSimulation}
          style={{
            borderColor: "var(--color-danger)",
            color: "var(--color-danger)",
          }}
        >
          RESET
        </button>
      </div>
    </div>
  );
};

const DataBox = ({ label, value, unit }) => (
  <div
    style={{
      background: "rgba(0, 243, 255, 0.05)",
      padding: "10px",
      borderLeft: "2px solid var(--color-primary)",
    }}
  >
    <div
      style={{
        fontSize: "0.7em",
        color: "rgba(255,255,255,0.5)",
        marginBottom: "5px",
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: "1.4em", fontFamily: "var(--font-display)" }}>
      {value}{" "}
      <span style={{ fontSize: "0.5em", color: "var(--color-primary)" }}>
        {unit}
      </span>
    </div>
  </div>
);

export default ControlPanel;
