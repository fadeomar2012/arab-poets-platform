export default function Loading() {
  return (
    <main className="loading-page" aria-busy="true" aria-label="Loading">
      <div className="page-skeleton">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-card" />
      </div>
    </main>
  );
}
