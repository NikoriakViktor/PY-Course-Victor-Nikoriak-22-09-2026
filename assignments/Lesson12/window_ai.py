def max_window_sum(items, k):
    max_sum = sum(items[0:k])
    temp = max_sum

    window_index = 0

    while window_index + k < len(items):
        candidate = temp - items[window_index] + items[window_index + k]
        
        if candidate > max_sum:
            max_sum = candidate

        window_index += 1
        temp = candidate

    return max_sum

l = [12, 4, 9, 20, 3, 15, 7]
k = 3

print(max_window_sum(l, k))