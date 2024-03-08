import unittest
from defense_sim.models.defense_area import DefenseArea, DefenseDataManager
from defense_sim.models.edge import Edge
import sys
from backend import DefenseAreaBackend
sys.path.append(r'C:\Users\ghwls\Documents\ADD')


## 
# client = MongoClient('localhost', 27017)
# db = client.defense_system
# defense_areas_col = db.defense_areas

# # Create a defense area with defense_score as one of the tags
# tags = {"type": "radar", "location": "mountain", "defense_score": "100"}
# defense_area = DefenseArea("AreaX", tags)

# # Insert the defense area into MongoDB
# defense_areas_col.insert_one(defense_area.to_dict())

# # Retrieve and display
# areas = defense_areas_col.find()
# for area in areas:
#     print(area)
# # Initialize the DefenseDataManager
    

class DefenseAreaConsole:
    def __init__(self):
        self.manager = DefenseDataManager("mongodb://localhost:27017/", "defense_system_db")

    def add_defense_area(self, area_id, tags_input):
        tags = {k:v for k, v in (tag.split(':') for tag in tags_input.split(','))}
        self.manager.add_defense_area(area_id, tags)
        print(f"Added defense area {area_id}.")

    def add_edge(self, source_id, target_id, weight):
        self.manager.add_edge(source_id, target_id, weight)
        print(f"Added edge from {source_id} to {target_id}.")

    def show_all_defense_areas(self):
        print("Defense Areas:")
        for area in self.manager.get_all_defense_areas():
            print(area)

    def show_edges_for_area(self, area_id):
        print(f"Edges for {area_id}:")
        for edge in self.manager.get_edges_for_area(area_id):
            print(edge)
    
    def add_tag(self,area_id, tags_input):
        tags = {k:v for k, v in (tag.split(':') for tag in tags_input.split(','))}
        self.manager.add_tags_to_defense_area(area_id,tags)

        

if __name__ == "__main__":
    
    
    console = DefenseAreaConsole()
    from flask import Flask, jsonify
    # import threading
    # backend = DefenseAreaBackend()
    # backend_thread = threading.Thread(target=backend.start)
    # backend_thread.daemon = True  # This makes the thread a daemon so it will automatically exit when the main thread exits
    # backend_thread.start()
    app = Flask(__name__)
    app.config['MONGO_URI'] = 'mongodb://localhost:27017/defense_system_db'
    # import socketio

    # Create a SocketIO client
    # sio = socketio.Client()

    # # Connect to the SocketIO server
    # sio.connect('http://localhost:5000')

    # Define a function to handle the 'defense_areas_updated' event
    # @sio.on('defense_areas_updated')
    # def on_defense_areas_updated(data):
    #     print('Defense areas updated:', data)

    # # Trigger the 'update_defense_areas' event on the server
    # sio.emit('update_defense_areas')

    while True:
        print("\n[Menu]")
        print("1. Add Defense Area")
        print("2. Add Edge")
        print("3. Show All Defense Areas")
        print("4. Show Edges for a Defense Area")
        print("5. Remove Defense Area")
        print("6. Construct AdjMtx")
        print("7. Add tag")
        print("q. Quit")
        
        choice = input("Select an option or 'q' to quit: ")
        
        if choice == 'q':
            break
        elif choice == '1':
            area_id = input("Enter defense area ID: ")
            tags_input = input("Enter tags (format: key:value,key2:value2): ")
            console.add_defense_area(area_id, tags_input)
        elif choice == '2':
            source_id = input("Enter source defense area ID: ")
            target_id = input("Enter target defense area ID: ")
            weight = int(input("Enter edge weight: "))
            console.add_edge(source_id, target_id, weight)
        elif choice == '3':
            console.show_all_defense_areas()
            # socketio.emit('update_defense_areas')
        elif choice == '4':
            area_id = input("Enter defense area ID to view its edges: ")
            console.show_edges_for_area(area_id)
        elif choice == '5':
            area_id = input("Enter defense area ID: ")
            console.manager.remove_defense_area(area_id)        
        elif choice == '6':
            mtx = console.manager.construct_adjacency_matrix()
            console.manager.store_adjacency_matrix(mtx)
        elif choice == '7':
            area_id = input("Enter defense area ID: ")
            tags_input = input("Enter tags (format: key:value,key2:value2): ")
            console.add_tag(area_id, tags_input)
        else:
            print("Invalid option. Please try again.")

    print("\nExiting program...")
    console.manager.close()
    print("Database connection closed.")