
from pymongo import MongoClient
from defense_sim.models.warsahll import warshall_and_single_row
from defense_sim.models.edge import Edge
from defense_sim.models.objects import DefenseArea
from defense_sim.models.IntentInference import IntentInference, Missile
from copy import copy

class MissionManager:
    def __init__(self):
        self.missions = []
        self.msgroups = []
        self.areas = []
        self.rules = []
        self.edges = []
        

    def append_mission(self,ms):
        self.missions.append(ms)
    def append_msgroup(self,msgroup):
        self.msgroups.append(msgroup)
    def append_area(self,area):
        self.areas.append(area)
    def append_rule(self,rule):
        self.rules.append(rule)
    
    def update_mission_state(self,mission_id, status):
        for _, mission in enumerate(self.missions):
            if mission.id == mission_id:
                mission.status = status
        
    def update_info(self):
        for _, area in enumerate(self.areas):            
            msgroup_indices = area.msgroup 
            for index in msgroup_indices:
                for group in self.msgroups:
                    if group.id == index:
                        group.append_area(area)  # Append the area_id to the areas list of the MissionGroup
                        break  # Exit the inner loop once the MissionGroup is found
   
        for _, mission in enumerate(self.missions):
            msgroup_idxs = copy(mission.msgroup)
            mission.msgroup.clear()
            for _, idx in enumerate(msgroup_idxs):
                for group in self.msgroups:
                    if group.id == idx:
                        mission.msgroup.append(group)
    
            
        
    def check_rule_beteen_areas(self,source_area, target_area,rule):        
        if (rule.source_tag in source_area.tags.values()) and (rule.target_tag in target_area.tags.values()):
            return True
        else:
            return False
        
        

    def compute_edges(self):
        self.edges.clear()
        for _, mission in enumerate(self.missions):
            if mission.status: # if the mission is activated
                for _, group in enumerate(mission.msgroup) :
                    for s_area_idx, s_area in enumerate(group.areas):
                        for t_area_idx, t_area in enumerate(group.areas):
                            if s_area_idx != t_area_idx:
                                is_connected = False
                                for i in range(len(self.rules)):
                                    if(self.check_rule_beteen_areas(s_area, t_area,self.rules[i])):
                                        is_connected = True
                                if is_connected:
                                    edge = Edge(s_area.area_id, t_area.area_id, 1)
                                    self.edges.append(copy(edge))
        
        return copy(self.edges)
        
            

# for each mission class
#     if mission class is avtivated 
#         for each mission group
#             for each pair of defense_area, 
#                 check if any rule applied to them. 
#                 if so, set the dependency between them. 
# % generate edges

    
    

class Rule:
    def __init__(self, id,source_tag, target_tag): 
        self.id = id
        self.source_tag = source_tag
        self.target_tag = target_tag


class Mission:
    def __init__(self, id, status):
        self.id = id
        self.name = None
        self.status = status
        self.msgroup = []

        

class MissionGroup:
    def __init__(self,id):
        self.id = id
        self.areas = []
    def append_area(self,area):
        self.areas.append(area)
    def extract_area(self,id):
        for _, area in enumerate(self.areas):
            if area.area_id == id:
                return area
        return None
    

class DefenseArea:
    def __init__(self):
        self.area_id = None
        self.tags = None
        self.msgroup = None
    def update(self, collection):
        self.area_id = collection['_id']
        self.tags = collection['tags']
        self.msgroup = list(map(int, collection['msgroup'].split(',')))
    
        
#         self.adjacency_matrix = None

#     def to_dict(self):
#         """
#         Convert the DefenseArea instance into a dictionary suitable for MongoDB.
#         """
#         return {
#             "_id": self.area_id,  # MongoDB uses "_id" as the primary key field.
#             "tags": self.tags
#         }

