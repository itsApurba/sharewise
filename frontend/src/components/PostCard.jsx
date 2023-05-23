import { Button, Text, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { getUserByID } from '../../api/userdata'
import { dislikePost, likePost } from '../../api/postdata'

const PostCard = ({post}) => {
    const [user, setUser] = useState(null)
    const [likes, setLikes] = useState(post.likes)
    // console.log(post)
    useEffect(() => {
       getUserByID(post.user_id).then((res) => {
         setUser(res)
       })
    },[])
    // console.log(post)
    const handleLike = () => {
      likePost(post._id).then((res) => {
        setLikes(res.likes)
      })
    }
    const handleDislike = () => {
      dislikePost(post._id).then((res) => {
        setLikes(res.likes)
      }).catch((err) => {
        console.log(err)
      })
    }
  return (
    <>
    {/* username */}
    <VStack align={'flex-start'}>
        {user && <Text>By: {user.name}</Text>}
        <Text>{post.content}</Text>
        <Text>{likes}</Text>
        <Button onClick={handleLike}>Like</Button>
        <Button onClick={handleDislike}>Dislike</Button>
    </VStack>
    </>
  )
}

export default PostCard