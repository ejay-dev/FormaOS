import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("APP BOOT: Layout rendered");
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
