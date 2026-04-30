"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (data) {
        setTitle(data.title);
        setPrice(data.price_ugx.toString());
        setStock(data.stock.toString());
        setDescription(data.description || "");
      }
      setIsLoading(false);
    }
    loadProduct();
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    await supabase
      .from('products')
      .update({
        title,
        price_ugx: parseFloat(price),
        stock: parseInt(stock, 10),
        description,
      })
      .eq('id', id);

    setIsSaving(false);
    setIsSuccess(true);
    
    setTimeout(() => {
      router.push('/vendor/dashboard');
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Saved!</h2>
        <p className="text-gray-600">Product updated successfully.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-50">
        <Link href="/vendor/dashboard" className="p-2 -ml-2 text-gray-600 active:bg-gray-100 rounded-full transition">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Edit Product</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Title</label>
            <input 
              required
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (UGX)</label>
              <input 
                required
                type="number" 
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Amount</label>
              <input 
                required
                type="number" 
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
            ></textarea>
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-md hover:bg-primary-dark transition active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </main>
  );
}
