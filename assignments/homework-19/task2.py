# AI log: запитав, як правильно задати умову для all(),
# змінив all(nums) > 0 на генератор all(num > 0 for num in nums),
# також зрозумів, що all([]) завжди повертає True.

def choose_func(nums: list, func1, func2):
    if all(num > 0 for num in nums):
        return func1(nums)
    else:
        return func2(nums)


# Assertions
nums1 = [1, 2, 3, 4, 5]
nums2 = [1, -2, 3, -4, 5]


def square_nums(nums):
    return [num ** 2 for num in nums]


def remove_negatives(nums):
    return [num for num in nums if num > 0]


assert choose_func(nums1, square_nums, remove_negatives) == [1, 4, 9, 16, 25]
assert choose_func(nums2, square_nums, remove_negatives) == [1, 3, 5]

# choose_func([], square_nums, remove_negatives)  # видасть [], бо all() для порожнього списку видає True
# choose_func([0, 2, 3], square_nums, remove_negatives) # видасть [2, 3], бо тут 0 поверне False для ф-ції all(), тому виконається remove_negatives
