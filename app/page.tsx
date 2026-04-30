import { Search, ShoppingBag, Store, TrendingUp, Menu } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { UserMenu } from "@/components/UserMenu";
import { WelcomeBanner } from "@/components/WelcomeBanner";

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Menu className="w-6 h-6 text-gray-700" />
          <h1 className="text-xl font-bold text-primary tracking-tight">Kuva</h1>
        </div>
        <div className="flex items-center gap-4">
          <Search className="w-6 h-6 text-gray-700" />
          {user ? (
            <UserMenu role={user.user_metadata.role} />
          ) : (
            <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
              Log in
            </Link>
          )}
          <div className="relative">
            <ShoppingBag className="w-6 h-6 text-gray-700" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
              2
            </span>
          </div>
        </div>
      </header>

      {user && <WelcomeBanner name={user.user_metadata?.name} />}

      {/* Hero Section */}
      <section className={`px-4 ${user ? 'pt-2' : 'pt-6'} pb-4 anim-slide-in-bottom anim-delay-300`}>
        <div className="bg-gradient-to-r from-orange-100 to-orange-50 rounded-2xl p-5 border border-orange-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Support Local. Shop Ugandan.
          </h3>
          <p className="text-gray-600 mb-4 text-sm">
            Discover unique products from the best SMEs in Kampala and beyond.
          </p>
          <button className="bg-primary text-white font-semibold py-2.5 px-6 rounded-full shadow-md hover:bg-primary-dark transition active:scale-95">
            Shop Now
          </button>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="px-4 py-4 anim-slide-in-bottom anim-delay-500">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> Popular Categories
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {["Fashion", "Crafts", "Electronics", "Groceries", "Beauty"].map((category) => (
            <button
              key={category}
              className="whitespace-nowrap px-4 py-2 bg-gray-100 hover:bg-gray-200 text-sm font-medium rounded-full text-gray-800 transition"
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="px-4 py-4 anim-slide-in-bottom anim-delay-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Top Rated Products</h3>
          <Link href="/products" className="text-sm text-primary font-medium">See All</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Product 1 */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="aspect-square bg-gray-100 relative">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">Image</div>
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-xs font-bold text-gray-900">
                ⭐ 4.8
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs text-gray-500 mb-1">Kampala Crafts</p>
              <h4 className="font-medium text-sm text-gray-900 line-clamp-1 mb-1">Woven Basket</h4>
              <p className="text-primary font-bold text-sm">UGX 35,000</p>
            </div>
          </div>

          {/* Product 2 */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="aspect-square bg-gray-100 relative">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">Image</div>
            </div>
            <div className="p-3">
              <p className="text-xs text-gray-500 mb-1">Buziga Organics</p>
              <h4 className="font-medium text-sm text-gray-900 line-clamp-1 mb-1">Shea Butter Lotion</h4>
              <p className="text-primary font-bold text-sm">UGX 20,000</p>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor Call to Action */}
      <section className="px-4 py-6 mt-4 anim-slide-in-bottom anim-delay-1000">
        <div className="bg-gray-900 rounded-2xl p-5 text-center">
          <Store className="w-10 h-10 text-primary mx-auto mb-3" />
          <h3 className="text-white font-bold text-lg mb-2">Sell on Kuva</h3>
          <p className="text-gray-400 text-sm mb-4">
            Reach thousands of buyers across Uganda. Fast payouts via Mobile Money.
          </p>
          <Link href="/vendor/upload" className="block w-full bg-white text-gray-900 font-bold py-3 rounded-xl active:scale-95 transition">
            Open Your Shop
          </Link>
        </div>
      </section>
    </main>
  );
}
