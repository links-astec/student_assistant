"use client";

export function SetupScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8 text-amber-600"
            >
              <path
                fillRule="evenodd"
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Supabase Setup Required
          </h1>
          <p className="text-gray-600">
            Please configure your Supabase credentials to use CampusFlow
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Setup Steps:</h2>

          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-medium">
                1
              </span>
              <div>
                <strong>Create a Supabase project</strong> at{" "}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  supabase.com
                </a>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-medium">
                2
              </span>
              <div>
                <strong>Run the database migration</strong>
                <br />
                Go to SQL Editor and execute{" "}
                <code className="bg-gray-200 px-1 rounded">
                  supabase/migrations/001_initial_schema.sql
                </code>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-medium">
                3
              </span>
              <div>
                <strong>Seed the database</strong>
                <br />
                Execute{" "}
                <code className="bg-gray-200 px-1 rounded">
                  supabase/seed.sql
                </code>{" "}
                in SQL Editor
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-medium">
                4
              </span>
              <div>
                <strong>Create .env.local file</strong>
                <br />
                Copy <code className="bg-gray-200 px-1 rounded">.env.local.example</code> to{" "}
                <code className="bg-gray-200 px-1 rounded">.env.local</code> and add your credentials
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-medium">
                5
              </span>
              <div>
                <strong>Restart the dev server</strong>
                <br />
                Run <code className="bg-gray-200 px-1 rounded">npm run dev</code> again
              </div>
            </li>
          </ol>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            Required Environment Variables:
          </h3>
          <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-100 font-mono overflow-x-auto">
            <div>SUPABASE_URL=https://your-project.supabase.co</div>
            <div>SUPABASE_ANON_KEY=your-anon-key</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Find these in your Supabase dashboard under Settings → API
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium
                     hover:bg-primary-700 transition-colors duration-200"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}
