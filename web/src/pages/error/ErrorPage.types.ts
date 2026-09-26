export interface ErrorPageProps {
  /** What went wrong, as the router caught it. */
  error: unknown;

  /** Re-renders the route that failed. */
  reset: () => void;
}
