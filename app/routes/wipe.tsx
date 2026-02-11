import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Navbar from "~/components/Navbar";
import { usePuterStore } from "~/lib/puter";

const WipeApp = () => {
  const { auth, isLoading, error, fs, kv } = usePuterStore();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FSItem[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadFiles = async () => {
    try {
      const files = (await fs.readDir("./")) as FSItem[];
      setFiles(files || []);
    } catch (e) {
      console.error("Failed to load files", e);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate("/auth?next=/wipe");
    }
  }, [isLoading, auth.isAuthenticated]);

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete all files and data? This action cannot be undone.",
      )
    )
      return;

    setIsDeleting(true);
    try {
      // Delete all files
      for (const file of files) {
        await fs.delete(file.path);
      }
      // Flush KV store
      await kv.flush();

      // Reload to show empty state
      await loadFiles();
    } catch (err) {
      console.error("Error wiping data:", err);
      alert("An error occurred while wiping data.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="bg-[url('/images/bg-main.svg')] dark:bg-none dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <img
          src="/images/resume-scan-2.gif"
          alt="Loading..."
          className="w-[200px]"
        />
      </main>
    );
  }

  if (error) {
    return (
      <main className="bg-[url('/images/bg-main.svg')] dark:bg-none dark:bg-gray-900 min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-red-500 font-semibold">
          Error: {error}
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[url('/images/bg-main.svg')] dark:bg-none dark:bg-gray-900 min-h-screen flex flex-col">
      {/* <Navbar /> */}

      <div className="flex-1 container mx-auto px-4 py-4 pb-8 max-w-7xl animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Data Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
              Manage your stored resumes and application data.
            </p>
          </div>

          <Link to="/" className="dark:text-blue-100 border border-gray-200 dark:border-gray-700 p-2 rounded-lg hover:bg-blue-100 hover:text-gray-800">Back to Home</Link>

        </div>

          <div className="flex flex-col sm:flex-row gap-4 items-end justify-end sm:items-center mb-10">
            {auth.user?.username && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {auth.user.username}
                </span>
              </div>
            )}
            <button
              onClick={handleDelete}
              disabled={isDeleting || files.length === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white shadow-md transition-all duration-200 ${
                isDeleting || files.length === 0
                  ? "bg-gray-400 dark:bg-gray-700 cursor-not-allowed opacity-70 shadow-none"
                  : "bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20 active:scale-95"
              }
                            `}
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              )}
              <span>{isDeleting ? "Wiping Data..." : "Wipe All Data"}</span>
            </button>
          </div>
        {/* Table Section */}
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {files.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-16 text-center text-gray-500 dark:text-gray-400"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                          </svg>
                        </div>
                        <p className="text-lg font-medium">
                          No files found in storage
                        </p>
                        <p className="text-sm opacity-70">
                          Upload a resume to see it here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  files.map((file) => (
                    <tr
                      key={file.id || file.name}
                      className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                            <img
                              src="/images/pdf.png"
                              alt="pdf"
                              className="w-6 h-6"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-400 font-mono mt-0.5 truncate max-w-[200px]">
                              {file.path}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                          {file.path.split(".")[1] === "pdf" ? "PDF Document" : "Image"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-mono">
                        {file.size
                          ? (file.size / 1024).toFixed(1) + " KB"
                          : "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-100 dark:border-green-900/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Available
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Stats */}
          <div className="bg-gray-50/80 dark:bg-gray-700/30 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {files.length}
              </span>{" "}
              files
            </p>
            <div className="text-xs text-gray-400">
              Storage usage:{" "}
              {files.reduce((acc, f) => acc + (f.size || 0), 0) / 1024 > 1024
                ? (
                    files.reduce((acc, f) => acc + (f.size || 0), 0) /
                    1024 /
                    1024
                  ).toFixed(2) + " MB"
                : (
                    files.reduce((acc, f) => acc + (f.size || 0), 0) / 1024
                  ).toFixed(1) + " KB"}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default WipeApp;
