import './globals.css';

export const metadata = {
  title: 'Brand Detection Dashboard',
  description: 'AI-powered brand extraction from PDFs',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
