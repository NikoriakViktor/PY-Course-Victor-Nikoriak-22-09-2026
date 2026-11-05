stock = {
    "banana": 6,
    "apple": 0,
    "orange": 32,
    "pear": 15
}

prices = {
    "banana": 4,
    "apple": 2,
    "orange": 1.5,
    "pear": 3
}

i = 0
fruits = list(stock.keys())
total = 0

while i < len(stock):
    price = stock.get(fruits[i]) * prices.get(fruits[i])
    total += price
    print(f"The total cost of {fruits[i]}s: {price}")

    i += 1

#Загальна вартість апельсинів 32 * 1.5, що разом буде 48
print("The total price of the stock: ", total)