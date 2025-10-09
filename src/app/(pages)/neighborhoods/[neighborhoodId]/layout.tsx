import "@/app/globals.css";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="container mx-auto px-4 flex-1 flex flex-col items-center sm:items-start gap-16 max-w-4xl">
            {children}
        </div>
    );
}
