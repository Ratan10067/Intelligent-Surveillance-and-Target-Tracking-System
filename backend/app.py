import eventlet
eventlet.monkey_patch()

from flask import Flask
from flask_socketio import SocketIO
import numpy as np
import math

from simulation.modules import Target, Sensor
from processing.tracking import KalmanFilter
from processing.classification import ThreatClassifier
from control.pid import PIDController
from processing.targeting import InterceptSolver

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# State
simulation_running = False
dt = 0.1

# Initialize Objects
target = Target(x=0, y=50, vx=5, vy=2) 
sensor = Sensor(noise_std=2.0)
kf = KalmanFilter(dt=dt)
classifier = ThreatClassifier()
turret_pid = PIDController(kp=1.0, ki=0.0, kd=0.1) 
solver = InterceptSolver(projectile_speed=60.0) # Faster than target

# Turret & Weapon State
turret_angle = 0.0
projectile = None # {x, y, vx, vy} or None
explosion = None # {x, y, frame} or None
lock_timer = 0.0 # Seconds held on target

def simulation_loop():
    global simulation_running, turret_angle, projectile, explosion, target, lock_timer
    print("Simulation started")
    while True:
        if simulation_running:
            # 1. Physics Step
            target.update()
            true_x, true_y = target.get_position()
            
            # Update Projectile
            if projectile:
                projectile['x'] += projectile['vx'] * dt
                projectile['y'] += projectile['vy'] * dt
                
                # Check Collision (Hit)
                dist = math.sqrt((projectile['x'] - true_x)**2 + (projectile['y'] - true_y)**2)
                if dist < 8.0: # Generous Hit radius
                    print("TARGET HIT!")
                    explosion = {'x': true_x, 'y': true_y, 'frame': 0}
                    projectile = None
                    # Reset Target (Respawn)
                    target.state = np.array([np.random.uniform(-40, 40), np.random.uniform(40, 60), np.random.uniform(-5, 5), np.random.uniform(-2, 2)])
                    lock_timer = 0.0 # Lost lock on destroy
                
                # Boundary check for projectile (cleanup)
                elif math.sqrt(projectile['x']**2 + projectile['y']**2) > 200:
                    projectile = None 
            
            # 2. Sensing Step
            meas_x, meas_y = sensor.measure(target)
            
            # 3. Tracking Step (Kalman Filter)
            kf.predict()
            est_x, est_y, est_vx, est_vy = kf.update([meas_x, meas_y])
            
            # 4. Classification Step
            threat_level, threat_color = classifier.classify([est_vx, est_vy])
            
            # 5. Targeting Step (Intercept Prediction)
            int_x, int_y, int_time = solver.calculate_intercept([est_x, est_y], [est_vx, est_vy])
            
            # Lock Logic
            if int_x is not None:
                lock_timer = min(2.0, lock_timer + dt) # 2 seconds to full lock
            else:
                lock_timer = max(0.0, lock_timer - dt*2) # Fast decay if invalid
                
            lock_percentage = lock_timer / 2.0
            
            # 6. Control Step (Aim at Intercept if possible, using standard angle logic)
            aim_x, aim_y = (int_x, int_y) if int_x is not None else (est_x, est_y)
            
            target_angle_rad = math.atan2(aim_y, aim_x)
            target_angle_deg = math.degrees(target_angle_rad)
            
            turret_pid.set_target(target_angle_deg)
            control_signal = turret_pid.compute(turret_angle, dt)
            turret_angle += control_signal * dt
            
            # 7. Broadcast State
            state = {
                'true_target': {'x': true_x, 'y': true_y},
                'measured_target': {'x': meas_x, 'y': meas_y},
                'estimated_target': {'x': est_x, 'y': est_y},
                'intercept_point': {'x': int_x, 'y': int_y} if int_x else None,
                'projectile': projectile,
                'explosion': explosion,
                'turret_angle': turret_angle,
                'threat_level': threat_level,
                'threat_color': threat_color,
                'lock_status': lock_percentage # 0.0 to 1.0
            }
            
            if explosion:
                explosion['frame'] += 1
                if explosion['frame'] > 20: explosion = None 
                
            socketio.emit('state_update', state)
            
        eventlet.sleep(dt)

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('start_simulation')
def handle_start():
    global simulation_running
    simulation_running = True
    print('Simulation resumed')

@socketio.on('stop_simulation')
def handle_stop():
    global simulation_running
    simulation_running = False
    print('Simulation paused')

@socketio.on('reset_simulation')
def handle_reset():
    global target, sensor, kf, turret_angle, projectile, explosion, lock_timer
    target = Target(x=0, y=50, vx=5, vy=2)
    sensor = Sensor(noise_std=2.0)
    kf = KalmanFilter(dt=dt)
    turret_angle = 0.0
    projectile = None
    explosion = None
    lock_timer = 0.0
    print('Simulation reset')

@socketio.on('fire_weapon')
def handle_fire():
    global projectile, turret_angle, simulation_running, lock_timer
    if not simulation_running: return
    
    # Fire in direction of turret -- WITH ERROR based on LOCK
    speed = solver.projectile_speed 
    
    # Calculate Error
    lock_percentage = lock_timer / 2.0
    accuracy_error = (1.0 - lock_percentage) * 0.5 # Up to 0.5 rad (~30 deg) error if not locked
    
    # Add random deviation
    deviation = np.random.uniform(-accuracy_error, accuracy_error)
    
    rad = math.radians(turret_angle) + deviation
    
    vx = speed * math.cos(rad)
    vy = speed * math.sin(rad)
    
    # Start at origin
    projectile = {'x': 0, 'y': 0, 'vx': vx, 'vy': vy}
    print(f"WEAPON FIRED (Lock: {lock_percentage*100:.1f}%)")

if __name__ == '__main__':
    eventlet.spawn(simulation_loop)
    socketio.run(app, debug=True)
