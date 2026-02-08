import type { Metadata } from "next";
import Script from "next/script";
import { Fraunces, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "UnlockedGPT Interface",
  description:
    "A prompt-trained ChatGPT interface with a studio-grade UI and local prompt control.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script src="https://js.puter.com/v2/" strategy="beforeInteractive" />
      </head>
      <body className={`${sora.variable} ${fraunces.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
