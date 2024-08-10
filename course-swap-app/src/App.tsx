import React, { useEffect } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { auth } from "./config/Firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { AuthProvider, useAuth } from "./config/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import CourseList from "./pages/CourseList";
import Login from "./pages/Login";
import Contact from "./pages/Contact";
import { SocketProvider } from "./config/SocketContext";

function App() {
  const [user] = useAuthState(auth);
  const { setAuthToken } = useAuth(); // Using custom hook

  useEffect(() => {
    if (user) {
      user
        .getIdToken()
        .then((token) => {
          setAuthToken(token); // Store token in context globally
        })
        .catch((error) => {
          console.error("Error getting token:", error);
        });
    }
  }, [user, setAuthToken]);

  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <SocketProvider>
            <div className="App">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/courses" element={<CourseList />} />
                <Route path="/login" element={<Login />} />
                <Route path="/contact" element={<Contact />} />
              </Routes>
            </div>
          </SocketProvider>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
