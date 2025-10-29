import Dashboard from "./components/Dashboard";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Sci-Fi Header */}
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-blue-500/10 to-purple-500/10 blur-xl"></div>
        <div className="relative bg-slate-800/90 backdrop-blur-sm border-b border-cyan-400/30 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                  <div className="text-white text-2xl font-bold">B</div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-mono">
                    BLUETTI PI MONITOR
                  </h1>
                  <div className="text-cyan-300 text-sm font-mono">
                    VANLIFE POWER MANAGEMENT SYSTEM
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-400 text-sm font-mono">
                  SYSTEM ONLINE
                </div>
                <div className="text-cyan-300 text-xs font-mono">
                  {new Date().toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard />
      </main>

      {/* Sci-Fi Footer */}
      <footer className="relative mt-12">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-slate-900/50"></div>
        <div className="relative bg-slate-800/90 backdrop-blur-sm border-t border-cyan-400/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="text-cyan-300 text-sm font-mono">
                © 2025 BLUETTI MONITOR • VANLIFE EDITION
              </div>
              <div className="flex items-center space-x-4 text-xs font-mono">
                <div className="text-green-400">●</div>
                <div className="text-cyan-300">POWER CORE STABLE</div>
                <div className="text-blue-400">●</div>
                <div className="text-cyan-300">SYSTEMS NOMINAL</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
