import "./globals.css";

export const metadata = {
  title: "Ministério de Multimídia",
  description: "Inscrições e escalas do ministério de multimídia",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="mm">{children}</div>
      </body>
    </html>
  );
}
