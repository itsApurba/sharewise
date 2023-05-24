import axios from "axios";

export const getAllUsers = async () => {
  const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users`);
  return res.data;
}

export const createUser = async (user) => {
  const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/users`, user);
  return res.data;
};

export const updateUserByID = async ({data,formData}) => {
  console.log(data,formData)
  const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/users/${data._id}`, formData);
  return res.data;
}

export const getUserByID = async (id) => {
  const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users/${id}`);
  return res.data;
}
export const deleteUserById = async (id) => {
  const res = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/users/${id}`);
  return res.data;
}