import Link from "next/link";

type NewListingButtonProps = {
    neighborhoodId: string;
};

export default function NewListingButton({ neighborhoodId }: NewListingButtonProps) {
    return (
        // Create New Listing Button - Fixed at bottom
        <Link
            href={`/neighborhoods/${neighborhoodId}/create`}
            className="inline-flex items-center"
        >
            <button className="button-basic">
                + Create New Listing
            </button>
        </Link>
    );
}
