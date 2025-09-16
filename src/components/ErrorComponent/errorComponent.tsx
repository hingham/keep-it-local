import Link from "next/link";

const ErrorComponent = ({ message, returnTo }: { message: string, returnTo: string }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="text-xl text-red-600 mb-4">
        {message}
      </div>
      <Link
        href={returnTo ? returnTo : "/"}
        className="text-blue-600 hover:underline"
      >
        ← Back to {returnTo ? "previous page" : "home"}
      </Link>
    </div>
  </div>
);

export default ErrorComponent;
