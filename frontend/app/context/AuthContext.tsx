import React, { createContext, useContext } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";

interface AuthContextValue {
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null | undefined;
  user: ReturnType<typeof useUser>["user"];
}

const AuthContext = createContext<AuthContextValue>({
  isSignedIn: false,
  isLoaded: false,
  userId: null,
  user: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, userId } = useClerkAuth();
  const { user } = useUser();

  return (
    <AuthContext.Provider
      value={{
        isSignedIn: isSignedIn ?? false,
        isLoaded,
        userId,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
