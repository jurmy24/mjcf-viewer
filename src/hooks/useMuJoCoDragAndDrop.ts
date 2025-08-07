"use client";
import { useContext } from "react";
import {
  MuJoCoDragAndDropContext,
  MuJoCoDragAndDropContextType,
} from "@/contexts/MuJoCoDragAndDropContext";

export const useMuJoCoDragAndDrop = (): MuJoCoDragAndDropContextType => {
  const context = useContext(MuJoCoDragAndDropContext);

  if (context === undefined) {
    throw new Error(
      "useMuJoCoDragAndDrop must be used within a MuJoCoDragAndDropProvider"
    );
  }

  return context;
};
