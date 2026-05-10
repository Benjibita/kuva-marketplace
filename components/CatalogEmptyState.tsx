import { Store } from "lucide-react";

interface CatalogEmptyStateProps {
  title?: string;
  description?: string;
}

export function CatalogEmptyState({
  title = "No products yet",
  description = "Be the first to list something on KUVA.",
}: CatalogEmptyStateProps) {
  return (
    <div className="anim-slide-in-bottom anim-delay-150 rounded-5xl border border-dashed border-kuva-line bg-white px-6 py-12 text-center shadow-card">
      <Store
        className="mx-auto mb-3 h-12 w-12 text-gray-300"
        strokeWidth={1.25}
      />
      <p className="font-medium text-gray-600">{title}</p>
      <p className="mt-1 text-sm text-gray-400">{description}</p>
    </div>
  );
}
