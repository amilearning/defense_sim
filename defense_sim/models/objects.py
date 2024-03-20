
class DefenseArea:
    def __init__(self):
        self.area_id = None
        self.tags = None
        self.msgroup = None
    def update(self, collection):
        self.area_id = collection['_id']
        self.tags = collection['tags']
        self.msgroup = list(map(int, collection['msgroup'].split(',')))