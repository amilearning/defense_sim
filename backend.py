from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_pymongo import PyMongo
import schedule
import time
import logging
from defense_sim.models.defense_area import DefenseDataManager

class DefenseAreaConsole:
    def __init__(self):
        self.manager = DefenseDataManager("mongodb://localhost:27017/", "defense_system_db")

    def add_defense_area(self, area_id, tags_input):
        tags = {k:v for k, v in (tag.split(':') for tag in tags_input.split(','))}
        self.manager.add_defense_area(area_id, tags)
        mtx = self.manager.construct_adjacency_matrix()
        self.manager.store_adjacency_matrix(mtx)
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
    
    def get_adj_mtx(self):
        return self.manager.get_adjacency_matrix()
        

class DefenseAreaBackend:
    def __init__(self):
        self.app = Flask(__name__)
        self.app.logger.disabled = True
        
        # self.log = logging.getLogger('werkzeug')
        # self.log.setLevel(logging.ERROR)
       
        CORS(self.app)  # Enable CORS for all routes
        self.console = DefenseAreaConsole()
        # self.app.config['SECRET_KEY'] = 'your-secret-key'
        self.app.config['MONGO_URI'] = 'mongodb://localhost:27017/defense_system_db'
        self.mongo = PyMongo(self.app)
        self.socketio = SocketIO(self.app, cors_allowed_origins="*")  # Allow WebSocket connections from all origins
        
        mtx = self.console.manager.construct_adjacency_matrix()
        self.console.manager.store_adjacency_matrix(mtx)
        

                
        @self.app.route('/api/update-missiles-measurements', methods=['POST'])
        def update_missiles_measurements():
            try:
                # Get the missile measurements from the request body
                missile_measurements = request.json['missileMeasurements']                
                if len(missile_measurements) < 1:
                    return jsonify({"message": "No missiles"}) 
                
                result = self.console.manager.update_missile_info(missile_measurements)
                # Process the missile measurements
             
                    # Update the missile measurements in your backend as needed
                    # For example, you could store them in a database or perform any other operations                    
                # Return a success response
                # return jsonify({"message": "Missile measurements updated successfully"})
                if result is None:
                    return jsonify({"message": "Missile measurements updated successfully"})
                else:
                    return jsonify({"message": "Missile measurements updated successfully", "result": result})
            
            except Exception as e:
                # Handle any errors that occur during the process
                return jsonify({"error": str(e)}), 500
            
            
        @self.app.route('/api/init-intentinference', methods=['POST'])
        def init_intent_inference():
            try:
                # Extract missile count from the request body
                missile_count = request.json['missileCount']
                self.console.manager.init_intent(int(missile_count))
                # Assuming self.console.manager.init_intent() initializes the intent inference algorithm
                # You may need to adjust this based on your application's structure                
                # Return success response
                return jsonify({"message": "Intent inference initialization successful"})
            except Exception as e:
                # Handle any errors that occur during initialization
                return jsonify({"error": str(e)})
            
            

        @self.app.route('/api/add-rule', methods=['POST'])
        def add_rule():
            _id = request.json['_id'] 
            source_tag = request.json['source_tag']
            target_tag = request.json['target_tag'] 
            self.console.manager.store_rule_info(_id, source_tag, target_tag)
            return jsonify({"message": "Rule added successfully"})


        @self.app.route('/api/add-msinfo', methods=['POST'])
        def add_msinfo():
            mission_id = request.json['mission_id']
            msgroup = request.json['msgroup'] 
            status = 0 # inactive by default
            self.console.manager.store_mission_info(mission_id,msgroup)
            return jsonify({"message": "Mission Info added successfully"})
        
        @self.app.route('/api/update-msinfo', methods=['POST'])
        def update_msinfo():
            mission_id = request.json['_id']
            msgroup = request.json['msgroup'] 
            status = request.json['status']             
            self.console.manager.update_mission_info(mission_id,msgroup,status)
            return jsonify({"message": "Mission Info updated successfully"})


        @self.app.route('/api/assign-msgroup', methods=['POST'])
        def assign_msgroup():
            area_id = request.json['area_id']
            msgroup = request.json['msgroup']
            self.console.manager.assign_msgroup(area_id,msgroup)
            return jsonify({"message": "Defense area Mission group added successfully"})

        @self.app.route('/api/add-defense-area', methods=['POST'])
        def add_defense_area():
            area_id = request.json['area_id']
            tags_input = request.json['tags']
            self.console.add_defense_area(area_id, tags_input)
            # Perform the operation to add a defense area
            return jsonify({"message": "Defense area added successfully"})

        @self.app.route('/api/add-edges', methods=['POST'])
        def add_edges():
            source_id = request.json['source_id']
            target_id = request.json['target_id']        
            weight = request.json['weight']            
            self.console.add_edge(source_id, target_id, weight)
            mtx = self.console.manager.construct_adjacency_matrix()            
            self.console.manager.store_adjacency_matrix(mtx)

            # Perform the operation to add a defense area
            return jsonify({"message": "Edge added successfully"})

            
        @self.app.route('/api/single-impact-analysis', methods=['POST'])
        def single_impact_analysis():
            area_id = request.json['area_id']            
            reachability_matrix = self.console.manager.compute_reachability_mtx(area_id)
            # Perform the operation to add a defense area
            area_id = request.json.get('area_id', 'unknown')            
            return jsonify({
                "message": f"single impact analysis done for missile type: {area_id}",
                "reachability_matrix": reachability_matrix
            })

        @self.app.route('/api/defense-areas', methods=['GET'])
        def get_defense_areas():
            defense_areas = self.mongo.db.defense_areas.find()
            adjacency_matrix = self.get_adjacency_matrix()
            # return jsonify(list(defense_areas))
            return jsonify({
                'defenseAreas': list(defense_areas),
                'adjacencyMatrix': adjacency_matrix
            })
        
        @self.app.route('/api/get-msinfo', methods=['GET'])
        def get_msinfo():
            missionInfo = self.mongo.db.missions.find()                        
            return jsonify({
                'missionInfo': list(missionInfo)
            })


    def get_adjacency_matrix(self):
        # Implement logic to retrieve the adjacency matrix from the database or generate it
        # For example:
        adjacency_matrix = self.console.get_adj_mtx()
        return adjacency_matrix
        # @self.socketio.on('update_defense_areas')
        # def handle_update_defense_areas():
        #     defense_areas = self.mongo.db.defense_areas.find()
        #     emit('defense_areas_updated', {'defenseAreas': list(defense_areas)})
        
        # @self.socketio.on('connect')
        # def handle_connect():
        #     # Schedule the emission of defense_areas_updated event every 1 second
        #     schedule.every(0.5).seconds.do(self.emit_defense_areas)

        # def emit_defense_areas(self):
        #     defense_areas = self.mongo.db.defense_areas.find()
        #     self.socketio.emit('defense_areas_updated', {'defenseAreas': list(defense_areas)})


    def start(self):
        self.socketio.run(self.app, debug=True)
    
 

if __name__ == '__main__':
    backend = DefenseAreaBackend()
    backend.start()
    
