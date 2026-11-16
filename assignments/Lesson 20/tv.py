class TVController:
    channel = 1
    def __init__(self, channels):
        self.channels = channels

    def first_channel(self):
        return self.channels[0]

    def last_channel(self):
        return self.channels[-1]

    def turn_channel(self, channel):
        if self.exists(channel):
            self.channel = channel

        return self.channels[self.channel - 1]


    def next_channel(self):
        if self.channel + 1 >= len(self.channels):
            self.channel = 1
        else:
            self.channel += 1

        return self.channels[self.channel - 1]

    def previous_channel(self):
            if self.channel - 1 < 1:
                self.channel = len(self.channels)
            else:
                self.channel -= 1

            return self.channels[self.channel - 1]

    def current_channel(self):
        return self.channels[self.channel - 1]

    def exists(self, channel):
        return channel in self.channels or (channel > 0 and channel <= len(self.channels))

CHANNELS = ["BBC", "Discovery", "TV1000"]

controller = TVController(CHANNELS)

print(controller.first_channel())      # "BBC"
print(controller.last_channel())       # "TV1000"
print(controller.turn_channel(1))      # "BBC"      — channels are numbered from 1, not 0
print(controller.next_channel())       # "Discovery"
print(controller.previous_channel())   # "BBC"
print(controller.current_channel())    # "BBC"
print(controller.exists(4))            # False
print(controller.exists("BBC"))        # True

# next_channel() поверне "Discovery", якщо це сама перша команда, тому що за замовчуванням канал дорівнює 1 при ініціалізації екземпляру класу
# turn_channel(0) перевіряє за допомогою exists() чи є вказаний канал. Якщо так, то змінює його. Якщо ні - нічого не робить і повертає поточний канал