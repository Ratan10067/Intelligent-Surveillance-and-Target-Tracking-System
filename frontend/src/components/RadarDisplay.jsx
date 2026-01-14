import React, { useRef, useEffect, useContext } from "react";
import { SocketContext } from "../context/SocketContext";

const RENDER_SCALE = 4.0;
const RADAR_RADIUS = 300;

const RadarDisplay = () => {
  const canvasRef = useRef(null);
  const { systemState } = useContext(SocketContext);
  const scanAngle = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    let animationFrameId;

    const drawGrid = () => {
      // Clear with fade effect for trails (optional, but clean clear is better for this style)
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = "#1a3c5e";
      ctx.lineWidth = 1;

      // Concentric Circles
      for (let r = 50; r <= RADAR_RADIUS; r += 50) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
        ctx.strokeStyle =
          r === RADAR_RADIUS
            ? "var(--color-primary)"
            : "rgba(0, 243, 255, 0.2)";
        ctx.stroke();

        // Range Markers
        ctx.fillStyle = "rgba(0, 243, 255, 0.5)";
        ctx.font = "10px Rajdhani";
        ctx.fillText(
          `${(r / RENDER_SCALE).toFixed(0)}m`,
          centerX + 5,
          centerY - r + 10
        );
      }

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX - RADAR_RADIUS, centerY);
      ctx.lineTo(centerX + RADAR_RADIUS, centerY);
      ctx.moveTo(centerX, centerY - RADAR_RADIUS);
      ctx.lineTo(centerX, centerY + RADAR_RADIUS);
      ctx.strokeStyle = "rgba(0, 243, 255, 0.3)";
      ctx.stroke();

      // X-ticks for degree markings
      for (let i = 0; i < 360; i += 30) {
        const rad = (i * Math.PI) / 180;
        const tx = centerX + Math.cos(rad) * (RADAR_RADIUS + 10);
        const ty = centerY + Math.sin(rad) * (RADAR_RADIUS + 10);
        ctx.fillStyle = "rgba(0, 243, 255, 0.8)";
        ctx.fillText(`${i}°`, tx - 5, ty);
      }
    };

    const drawScanner = () => {
      // Scanner Line - Slower speed
      scanAngle.current = (scanAngle.current + 0.5) % 360;
      const rad = (scanAngle.current * Math.PI) / 180;

      const endX = centerX + Math.cos(rad) * RADAR_RADIUS;
      const endY = centerY + Math.sin(rad) * RADAR_RADIUS;

      // Gradient Cone
      const gradient = ctx.createConicGradient(
        rad - Math.PI / 2,
        centerX,
        centerY
      );
      gradient.addColorStop(0, "rgba(0, 243, 255, 0)");
      gradient.addColorStop(0.8, "rgba(0, 243, 255, 0)");
      gradient.addColorStop(1, "rgba(0, 243, 255, 0.1)"); // Softer trail

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, RADAR_RADIUS, 0, 2 * Math.PI);
      ctx.fill();

      // Leading Edge - Subtle
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = "rgba(0, 243, 255, 0.3)"; // Very low opacity
      ctx.lineWidth = 1; // Thinner
      ctx.stroke();
    };

    const drawTarget = (x, y, color, size, label, hollow = false) => {
      const screenX = centerX + x * RENDER_SCALE;
      const screenY = centerY - y * RENDER_SCALE;

      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      ctx.beginPath();
      if (hollow) {
        ctx.arc(screenX, screenY, size, 0, 2 * Math.PI);
        ctx.stroke();
      } else {
        ctx.arc(screenX, screenY, size, 0, 2 * Math.PI);
        ctx.fill();
        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (label) {
        ctx.fillStyle = color;
        ctx.font = "12px Orbitron";
        ctx.fillText(label, screenX + 10, screenY - 10);

        // Connecting line
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(screenX + 8, screenY - 8);
        ctx.stroke();
      }
    };

    const drawTurret = (angleDeg) => {
      const angleRad = -((angleDeg * Math.PI) / 180);
      const endX = centerX + Math.cos(angleRad) * RADAR_RADIUS;
      const endY = centerY + Math.sin(angleRad) * RADAR_RADIUS;

      ctx.strokeStyle = "#00ff9d"; // Green for Turret
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]); // Dashed line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Turret Base
      ctx.fillStyle = "#00ff9d";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
      ctx.fill();
    };

    const render = () => {
      drawGrid();
      drawScanner();

      if (systemState) {
        drawTurret(systemState.turret_angle);

        // Draw Intercept Crosshair
        if (systemState.intercept_point) {
          const intX = centerX + systemState.intercept_point.x * RENDER_SCALE;
          const intY = centerY - systemState.intercept_point.y * RENDER_SCALE;

          ctx.strokeStyle = "rgba(234, 0, 55, 0.5)";
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(intX - 10, intY);
          ctx.lineTo(intX + 10, intY);
          ctx.moveTo(intX, intY - 10);
          ctx.lineTo(intX, intY + 10);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw Projectile
        if (systemState.projectile) {
          const projX = centerX + systemState.projectile.x * RENDER_SCALE;
          const projY = centerY - systemState.projectile.y * RENDER_SCALE;

          ctx.fillStyle = "#ffff00";
          ctx.beginPath();
          ctx.arc(projX, projY, 3, 0, 2 * Math.PI);
          ctx.fill();
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#ffff00";
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Draw Explosion
        if (systemState.explosion) {
          const expX = centerX + systemState.explosion.x * RENDER_SCALE;
          const expY = centerY - systemState.explosion.y * RENDER_SCALE;
          const radius = systemState.explosion.frame * 5;

          ctx.strokeStyle = `rgba(255, 100, 0, ${
            1 - systemState.explosion.frame / 20
          })`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(expX, expY, radius, 0, 2 * Math.PI);
          ctx.stroke();

          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          ctx.beginPath();
          ctx.arc(expX, expY, 4, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Raw Measurement
        drawTarget(
          systemState.measured_target.x,
          systemState.measured_target.y,
          "rgba(255, 255, 255, 0.2)",
          3,
          null,
          true
        );

        // Estimated Target
        const threatColor =
          systemState.threat_color === "red"
            ? "var(--color-danger)"
            : systemState.threat_color === "orange"
            ? "var(--color-warning)"
            : "var(--color-success)";
        drawTarget(
          systemState.estimated_target.x,
          systemState.estimated_target.y,
          threatColor,
          5,
          `TRGT [${systemState.threat_level}]`
        );
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [systemState]);

  return (
    <div className="hud-panel" style={{ display: "inline-block" }}>
      <h3
        style={{
          color: "var(--color-primary)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>RADAR.SYS // </span>
        <span style={{ fontSize: "0.6em", opacity: 0.8 }}>RANGE: 75m</span>
      </h3>
      <canvas
        ref={canvasRef}
        width={700}
        height={700}
        style={{
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(16,27,43,0) 0%, rgba(16,27,43,0.8) 100%)",
        }}
      />
    </div>
  );
};

export default RadarDisplay;
