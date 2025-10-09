import Link from "next/dist/client/link";

export default function Footer() {
  return (
    <footer className="mt-auto">
      <div className="bg-secondary w-full text-center text-text-light py-4 flex flex-col justify-center items-center gap-2 sm:gap-0">
        <Link href="/">© 2025 The Local Board</Link>
      </div>
    </footer>
  );
}

function StickyFooter() {
  return (
    <footer className="mt-auto sticky bottom-0 z-10">
      <div className="bg-secondary w-full text-center text-text-light py-4 flex flex-col justify-center items-center gap-2 sm:gap-0">
        <div className="flex flex-row gap-4">

          <Link href="/support" className="text-text-secondary-light">
            Contact Support
          </Link>
          <span>|</span>
          <Link href="/remove-listing" className="text-text-secondary-light">
            Delete Listing
          </Link>

        </div>
      </div>
    </footer>
  );
}

export { StickyFooter }