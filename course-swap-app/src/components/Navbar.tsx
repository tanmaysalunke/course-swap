import React, { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../config/Firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import { useSocket } from "../config/SocketContext";
import Modal from "./Modal";

const Navbar = () => {
  const [user] = useAuthState(auth);
  const { notifCount, notifications } = useSocket();
  // const [showNotifDetail, setShowNotifDetail] = useState(false);
  const { socket } = useSocket();
  const [selectedNotification, setSelectedNotification] = useState<any | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleNotificationClick = (notification: any) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
  };

  const signUserOut = async () => {
    await signOut(auth);
    setIsOpen(!isOpen);
  };

  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const toggleNotifPanel = () => {
    setShowNotifPanel(!showNotifPanel);
  };

  const onNotifAccept = (notifId: string) => {
    if (socket) {
      socket.emit("notificationAccepted", notifId);
    }
    setIsModalOpen(false);
  };
  const onNotifReject = (notifId: string) => {
    if (socket) {
      socket.emit("notificationRejected", notifId);
    }
  };

  return (
    <nav className="bg-white border-gray-200 dark:bg-gray-900">
      {/*  ----------Site Name and Logo---------- */}
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <button
          onClick={(e) => e.preventDefault()}
          className="flex items-center space-x-3 rtl:space-x-reverse"
        >
          <img
            src="https://flowbite.com/docs/images/logo.svg"
            className="h-8"
            alt="Flowbite Logo"
          />
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
            Course Swap
          </span>
        </button>

        {/*  ----------Profile Icon---------- */}
        <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          {!user && (
            <button
              type="button"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              <Link to="/login">Login</Link>
            </button>
          )}

          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex justify-center items-center">
                <button
                  className="relative rounded-full p-2 w-10 h-10"
                  onClick={toggleNotifPanel}
                >
                  <img
                    src="/icons/noun-notification.svg"
                    alt="Notification"
                  ></img>
                  {notifCount > 0 && (
                    <span className="absolute top-2 right-2 transform translate-x-1/2 -translate-y-1/2 bg-red-600 text-white px-1 wx-1 rounded-full text-xs font-bold">
                      {notifCount}
                    </span>
                  )}
                </button>
                {showNotifPanel && (
                  <div className="absolute top-8 mt-12 w-80 bg-white shadow-lg rounded-lg p-4">
                    <h2 className="text-lg font-semibold">Notifications</h2>
                    <ul className="space-y-4 mt-4">
                      {notifications.map((notif, index) => (
                        <div>
                          {notif.read === true ? (
                            <li
                              key={index}
                              className="p-4 rounded bg-gray-100 text-gray-600"
                            >
                              {notif.message}
                            </li>
                          ) : (
                            <li
                              key={index}
                              className="p-4 rounded hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleNotificationClick(notif)}
                            >
                              {notif.message}
                            </li>
                          )}
                          <Modal
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                          >
                            {selectedNotification && (
                              <div>
                                <p>
                                  {selectedNotification.requesterEmail} wants to
                                  connect for{" "}
                                  {
                                    selectedNotification.match.wantedCourse
                                      .course
                                  }{" "}
                                  -{" "}
                                  {
                                    selectedNotification.match.wantedCourse
                                      .number
                                  }
                                  .
                                </p>
                                <div className="flex flex-row justify-evenly pt-4">
                                  <button
                                    className="bg-teal-600 hover:bg-teal-700 active:bg-teal-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    onClick={() => {
                                      onNotifAccept(notif._id);
                                    }}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    className="bg-red-600 hover:bg-red-700 active:bg-teal-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    onClick={() => {
                                      onNotifReject(notif._id);
                                    }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            )}
                          </Modal>
                          {/* {showNotifDetail && (
                            
                          )} */}
                        </div>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="relative">
                <img
                  src={user?.photoURL || ""}
                  className="w-10 h-10 rounded-full cursor-pointer"
                  onClick={toggleDropdown}
                  alt="Profile"
                />
                {isOpen && (
                  <div className="absolute mt-12 right-0 top-4 bg-white shadow-lg rounded-md">
                    <button
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      onClick={signUserOut}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/*  ----------Menu---------- */}
        <div
          className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
          id="navbar-cta"
        >
          <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
            <li>
              <Link
                to="/"
                className="block py-2 px-3 md:p-0 text-white bg-blue-700 rounded md:bg-transparent md:text-blue-700 md:dark:text-blue-500"
                aria-current="page"
              >
                Home
              </Link>
            </li>
            <li>
              {user && (
                <Link
                  to="/profile"
                  className="block py-2 px-3 md:p-0 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                >
                  Profile
                </Link>
              )}
            </li>
            <li>
              {user && (
                <Link
                  to="/courses"
                  className="block py-2 px-3 md:p-0 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                >
                  Courses
                </Link>
              )}
            </li>
            <li>
              <Link
                to="/contact"
                className="block py-2 px-3 md:p-0 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
