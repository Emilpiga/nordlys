import type { ReactNode } from "react";
import "./globals.css";

/** Pass-through root — `<html>` / `<body>` live in `[locale]/layout`. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
