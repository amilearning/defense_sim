from ..models import DefenseArea, Edge, Rule

class GraphService:
    def __init__(self):
        self.areas = {}
        self.edges = []

    def add_area(self, area):
        self.areas[area.area_id] = area

    def add_edge(self, source_id, target_id, weight=1):
        if source_id in self.areas and target_id in self.areas:
            source = self.areas[source_id]
            target = self.areas[target_id]
            edge = Edge(source, target, weight)
            source.add_outgoing_edge(edge)
            self.edges.append(edge)

    def apply_rules(self, rules):
        for rule in rules:
            for source in self.areas.values():
                for target in self.areas.values():
                    if source != target and rule.applies_to(source, target):
                        self.add_edge(source.area_id, target.area_id)