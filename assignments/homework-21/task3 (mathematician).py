# AI log: за підказками виправив логіку високосного року (комбінація and/or).

class SquareNums:
    def square_nums(self, nums):
        return [num ** 2 for num in nums]


class RemovePositives:
    def remove_positives(self, nums):
        return [num for num in nums if num < 0]


class FilterLeaps:
    def filter_leaps(self, nums):
        return [num for num in nums if (not num % 4 and num % 100) or not num % 400]


class Mathematician(FilterLeaps, SquareNums, RemovePositives):
    pass


m = Mathematician()

print(m.square_nums([7, 11, 5, 4]))
print(m.remove_positives([26, -11, -8, 13, -90]))
print(m.filter_leaps([2001, 1884, 1995, 2003, 2020]))

assert m.square_nums([7, 11, 5, 4]) == [49, 121, 25, 16]
assert m.remove_positives([26, -11, -8, 13, -90]) == [-11, -8, -90]
assert m.filter_leaps([2001, 1884, 1995, 2003, 2020]) == [1884, 2020]

# print(Mathematician.__mro__) покаже (Mathematician, SquareNums, RemovePositives, FilterLeaps, object)
# після зміни порядку покаже (Mathematician, FilterLeaps, SquareNums, RemovePositives, object)
# так відбувається, бо mro(method resolution order) шукає спочатку в власному класі,
# і потім попорядку які в нього передаються і вже потім батьківський object
