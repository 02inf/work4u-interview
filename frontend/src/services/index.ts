import axios from "axios";
import type { components } from "./schema";
// generate a digest session
const API_BASE = "http://localhost:8000/api/v1";

export const generateSession = () => {
  return axios
    .post<components["schemas"]["APIResponse_SessionResponse_"]>(
      `${API_BASE}/session`
    )
    .then((response) => {
      if (response.data.success) {
        return response.data.data;
      }

      throw new Error(response.data.message);
    });
};

export const getSessions = () => {
  return axios
    .get<components["schemas"]["APIResponse_List_SessionResponse__"]>(
      `${API_BASE}/sessions`
    )
    .then((response) => {
      return response.data.data;
    });
};

export const getSessionChats = (session_id: string) => {
  return axios
    .get<components["schemas"]["APIResponse_List_ChatResponse__"]>(
      `${API_BASE}/sessions/${session_id}/chats`
    )
    .then((response) => {
      return response.data.data;
    });
};
