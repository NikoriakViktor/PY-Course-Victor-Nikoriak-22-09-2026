#make_country("Kiyv", "Ukraine") поверне {'name': 'Kyiv', 'capital': 'Ukraine'}
def make_country(country, capital):
    return {'name': country, 'capital': capital}

country_1 = make_country("Ukraine", "Kyiv")
print(country_1)

country_2 = make_country(capital="Kyiv", country="Ukraine")
print(country_2)