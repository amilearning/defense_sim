def warshall(adj_matrix):
    num_nodes = len(adj_matrix)

    # Initialize the reachability matrix with the same values as the adjacency matrix
    reachability_matrix = [[0] * num_nodes for _ in range(num_nodes)]
    for i in range(num_nodes):
        for j in range(num_nodes):
            reachability_matrix[i][j] = adj_matrix[i][j]

    # Apply the Warshall algorithm
    for k in range(num_nodes):
        for i in range(num_nodes):
            for j in range(num_nodes):
                reachability_matrix[i][j] = reachability_matrix[i][j] or (reachability_matrix[i][k] and reachability_matrix[k][j])

    return reachability_matrix

def warshall_and_single_row(matrix, row_index):
    """
    Returns a new matrix where every entry is zero except for the row corresponding to the given row index.

    Args:
    - matrix (list of lists): The input matrix
    - row_index (int): The index of the row to preserve

    Returns:
    - new_matrix (list of lists): The new matrix with the specified row preserved and other entries zeroed out
    """
    reach_matrix = warshall(matrix)
    num_rows = len(reach_matrix)
    num_cols = len(reach_matrix[0]) if num_rows > 0 else 0

    new_matrix = [[0] * num_cols for _ in range(num_rows)]
    new_matrix[row_index] = reach_matrix[row_index][:]
    return new_matrix 

# # Example usage:
# adj_matrix = [
#     [0, 1, 0, 1],
#     [0, 0, 1, 0],
#     [1, 0, 0, 0],
#     [0, 0, 0, 0]
# ]

# reachability_matrix = warshall(adj_matrix)
# print("Reachability Matrix:")
# for row in reachability_matrix:
#     print(row)