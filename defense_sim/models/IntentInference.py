import numpy as np 
import math
from defense_sim.models.objects import DefenseArea
class Missile:
    def __init__(self, name,  targets=None, type_probabilities=None):
        self.name = name        
        self.targets = targets if targets is not None else {}
        self.type_probabilities = type_probabilities if type_probabilities is not None else {}
        self.impact_scores = {}
        self._compute_and_store_impact()
        
        # Trajectory information
        self.trajectory = {'lat': [], 'lon': [], 'alt': []}  # Lists to store trajectory points


    
    
    def add_trajectory_point(self, lat, lon, alt):
        """Adds a new point to the missile's trajectory."""
        self.trajectory['lat'].append(lat)
        self.trajectory['lon'].append(lon)
        self.trajectory['alt'].append(alt)

    def update_target_probability(self, target_name, probability):
        if target_name in self.targets:
            self.targets[target_name] = probability
            self._compute_and_store_impact()

    def add_type_probability(self, type_category, probability):
        self.type_probabilities[type_category] = probability
        self._compute_and_store_impact()

    def update_type_probability(self, type_category, probability):
        if type_category in self.type_probabilities:
            self.type_probabilities[type_category] = probability
            self._compute_and_store_impact()

    def _compute_and_store_impact(self):
        for target, target_prob in self.targets.items():
            for type_category, type_prob in self.type_probabilities.items():
                impact_score = self.impact_function(target_prob, type_prob)
                self.impact_scores[(target, type_category)] = impact_score

    def get_impact_score(self, target, type_category):
        return self.impact_scores.get((target, type_category), "Impact score not found.")
    
    def impact_function(self,target_prob, type_prob):
        return target_prob * type_prob

# Example usage
# missile = Missile(name="Missile_1")
# missile.add_trajectory_point(lat=35.6895, lon=139.6917, alt=1000)  # Example point
# missile.update_target_probability("Target_A", 0.75)
# missile.update_type_probability("Type_1", 0.55)
        
class IntentInference:
    def __init__(self, defense_areas=None):
        self.defense_areas = defense_areas if defense_areas is not None else []
        self.missiles = []
        self.is_ready = False

    def reset(self,num_missiles, defense_areas):
        self.is_ready = False
        self.trajectory = {'lat': [], 'lon': [], 'alt': []}
        self.defense_areas.clear()
        defense_area_ids = []
        for index, area in enumerate(defense_areas.find()):
            ar = DefenseArea()
            ar.update(area)
            self.defense_areas.append(ar)
            defense_area_ids.append(ar.area_id)

        self.missiles.clear()
        for i in range(num_missiles):
            tmp_missile = Missile(name=str(i), targets= {area_id: 0.05 for area_id in defense_area_ids})
            self.add_missile(tmp_missile)   
        print("intent init done")
        self.is_ready = True
            
    def add_missile(self, missile):
        """Add a missile to the list, optionally including defense area information."""
        self.missiles.append(missile)

    def naive_update(self,missile):
        for idx, area in enumerate(self.defense_areas):    
            max_distance_threshold = 5                 
            distance = math.sqrt(pow(float(missile.trajectory['lat'][-1]) - float(area.tags['lat']), 2)+pow(float(missile.trajectory['lon'][-1])-float(area.tags['lon']), 2))
            probability = 1 - min(distance / max_distance_threshold, 1) 
            missile.update_target_probability(area.area_id, probability)
        return
    
    def normalize_to_probability(self,arr):
        min_val = np.min(arr)
        max_val = np.max(arr)
        if min_val == max_val:
            return np.ones_like(arr) * 0.5  # If min and max are equal, return an array of 0.5s (neutral probability)
        normalized_arr = (arr - min_val) / (max_val - min_val+1e-11)
        return normalized_arr

    def normalize_prob(self):
        tmp_probs = []
        for missile_idx, missile in enumerate(self.missiles):        
            tmp_prob = []
            for area_idx, area in enumerate(self.defense_areas):    
                tmp_prob.append(missile.targets[area.area_id])            
            tmp_prob = np.array(tmp_prob)
            tmp_prob = self.normalize_to_probability(tmp_prob)
            tmp_probs.append(tmp_prob)
        
        for missile_idx, missile in enumerate(self.missiles):  
            for area_idx, area in enumerate(self.defense_areas):                                
                tmp_prob = tmp_probs[missile_idx]
                self.missiles[missile_idx].update_target_probability(area.area_id, tmp_prob[area_idx])
                

    def dynamic_based_update(self):
        return NotImplementedError  
          
    def learning_based_update(self):
        return NotImplementedError
    
    def bayes_update(self):
        return NotImplementedError
                
    
    def update_measurement(self,missile_measurements):   
        result = []
        if self.is_ready is False:
            return result
        for idx, measurement in enumerate(missile_measurements):                        
            if measurement['launched']:                
                self.missiles[idx].name = measurement['id']
                self.missiles[idx].add_trajectory_point(lat=float(measurement['lat']), lon=float(measurement['lon']), alt=1000)  # Example point                                        
                self.naive_update(self.missiles[idx])

        self.normalize_prob()
        
        for idx, measurement in enumerate(missile_measurements):                        
            result.append({'id' : self.missiles[idx].name , 'target': self.missiles[idx].targets})        
        
        return result

 