# from pymongo import MongoClient

# class DefenseDataManager:
#     def __init__(self, db_uri, db_name):
#         """
#         Initializes a new instance of the data manager.
        
#         :param db_uri: MongoDB URI for connecting to the database.
#         :param db_name: Name of the database to use.
#         """
#         self.client = MongoClient(db_uri)
#         self.db = self.client[db_name]
#         self.defense_areas = self.db.defense_areas
#         self.edges = self.db.edges

#     def add_defense_area(self, area_id, tags):
#         """
#         Adds a new defense area to the database.
        
#         :param area_id: The unique identifier of the defense area.
#         :param tags: A dictionary of tags associated with the defense area.
#         """
#         defense_area = {"_id": area_id, "tags": tags}
#         return self.defense_areas.insert_one(defense_area).inserted_id

#     def add_edge(self, source_id, target_id, weight=1):
#         """
#         Adds a new edge between two defense areas.
        
#         :param source_id: The ID of the source defense area.
#         :param target_id: The ID of the target defense area.
#         :param weight: The weight of the edge (optional).
#         """
#         edge = {"source_id": source_id, "target_id": target_id, "weight": weight}
#         return self.edges.insert_one(edge).inserted_id

#     def get_all_defense_areas(self):
#         """
#         Retrieves all defense areas from the database.
#         """
#         return list(self.defense_areas.find())

#     def get_edges_for_area(self, area_id):
#         """
#         Retrieves all edges originating from a specific defense area.
        
#         :param area_id: The ID of the defense area.
#         """
#         return list(self.edges.find({"source_id": area_id}))

#     def remove_defense_area(self, area_id):
#         """
#         Removes a specific defense area and all related edges from the database.
        
#         :param area_id: The ID of the defense area to remove.
#         """
#         # Delete the defense area
#         self.defense_areas.delete_one({"_id": area_id})
#         self.edges.delete_many({"$or": [{"source_id": area_id}, {"target_id": area_id}]})
   


#     def close(self):
#         """
#         Closes the database connection.
#         """
#         self.client.close()