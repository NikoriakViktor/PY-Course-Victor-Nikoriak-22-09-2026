import sys
import json
import os

def load_phonebook(filename):
    try:
        with open(filename, 'r', encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        raise FileNotFoundError(f"File {filename} not found")


def save_phonebook(filename, contacts):
    with open(filename, 'w', encoding="utf-8") as f:
        json.dump(contacts, f, ensure_ascii=False, indent=4)


def add_contact(contacts):
    f_name = input("Enter first name: ")
    l_name = input("Enter last name: ")
    phone = input("Enter phone number: ")
    city = input("Enter city: ")
    state = input("Enter state: ")
    new_contact = {
        "first_name": f_name,
        "last_name": l_name,
        "phone": phone,
        "city": city,
        "state": state
    }
    contacts.append(new_contact)


def search_by_first_name(contacts):
    query = input("Enter query: ")
    results = []
    for contact in contacts:
        if contact["first_name"].lower() == query.lower():
            results.append(contact)
    print(results)


def search_by_last_name(contacts):
    query = input("Enter query: ")
    results = []
    for contact in contacts:
        if contact["last_name"].lower() == query.lower():
            results.append(contact)
    print(results)


def search_by_phone(contacts):
    query = input("Enter query: ")
    results = []
    for contact in contacts:
        if contact["phone"].lower() == query.lower():
            results.append(contact)
    print(results)


def search_by_city_or_state(contacts):
    query = input("Enter query: ")
    results = []
    for contact in contacts:
        if contact["city"].lower() == query.lower() or (contact["state"].lower() == query.lower()):
            results.append(contact)
    print(results)


def update_by_phone(contacts):
    query = input("Enter phone number: ")
    for contact in contacts:
        if contact["phone"].lower() == query.lower():
            contact['first_name'] = input("Enter new first name: ")
            contact['last_name'] = input("Enter new last name: ")
            contact['phone'] = input("Enter new phone number: ")
            contact['city'] = input("Enter new city: ")
            contact['state'] = input("Enter new state: ")
            print("Contact updated")
            break

# Прогноз: Якщо я видалю контакт через меню, але потім просто закрию вікно терміналу за допомогою хрестика (не натискаючи «9 — Exit»), то файл phnebook.json на диску залишиться зі старими даними, тому що метод .remove() змінює список на місці (в оперативці) але зміни попадуть в нього на постійній основі тільки після виклику json.dump(). # Результат: як я і очікував, після коректного виходу через пункт меню 9, json.dump() перезаписав файл, і видалений контакт звідти зник (залишився пустий список [])
def delete_by_phone(contacts):
    query = input("Enter phone number: ")
    for contact in contacts:
        if contact["phone"].lower() == query.lower():
            contacts.remove(contact)
            print("Contact removed")
            break


if __name__ == '__main__':
    filename = sys.argv[1]
    contacts = load_phonebook(filename)
    while True:
        print("1 - Search by first name\n2 - Add contact\n3 - Save contact\n4 - Search by city or state\n5 - Search by phone number\n6 - Search by last name\n7 - Update by phone\n8 - Delete by phone\n9 - Exit")
        choice = input("Enter your choice: ")
        if choice == '1':
            search_by_first_name(contacts)
        elif choice == '2':
            add_contact(contacts)
        elif choice == '3':
            save_phonebook(filename, contacts)
        elif choice == '4':
            search_by_city_or_state(contacts)
        elif choice == '5':
            search_by_phone(contacts)
        elif choice == '6':
            search_by_last_name(contacts)
        elif choice == '7':
            update_by_phone(contacts)
        elif choice == '8':
            delete_by_phone(contacts)
        elif choice == '9':
            save_phonebook(filename, contacts)
            break

# AI log: AI виступав в ролі ментора при написанні коду, методом багатьох спроб та помилок, код я написав сам