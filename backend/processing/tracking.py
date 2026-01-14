import numpy as np

class KalmanFilter:
    def __init__(self, dt=0.1, process_noise=0.1, measurement_noise=1.0):
        self.dt = dt
        
        # State Vector: [x, y, vx, vy]
        self.x = np.zeros(4)
        
        # State Transition Matrix (F)
        self.F = np.array([
            [1, 0, dt, 0],
            [0, 1, 0, dt],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ])
        
        # Measurement Matrix (H)
        # We only measure position [x, y]
        self.H = np.array([
            [1, 0, 0, 0],
            [0, 1, 0, 0]
        ])
        
        # Covariance Matrix (P)
        self.P = np.eye(4) * 500.0
        
        # Process Noise Covariance (Q)
        self.Q = np.eye(4) * process_noise
        
        # Measurement Noise Covariance (R)
        self.R = np.eye(2) * measurement_noise

    def predict(self):
        """Predict the next state."""
        self.x = self.F @ self.x
        self.P = self.F @ self.P @ self.F.T + self.Q
        return self.x

    def update(self, z):
        """Update the state with a new measurement z = [mx, my]."""
        z = np.array(z)
        
        # Innovation
        y = z - self.H @ self.x
        
        # Innovation Covariance
        S = self.H @ self.P @ self.H.T + self.R
        
        # Kalman Gain
        K = self.P @ self.H.T @ np.linalg.inv(S)
        
        # Update State
        self.x = self.x + K @ y
        
        # Update Covariance
        I = np.eye(len(self.x))
        self.P = (I - K @ self.H) @ self.P
        
        return self.x

    def get_estimate(self):
        return self.x[0], self.x[1]
    
    def get_velocity_estimate(self):
        return self.x[2], self.x[3]
