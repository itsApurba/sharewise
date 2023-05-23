import axios from "axios";

export const createUser = async (user) => {
  const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/users`, user);
  return res.data;
};

export const updateUserByID = async (user) => {
  const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/users/${user.id}`, user);
  return res.data;
}

export const getUserByID = async (id) => {
  const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users/${id}`);
  return res.data;
}