class DefenseDataManager:
    def __init__(self, db_uri, db_name):
        """
        Initializes a new instance of the data manager.
        
        :param db_uri: MongoDB URI for connecting to the database.
        :param db_name: Name of the database to use.
        """
        self.client = MongoClient(db_uri)
        self.db = self.client[db_name]
        self.defense_areas = self.db.defense_areas
        self.edges = self.db.edges
        self.missions = self.db.missions
        self.rules = self.db.rules
        self.adj_matrix = self.db.adjacency_matrix
        self.mission_manager = MissionManager()
        self.intent_machine = IntentInference()
        self.init_mission_manager()
    
    def update_missile_info(self,missile_measurements):
        if self.intent_machine.is_ready is False:
            return                        
        result = self.intent_machine.update_measurement(missile_measurements)        
        return result
    
    def init_intent(self, missile_count = 0):
        if missile_count < 1:
            return print("zero numnber of missile")
        print("missile_count =  " + str(missile_count))        
        self.intent_machine.reset(missile_count, self.defense_areas)                
        return 
        
    def store_rule_info(self,_id, source_tag,target_tag ):
        rule_info = {'_id': _id, 'source_tag' : source_tag, 'target_tag': target_tag}
        self.rules.insert_one(rule_info)
        
    def init_mission_manager(self):
        for index, rule in enumerate(self.rules.find()):
            rl = Rule(rule['_id'],rule['source_tag'], rule['target_tag'])
            self.mission_manager.append_rule(rl)

        msgroup_idx = []
        for index, mission in enumerate(self.missions.find()):
            ms = Mission(mission['_id'],mission['status'])            
            msgroup = list(map(int, mission['msgroup'].split(',')))
            ms.msgroup = msgroup
            msgroup_idx.append(msgroup)
            self.mission_manager.append_mission(ms)
        
        flattened_msgroup = [item for sublist in msgroup_idx for item in sublist]
        unique_elements = set(flattened_msgroup)
        unique_mission_group_idx = sorted(list(unique_elements))
        for idx, msgroup_idx in enumerate(unique_mission_group_idx):           
            msgrp = MissionGroup(msgroup_idx)
            self.mission_manager.append_msgroup(msgrp)

        for index, area in enumerate(self.defense_areas.find()):
            ar = DefenseArea()
            ar.update(area)
            self.mission_manager.append_area(ar)
        
        self.mission_manager.update_info()
        self.update_edges_given_mission()
        # edges = self.mission_manager.compute_edges()
        # self.update_edges_from_edgeClass(edges)

    def update_edges_given_mission(self):
       
        edges = self.mission_manager.compute_edges()
        self.update_edges_from_edgeClass(edges)

    
    def update_edges_from_edgeClass(self,edges):      
        self.edges.delete_many({}) 
        for _, edge in enumerate(edges):
            self.add_edge(edge.source_id , edge.target_id,  edge.weight)
        

        pipeline = [
            {"$group": {
                "_id": {"source_id": "$source_id", "target_id": "$target_id"},
                "ids": {"$push": "$_id"},
                "count": {"$sum": 1}
            }},
            {"$match": {"count": {"$gt": 1}}}
        ]
        duplicates = list(self.edges.aggregate(pipeline))

        # Remove duplicates
        for duplicate in duplicates:
            # Keep one document and remove the rest
            keep_id = duplicate["ids"][0]
            delete_ids = duplicate["ids"][1:]
            self.edges.delete_many({"_id": {"$in": delete_ids}})
            print(f"Removed duplicates for source_id: {duplicate['_id']['source_id']} and target_id: {duplicate['_id']['target_id']}")

        print("Duplicates have been removed.")

        # query = {"$where": "this.source_id === this.source_id && this.target_id === this.target_id"}
        # result = self.edges.delete_many(query)

        mtx = self.construct_adjacency_matrix()            
        self.store_adjacency_matrix(mtx)
        print("edges are updated, Done")


        # Check if there are any matching documents
        




    def update_mission_info(self,mission_id, msgroup,status):
        self.client.manager.edges.delete_many({})
        mission = self.missions.find_one({"_id": mission_id})
        if mission:            
            self.missions.update_one({"_id": mission_id}, {"$set": {"status": status}})
            self.mission_manager.update_mission_state(mission_id, status)
            self.update_edges_given_mission()
            return True
        else:
            return False


    def store_mission_info(self,mission_id, msgroup):
        status = 0
        mission_info = {'_id': mission_id, 'msgroup' : msgroup, 'status': status}
        self.missions.insert_one(mission_info)

    def store_adjacency_matrix(self, matrix):
        """
        Store the adjacency matrix in the database.
        """
        self.adj_matrix.delete_many({})  # Clear existing matrix
        for row_index, row in enumerate(matrix):
            matrix_row = {'row_index': row_index, 'values': row}
            self.adj_matrix.insert_one(matrix_row)
    
    def get_adjacency_matrix(self):
        """
        Retrieve the adjacency matrix from the database.
        """
        matrix = []
        for matrix_row in self.adj_matrix.find().sort('row_index', 1):
            matrix.append(matrix_row['values'])
        return matrix

    def add_defense_area(self, area_id, tags):
        """
        Adds a new defense area to the database.
        
        :param area_id: The unique identifier of the defense area.
        :param tags: A dictionary of tags associated with the defense area.
        """
        defense_area = {"_id": area_id, "tags": tags}
        return self.defense_areas.insert_one(defense_area).inserted_id
    def assign_msgroup(self, area_id, msgroup):
        defense_area = self.defense_areas.find_one({"_id": area_id})
        if defense_area:            
            self.defense_areas.update_one({"_id": area_id}, {"$set": {"msgroup": msgroup}})
            return True
        else:
            return False
    def add_edge(self, source_id, target_id, weight=1):
        """
        Adds a new edge between two defense areas.
        
        :param source_id: The ID of the source defense area.
        :param target_id: The ID of the target defense area.
        :param weight: The weight of the edge (optional).
        """
        edge = {"source_id": source_id, "target_id": target_id, "weight": weight}
        return self.edges.insert_one(edge).inserted_id

    def get_all_defense_areas(self):
        """
        Retrieves all defense areas from the database.
        """
        return list(self.defense_areas.find())

    def get_edges_for_area(self, area_id):
        """
        Retrieves all edges originating from a specific defense area.
        
        :param area_id: The ID of the defense area.
        """
        return list(self.edges.find({"source_id": area_id}))

    def remove_defense_area(self, area_id):
        """
        Removes a specific defense area and all related edges from the database.
        
        :param area_id: The ID of the defense area to remove.
        """
        # Delete the defense area
        self.defense_areas.delete_one({"_id": area_id})
        self.edges.delete_many({"$or": [{"source_id": area_id}, {"target_id": area_id}]})
    
    def compute_reachability_mtx(self, area_id):                
        adj_mtx = self.construct_adjacency_matrix()

        def find_index_by_id( area_id):
            for index, document in enumerate(self.defense_areas.find()):
                if document['_id'] == area_id:
                    return index
            return None


        target_idx = find_index_by_id(area_id) # int(area_id)-1
        reachable_mtx = warshall_and_single_row(adj_mtx, target_idx)
        reachable_mtx[target_idx][target_idx] = 1
        return reachable_mtx

    def construct_adjacency_matrix(self):
        """
        Constructs an adjacency matrix based on the edges in the database.

        :return: The adjacency matrix.
        """
        # Retrieve all defense areas and edges
        defense_areas = self.get_all_defense_areas()
        edges = list(self.edges.find())

        # Create an empty matrix with dimensions equal to the number of defense areas
        num_areas = len(defense_areas)
        adjacency_matrix = [[0] * num_areas for _ in range(num_areas)]

        # Create a mapping from defense area ID to index in the matrix
        area_id_to_index = {area['_id']: i for i, area in enumerate(defense_areas)}

        # Update the matrix based on the edges
        for edge in edges:
            source_index = area_id_to_index.get(edge['source_id'])
            target_index = area_id_to_index.get(edge['target_id'])
            if source_index is not None and target_index is not None:
                adjacency_matrix[source_index][target_index] = edge['weight']
        self.adjacency_matrix = adjacency_matrix
       
        return adjacency_matrix
    

    def add_tags_to_defense_area(self, area_id, tags):
        """
        Adds tags to a specific defense area.

        :param area_id: The ID of the defense area.
        :param tags: A dictionary of tags to be added.
        """
        # Find the defense area document by ID
        defense_area = self.defense_areas.find_one({"_id": area_id})
        if defense_area:
            # Update the tags with the new ones
            new_tags = {**defense_area["tags"], **tags}
            # Update the defense area document in the database
            self.defense_areas.update_one({"_id": area_id}, {"$set": {"tags": new_tags}})
            return True
        else:
            return False
        
    def close(self):
        """
        Closes the database connection.
        """
        self.client.close()

