class Edge:
    def __init__(self, source_id, target_id, weight=1):
        """
        Initialize a new Edge instance.
        :param source_id: The area_id of the source defense area.
        :param target_id: The area_id of the target defense area.
        :param weight: The weight of the edge (optional, defaults to 1).
        """
        self.source_id = source_id
        self.target_id = target_id
        self.weight = weight

    def to_dict(self):
        """
        Convert the Edge instance into a dictionary suitable for MongoDB.
        :return: A dictionary representation of the instance.
        """
        return {
            "source_id": self.source_id,
            "target_id": self.target_id,
            "weight": self.weight
        }