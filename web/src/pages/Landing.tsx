import { Link } from "react-router-dom";


export default function Landing() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* HEADER */}
      <header className="container mx-auto px-4 py-8">
        <div className="relative">
          {/* Title + Subtitle (centered) */}
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-semibold">Home Page</h1>
            <p className="mt-2 text-lg md:text-xl">
              Welcome to LoL Match Replay System
            </p>
          </div>

          {/* Top-right avatar */}
          <div className="absolute right-0 top-0">
            <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-violet-500 text-white grid place-items-center shadow">
              <span className="text-sm md:text-base font-semibold">MR</span>
            </div>
          </div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section className="container mx-auto px-4 pb-12">
        <h2 className="text-2xl font-semibold mb-4">How it Works:</h2>

        {/* Two-column area (left = text cards, right = image cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT COLUMN: Text cards (stacked) */}
          <div className="flex flex-col gap-6">
            <div className="rounded-lg bg-gray-700 text-white shadow p-5">
              <p className="leading-relaxed">
                <span className="font-semibold">Simplified Match Replay:</span>{" "}
                We use Riot’s public API to ensure an easy, seamless process. Just
                insert your game name, select a match, and start viewing!
              </p>
            </div>

            <div className="rounded-lg bg-gray-700 text-white shadow p-5">
              <p className="leading-relaxed">
                <span className="font-semibold">Our Goal:</span> We want to create a
                match replay system that simplifies match viewing by showing the
                entire map at once with updated player positions, major events, and
                team statistics.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Image cards (stacked) */}
          <div className="flex flex-col gap-6">
            {/* Replace these placeholders with <Image> later */}
            <div className="rounded-lg bg-gray-600 shadow p-5 grid place-items-center min-h-[220px]">
              <span className="text-white/90 text-center">
                Images/Visual representation<br />of our website in action
              </span>
            </div>
            <div className="rounded-lg bg-gray-600 shadow p-5 grid place-items-center min-h-[220px]">
              <span className="text-white/90 text-center">
                Images relating to our goal
              </span>
            </div>
          </div>
        </div>

        {/* Bottom: Get started link */}
        <div className="mt-8">
          <Link to ="/login"
            className="inline-block text-lg font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
          >
            Get started
          </Link>
        </div>
      </section>
    </main>
  );
}