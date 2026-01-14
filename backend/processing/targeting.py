import numpy as np
import math

class InterceptSolver:
    def __init__(self, projectile_speed=50.0):
        self.projectile_speed = projectile_speed

    def calculate_intercept(self, target_pos, target_vel):
        """
        Calculates the intercept point (x, y) where a projectile fired NOW 
        will hit the target, assuming constant velocity for both.
        
        Returns: (intercept_x, intercept_y, time_to_impact) OR (None, None, None) if impossible.
        """
        start_pos = np.array([0, 0]) # Turret is at origin
        pos_diff = np.array(target_pos) - start_pos
        vel_diff = np.array(target_vel) # Projectile velocity unknown direction, but speed known
        
        # Solving |P_target(t)| = v_proj * t
        # |P0 + V*t|^2 = (S*t)^2
        # (Px + Vx*t)^2 + (Py + Vy*t)^2 = (S*t)^2
        # ... Quadratic Equation: at^2 + bt + c = 0
        
        px, py = pos_diff
        vx, vy = target_vel
        s = self.projectile_speed
        
        a = vx**2 + vy**2 - s**2
        b = 2 * (px * vx + py * vy)
        c = px**2 + py**2
        
        if abs(a) < 1e-6:
            # Linear case (target moving at projectile speed usually unlikely)
            if abs(b) < 1e-6:
                return None, None, None
            t = -c / b
            if t < 0: return None, None, None
        else:
            delta = b**2 - 4*a*c
            if delta < 0:
                return None, None, None # Out of range / Too fast
            
            t1 = (-b - math.sqrt(delta)) / (2*a)
            t2 = (-b + math.sqrt(delta)) / (2*a)
            
            if t1 > 0 and t2 > 0:
                t = min(t1, t2)
            elif t1 > 0:
                t = t1
            elif t2 > 0:
                t = t2
            else:
                return None, None, None
                
        # Calculate intercept point
        intercept_x = px + vx * t
        intercept_y = py + vy * t
        
        return intercept_x, intercept_y, t
