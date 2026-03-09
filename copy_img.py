import shutil
import os

src = r"C:\Users\HI\.gemini\antigravity\brain\8c4bd10e-134f-4c27-a312-a25dc4e087c4\premium_nilwala_services_hero_1772957327171.png"
dst = r"c:\Users\HI\Desktop\NILWALA\assets\premium_services_hero.png"

try:
    shutil.copy(src, dst)
    print("Copied successfully.")
except Exception as e:
    print(e)
