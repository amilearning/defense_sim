from pyproj import Proj, Transformer
import pyproj
import numpy as np

def latlon_to_utm(lat, lon):    
    wgs84 = pyproj.CRS('epsg:4326')  # 원래 좌표계 (WGS84)
    tm_korea = pyproj.CRS('epsg:5179')  # 변환하려는 좌표계 (TM Korea)
    transformer = pyproj.Transformer.from_crs(wgs84, tm_korea)

    x, y = transformer.transform(lat, lon)
    
    return x, y

def get_relative_displacement(lat1, lon1, lat2, lon2):
    # Convert the coordinates to UTM
    x1, y1 = latlon_to_utm(lat1, lon1)
    x2, y2 = latlon_to_utm(lat2, lon2)        
    return -1*np.array([x2 - x1, y2-y1])

def compute_distance(lat1, lon1, lat2, lon2):
    # Convert the coordinates to UTM
    x1, y1 = latlon_to_utm(lat1, lon1)
    x2, y2 = latlon_to_utm(lat2, lon2)
    
    # Compute the Euclidean distance
    distance = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
    
    return distance


# target_lat_and_lon = np.array([[37.536000, 126.874854],
#                                 [37.506298, 127.082379],
#                                 [37.992066, 127.169186],
#                                 [37.744941, 128.872667],
#                                 [36.504517, 127.264373],
#                                 [37.533446, 126.977978],
#                                 [36.297663, 127.244953],
#                                 [37.214519, 127.238170],
#                                 [35.898589, 128.638408],
#                                 [37.090014, 127.030158],
#                                 [37.754122, 128.944691],
#                                 [36.998655, 126.825257],
#                                 [34.763252, 126.393823]])
# launch_site_lat_lon = np.array([38.832565, 126.084214])




# # Compute distances from the launch site to each target location
# distances = []
# for target in target_lat_and_lon:
#     distance = compute_distance(launch_site_lat_lon[0], launch_site_lat_lon[1], target[0], target[1])
#     distances.append(distance/1000)

# vectors =[]
# for target in target_lat_and_lon:
#     vec = get_relative_displacement(launch_site_lat_lon[0], launch_site_lat_lon[1], target[0], target[1])
#     vectors.append(vec)

# np.array(vectors)/1000
# # Print the distances
# for i, distance in enumerate(distances):
#     print(f"Distance from launch site to target {i+1}: {distance:.2f} Kilometers")