import { useEffect, useRef, useCallback, useState } from "react";
import { Spinner } from "../components/common";

// ─── useInfiniteScroll hook ───────────────────────────────
export const useInfiniteScroll = ({ onLoadMore, hasMore, loading }) => {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  return sentinelRef;
};

// ─── InfiniteScrollSentinel component ────────────────────
export function InfiniteScrollSentinel({ hasMore, loading }) {
  const sentinelRef = useRef(null);
  return (
    <div ref={sentinelRef} className="flex justify-center py-6">
      {loading && <Spinner size={24} />}
      {!hasMore && !loading && (
        <p className="text-xs text-slate-600">You've seen all matches.</p>
      )}
    </div>
  );
}

// ─── usePagination hook ───────────────────────────────────
export const usePagination = (fetchFn, deps = []) => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const load = useCallback(
    async (reset = false) => {
      const currentPage = reset ? 1 : page;
      setLoading(true);
      try {
        const result = await fetchFn(currentPage);
        if (reset) {
          setData(result.data);
          setPage(2);
        } else {
          setData((prev) => [...prev, ...result.data]);
          setPage((p) => p + 1);
        }
        setTotal(result.pagination?.total || result.data.length);
        setHasMore(
          result.pagination
            ? currentPage < result.pagination.pages
            : false
        );
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    },
    [page, fetchFn]
  );

  useEffect(() => {
    setPage(1);
    load(true);
  }, deps);

  return { data, loading, hasMore, total, loadMore: () => load(false) };
};
