import time

def question1(first_list, second_list):
    res = []
    for el_first_list in first_list:
        if el_first_list in second_list:
            res.append(el_first_list)
    return res

def common_elements_fast(first_list, second_list):
    second_set = set(second_list)
    res = []
    for el in first_list:
        if el in second_set:
            res.append(el)
    return res

# Прогноз: якщо для question1: O(n²) збільшити розмір списку в 2 рази то час збільшиться в 4 рази
# Але якщо для common_elements_fast: O(n) збільшити розмір списку в 2 рази то час збільшиться пропорційно в 2 рази

# question1

for size in [1000, 2000, 4000]:
    first = list(range(size))
    second = list(range(size // 2, size + size // 2))

    times = []
    for _ in range(5):
        start = time.perf_counter()
        question1(first, second)
        times.append(time.perf_counter() - start)
    print(f"question1, {size}: {min(times):.5f} сек")

# common_elements_fast

for size in [100000, 200000, 400000]:
    first = list(range(size))
    second = list(range(size // 2, size + size // 2))

    times = []
    for _ in range(5):
        start = time.perf_counter()
        common_elements_fast(first, second)
        times.append(time.perf_counter() - start)
    print(f"common_elements_fast, {size}: {min(times):.5f} сек")

# question1, 1000: 0.00421 сек
# question1, 2000: 0.01649 сек
# question1, 4000: 0.06852 сек
# common_elements_fast, 100000: 0.00542 сек
# common_elements_fast, 200000: 0.01136 сек
# common_elements_fast, 400000: 0.02560 сек

# Як бачимо, час question1 дійсно зріс приблизно в 4 рази, а час common_elements_fast — у 2 рази, що підтверджує прогноз

# Якщо на 4000 елементів ідуть мілісекунди, то на 400 000 коду знадобляться години, бо це буде 160 мільярдів операцій замість 16 мільйонів у 4000

# AI log: Допоміг мені скоротити написання коду (замість 6 блоків коду, написав 2 з використанням циклу)