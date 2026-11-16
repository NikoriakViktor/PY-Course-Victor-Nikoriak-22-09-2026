class InvalidTransaction(Exception):
    pass

balance = 100000

def transaction(current_balance: float, name: str, category: str, price: float):
    if current_balance - price < 0:
        raise InvalidTransaction("Balance cannot be less than zero")

    current_balance -= price
    
    print(f"Transaction:\nName: {name}\nCategory: {category}\nPrice: {price}$\n\nBalance: {current_balance}$")

    return current_balance


balance = transaction(balance, "VR Headset", "Hobbies", 100001)
