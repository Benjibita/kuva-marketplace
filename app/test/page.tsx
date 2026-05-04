import { createClient } from "@/utils/supabase/server";

export default async function SupabaseTestPage() {
  const supabase = createClient();

  // We'll test the connection by querying the products table we scaffolded earlier.
  // Using limit(1) makes it a very light query.
  const { data, error, status } = await supabase
    .from("products")
    .select("*")
    .is("deleted_at", null)
    .limit(1);

  const isConnected = !error || error.code === 'PGRST116'; // PGRST116 is "no rows returned"

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 text-center">Supabase Connection Test</h1>
        
        <div className={`p-4 rounded-xl mb-6 flex items-center justify-center font-bold ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isConnected ? "✅ Connection Successful" : "❌ Connection Failed"}
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Status Code</h2>
            <p className="font-mono bg-gray-100 p-2 rounded text-gray-800">{status || "N/A"}</p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Error Details</h2>
            <pre className="font-mono bg-gray-100 p-2 rounded text-gray-800 text-xs overflow-auto">
              {error ? JSON.stringify(error, null, 2) : "None"}
            </pre>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Data Returned</h2>
            <pre className="font-mono bg-gray-100 p-2 rounded text-gray-800 text-xs overflow-auto">
              {data ? JSON.stringify(data, null, 2) : "None"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
