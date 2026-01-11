export const dynamic = 'force-dynamic';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#05080f] text-white">
      <header className="h-14 border-b border-white/10 px-6 flex items-center">
        FormaOS Admin
      </header>

      <main className="p-6">{children}</main>
    </div>
  );
}