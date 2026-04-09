import client from "@config/api/apiClient";

export const getProfilePinStatus = async () => {
  const response = await client.get("/users/profile/pin/status");
  return response.data.data;
};

export const setupProfilePin = async (pin) => {
  const response = await client.post("/users/profile/pin/setup", { pin });
  return response.data.data;
};

export const verifyProfilePin = async (pin) => {
  const response = await client.post("/users/profile/pin/verify", { pin });
  return response.data.data;
};
