from functools import reduce

prices = ["120", "80", "45", "300"]

# Bug: numbers потрібно огорнути в list(), тому що функція map повертає map object
numbers = list(map(int, prices))
cheap = filter(lambda p: p < 100, list(numbers))
print("Cheap:", list(cheap))

total = reduce(lambda acc, p: acc + p, list(numbers))
print("Total:", total)

# Bug: key=len() дужки зайві. В даному випадку функція len викликається, а не передедається
names = sorted(["Olena", "Ira", "Bohdan"], key=len)
print(names)