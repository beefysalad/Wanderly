"use client";

import { Suspense } from "react";
import LoginPage from "../components/pages/Login";

export default function Login() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
