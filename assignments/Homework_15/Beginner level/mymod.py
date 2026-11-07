def count_lines(name):
    with open(name, 'r', encoding="utf-8") as f:
        return len(f.readlines())


def count_chars(name):
    with open(name, 'r', encoding="utf-8") as f:
        return len(f.read())


if __name__ == "__main__":
    print(count_lines(
        "C:/Users/Admin/Desktop/Домашка Python/15. Files IO, context managers, JSON/Beginner level/mymod.py"))
    print(count_chars(
        "C:/Users/Admin/Desktop/Домашка Python/15. Files IO, context managers, JSON/Beginner level/mymod.py"))

# Результат з Pycharm:
# 11
# 486

# Результат з PowerShell (Get-Content "C:/Users/Admin/Desktop/Домашка Python/15. Files IO, context managers, JSON/Beginner level/mymod.py" | Measure-Object -Line -Character):
# Lines Words Characters Property
# ----- ----- ---------- --------
#     9              489

# AI log: none
