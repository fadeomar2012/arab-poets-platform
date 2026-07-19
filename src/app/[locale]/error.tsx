"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="error-page"><h1>Something went wrong</h1><button className="button button-primary" onClick={reset}>Try again</button></main>; }
