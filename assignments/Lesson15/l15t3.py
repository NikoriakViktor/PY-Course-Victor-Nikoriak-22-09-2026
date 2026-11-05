import json
import os
import sys

def loadJS(file_path: str):
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)

def saveJS(file_path: str, data: dict):
    with open(file_path, "w", encoding="utf-8") as file:
        return json.dump(data, file, indent=4)

def addEntry(data: list):
    firstName = input("Enter first name: ")
    secondName = input("Enter second name: ")
    telephoneNumber = input("Enter telephone number: ")
    country = input("Enter country: ")
    city = input("Enter city: ")

    entry = {
        "firstName": firstName,
        "secondName": secondName,
        "telephoneNumber": telephoneNumber,
        "address": {
            "country": country,
            "city": city
        }
    }

    if type(data) != list:
        data = [data]
    data.append(entry)

    print("The record has been added")

    return data


def delEntry(data: list):
    telephoneNumber = input("Enter telephone number: ")
    data_updated = []
    if type(data) != list:
        data = [data]

    for i in data:
        if i["telephoneNumber"] != telephoneNumber:
            data_updated.append(i)

    print("The record has been deleted succesfuly")

    return data_updated

def findByFN(data: dict):
    try:
        firstName, secondName = input("Enter fullname: ").split(" ")
    except ValueError:
        print("Invalid input. Enter full name separated by space")
        return data

    if type(data) != list:
        data = [data]

    for i in data:
        if i["firstName"] == firstName and i["secondName"] == secondName:
            print(i)
            return data
            
    print("The person is missing")
    return data

def findByFirstName(data: list):
    firstName = input("Enter first name: ")

    if type(data) != list:
        data = [data]
    
    for i in data:
        if i["firstName"] == firstName:
            print(i)
            return data

    print("The record is missing")

    return data

def findBySecondName(data: list):
    secondName = input("Enter second name: ")

    if type(data) != list:
        data = [data]
    
    for i in data:
        if i["secondName"] == secondName:
            print(i)
            return data

    print("The record is missing")

    return data

def findByTelephoneNumber(data: list):
    telephoneNumber = input("Enter telephone number: ")

    if type(data) != list:
        data = [data]
    
    for i in data:
        if i["telephoneNumber"] == telephoneNumber:
            print(i)
            return data

    print("The record is missing")

    return data

def findByCity(data: list):
    city = input("Enter city: ")

    if type(data) != list:
        data = [data]
    
    for i in data:
        if i["address"]["city"] == city:
            print(i)
            return data

    print("The record is missing")

    return data

def updateByTelephoneNumber(data: list):
    telephoneNumber = input("Enter telephone number of record to update: ")

    for d in data:
        if d.get("telephoneNumber") == telephoneNumber:
            field = input("Enter field to update (first name, second name, telephone number, country, city): ")
            update = input("Enter new value: ")

            if field == "country":
                d["address"][field] = update
            elif field == "city":
                d["address"][field] = update
            elif field in d:
                d[field] = update
            else:
                print("Invalid field name")
                return data

    print("Update has been completed")
    
    return data

if len(sys.argv) < 2:
    raise ValueError("Error: Please provide the phonebook filename as a command-line argument (e.g., python mymod.py phonebook.json)")
    
file_path = sys.argv[1]

if not os.path.exists(file_path):
    raise FileNotFoundError(f"Error: The phonebook file '{file_path}' does not exist.")

data = loadJS(file_path)

options = {"1. Add entry": addEntry,
               "2. Delete by telephone number": delEntry,
               "3. Find by full name": findByFN,
               "4. Find by first name": findByFirstName,
               "5. Find by second name": findBySecondName,
               "6. Find by telephone number": findByTelephoneNumber,
               "7. Find by city": findByCity,
               "8. Update by telephone number": updateByTelephoneNumber,
               "9. Exit": None}

while True:
    print("\nSelect an option:")
    choices = {}
    k = 1
    for i in options.keys():
        choices[f"{k}"] = i
        print(i)
        k += 1
    option = input()

    try:
        if not options[choices[option]]:
            break
        else:
            data = options[choices[option]](data)
            saveJS(file_path, data)
    except KeyError:
        print("Invalid option")