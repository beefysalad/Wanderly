"use client";

import LandingPage from "./components/LandingPage";

export default function Home() {
  const handleQuickJoin = (code: string, guestName: string) => {
    console.log(code, guestName);
  };
  return <LandingPage onQuickJoin={handleQuickJoin} />;
}
