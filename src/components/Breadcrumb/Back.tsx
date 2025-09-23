import Link from 'next/link';



interface BackProps {
    title: string;
    returnToHref: string;
    returnToText: string;
}

export default function Back({ title, returnToHref, returnToText }: BackProps) {
    return (
        <div className="mb-4">
            <nav className="flex items-center space-x-2 text-gray-500 dark:text-gray-400t text-xl">
                <div className="flex items-center space-x-2 mb-2">
                    <Link href={returnToHref} className="hover:underline dark:hover:text-blue-400">
                        ← {returnToText}
                    </Link>
                </div>
            </nav>
            <h2 className="text-2xl font-semibold text-text-primary mb-2">{title}</h2>
        </div>
    );
}
