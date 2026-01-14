import numpy as np
import random

class Target:
    def __init__(self, x=0, y=0, vx=0, vy=0):
        self.state = np.array([x, y, vx, vy], dtype=float)
        self.dt = 0.1  # Time step

    def update(self):
        """Updates the target position based on velocity (Constant Velocity Model)."""
        # x = x + vx * dt
        # y = y + vy * dt
        self.state[0] += self.state[2] * self.dt
        self.state[1] += self.state[3] * self.dt
        
        # World Boundaries (Bounce effect for endless demo)
        # Radar Radius is ~75m (300px / 4px/m). Let's bound at 70m.
        BOUNDARY = 70.0
        
        if self.state[0] > BOUNDARY or self.state[0] < -BOUNDARY:
            self.state[2] *= -1 # Reverse X velocity
            
        if self.state[1] > BOUNDARY or self.state[1] < -BOUNDARY:
            self.state[3] *= -1 # Reverse Y velocity
        
        # Optional: Add small process noise (random acceleration/jerk)
        self.state[2] += np.random.normal(0, 0.1)
        self.state[3] += np.random.normal(0, 0.1)

    def get_position(self):
        return self.state[0], self.state[1]

    def get_velocity(self):
        return self.state[2], self.state[3]

class Sensor:
    def __init__(self, noise_std=1.0):
        self.noise_std = noise_std

    def measure(self, target):
        """Returns a noisy measurement of the target's position."""
        x_true, y_true = target.get_position()
        
        x_meas = x_true + np.random.normal(0, self.noise_std)
        y_meas = y_true + np.random.normal(0, self.noise_std)
        
        return x_meas, y_meas
