# Intelligent Surveillance and Target Tracking System

A Design Lab project demonstrating a real-time surveillance system with target detection, tracking (Kalman Filter), and autonomous control (PID).

## Features

- **Simulation Mode**: Simulates targets and sensors without hardware.
- **Kalman Filter**: Smooths noisy sensor data for accurate tracking.
- **PID Control**: Autonomous turret tracking mechanism.
- **Threat Detection**: Classifies targets based on velocity.
- **Dashboard**: Modern React-based "Iron Man" style interface.

## Tech Stack

- **Backend**: Python (Flask, Socket.IO, NumPy)
- **Frontend**: React (Vite, Canvas API)

## How to Run

1. **Backend**:
   ```bash
   python3 backend/app.py
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
