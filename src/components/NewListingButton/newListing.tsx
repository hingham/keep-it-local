import Link from "next/link";

type NewListingButtonProps = {
    neighborhoodId: string;
};

export default function NewListingButton({ neighborhoodId }: NewListingButtonProps) {
    return (
        // Create New Listing Button - Fixed at bottom
        <div className="text-md sticky bottom-11 bg-white dark:bg-gray-800 p-4 w-full">

            <Link
                href={`/neighborhoods/${neighborhoodId}/create`}
                className="inline-flex items-center"
            >
                <button className="button-basic">
                    + Create New Listing
                </button>
            </Link>
        </div>
    );
}
