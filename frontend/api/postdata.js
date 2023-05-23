import axios from 'axios'

export const createPost = async (postData) => {
    const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/posts`, postData)
    return res.data
}

export const updatePostByID = async (postData) => {
    const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/posts/${postData.id}`, postData)
    return res.data
}