import React, { ReactNode, FC } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const Modal: FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="relative bg-white p-8 rounded-lg shadow-lg">
        {children}
        {/* Close button with X mark at the top right corner */}
        <button
          className="absolute top-0 right-0 mt-2 mr-2 px-1 bg-transparent text-gray-600 hover:text-gray-900 font-bold"
          onClick={onClose}
        >
          &#10005; {/* Unicode character for 'X' */}
        </button>
      </div>
    </div>
  );
};

export default Modal;
