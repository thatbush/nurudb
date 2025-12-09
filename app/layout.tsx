import type { Metadata } from "next";
import { Geist, Geist_Mono, Josefin_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import LayoutWrapper from "@/components/LayoutWrapper";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Script from "next/script";

const josefinSans = Josefin_Sans({
	variable: "--font-josefin-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Kenya's Verified Alumni Knowledge Base for Smarter Choices",
	description: "Nuru is Kenya's only platform where alumni, students, and official records combine. Discover real graduate insights, peer-verified course info, and make smarter university choices before KUCCPS opens. Join our winner's globe and connect with campus communities built on truth, experience, and transparency.",
	// ... rest of your metadata
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<Script src="https://www.googletagmanager.com/gtag/js?id=G-J069E6NLMH" />
				<Script id="gtag-config">
					{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-J069E6NLMH');
          `}
				</Script>
				<link rel="icon" href="/favicon.ico" type="image/icon" />
			</head>
			<body className={`${josefinSans.variable} ${geistMono.variable} antialiased`}>
				<ThemeProvider attribute="class">
					<LayoutWrapper>
						{children}
						<GoogleAnalytics />
					</LayoutWrapper>
					<Toaster />
				</ThemeProvider>
			</body>
		</html>
	);
}