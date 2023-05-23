import { Box, Button, Center, FormControl, FormLabel, Input, Stack, Textarea, useColorModeValue } from '@chakra-ui/react';
import React from 'react'

const PostForm = () => {
  return (
    <Center w={"full"} h={"100vh"} bg={useColorModeValue("gray.50", "gray.800")}>
      <Box rounded={"lg"} bg={useColorModeValue("gray.100", "gray.900")} boxShadow={"lg"} p={8}>
        <Stack spacing={4}>
          <FormControl id='id'>
            <FormLabel>ID</FormLabel>
            <Input type='text' required/>
          </FormControl>
          <FormControl id='content'>
            <FormLabel>Content</FormLabel>
            <Textarea resize={"none"} rounded={"lg"} />
          </FormControl>
          <Stack>
            <Button
              bg={"blue.400"}
              color={"white"}
              _hover={{
                bg: "blue.500",
              }}
            >
              Create Post
            </Button>
            <Button
              variant='outline'
              color={"white"}
              _hover={{
                bg: "blue.400",
              }}
            >
              Update Post
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Center>
  );
}

export default PostForm