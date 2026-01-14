import numpy as np

class ThreatClassifier:
    def __init__(self, speed_thresholds={'med': 2.0, 'high': 5.0}):
        self.thresholds = speed_thresholds

    def classify(self, velocity_vector):
        """Classifies the threat level based on velocity."""
        vx, vy = velocity_vector
        speed = np.sqrt(vx**2 + vy**2)
        
        if speed > self.thresholds['high']:
            return "HIGH", "red"
        elif speed > self.thresholds['med']:
            return "MEDIUM", "orange"
        else:
            return "LOW", "green"
