def choose_func(nums: list, func1, func2):
    for n in nums:
        if n < 0:
            return func2(nums)
    return func1(nums)

# Assertions
nums1 = [1, 2, 3, 4, 5]
nums2 = [1, -2, 3, -4, 5]

def square_nums(nums):
    return [num ** 2 for num in nums]

def remove_negatives(nums):
    return [num for num in nums if num > 0]

print(choose_func(nums1, square_nums, remove_negatives))
print(choose_func(nums2, square_nums, remove_negatives))
# choose_func([], square_nums, remove_negatives) поверне [] (пустий список), тому що у функції choose_func іде обхід по списку nums
# і повертається func2. Так як у списку nums 0 елементів, то і обходу не буде, далі повертається []
# за замовчуванням
# choose_func([0, 2, 3], square_nums, remove_negatives) поверне [0, 4, 9] так як у переданому списку
# відсутні від'ємні значення