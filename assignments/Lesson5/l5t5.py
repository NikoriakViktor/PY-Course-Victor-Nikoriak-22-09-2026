board = [" " for i in range(9)]
winning_lines = [(0, 1, 2), (3, 4, 5), (6, 7, 8), (0, 3, 6), (1, 4, 7), (2, 5, 8),
                 (0, 4, 8), (2, 4, 6)]
current_player = 1
turn_count = 0

while True:
    print(f"| {board[0]} {board[1]} {board[2]} |")
    print(f"| {board[3]} {board[4]} {board[5]} |")
    print(f"| {board[6]} {board[7]} {board[8]} |")
    won = False

    player_input = int(input(f"Player {current_player}'s move: "))

    if player_input < 1 or player_input > 9:
        print("The number should be in range from 1 to 9! Try again")
        continue
    elif board[player_input - 1] != " ":
        print("The cell have been already picked! Try again")
        continue
    elif current_player == 1 and board[player_input - 1] == "X":
        print("You cannot picked other's player cell! Try again")
        continue
    elif current_player == 2 and board[player_input - 1] == "O":
        print("You cannot picked other's player cell! Try again")
        continue

    if current_player == 1:
        board[player_input - 1] = "O"
    else:
        board[player_input - 1] = "X"
    turn_count += 1

    i = 0
    player_one_cells = []
    player_two_cells = []

    while i < len(board):
        if board[i] == "O":
            player_one_cells.append(i)
        elif board[i] == "X":
            player_two_cells.append(i)

        i += 1

    for line in winning_lines:
        if set(line).issubset(set(player_one_cells)) or set(line).issubset(set(player_two_cells)):
            won = True

    if won:
        print("Player one won! Would you like to try again ? y/n") if current_player == 1 else print("Player two won! Would you like to try again ? y/n")
        if input() == "y":
            turn_count = 0
            board = [" " for i in range(9)]
            current_player = 1
            continue
        else:
            break

    if turn_count == 9:
        print("Draw! Would you like to try again ? y/n")
        if input() == "y":
            turn_count = 0
            board = [" " for i in range(9)]
            current_player = 1
            continue
        else:
            break

    current_player = 2 if current_player == 1 else 1