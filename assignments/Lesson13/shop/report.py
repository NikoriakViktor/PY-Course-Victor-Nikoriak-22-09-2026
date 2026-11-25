import sys
sys.path.append("c:/Users/R&D/Desktop/Beetroot Python/Lesson13")
import prices

prices_list = [1200, 899, 450]
discount = 0.15

discounted_prices = []

for i in prices_list:
    discounted_prices.append(prices.with_discounts(i, discount))

print(f"Original prices: {prices_list[0]}, {prices_list[1]}, {prices_list[2]}")
print(f"Discount: {discount * 100}%, Discounted prices: {discounted_prices[0]}, {discounted_prices[1]}, {discounted_prices[2]}")
print(f"Total price: {prices.total(discounted_prices)}")
print(f"Discounted prices: {discounted_prices[0], discounted_prices[1], discounted_prices[2]}")