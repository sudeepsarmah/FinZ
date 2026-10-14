"use client";

import { useParams } from "next/navigation";
import { DreamStudio } from "@/components/dream-studio";

export function DreamScreen() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  if (!id) return null;
  return <DreamStudio id={id} />;
}
