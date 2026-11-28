# AI log: додав __repr__ та __str__ до Product і ProductStore; за допомогою ментора перевірив,
# щоб __repr__ показував реальний стан об'єктів і не вводив в оману щодо аргументів конструктора.

class Product:
    def __init__(self, type, name, price):
        self.type = type
        self.name = name
        self.price = price

    def __repr__(self):
        return f"{self.__class__.__name__}('{self.type}', '{self.name}', {self.price})"

    def __str__(self):
        return f"[{self.__class__.__name__}] type - {self.type}, name - {self.name}, price - {self.price}"


class ProductStore:
    def __init__(self):
        self.storage = {}
        self.revenue = 0

    def add(self, product, amount):
        product.price = product.price * 1.3
        self.storage[product.name] = {'product': product, 'amount': amount}

    def set_discount(self, identifier, percent, identifier_type="name"):
        for item in self.storage.values():
            prod = item['product']

            if ((identifier_type == "name" and prod.name == identifier) or
                    (identifier_type == "type" and prod.type == identifier)):
                prod.price = prod.price * (1 - percent / 100)

    def sell_product(self, product_name, amount):
        if product_name in self.storage and self.storage[product_name]['amount'] >= amount:
            p_info = self.storage[product_name]
            p_info['amount'] = p_info['amount'] - amount
            self.revenue = self.revenue + amount * p_info['product'].price

        else:
            raise ValueError("Product not found or not enough amount in stock")

    def get_income(self):
        return self.revenue

    def get_all_products(self):
        return self.storage

    def get_product_info(self, product):
        if product in self.storage:
            return product, self.storage[product]['amount']

        else:
            raise ValueError("Product not found")

    def __repr__(self):
        return f"<{self.__class__.__name__}: revenue = {self.revenue}, storage = {self.storage}>"

    def __str__(self):
        return f"[{self.__class__.__name__}] revenue - {self.revenue}, \nstorage - {self.storage}"


p = Product('Sport', 'Football T-Shirt', 100)
p2 = Product('Food', 'Ramen', 1.5)

s = ProductStore()
s.add(p, 10)
s.add(p2, 300)
s.sell_product('Ramen', 10)

print(p)
print(repr(p), '\n')

print(s, '\n')
print(repr(s))
