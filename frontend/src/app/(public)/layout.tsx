import PublicHeader from "@/components/layout/public-header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden font-sans">
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      {/* Watermark Logo */}
      {/* <div
        className="fixed inset-0 mt-16 flex items-center justify-center pointer-events-none z-0"
        style={{ opacity: 0.04 }}
      >
        <Image
          src="/logo-aii.png"
          alt="Organization Logo"
          width={700}
          height={700}
          className="object-contain"
        />
      </div> */}
      
      {/* Navigation */}
      <PublicHeader />
        {children}
    
    </div>
  );
}