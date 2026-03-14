import type { Metadata } from "next";
import { LoginClient } from "./LoginClient";

export const metadata: Metadata = {
  title: "Sign In — Meet2Task AI",
  description: "Sign in to Meet2Task AI with your GitHub account",
};

export default function LoginPage() {
  return <LoginClient />;
}
