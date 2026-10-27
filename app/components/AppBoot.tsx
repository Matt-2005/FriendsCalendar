"use client";

import { useEffect } from "react";
import { bootPush } from "./pushClient";

export default function AppBoot() {
  useEffect(() => {
    bootPush();
  }, []);
  return null;
}
