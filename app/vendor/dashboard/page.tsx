import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Package, Edit3, Settings, ArrowLeft } from 'lucide-react'
import { SoftDeleteProductButton } from '@/components/SoftDeleteProductButton'

export default async function VendorDashboard({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata.role !== 'vendor') {
    redirect('/')
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const message =
    typeof searchParams.message === 'string' ? searchParams.message : undefined
  const error =
    typeof searchParams.error === 'string' ? searchParams.error : undefined

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4 anim-slide-in-bottom">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-600 hover:text-primary transition">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Vendor Dashboard</h1>
        </div>
        <Link href="/settings" className="text-gray-600 hover:text-primary">
          <Settings className="w-6 h-6" />
        </Link>
      </header>

      <div className="space-y-6 p-4">
        {message && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 anim-slide-in-bottom">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 anim-slide-in-bottom">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm anim-slide-in-bottom anim-delay-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.user_metadata.business_name || 'My Shop'}</h2>
            <p className="text-sm text-gray-500">{user.user_metadata.name}</p>
          </div>
          <Link href="/settings" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition">
            Edit Profile
          </Link>
        </div>

        <div className="flex items-center justify-between anim-slide-in-bottom anim-delay-200">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> My Products
          </h3>
          <Link 
            href="/vendor/upload" 
            className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>

        {products && products.length > 0 ? (
          <div className="space-y-3">
            {products.map((product, i) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm anim-slide-in-bottom"
                style={{ animationDelay: `${250 + Math.min(i, 12) * 40}ms` }}
              >
                <div>
                  <h4 className="font-medium text-gray-900">{product.title}</h4>
                  <div className="text-sm text-gray-500 flex gap-4 mt-1">
                    <span>UGX {product.price_ugx.toLocaleString()}</span>
                    <span>Stock: {product.stock}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/vendor/edit-product/${product.id}`}
                    className="rounded-full bg-orange-50 p-2 text-primary transition hover:bg-orange-100"
                    aria-label="Edit product"
                  >
                    <Edit3 className="h-5 w-5" />
                  </Link>
                  <SoftDeleteProductButton productId={product.id} compact />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center anim-slide-in-bottom anim-delay-250">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">You haven't added any products yet.</p>
            <Link 
              href="/vendor/upload" 
              className="inline-block bg-primary text-white font-bold py-2 px-6 rounded-xl shadow-sm hover:bg-primary-dark transition"
            >
              Add Your First Product
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
