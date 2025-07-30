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
      debugger;
      if (response.data.success) {
        return response.data.data;
      }

      throw new Error(response.data.message);
    });
};
