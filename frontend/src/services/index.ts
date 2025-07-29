// generate a digest session
const API_BASE = "http://localhost:8000/api/v1";

export const generateSession = async () => {
  const response = await fetch(`${API_BASE}/session`, {
    method: "POST",
  });
  return await response.json() as {
    session_id: string
  };
};

