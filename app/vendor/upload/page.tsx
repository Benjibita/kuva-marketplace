"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function VendorUpload() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call to Supabase
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Uploaded!</h2>
        <p className="text-gray-600 mb-8">Your product is now live on the Kuva marketplace.</p>
        <button
          onClick={() => setIsSuccess(false)}
          className="w-full bg-primary text-white font-bold py-3 rounded-xl mb-3"
        >
          Upload Another Product
        </button>
        <Link href="/vendor/dashboard" className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-50">
        <Link href="/vendor/dashboard" className="p-2 -ml-2 text-gray-600 active:bg-gray-100 rounded-full transition">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Upload New Product</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Image Upload Area */}
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <UploadCloud className="w-10 h-10 text-primary mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-1">Tap to upload photos</p>
          <p className="text-xs text-gray-500">Max 5MB per image</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Title</label>
            <input
              required
              type="text"
              placeholder="e.g. Handmade Leather Sandals"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (UGX)</label>
              <input
                required
                type="number"
                placeholder="0"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Amount</label>
              <input
                required
                type="number"
                placeholder="1"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none">
              <option value="">Select a category</option>
              <option value="fashion">Fashion & Apparel</option>
              <option value="crafts">Crafts</option>
              <option value="beauty">Health & Beauty</option>
              <option value="electronics">Electronics</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={4}
              placeholder="Describe your product..."
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
            ></textarea>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-md hover:bg-primary-dark transition active:scale-95 disabled:opacity-70 flex justify-center items-center"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Uploading...</span>
            ) : (
              "List Product for Sale"
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
