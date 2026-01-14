import eventlet
eventlet.monkey_patch()

from flask import Flask
from flask_socketio import SocketIO, emit
import time
import math
import numpy as np

# Import our modules
from simulation.modules import Target, Sensor
from processing.tracking import KalmanFilter
from processing.classification import ThreatClassifier
from control.pid import PIDController

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# State
simulation_running = False
dt = 0.1

# Initialize Objects
target = Target(x=0, y=50, vx=5, vy=2) # Starting at (0, 50) moving NE
sensor = Sensor(noise_std=2.0)
kf = KalmanFilter(dt=dt)
classifier = ThreatClassifier()
turret_pid = PIDController(kp=1.0, ki=0.0, kd=0.1) # Controls turret angle

# Turret State
turret_angle = 0.0

def simulation_loop():
    global simulation_running, turret_angle
    print("Simulation started")
    while True:
        if simulation_running:
            # 1. Physics Step
            target.update()
            true_x, true_y = target.get_position()
            
            # 2. Sensing Step
            meas_x, meas_y = sensor.measure(target)
            
            # 3. Tracking Step (Kalman Filter)
            kf.predict()
            est_x, est_y, est_vx, est_vy = kf.update([meas_x, meas_y])
            
            # 4. Classification Step
            threat_level, threat_color = classifier.classify([est_vx, est_vy])
            
            # 5. Control Step
            # Calculate desired angle to target (arctan2(y, x))
            # Note: Radar usually has 0 deg as North (Y axis) or East (X axis). 
            # Let's assume standard Math: 0 is East.
            target_angle_rad = math.atan2(est_y, est_x)
            target_angle_deg = math.degrees(target_angle_rad)
            
            turret_pid.set_target(target_angle_deg)
            control_signal = turret_pid.compute(turret_angle, dt)
            
            # Update turret position (simulate motor)
            turret_angle += control_signal * dt
            
            # 6. Broadcast State
            state = {
                'true_target': {'x': true_x, 'y': true_y},
                'measured_target': {'x': meas_x, 'y': meas_y},
                'estimated_target': {'x': est_x, 'y': est_y},
                'turret_angle': turret_angle,
                'threat_level': threat_level,
                'threat_color': threat_color
            }
            socketio.emit('state_update', state)
            
        eventlet.sleep(dt)

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('start_simulation')
def handle_start():
    global simulation_running
    simulation_running = True
    print("Simulation resumed")

@socketio.on('stop_simulation')
def handle_stop():
    global simulation_running
    simulation_running = False
    print("Simulation paused")

@socketio.on('reset_simulation')
def handle_reset():
    global target, kf, turret_angle
    target = Target(x=0, y=50, vx=5, vy=2)
    kf = KalmanFilter(dt=dt) # Reset KF state
    turret_angle = 0.0
    print("Simulation reset")

if __name__ == '__main__':
    # Start background thread
    socketio.start_background_task(simulation_loop)
    socketio.run(app, debug=True, port=5000)
