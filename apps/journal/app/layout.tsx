import "./globals.css";

export const metadata = {
  title: "Aegis Ledger | Execution Firewall",
  description: "FSM-based Trading Behavioral Enforcer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen font-sans">{children}</body>
    </html>
  );
}