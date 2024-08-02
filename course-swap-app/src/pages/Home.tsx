import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../config/Firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useSocket } from "../config/SocketContext";

interface Course {
  _id: string;
  count: number;
  courseDetails: courseDetails;
}

interface courseDetails {
  _id: string;
  course: string;
  number: string;
  instructor: string;
}

const HomePage = () => {
  const [user] = useAuthState(auth);
  const { socket } = useSocket();
  const [featuredCourses, setfeaturedCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (socket) {
      socket.on("setFeaturedCourses", (receivedCourses: Course[]) => {
        setfeaturedCourses(receivedCourses);
      });

      socket.emit("requestFeaturedCourses"); // Request the featured courses from the backend

      return () => {
        socket.off("setFeaturedCourses");
      };
    }
  }, [socket]);
  return (
    <div className="container mx-auto px-4 py-6 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-6">
        Welcome to Course Swap!
      </h1>
      <p className="text-lg text-gray-700 mb-6">
        The ultimate platform for exchanging courses with your peers.
      </p>

      <section className="how-it-works mb-8">
        <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
        <p className="text-base text-gray-600">
          Our platform simplifies the process of swapping courses. Just list the
          courses you have and those you want. Our advanced matching algorithm
          takes care of finding the best swaps for you.
        </p>
      </section>

      <section className="featured-courses mb-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Featured Courses</h2>
          {featuredCourses.length > 0 ? (
            <ul>
              {featuredCourses.map((course) => (
                <li key={course._id}>{course.courseDetails.course}</li>
              ))}
            </ul>
          ) : (
            <p>No featured courses available.</p>
          )}
        </div>
      </section>

      <section className="quick-start-guide mb-8">
        <h2 className="text-2xl font-semibold mb-4">Quick Start Guide</h2>
        <ol className="list-decimal list-inside text-gray-600">
          <li>Sign in using your Google account.</li>
          <li>Add courses to your 'Have' and 'Want' lists.</li>
          <li>
            Check your profile for matches and connect with peers to swap
            courses.
          </li>
        </ol>
      </section>

      {user ? (
        <footer className="home-footer">
          <Link
            to="/courses"
            className="bg-blue-800 hover:bg-blue-900 active:bg-blue-900 text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2 transition duration-150 ease-in-out"
          >
            Add Your Courses
          </Link>
        </footer>
      ) : (
        <footer className="home-footer">
          <Link
            to="/login"
            className="bg-blue-800 hover:bg-blue-900 active:bg-blue-900 text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2 transition duration-150 ease-in-out"
          >
            Sign In to Get Started
          </Link>
        </footer>
      )}
    </div>
  );
};

export default HomePage;
