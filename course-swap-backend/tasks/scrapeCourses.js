const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const Course = require("../models/Course");

const scrapeCourses = async (urls) => {
  try {
    // Setup Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Iterate over each URL to scrape courses
    const urls = [
      "https://catalog.apps.asu.edu/catalog/classes/classlist?campusOrOnlineSelection=A&honors=F&level=grad&promod=F&searchType=all&subject=CSE&term=2247",
      "https://catalog.apps.asu.edu/catalog/classes/classlist?campusOrOnlineSelection=A&honors=F&level=400-499&promod=F&searchType=all&subject=CSE&term=2247",
    ];
    for (const url of urls) {
      console.log(`Scraping data from ${url}`);
      await page.goto(url, { waitUntil: "networkidle2" });
      await page.waitForSelector('div[class*="class-accordion"]', {
        timeout: 10000,
      });

      // Scrape the data using Puppeteer
      const courses = await page.evaluate(() => {
        const courses = [];
        const accordions = document.querySelectorAll(
          'div[class*="class-accordion"]'
        );
        accordions.forEach((accordion) => {
          const courseCells = accordion.querySelectorAll(
            "div.class-results-cell.course.pointer.pe-1.d-lg-none"
          );
          const courseNumbers = accordion.querySelectorAll(
            "div.class-results-cell.number"
          );
          const courseInstructors = accordion.querySelectorAll(
            "div.class-results-cell.instructor"
          );

          courseCells.forEach((cell, index) => {
            const cour = cell.querySelector("span.bold-hyperlink");
            const numb = courseNumbers[index].querySelector("div");
            const inst = courseInstructors[index].querySelector("a");

            if (cour && numb) {
              courses.push({
                course: cour.textContent.trim(),
                number: numb.textContent.trim(),
                instructor: inst ? inst.textContent.trim() : "Not Listed",
              });
            }
          });
        });
        return courses;
      });

      // Process each course to update or insert into the database
      for (const { course, number, instructor } of courses) {
        await Course.updateOne(
          { number: number }, // Condition to find the document by course number
          { $set: { course, instructor } }, // Update these fields
          { upsert: true } // Option to insert if not found
        );
      }
    }

    // Close the browser
    await browser.close();
    console.log(`Data has been written to the database`);
  } catch (error) {
    console.error("Error occurred:", error);
  }
};

module.exports = scrapeCourses;

// scrapeCourses(urls);
