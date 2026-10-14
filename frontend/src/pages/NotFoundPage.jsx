import { Button } from "@chakra-ui/react";
import { LuMapPinOff } from "react-icons/lu";
import { Link } from "react-router-dom";
import EmptyState from "../components/ds/EmptyState";
import { PageContainer } from "../components/ds/Page";

const NotFoundPage = () => (
  <PageContainer pt={{ base: "6", md: "12" }}>
    <EmptyState
      icon={<LuMapPinOff />}
      title='This page wandered off'
      description='The link may be old or mistyped. Your lessons are safe.'
      action={
        <Button asChild rounded='full'>
          <Link to='/'>Go to the feed</Link>
        </Button>
      }
    />
  </PageContainer>
);

export default NotFoundPage;
