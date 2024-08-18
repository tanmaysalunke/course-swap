# Course Swap Application

Course Swap is a cutting-edge platform designed specifically for ASU CS graduate students to facilitate the exchange of course registrations. By leveraging a robust matching algorithm, the application connects students who wish to swap their courses, streamlining the process and ensuring optimal matches based on user preferences.

## Table of Contents

- [What's New](#whats-new)
- [Features](#features)
- [How to Use](#how-to-use)
- [Technologies](#technologies)
- [Contributing](#contributing)
- [Contact](#contact)
- [License](#license)

## What's New

**Latest Release:** Version 1.0.0

- Introduction of real-time notifications for swap updates.
- Enhanced matching algorithm to support more complex user preferences.

## Features

- **Secure Login:** Integration with Google OAuth2 ensures a secure and straightforward authentication process.
- **Real-Time Communication:** Utilizes Socket.io for seamless, real-time interaction between clients and the server.
- **Dynamic Course Listings:** Displays an up-to-date list of 400 and 500 level CSE courses available for swapping.
- **Intelligent Matching Algorithm:** Automatically matches students based on the courses they "Have" and "Want".
- **User Profiles and Connections:** Allows users to send and manage connection requests via a user-friendly interface.
- **Notifications:** Sends notifications both in-app and via email when a match is found or a request is accepted.
- **Top Courses Display:** The homepage highlights the three most sought-after courses to inform user decisions.

## How to Use

**Access the Application:** Simply visit [Course Swap](http://54.67.32.217/) to get started.

- **Log In:** Securely sign in using your Google account.
- **Set Preferences:** Choose from the available courses what you "Have" and what you "Want".
- **Manage Connections:** Send connection requests to matched users and respond to incoming requests.
- **Transaction Completion:** Finalize swaps and receive contact details of your match upon successful connection.

## Technologies

- **Frontend:** React TypeScript for a robust and scalable user interface.
- **Backend:** Node with Express for efficient server-side logic.
- **Real-Time Updates:** Socket.io for web socket communication.
- **Database:** MongoDB for flexible data storage.
- **Deployment:** Docker for containerization and AWS EC2 for cloud hosting.
- **CI/CD:** GitHub Actions for continuous integration and delivery.
- **Data Scraping:** Puppeteer for automated scraping of course details.

## Contributing

We welcome contributions from the community. Please refer to our contributing guidelines for more information on how to participate.

## Contact

For more information or support, please email us at [contact@courseswap.example.com](mailto:tanmaysalunke4@gmail.com).

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.
