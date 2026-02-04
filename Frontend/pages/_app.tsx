import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>ClaimScan | Property Insurance Claims Processing</title>
        <meta name="description" content="Streamline property insurance claim adjudication with AI-powered contractor invoice processing. Automate coverage validation and fraud detection." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#fefefe" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph */}
        <meta property="og:title" content="ClaimScan | Property Insurance Claims Processing" />
        <meta property="og:description" content="AI-powered property insurance claim adjudication and invoice processing" />
        <meta property="og:type" content="website" />

        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
