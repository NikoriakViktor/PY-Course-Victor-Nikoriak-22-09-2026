days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
week = {i:days[i] for i in range(0, len(days))}
reverse_week = {days[i]:i for i in range(0, len(days))}

print(days)
print(week)
print(reverse_week)

#days[0] виведе у консолі Monday, а week[1] виведе Tuesday, тому що це словник і значення 1 - це ключ
#reverse_week["Sunday"] виведе 6, знову ж таки, тому що Sunday - це ключ, який мість значення 6
print(days[0])
print(week[1])
print(reverse_week["Sunday"])