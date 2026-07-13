"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TareasRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/actividades"); }, [router]);
  return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>;
}
