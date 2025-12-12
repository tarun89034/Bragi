import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="border-t border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 sm:px-6 lg:px-8">
        <div>
          <h4 className="mb-3 text-sm font-semibold">Company</h4>
          <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <li>
              <Link href="/about" className="hover:underline">
                About
              </Link>
            </li>
            <li>
              <Link href="/jobs" className="hover:underline">
                Jobs
              </Link>
            </li>
            <li>
              <Link href="/press" className="hover:underline">
                Press
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Communities</h4>
          <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <li>
              <Link href="/creators" className="hover:underline">
                For Creators
              </Link>
            </li>
            <li>
              <Link href="/developers" className="hover:underline">
                Developers
              </Link>
            </li>
            <li>
              <Link href="/brands" className="hover:underline">
                Brands
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Useful links</h4>
          <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <li>
              <Link href="/support" className="hover:underline">
                Support
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:underline">
                Terms of use
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:underline">
                Privacy
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Get the Bragi app</h4>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              aria-label="Download Bragi on the App Store"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M16.365 1.43c.04.052.076.106.11.162-1.04.604-1.74 1.61-1.9 2.757-.04.052-.08.103-.12.154-.313.402-.84.72-1.35.67-.048-.74.22-1.487.7-2.07.48-.58 1.24-1.03 2.04-1.14.174-.025.352-.027.52-.027zM20.36 17.59c-.34.79-.5 1.13-1.03 1.83-.67.93-1.62 2.08-2.79 2.1-1.04.02-1.31-.67-2.73-.67-1.42 0-1.72.65-2.76.68-1.17.03-2.06-1.01-2.73-1.93-1.87-2.62-2.06-5.69-.91-7.32.82-1.18 2.11-1.87 3.36-1.87 1.25 0 2.03.68 3.06.68 1.01 0 1.61-.68 3.06-.68 1.1 0 2.27.6 3.09 1.64-2.71 1.49-2.26 5.37.38 6.53z" />
              </svg>
              App Store
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              aria-label="Get Bragi on Google Play"
            >
              <svg
                viewBox="0 0 512 512"
                className="h-5 w-5"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M325.3 234.3L74.8 6.5c-4.7-4.2-10.8-6.5-17-6.5C25.8 0 0 25.8 0 57.8v396.4C0 486.2 25.8 512 57.8 512c6.2 0 12.3-2.3 17-6.5l250.5-227.8-85.8-43.4 85.8-43.1zM362.8 258.4l-32 29.1 90.7 46.3 71.3-64.9c13.1-11.9 13.1-32.6 0-44.5l-71.3-64.9-90.7 46.3 32 29.1c7.2 6.6 7.2 17.5 0 24.5z" />
              </svg>
              Google Play
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200/70 dark:border-neutral-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 text-sm text-neutral-600 sm:px-6 lg:px-8 dark:text-neutral-400">
          <p>© {new Date().getFullYear()} Bragi</p>
          <p className="text-neutral-500 dark:text-neutral-400">The AI muse for your playlists</p>
        </div>
      </div>
    </footer>
  );
}
