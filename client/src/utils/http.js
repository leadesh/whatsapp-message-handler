import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

export const queryClient = new QueryClient();

export const signUpHelper = async ({ formData }) => {
  const response = await axios.post("/api/signup", formData);
  return response.data;
};

export const signInHelper = async ({ formData }) => {
  const response = await axios.post("/api/signin", formData);
  return response.data;
};

export const createWhatsappServer = async () => {
  const response = await axios.get("/api/createSession");
  return response.statusText;
};

export const getQRCode = async () => {
  const response = await axios.get("/api/getQR");
  return response.data;
};
