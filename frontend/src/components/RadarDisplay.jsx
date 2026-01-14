import React, { useRef, useEffect, useContext } from "react";
import { SocketContext } from "../context/SocketContext";

const RENDER_SCALE = 4.0; // Pixels per meter
const RADAR_RADIUS = 300; // Pixels

const RadarDisplay = () => {
  const canvasRef = useRef(null);
  const { systemState } = useContext(SocketContext);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const drawGrid = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw background circles
      ctx.strokeStyle = "#1a3c5e";
      ctx.lineWidth = 1;

      for (let r = 50; r <= RADAR_RADIUS; r += 50) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Draw Crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX - RADAR_RADIUS, centerY);
      ctx.lineTo(centerX + RADAR_RADIUS, centerY);
      ctx.moveTo(centerX, centerY - RADAR_RADIUS);
      ctx.lineTo(centerX, centerY + RADAR_RADIUS);
      ctx.stroke();
    };

    const drawTarget = (x, y, color, size, label) => {
      // Transform (0,0) center to canvas coordinates
      // Note: In simulation (0,0) is origin.
      // Screen Y is inverted relative to standard Cartesian
      const screenX = centerX + x * RENDER_SCALE;
      const screenY = centerY - y * RENDER_SCALE;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, size, 0, 2 * Math.PI);
      ctx.fill();

      // Glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (label) {
        ctx.fillStyle = "#8ba2b5";
        ctx.font = "10px Inter";
        ctx.fillText(label, screenX + 8, screenY - 8);
      }
    };

    const drawTurret = (angleDeg) => {
      // Angle is in degrees, standard math (0 is East/Right)
      // Canvas Y is inverted, so negative angle correction if needed
      // But let's assume we map math to screen directly:
      // Math: 0 deg = Right. Canvas: 0 rad = Right.
      // Math: 90 deg = Up. Canvas: -90 deg (since Y is down).

      // However, our backend sends "Angle in degrees".
      // If backend says 90 deg (North), on canvas with Y down, that is -90 deg (-PI/2).
      // So we negate the angle for visualization if using standard cartesian logic on inverted Y.
      const angleRad = -((angleDeg * Math.PI) / 180);

      const endX = centerX + Math.cos(angleRad) * RADAR_RADIUS;
      const endY = centerY + Math.sin(angleRad) * RADAR_RADIUS;

      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Turret Base
      ctx.fillStyle = "#00f0ff";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
      ctx.fill();
    };

    // Render Frame
    drawGrid();

    if (systemState) {
      // Draw Turret
      drawTurret(systemState.turret_angle);

      // Draw Measured Position (Raw Sensor) - Gray/Ghostly
      drawTarget(
        systemState.measured_target.x,
        systemState.measured_target.y,
        "rgba(255, 255, 255, 0.3)",
        3
      );

      // Draw Estimated Position (Kalman) - Green/Yellow/Red
      const threatColor =
        systemState.threat_color === "red"
          ? "#ff2a2a"
          : systemState.threat_color === "orange"
          ? "#ffae00"
          : "#00ff66";
      drawTarget(
        systemState.estimated_target.x,
        systemState.estimated_target.y,
        threatColor,
        6,
        "TRGT"
      );

      // Draw Trajectory/Velocity Vector
      // TODO
    }
  }, [systemState]);

  return (
    <div className="panel" style={{ display: "inline-block", padding: "10px" }}>
      <h3
        style={{
          margin: "0 0 10px 0",
          borderBottom: "1px solid #1a3c5e",
          paddingBottom: "5px",
        }}
      >
        RADAR.SYS // ACTIVE
      </h3>
      <canvas
        ref={canvasRef}
        width={700}
        height={700}
        style={{ background: "#111b2b", borderRadius: "4px" }}
      />
    </div>
  );
};

export default RadarDisplay;
