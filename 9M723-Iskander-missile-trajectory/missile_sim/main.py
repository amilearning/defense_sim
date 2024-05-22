
import numpy as np
from scipy.io import loadmat
from pyproj import Proj, Transformer
import os
import random
import matplotlib.pyplot as plt

from mpl_toolkits.mplot3d import Axes3D
from util import get_relative_displacement

# random.seed(1)


class DefenceArea:
    def __init__(self, area_id, lon, lat, value=0):
        self.id = area_id
        self.lon = lon
        self.lat = lat
        self.value = value
        self.utm_x = None
        self.utm_y = None


class Missile:
    def __init__(self, target_id=None):
        self.target_id = target_id
        self.terminal_state = None
        self.data_history = None
        self.states = None
        self.cur_state = None
        self.idx = 0
        self.update_step = 20
        self.landed = False

        
        
    
    def step(self):
        if self.idx < len(self.states)-1:
            self.idx+=self.update_step
        
        if self.idx > len(self.states)-1:
            self.idx = len(self.states)-1           
        self.cur_state = self.states[self.idx,:]

    def get_one_step_pred(self):
        tmp_idx = self.idx +self.update_step
        if tmp_idx > len(self.states)-1:
            tmp_idx = len(self.states)-1
        return self.states[tmp_idx,:]
        
    def check_if_landed(self):
        distance = np.sqrt((self.terminal_state[1] - self.cur_state[1])**2 + (self.terminal_state[2] - self.cur_state[2])**2)
        if distance < 5 and abs(self.cur_state[3]) < 10:
            self.landed = True 
        
        # data = [t, x, y, z, U, V, W, U_dot, V_dot, W_dot, g, n_x, n_y, n_z, n,...
        #     phi, theta, psi, alfa, beta, alfa_t, delta_w, delta_k, delta_w_T, delta_k_T, P, Q, R, x_sm, x_sp];
        #     param = [coordinate(1), coordinate(2), fuel_rate, gamma_pb];

    def data_to_state(self,data):
        if len((data.shape)) == 1:
            return data[:4]
        else:
            return data[:,:4]
    def load_missile_traj_from_mat(self, mat_file_name):
        data = loadmat(mat_file_name)
        self.data_history = data['data']
        self.terminal_state = self.data_to_state(self.data_history[-1,:])
        self.states = self.data_to_state(self.data_history[:,:])
        self.cur_state = self.data_to_state(self.data_history[0,:]) 



    def find_closest_target(self, areas):
        min_distance = float('inf')
        closest_area_id = None
        for area in areas:
            distance = np.sqrt((self.terminal_state[1]/1000 - area.utm_x)**2 + (self.terminal_state[2]/1000 - area.utm_y)**2)
            if distance < min_distance:
                min_distance = distance
                closest_area_id = area.id
        self.target_id = closest_area_id

