import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./Firebase";

type AuthContextType = {
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  loading: boolean;
};

const defaultContext: AuthContextType = {
  authToken: null,
  setAuthToken: () => {}, // Provide a noop function as default
  loading: true,
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [authToken, setAuthToken] = useState<string | null>(
    localStorage.getItem("authToken")
  );
  const [loading, setLoading] = useState(true);
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (user) {
      user.getIdToken().then((token) => {
        setAuthToken(token);
        localStorage.setItem("authToken", token);
        setLoading(false);
      });
    } else {
      setAuthToken(null);
      localStorage.removeItem("authToken");
      setLoading(false);
    }
  }, [user]);

  const value = { authToken, setAuthToken, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using context
export const useAuth = () => useContext(AuthContext);
