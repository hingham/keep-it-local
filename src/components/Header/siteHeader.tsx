import Link from "next/link"

import { ReactNode } from "react";

const SiteHeader = ({children}: {children?: ReactNode}) => {
    return (

        <div className="text-center mx-auto">

            <Link href="/" className="text-sm text-primary hover:underline mb-4 inline-block">
                <h1 className="text-4xl sm:text-6xl font-bold text-text-primary mb-4">
                    The Local Board
                </h1>
            </Link>
            <p className="text-lg text-text-secondary mb-6">
                Your neighborhood’s bulletin board.
                <br />
                Events, and services—right where you live.
            </p>
            {children}
        </div>
    )
}

export default SiteHeader;


