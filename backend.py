from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_pymongo import PyMongo
import schedule
import time

from defense_sim.models.defense_area import DefenseArea, DefenseDataManager

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
        CORS(self.app)  # Enable CORS for all routes
        self.console = DefenseAreaConsole()
        # self.app.config['SECRET_KEY'] = 'your-secret-key'
        self.app.config['MONGO_URI'] = 'mongodb://localhost:27017/defense_system_db'
        self.mongo = PyMongo(self.app)
        self.socketio = SocketIO(self.app, cors_allowed_origins="*")  # Allow WebSocket connections from all origins
        
    
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
    
