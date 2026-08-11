import "./globals.css";

export const metadata = {
  title: "Doodle AI",
  description: "Doodle AI Sketch & Architecture Diagrams",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Georgia, serif', fontWeight: 'normal' }}>{children}</body>
    </html>
  );
}
