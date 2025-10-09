import Link from "next/link"

import { ReactNode } from "react";

const SiteHeader = ({ children }: { children?: ReactNode }) => {
    return (

        <div className="text-center text-text-secondary-light bg-secondary mx-auto mb-4 w-full">

            <Link href="/" className="text-sm hover:underline inline-block w-full py-2">
                <h2 className="text-3xl text-text-primary font-semibold mt-2">
                    The Local Board
                </h2>
            </Link>
            {children}
            <p className="text-md md:text-sm w-full pb-2">
                Your neighborhood’s bulletin board. Events and services—right where you live.
            </p>
        </div>
    )
}

export default SiteHeader;


