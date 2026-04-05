export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6 bg-zinc-950 min-h-screen">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
        <div className="flex items-center space-x-2">
          {/* CalendarDateRangePicker goes here */}
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-all">
            Download Report
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Metric Cards will go here */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm backdrop-blur-md">
           <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium text-zinc-400">Total Tasks Completed</h3>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-indigo-400"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
           </div>
           <div className="text-2xl font-bold text-white">12</div>
           <p className="text-xs text-zinc-500">+19% from last month</p>
        </div>
      </div>
    </div>
  );
}
