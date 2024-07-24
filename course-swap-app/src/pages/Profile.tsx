import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../config/AuthContext";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../config/Firebase";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSocket } from "../config/SocketContext";

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
  const { socket } = useSocket();

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
    if (socket) {
      socket.on("matchInvalidated", (data) => {
        alert(data.message); // Handle the event
      });

      return () => {
        socket.off("matchInvalidated");
      };
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      socket.on("matchDetails", (data) => {
        setNotifCount(data.length);
      });
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      socket.on("matchInvalidated", (data) => {
        alert(data.message); // or update a state to display in the UI
      });
    }
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
    if (socket) {
      socket.emit("requestToConnect", {
        _id: match._id,
      });
      console.log("request sent to node app");
    }
    showMatchDetailsToast(match);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-12">
        Profile Page
      </h1>
      <ToastContainer />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        {/* Personal Info Card */}
        <div className="bg-white shadow-lg p-6 rounded-lg space-y-4">
          <div className="text-center">
            <img
              src={user.photoURL || "https://via.placeholder.com/150"}
              alt="Profile"
              className="rounded-full w-32 h-32 object-cover mx-auto"
            />
            <p className="mt-4 text-lg font-semibold text-gray-800">
              {user.displayName || "N/A"}
            </p>
          </div>
          <div className="text-gray-600">
            <strong>Email:</strong> {user.email}
          </div>
        </div>

        {/* Have and Want Courses */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white shadow-lg p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Have Courses
            </h3>
            <div className="">
              {hcourses.map((course) => (
                <div key={course._id} className="text-gray-800 py-1">
                  {course.course} - {course.number}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white shadow-lg p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Want Courses
            </h3>
            {wcourses.map((course) => (
              <div key={course._id} className="text-gray-600 py-1">
                {course.course} - {course.number}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Match Results */}
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl mt-6">
        <h2 className="text-xl font-semibold text-gray-800">Match Results</h2>
        <ul className="space-y-4 mt-4">
          {matches.map((match, index) => (
            <li key={index} className="p-4 rounded hover:bg-gray-100">
              <span className="text-gray-800">
                Someone has course {match.wantedCourse.number} which you want.
              </span>
              <button
                className="ml-4 bg-blue-800 hover:bg-blue-900 active:bg-blue-900 text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
                onClick={() => handleRequestToConnect(match)}
              >
                Request to Connect
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Profile;
