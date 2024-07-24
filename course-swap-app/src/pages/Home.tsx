import React from "react";
import { Link } from "react-router-dom";
import { auth } from "../config/Firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const HomePage = () => {
  const [user] = useAuthState(auth);
  return (
    <div className="container mx-auto px-4 py-6 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-12">
        Welcome to Course Swap
      </h1>
      <p>Exchange courses easily with your peers!</p>
      <section className="how-it-works">
        <h2>How It Works</h2>
        <p>
          Simply list the courses you have and the courses you want. Our
          matching algorithm will do the rest!
        </p>
      </section>
      <section className="featured-courses">
        <h2>Featured Courses</h2>
        <p>Calculus II</p>
        <p>Introduction to Psychology</p>
        <p>Modern World History</p>
      </section>
      <section className="quick-start-guide">
        <h2>Quick Start Guide</h2>

        <p>Sign in using Google.</p>
        <p>Add courses to your 'Have' and 'Want' lists.</p>
        <p>Check your profile for matches and contact your peers.</p>
      </section>
      {user ? (
        <footer className="home-footer">
          <Link
            to="/courses"
            className="bg-blue-800 hover:bg-blue-900 active:bg-blue-900 text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
          >
            Get Started
          </Link>
        </footer>
      ) : (
        <footer className="home-footer">
          <Link
            to="/login"
            className="bg-blue-800 hover:bg-blue-900 active:bg-blue-900 text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
          >
            Get Started
          </Link>
        </footer>
      )}
    </div>
  );
};

export default HomePage;
