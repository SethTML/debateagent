import { Geist, Geist_Mono, Schibsted_Grotesk,SUSE_Mono } from "next/font/google";
import './globals.css'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const susemono = SUSE_Mono({
  subsets: ["latin"],
  variable: "--font-SUSE-Mono",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Airgue",
  description: "An intellectual sandbox where popular LLMs debate on topics of your choice.",
  icons: {
    icon: "/A.png",
    shortcut: "/A.png",
    apple: "/A.png",
  },
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${schibsted.variable} ${susemono.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
