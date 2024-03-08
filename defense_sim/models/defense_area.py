
from pymongo import MongoClient

class DefenseArea:
    def __init__(self, area_id, tags):
        self.area_id = area_id
        self.tags = tags
        self.adjacency_matrix = None

    def to_dict(self):
        """
        Convert the DefenseArea instance into a dictionary suitable for MongoDB.
        """
        return {
            "_id": self.area_id,  # MongoDB uses "_id" as the primary key field.
            "tags": self.tags
        }

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
        self.adj_matrix = self.db.adjacency_matrix

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

