import Link from "next/link";
export default function NotFound() { return <main className="error-page"><h1>404</h1><p>The requested page was not found.</p><Link className="button button-primary" href="/ar">Home</Link></main>; }
