# AI log: Розглянули поділ циклів while для плюсового та мінусового кроку.
# Прогноз для list(in_range(10, 0, -3)): список [10, 7, 4, 1]
# Прогноз для list(in_range(5, 1)): пустий список []

def in_range(start, end, step=1):
    if step > 0:
        while start < end:
            yield start
            start += step
    elif step < 0:
        while start > end:
            yield start
            start += step