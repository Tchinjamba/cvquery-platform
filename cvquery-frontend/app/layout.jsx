import "./globals.css";
export const metadata = { title: "CVQuery Platform", description: "Academic CV editor with CVQuery language" };
export default function RootLayout({ children }) {
  return (<html lang="pt"><body>{children}</body></html>);
}
