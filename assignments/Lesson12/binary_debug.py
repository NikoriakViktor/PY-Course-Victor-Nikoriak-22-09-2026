def binary_search_broken(items, target):
    low = 0
    high = len(items)
    while low < high:
        mid = (low + high) // 2
        if items[mid] == target:
            return mid
        if items[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

numbers = list(range(0, 200, 2))

print(binary_search_broken(numbers, 198))

#Функція уходить в нескіченний цикл
#тому що low або high під кінець упреться в значення, яке на одиницю менше ніж парний high або low
#А це відбувається через ділення суми low і high навпіл, результат якого не завжди є цілим числом
print(binary_search_broken(numbers, 7))

def pair_sum_sorted(items, target):
    left = 0
    right = len(items) - 1
    sum = items[left] + items[right]

    while left != right:
        if sum == target:
            return (left, right)
        
        if sum > target:
            right -= 1
        else:
            left += 1

        sum = items[left] + items[right]

    return None

t = [2, 7, 11, 15, 19, 26]
target = 33

print(pair_sum_sorted(t, target))