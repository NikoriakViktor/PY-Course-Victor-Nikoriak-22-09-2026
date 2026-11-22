# Task 2

# AI log: not used


def in_range(start, end, step=1):
    if step > 0:
        while start < end:
            yield start
            start += step
    else:
        while start > end:
            yield start
            start += step


print(list(in_range(10, 0, -3)))
print(list(in_range(5, 1)))
