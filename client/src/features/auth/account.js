import client from "@config/api/apiClient";

export const getAccountContext = async (profileId = "") => {
  const headers = profileId ? { "x-profile-id": profileId } : undefined;
  const response = await client.get("/auth/context", { headers });
  return response.data.data;
};

export const getProfiles = async () => {
  const response = await client.get("/users/profiles");
  return response.data.data;
};

export const createProfile = async (payload) => {
  const response = await client.post("/users/profiles", payload);
  return response.data.data;
};
