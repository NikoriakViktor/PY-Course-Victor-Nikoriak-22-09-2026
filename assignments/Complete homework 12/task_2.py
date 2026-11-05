# AI log: використано для перекладу завдання та пояснення що саме потрібно зробити в завданні,
# також для допомоги з розумінням помилок в моєму коді
# допоміг написати спільну функцію ддя вимірювання часу, щоб не дублючати їх для різних значень
#
import time


def common_elements_fast(first_list, second_list):
    second_set = set(second_list)
    res = []
    for el_first_list in first_list:
        if el_first_list in second_set:
            res.append(el_first_list)
    return res

def question1(first_list, second_list):
    res = []
    for el_first_list in first_list:
        if el_first_list in second_list:
            res.append(el_first_list)
    return res


def measure(func, size):
    first = list(range(size))
    second = list(range(size // 2, size + size // 2))
    times = []
    for _ in range(5):
        start = time.perf_counter()
        func(first, second)
        times.append(time.perf_counter() - start)
    print(f"{func.__name__}, {size}:", min(times))


measure(question1, 1000)
measure(question1, 2000)
measure(question1, 4000)

measure(common_elements_fast, 100_000)
measure(common_elements_fast, 200_000)
measure(common_elements_fast, 400_000)