class SimulationMain:
    def __init__(self):        
        main_dir = os.path.dirname(os.path.abspath(__file__))
        self.traj_directory = os.path.join(main_dir, 'traj_data')   
        self.target_lat_and_lon = np.array([[37.536000, 126.874854],
                                            [37.506298, 127.082379],
                                            [37.992066, 127.169186],
                                            [37.744941, 128.872667],
                                            [36.504517, 127.264373],
                                            [37.533446, 126.977978],
                                            [36.297663, 127.244953],
                                            [37.214519, 127.238170],
                                            [35.898589, 128.638408],
                                            [37.090014, 127.030158],
                                            [37.754122, 128.944691],
                                            [36.998655, 126.825257],
                                            [34.763252, 126.393823]])
        self.launch_site_lat_lon = np.array([38.832565, 126.084214])
        self.defense_areas = []
        self.missiles = []
        self.origin_utm = None
        self.init_defense_areas()
        self.load_missiles()
        self.missile_target_assign()


    
        

    def missile_target_assign(self):
        for missile in self.missiles:
            missile.find_closest_target(self.defense_areas)
        return None

        
    def latlon_to_utm(self, lat, lon):
        wgs84 = Proj(proj='latlong', datum='WGS84')
        utm_zone = int((lon + 180) / 6) + 1
        utm_proj = Proj(proj='utm', zone=utm_zone, datum='WGS84')
        transformer = Transformer.from_proj(wgs84, utm_proj)
        x, y = transformer.transform(lat, lon)
        return x, y, utm_zone

    def init_defense_areas(self):
        # launch_utm_x, launch_utm_y, _ = self.latlon_to_utm(self.launch_site_lat_lon[0], self.launch_site_lat_lon[1])        
        for i, (lat, lon) in enumerate(self.target_lat_and_lon):
            # x, y, _ = self.latlon_to_utm(lat, lon)
            vec = get_relative_displacement(self.launch_site_lat_lon[0], self.launch_site_lat_lon[1], lat, lon)
            # x -= self.origin_utm[0]
            # y -= self.origin_utm[1]
            area = DefenceArea(i, lon, lat)
            area.utm_x = vec[0]/1000 # in km
            area.utm_y = vec[1]/1000 # in km
            self.defense_areas.append(area)

    
    def load_missiles(self):
     
        mat_files = [file for file in os.listdir(self.traj_directory) if file.endswith('.mat')]
        for mat_file in mat_files:
            missile = Missile()
            file_path = os.path.join(self.traj_directory, mat_file)
            missile.load_missile_traj_from_mat(file_path)
            self.missiles.append(missile)

    def define_missiles_to_launch(self, target_index):
        return [missile for missile in self.missiles if missile.target_id == target_index]



    def visualize_missile_paths(self, missiles, lines):
        for line, missile in zip(lines, missiles):
            xdata, ydata, zdata = line._verts3d
            if len(line.get_xdata())== 0:   
                xdata = xdata.tolist()
                ydata = ydata.tolist()
                zdata = zdata.tolist()
                
            xdata.append(missile.cur_state[1]/1000)
            ydata.append(missile.cur_state[2]/1000)
            zdata.append(-missile.cur_state[3]/1000)
            line.set_data(xdata, ydata)
            line.set_3d_properties(zdata)
        plt.draw()
        plt.pause(0.01) 


    def draw_defense_area_circles(self, ax):
        for area in self.defense_areas:
            theta = np.linspace(0, 2*np.pi, 100)
            x = area.utm_x + 5 * np.cos(theta)  # Radius of 50 meters
            y = area.utm_y + 5 * np.sin(theta)
            z = np.zeros_like(x)  # z = 0 for all points
            ax.plot(x, y, z, color='r')  # Red circles


    def sim_loop(self):        
        num_missiles = 5
        selected_missiles = random.sample(self.missiles, num_missiles)
        all_landed = False
        
        plt.ion()  # Turn on interactive mode
        fig = plt.figure()
        ax = fig.add_subplot(111, projection='3d')
        lines = [ax.plot([], [], [])[0] for _ in selected_missiles]
        ax.set_xlim(-0, 500)
        ax.set_ylim(-500, 0)
        ax.set_zlim(0, 350)  # Adjust based on expected altitude range
        ax.set_xlabel('X (meters)')
        ax.set_ylabel('Y (meters)')
        ax.set_zlabel('Altitude (meters)')
        ax.set_title('Missile Trajectories')
        ax.grid(True)
        self.draw_defense_area_circles(ax)

        while not all(missile.landed for missile in selected_missiles):            
            
            for missile in selected_missiles:
                missile.check_if_landed()
                missile.step()
                
                for defense_area in self.defense_areas:
                    # P(x_k+1 | x_k, defense_i)
                    pred_normal_mu = np.zeros(missile.cur_state.shape)    
                    pred_normal_sigma = np.ones(missile.cur_state.shape)*1e5
                    if defense_area.id == missile.target_id:
                        pred_state = missile.get_one_step_pred()                        
                        pred_normal_mu = pred_state + np.random.randn(*pred_state.shape)*5e-2
                        pred_normal_sigma = np.ones(pred_state.shape)*1e1                    
            
            self.visualize_missile_paths(selected_missiles, lines)
            # t_idx +=1
        print(1)

    
    

    
if __name__ == "__main__":
    sim = SimulationMain()    
    # Perform a simulation step
    sim.sim_loop()
# class simulation_main


#     target_lat_and_lon = np.array([[37.536000, 126.874854],
#                                     [37.506298, 127.082379],
#                                     [37.992066, 127.169186],
#                                     [37.744941, 128.872667],
#                                     [36.504517, 127.264373],
#                                     [37.533446, 126.977978],
#                                     [36.297663, 127.244953],
#                                     [37.214519, 127.238170],
#                                     [35.898589, 128.638408],
#                                     [37.090014, 127.030158],
#                                     [37.754122, 128.944691],
#                                     [36.998655, 126.825257],
#                                     [34.763252, 126.393823]])
#     launch_site_lat_lon = np.array([38.832565, 126.084214])
    
#     convert launch site_lat_lon to utm and take this as origin

#     make defense areas for target in target_lat_and_lon 
#     convert the lat and lon to utm and store this information in defence area, compute relative to origin 
    

#     def load_missiles
#         load the missile history stored in mat files under specific directory
#         for each loaded missile history  
#             compute extract the terminal state and compute the distance from start point 
    
#     def define_missiles to launch 
#         input: given the target index 
#         output: return the missiles which has the target index 
    
#     def init intention inference 
        
#     def sim_step 
#         step_the missile
#         step the intention inference
#         visualize the  missiles path
    
    
#     init_probabilities 


    
