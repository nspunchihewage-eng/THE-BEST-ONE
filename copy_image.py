import shutil
import os

source = r"C:\Users\HI\.gemini\antigravity\brain\8c4bd10e-134f-4c27-a312-a25dc4e087c4\croc_kingdom_branded_services_hero_photo_1772958529149.png"
dest = r"c:\Users\HI\Desktop\NILWALA\assets\ultimate_services_hero.png"

try:
    shutil.copy2(source, dest)
    print("Successfully copied")
except Exception as e:
    print(f"Error: {e}")
