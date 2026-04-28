import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PrepHire - AI Interview Preparation",
  description: "Master your interviews with AI-powered practice sessions, real-time feedback, and personalized guidance based on your resume and target roles.",
  keywords: ["interview", "preparation", "AI", "practice", "feedback"],
  icons: {
    icon: "/sparkless.png",
    shortcut: "/sparkless.png",
    apple: "/sparkless.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=localStorage.getItem('ph-theme');if(s==='light'||s==='dark'){document.documentElement.setAttribute('data-theme',s);}else if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();` }} />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
