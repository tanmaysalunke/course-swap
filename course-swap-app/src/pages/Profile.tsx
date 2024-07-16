import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../config/AuthContext";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../config/Firebase";
import io from "socket.io-client";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const socket = io("http://localhost:5000", {
  transports: ["websocket", "polling"],
});

interface Course {
  _id: string;
  course: string;
  number: string;
  instructor: string;
}

interface UserData {
  email: string;
  haveCourses: Course[];
  uid: string;
  wantCourses: Course[];
  __v: number;
  _id: string;
}

interface Match {
  _id: string;
  requesterEmail: string;
  wantedCourse: Course;
  ownerEmail: string;
  ownerCourse: Course;
  status: string;
  createdAt?: Date;
}

function Profile() {
  const navigate = useNavigate();
  const { authToken, loading } = useAuth();
  const [hcourses, setHcourses] = useState<Course[]>([]);
  const [wcourses, setWcourses] = useState<Course[]>([]);
  const [user] = useAuthState(auth);
  const [data, setData] = useState<UserData | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [matchDetails, setMatchDetails] = useState<Match[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      console.log("Loading:", loading);
      console.log("Auth Token:", authToken);
      setTimeout(() => {
        if (!loading && !authToken) {
          navigate("/login");
        }
      }, 2000);
    };

    checkAuth();
  }, [authToken, loading, navigate]);

  useEffect(() => {
    fetch("http://localhost:5000/api/matches", {
      headers: {
        Authorization: `Bearer ${authToken}`, // Assuming you're using a Bearer token
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setMatches(data);
        setNotifCount(data.length);
      })
      .catch((error) => {
        console.error("Failed to fetch matches:", error);
      });
  }, [authToken]);

  useEffect(() => {
    const fetchData = async () => {
      if (authToken) {
        try {
          const response = await fetch("http://localhost:5000/api/user/data", {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });
          if (!response.ok) throw new Error("Failed to fetch courses");
          const data = await response.json();
          setData(data);
          setHcourses([...data.haveCourses]);
          setWcourses([...data.wantCourses]);
        } catch (error) {
          console.error("Error fetching courses:", error);
        }
      }
    };

    fetchData();
  }, [authToken]);

  //Socket.io
  useEffect(() => {
    // Listen for new connection requests
    socket.on("matchDetails", (data) => {
      console.log("Match details received:", data);
      setMatchDetails(data);
      console.log(data.ownerEmail);
      showMatchDetailsToast(data);
    });

    return () => {
      socket.off("matchDetails");
    };
  }, []);

  useEffect(() => {
    socket.on("matchInvalidated", (data) => {
      alert(data.message); // or update a state to display in the UI
    });
  }, [socket]);

  const showMatchDetailsToast = (matchDetails: Match) => {
    toast(
      <div>
        <p>Connection Request Sent!</p>
      </div>,
      {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      }
    );
  };

  const handleRequestToConnect = (match: Match) => {
    socket.emit("requestToConnect", {
      _id: match._id,
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">
        Profile Page
      </h1>
      <ToastContainer />
      <div className="flex justify-center py-4">
        <button
          className="icon-button-image relative p-4 bg-white rounded-full shadow-lg hover:shadow-xl transition duration-300"
          onClick={() => setShowPopup(true)}
        >
          {notifCount > 0 && (
            <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
              {notifCount}
            </span>
          )}
        </button>
      </div>
      <div>
        {showPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
              <h2 className="text-xl text-gray-700 font-semibold mb-4">
                Match Results
              </h2>
              <ul className="space-y-4">
                {matches.map((match, index) => (
                  <li key={index} className="p-2 hover:bg-gray-100 rounded">
                    <span className="text-gray-600">
                      Someone has course {match.wantedCourse.number} which you
                      want.
                    </span>
                    <div className="pt-2">
                      <button
                        className="bg-blue-800 hover:bg-blue-900 active:bg-blue-900 text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
                        onClick={() => {
                          handleRequestToConnect(match);
                          console.log(match.wantedCourse.number);
                        }}
                      >
                        Request to Connect
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setShowPopup(false)}
                className="mt-4 w-full text-white bg-red-500 hover:bg-red-600 font-bold py-2 px-4 rounded transition duration-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row justify-around items-start p-4 space-y-4 md:space-y-0 md:space-x-4 w-full max-w-6xl">
        <div className="bg-white shadow-lg p-6 rounded-lg w-full md:w-1/3 text-left">
          <p className="text-gray-600">
            <strong>Name:</strong> {user.displayName || "N/A"}
          </p>
          <p className="text-gray-600">
            <strong>Email:</strong> {user.email || "N/A"}
          </p>
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt="Profile"
              className="rounded-full w-32 h-32 object-cover mx-auto"
            />
          )}
        </div>
        <div className="flex flex-col space-y-4 w-full md:w-1/3">
          <div className="bg-white shadow-lg p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Have</h3>
            {hcourses.map((course) => (
              <div key={course._id} className="text-gray-800">
                {course.course}-{course.number}
              </div>
            ))}
          </div>
          <div className="bg-white shadow-lg p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Want</h3>
            {wcourses.map((course) => (
              <div key={course._id} className="text-gray-600">
                {course.course}-{course.number}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
