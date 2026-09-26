"use client";

import { Suspense } from "react";
import RegisterPage from "../components/pages/Register";

export default function Register() {
  return (
    <Suspense>
      <RegisterPage />
    </Suspense>
  );
}
