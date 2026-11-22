def max_window_sum(items, k):
    if k <= 0 or k > len(items):
        raise ValueError("k must be between 1 and len(items)")

    window_sum = sum(items[:k])
    best = window_sum

    for right in range(k, len(items)):
        window_sum += items[right]       # element entering the window
        window_sum -= items[right - k]   # element leaving the window
        best = max(best, window_sum)

    return best


items = [12, 4, 9, 20, 3, 15, 7]
print(max_window_sum(items, 20))  # 38