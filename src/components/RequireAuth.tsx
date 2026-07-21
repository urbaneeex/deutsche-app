"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import SetupNotice from "@/components/SetupNotice";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (configured && !loading && !user) {
      router.replace("/login");
    }
  }, [configured, loading, user, router]);

  if (!configured) return <SetupNotice />;

  if (loading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-stone-400">
        Cargando...
      </div>
    );
  }

  return <>{children}</>;
}
