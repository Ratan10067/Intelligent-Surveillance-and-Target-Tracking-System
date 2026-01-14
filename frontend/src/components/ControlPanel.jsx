import React, { useContext } from "react";
import { SocketContext } from "../context/SocketContext";

const ControlPanel = () => {
  const {
    isConnected,
    systemState,
    startSimulation,
    stopSimulation,
    resetSimulation,
  } = useContext(SocketContext);

  if (!systemState) {
    return (
      <div className="panel" style={{ minWidth: "300px" }}>
        <h3>SYSTEM STATUS</h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <div
            className="status-indicator"
            style={{
              background: isConnected
                ? "var(--color-primary)"
                : "var(--color-danger)",
            }}
          ></div>
          <span>{isConnected ? "ONLINE" : "OFFLINE"}</span>
        </div>
        <div style={{ opacity: 0.5 }}>Waiting for telemetry...</div>
        {isConnected && (
          <button
            onClick={startSimulation}
            style={{ width: "100%", marginTop: "20px" }}
          >
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
      : "var(--color-safe)";

  return (
    <div
      className="panel"
      style={{
        minWidth: "350px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* Header */}
      <div>
        <h3 style={{ margin: "0 0 5px 0" }}>CONTROL.MOD</h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.8em",
            color: "var(--color-text-dim)",
          }}
        >
          <div
            className="status-indicator"
            style={{ background: "var(--color-primary)" }}
          ></div>
          <span>CONNECTED_TO_CORE</span>
        </div>
      </div>

      {/* Threat Display */}
      <div
        style={{
          border: `1px solid ${threatColorHex}`,
          background: `rgba(${
            threat_color === "red" ? "255, 42, 42" : "0, 255, 102"
          }, 0.1)`,
          padding: "15px",
          textAlign: "center",
          borderRadius: "4px",
        }}
      >
        <div
          style={{
            fontSize: "0.8em",
            letterSpacing: "2px",
            marginBottom: "5px",
          }}
        >
          THREAT LEVEL
        </div>
        <div
          style={{ fontSize: "2em", fontWeight: "bold", color: threatColorHex }}
        >
          {threat_level}
        </div>
      </div>

      {/* Telemetry Data */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}
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
          label="TURRET AZIMUTH"
          value={systemState.turret_angle.toFixed(1)}
          unit="deg"
        />
        <DataBox label="SENSOR CONFIDENCE" value="98.2" unit="%" />
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginTop: "auto",
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={startSimulation} style={{ flex: 1 }}>
            RESUME
          </button>
          <button
            onClick={stopSimulation}
            style={{
              flex: 1,
              borderColor: "var(--color-warning)",
              color: "var(--color-warning)",
            }}
          >
            PAUSE
          </button>
        </div>
        <button
          onClick={resetSimulation}
          style={{
            borderColor: "var(--color-danger)",
            color: "var(--color-danger)",
          }}
        >
          SYSTEM RESET
        </button>
      </div>
    </div>
  );
};

const DataBox = ({ label, value, unit }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.05)",
      padding: "10px",
      borderRadius: "4px",
    }}
  >
    <div
      style={{
        fontSize: "0.7em",
        color: "var(--color-text-dim)",
        marginBottom: "5px",
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: "1.2em", fontFamily: "monospace" }}>
      {value}{" "}
      <span style={{ fontSize: "0.6em", color: "var(--color-primary)" }}>
        {unit}
      </span>
    </div>
  </div>
);

export default ControlPanel;
