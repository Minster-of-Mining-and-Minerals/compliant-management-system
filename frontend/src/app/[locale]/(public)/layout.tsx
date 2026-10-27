import PublicHeader from "@/components/layout/public-header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <PublicHeader variant="dark" />
      {children}
    </div>
  );
}
