import { Button, Center, Spinner } from "@chakra-ui/react";
import { LuWifiOff } from "react-icons/lu";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMe } from "../../hooks/useAuth";
import EmptyState from "../ds/EmptyState";

const Loading = () => (
  <Center minH='40dvh' aria-busy='true' aria-label='Loading'>
    <Spinner color='brand.fg' size='lg' />
  </Center>
);

/** Signed-in routes. Logged-out visitors go to /login and come back here afterwards. */
export const RequireAuth = () => {
  const { data: me, isPending, isError, refetch, isFetching } = useMe();
  const location = useLocation();
  if (isPending) return <Loading />;
  if (isError) {
    // The token may be fine; the API is just unreachable. Do not log the user out for that.
    return (
      <Center minH='40dvh'>
        <EmptyState
          icon={<LuWifiOff />}
          title='Cannot reach Sharewise'
          description='Check your connection, then try again.'
          action={
            <Button rounded='full' loading={isFetching} onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      </Center>
    );
  }
  if (!me) {
    const here = `${location.pathname}${location.search}`;
    const search = here === "/" ? "" : `?next=${encodeURIComponent(here)}`;
    return <Navigate to={`/login${search}`} replace />;
  }
  return <Outlet />;
};
