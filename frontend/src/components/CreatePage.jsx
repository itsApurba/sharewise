import React from 'react'
import UserForm from './UserForm'
import PostForm from './PostForm'
import { HStack } from '@chakra-ui/react'


const CreatePage = () => {
  return (
    <HStack pt={5} justify={'space-evenly'} align={'flex-start'} w={'container.md'}>
      <UserForm/>
      <PostForm/>
    </HStack>
  )
}

export default CreatePage