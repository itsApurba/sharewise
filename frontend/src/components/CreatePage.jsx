import UserForm from "./UserForm";
import PostForm from "./PostForm";
import { SimpleGrid } from "@chakra-ui/react";
import { PageContainer, PageHeader } from "./ds/Page";

const CreatePage = () => {
  return (
    <PageContainer width='wide'>
      <PageHeader eyebrow='Classic' title='Create' description='Add a user, then post as them with their user ID from the Users page.' />
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap='6' alignItems='start'>
        <UserForm />
        <PostForm />
      </SimpleGrid>
    </PageContainer>
  );
};

export default CreatePage;
