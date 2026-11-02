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

cart = dict({})

while True:
    print("\n")
    out_of_stock = {i:j for i,j in stock.items() if stock[i] == 0}
    print("Available products:")
    for i in stock.keys():
        if i not in out_of_stock:
            print(f"{i}: {stock[i]}")

    option = input("Please enter product and quantity. Print done to finish.\n")

    if option == "done":
        print("\nReceipt:")
        total = 0
        for i,j in cart.items():
            print(f"\nProduct:{i}\nQuantity:{j}\nPrice:{prices[i]*j}\n")
            total += prices[i]*j

        print(f"Total price:{total}")
        break

    if len(option.split()) != 2 or not option.split()[1].isdigit():
        print("Something went wrong. Please try again")
        continue

    user_product = option.split(" ")[0]
    user_quantity = int(option.split(" ")[1])

    if not user_product in stock:
        print("The product is unavaliable. Please choose the option below:")
        for i in stock.keys():
            print(f"{i}")
        continue
    elif user_quantity > stock[user_product]:
        print(f"There is no such quantity of {user_product}s available right now. Please enter quantity that doesn't exceed {stock[user_product]}")
        continue

    stock[user_product] -= user_quantity

    cart.update({user_product:user_quantity})



    