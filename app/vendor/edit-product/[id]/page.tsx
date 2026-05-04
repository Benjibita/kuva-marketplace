"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Save, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { SoftDeleteProductButton } from "@/components/SoftDeleteProductButton";

export default function EditProductPage() {
  const params = useParams();
  const id = useMemo(() => {
    const raw = params.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params.id]);

  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      setNotFound(true);
      return;
    }

    async function loadProduct() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setUnauthorized(true);
          return;
        }

        if (user.user_metadata?.role !== "vendor") {
          setUnauthorized(true);
          return;
        }

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .eq("vendor_id", user.id)
          .is("deleted_at", null)
          .maybeSingle();

        if (error) {
          console.error("[EditProduct] load", error);
          setNotFound(true);
          return;
        }

        if (!data) {
          setNotFound(true);
          return;
        }

        setTitle(data.title);
        setPrice(data.price_ugx.toString());
        setStock(data.stock.toString());
        setDescription(data.description || "");
      } catch (e) {
        console.error("[EditProduct] load unexpected", e);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.user_metadata?.role !== "vendor") {
        setUnauthorized(true);
        setIsSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({
          title,
          price_ugx: parseFloat(price),
          stock: parseInt(stock, 10),
          description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("vendor_id", user.id)
        .is("deleted_at", null);

      if (updateError) {
        console.error("[EditProduct] update", updateError);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/vendor/dashboard");
      }, 1500);
    } catch (err) {
      console.error("[EditProduct] submit", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <p className="text-gray-700">You do not have access to edit this product.</p>
        <Link
          href="/"
          className="mt-4 text-sm font-semibold text-primary underline"
        >
          Back to home
        </Link>
      </div>
    );
  }

  if (notFound || !id) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <p className="font-medium text-gray-900">Product not found</p>
        <p className="mt-1 text-sm text-gray-500">
          It may have been removed or you do not own this listing.
        </p>
        <Link
          href="/vendor/dashboard"
          className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <CheckCircle className="anim-slide-in-bottom mb-4 h-16 w-16 text-green-500" />
        <h2 className="anim-slide-in-bottom anim-delay-100 mb-2 text-2xl font-bold text-gray-900">
          Saved!
        </h2>
        <p className="anim-slide-in-bottom anim-delay-200 text-gray-600">
          Product updated successfully.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-4 anim-slide-in-bottom">
        <Link
          href="/vendor/dashboard"
          className="-ml-2 rounded-full p-2 text-gray-600 transition active:bg-gray-100"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Edit Product</h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="anim-slide-in-bottom anim-delay-100 space-y-6 p-4"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Product Title
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Price (UGX)
              </label>
              <input
                required
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Stock Amount
              </label>
              <input
                required
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-white shadow-md transition hover:bg-primary-dark active:scale-95 disabled:opacity-70"
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      <div className="border-t border-gray-200 px-4 pb-8 pt-6 anim-slide-in-bottom anim-delay-200">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">
          Remove from marketplace
        </h2>
        <p className="mb-4 text-xs text-gray-500">
          Soft-deletes this listing: it stays in the database but buyers cannot
          see or purchase it. Use checkout validation to block stale cart lines.
        </p>
        <SoftDeleteProductButton productId={id} />
      </div>
    </main>
  );
}
