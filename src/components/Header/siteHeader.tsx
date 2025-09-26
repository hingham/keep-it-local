import Link from "next/link"

import { ReactNode } from "react";

const SiteHeader = ({children}: {children?: ReactNode}) => {
    return (

        <div className="text-center text-white mx-auto py-8 bg-secondary/90 border border-primary/20 rounded-lg md:p-8 shadow-sm w-full mb-6">

            <Link href="/" className="text-sm text-secondary-light hover:underline mb-4 inline-block">
                <h1 className="text-4xl sm:text-6xl text-text-primary mb-4">
                    The Local Board
                </h1>
            </Link>
            <p className="text-lg text-text-secondary-light md:mb-6">
                Your neighborhood’s bulletin board.
                <br />
                Events, and services—right where you live.
            </p>
            {children}
        </div>
    )
}

export default SiteHeader;


