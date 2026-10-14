import { Button, Center, Spinner, Text } from "@chakra-ui/react";
import { useEffect, useRef } from "react";

/**
 * Footer for an infinite query: loads the next page when it scrolls into view,
 * with a "Load more" button as the fallback, and a quiet note at the end.
 */
const LoadMore = ({ query, endLabel = "You are all caught up." }) => {
  const { hasNextPage, isFetchingNextPage, fetchNextPage, isFetchNextPageError } = query;
  const sentinel = useRef(null);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage || isFetchNextPageError) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "400px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isFetchNextPageError]);

  if (!hasNextPage) {
    return (
      <Text textAlign='center' fontSize='sm' color='fg.muted' py='4'>
        {endLabel}
      </Text>
    );
  }
  return (
    <Center ref={sentinel} py='4'>
      {isFetchingNextPage ? (
        <Spinner size='sm' color='brand.fg' aria-label='Loading more' />
      ) : (
        <Button variant='outline' colorPalette='gray' rounded='full' size='sm' onClick={() => fetchNextPage()}>
          {isFetchNextPageError ? "Could not load more. Try again" : "Load more"}
        </Button>
      )}
    </Center>
  );
};

export default LoadMore;
