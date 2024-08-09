import React, { useState, useEffect } from "react";
import { auth } from "../config/Firebase";
// import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { useAuth } from "../config/AuthContext";
import axios from "axios";

// Interface for skeleton on Course
interface Course {
  _id: string;
  course: string;
  number: string;
  instructor: string;
}
const CourseList = () => {
  const [selected, setSelected] = useState<string>("all-classes");

  const [courses, setCourses] = useState<Course[]>([]);

  const { authToken, loading } = useAuth();

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/courses`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(setCourses)
      .catch((error) => {
        console.error("Error fetching courses:", error);
        // Here you might want to update the UI to reflect the error
      });
  }, []); // Empty dependency array means this effect runs only once after the initial render

  // handle send to have
  const [haveCourses, setHaveCourses] = useState<Course[]>([]);

  const handleHave = (course: Course) => {
    if (!wantCourses.find((c) => c._id === course._id)) {
      // Ensure the course isn't in the "Want" list
      if (haveCourses.find((c) => c._id === course._id)) {
        setHaveCourses(haveCourses.filter((c) => c._id !== course._id));
      } else {
        setHaveCourses([...haveCourses, course]);
      }
    }
  };

  const handleRemoveHave = (course: Course) => {
    setHaveCourses(haveCourses.filter((c) => c._id !== course._id));
  };

  // handle send to want
  const [wantCourses, setWantCourses] = useState<Course[]>([]);

  const handleWant = (course: Course) => {
    if (!haveCourses.find((c) => c._id === course._id)) {
      // Ensure the course isn't in the "Have" list
      if (wantCourses.find((c) => c._id === course._id)) {
        setWantCourses(wantCourses.filter((c) => c._id !== course._id));
      } else {
        setWantCourses([...wantCourses, course]);
      }
    }
  };

  const handleRemoveWant = (course: Course) => {
    setWantCourses(wantCourses.filter((c) => c._id !== course._id));
  };

  const handleChange = (value: string) => {
    setSelected(value);
  };

  // Search Functionality
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredCourses = courses.filter(
    (course) =>
      course.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.number.includes(searchTerm)
  );

  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  useEffect(() => {
    const checkAuth = () => {
      if (!loading && !authToken) {
        console.log(
          "Redirecting to login because no auth token is found and loading is complete."
        );
        navigate("/login");
      }
    };

    const timer = setTimeout(() => {
      checkAuth();
    }, 2000);

    return () => clearTimeout(timer);
  }, [authToken, loading, navigate]);
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  const handleSubmit = async () => {
    const payload = {
      email: user?.email,
      uid: user?.uid,
      haveCourses,
      wantCourses,
    };
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/match`,
        payload
      );
      console.log("Match request sent successfully:", response.data);
      // Handle further actions like notifying the user about the pending matches
    } catch (error) {
      console.error("Failed to send match request:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">
        Browse Courses
      </h1>
      <div className="flex flex-col lg:flex-row items-center justify-between mb-8">
        <div className="relative text-gray-600 focus-within:text-gray-400">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2">
            <button
              type="submit"
              className="p-1 focus:outline-none focus:shadow-outline"
            >
              <svg
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                className="w-6 h-6"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>
          </span>
          <input
            type="search"
            className="py-2 text-sm rounded-md pl-10 focus:outline-none focus:bg-white focus:text-gray-900"
            placeholder="Search Courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-lg shadow-lg p-4 grid grid-rows-[1fr_auto]"
            >
              <div className="mb-2 ">
                <h3 className="text-xl font-semibold">{course.course}</h3>
                <p className="text-gray-600">Number: {course.number}</p>
                <p className="text-gray-600">Instructor: {course.instructor}</p>
              </div>
              <div className="mt-auto">
                <button
                  className="bg-blue-800 hover:bg-blue-900 active:bg-blue-900 text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
                  onClick={() => handleHave(course)}
                >
                  Add to Have
                </button>
                <button
                  className="bg-teal-600 hover:bg-teal-700 active:bg-teal-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  onClick={() => handleWant(course)}
                >
                  Add to Want
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="w-full lg:w-96">
          <div className="mb-6 p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Have Courses
            </h2>
            <div className="p-4">
              {haveCourses.map((course) => (
                <div
                  key={course.number}
                  className="flex flex-row justify-between p-2 hover:bg-gray-100 rounded"
                >
                  <div className="flex flex-col text-left">
                    <p className="font-semibold">{course.course}</p>
                    <p>{course.number}</p>
                    <p className="text-gray-600">{course.instructor}</p>
                  </div>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleRemoveHave(course)}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Want Courses
            </h2>
            <div className="p-4">
              {wantCourses.map((course) => (
                <div
                  key={course.number}
                  className="flex justify-between items-center p-2 hover:bg-gray-100 rounded"
                >
                  <div className="flex flex-col text-left">
                    <p className="font-semibold">{course.course}</p>
                    <p>{course.number}</p>
                    <p className="text-gray-600">{course.instructor}</p>
                  </div>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleRemoveWant(course)}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="mt-4 w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-lg shadow"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseList;
