def with_discounts(price, percent):
    return round(price * (1 - percent), 2)

def total(prices):
    return round(sum(prices), 2)

# 'python prices.py' вивів:
# Sample discounted price (200 with 10% off): 180.0
# Sample total sum: 200.0
#
# 'python report.py' вивів:
# Discounted list: [1020.0, 764.15, 382.5]
# Total: 2166.65
#
# Результат відрізняється тому що файли ідуть різними шляхами
# `prices.py` працює тільки в межах блоку `if __name__ == "__main__":`
# `report.py` імпортує функції і використовує їх для власного сценарію

if __name__ == "__main__":
    sample_price = 200
    sample_list = [100.0, 50.5, 49.5]
    
    print("Sample discounted price (200 with 10% off):", with_discounts(sample_price, 10))
    print("Sample total sum:", total(sample_list))