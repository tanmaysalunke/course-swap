from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import time
import json
import os

# Setup Selenium WebDriver
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service)

# URL from the ASU course catalog
url = 'https://catalog.apps.asu.edu/catalog/classes/classlist?campusOrOnlineSelection=A&honors=F&level=400-499&promod=F&searchType=all&subject=CSE&term=2247'
driver.get(url)

# Wait for JavaScript to load content
time.sleep(5)

# Use BeautifulSoup to parse the page source
soup = BeautifulSoup(driver.page_source, 'html.parser')

# Find all accordion divs containing courses, both odd and even
accordions = soup.find_all('div', class_=['focus class-accordion odd', 'focus class-accordion even'])

courses = []  # List to store course data

for accordion in accordions:
    # Within each accordion, find the div with the course information
    course_cells = accordion.find_all('div', class_='class-results-cell course pointer pe-1 d-lg-none')
    course_numbers = accordion.find_all('div', class_='class-results-cell number')
    course_instructor = accordion.find_all('div', class_='class-results-cell instructor')

    for cell, number, instructor in zip(course_cells, course_numbers, course_instructor):
        # Within each course cell, find the span containing the course title
        cour = cell.find('span', class_='bold-hyperlink')
        numb = number.find('div')
        inst = instructor.find('a')
        if cour and numb:
            # Create a dictionary for each course and append to the list
            if inst:
                course_info = {
                    "Course": cour.text.strip(),
                    "Number": numb.text.strip(),
                    "Instructor": inst.text.strip()
                }
            else:
                course_info = {
                    "Course": cour.text.strip(),
                    "Number": numb.text.strip(),
                    "Instructor": "Not Listed"
                }
            courses.append(course_info)
        else:
            print("No course title span found in the cell.")

# Close the driver after scraping
driver.quit()

# Define the path where you want to save the file
output_directory = 'src'
output_file = 'courses400.json'

# Ensure the output directory exists (should already exist in your case)
os.makedirs(output_directory, exist_ok=True)

# Complete file path
file_path = os.path.join(output_directory, output_file)

# Write the course data to a JSON file in the specified directory
with open(file_path, 'w') as f:
    json.dump(courses, f, indent=4)  # Write data with indentation for readability

print(f"Data has been written to '{file_path}'")
