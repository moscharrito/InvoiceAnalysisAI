import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Invoice Intelligence | AI-Powered Document Analysis</title>
        <meta name="description" content="Transform invoices into structured data with Azure AI. Extract vendor details, line items, and totals instantly." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#fefefe" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph */}
        <meta property="og:title" content="Invoice Intelligence | AI-Powered Analysis" />
        <meta property="og:description" content="Transform invoices into structured data with Azure AI" />
        <meta property="og:type" content="website" />

        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
