"use client";

import LandingPage, { IUserCredentials } from "./components/LandingPage";

export default function Home() {
  const handleLogin = (userCredentials: IUserCredentials) => {
    console.log(userCredentials);
  };
  const handleRegister = (userCredentials: IUserCredentials) => {
    console.log(userCredentials);
  };
  const handleQuickJoin = (code: string, guestName: string) => {
    console.log(code, guestName);
  };
  return (
    <LandingPage
      onLogin={handleLogin}
      onRegister={handleRegister}
      onQuickJoin={handleQuickJoin}
    />
  );
}
