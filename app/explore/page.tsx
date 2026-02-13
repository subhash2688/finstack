import { Suspense } from "react";
import { ExplorePageClient } from "./ExplorePageClient";

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-16 max-w-5xl text-center text-gray-400">Loading...</div>}>
      <ExplorePageClient />
    </Suspense>
  );
}
