class Mission:
    def __init__(self, id):
        self.mission_id = id
        self.name = None
        self.mission_groups = []

    def add_mission_group(self, mission_group):
        self.mission_groups.append(mission_group)
        
class MissionGroup:
    def __init__(self, group_id, name):
        self.group_id = group_id
        self.name = name
        self.defendareas = []

    def add_area(self, area):
        self.defendareas.append(area)

class Rule:
    def __init__(self, condition, action):
        self.condition = condition
        self.action = action


# create mission classes 
# for each mission classes assign mission groups


# Create mission classes 
# Create missiongroup classes 

# for each defenseArea
#     for each mission group info         
#         add defensearea to missiongroup certain class

# % completion of mission group 

# for each mission group
#     add mission group to mission class

# % completion of mission 
        
# for each mission class
#     if mission class is avtivated 
#         for each mission group
#             for each pair of defense_area, 
#                 check if any rule applied to them. 
#                 if so, set the dependency between them. 
# % generate edges

    