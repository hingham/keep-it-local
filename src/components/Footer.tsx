import Link from "next/dist/client/link";

export default function Footer() {
  return (
    <footer className="mt-auto">
      <div className="bg-secondary w-full text-center text-text-light py-4 flex flex-col justify-center items-center gap-2 sm:gap-0">
        <span>© 2025 The Local Board</span>
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
