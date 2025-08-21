// utils/api.js
import axios from "axios";

const API_BASE_URL = "https://real-time-collaborative-whiteboard-0vbu.onrender.com/canvas";

const getAuthHeaders = () => {
  const token = localStorage.getItem("whiteboard_user_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const updateCanvas = async (canvasId, elements) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/update`,
      { canvasId, elements },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    // swallow to avoid UI spam
  }
};

export const fetchInitialCanvasElements = async (canvasId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/load/${canvasId}`, {
      headers: getAuthHeaders(),
    });
    return response.data.elements;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching initial canvas elements:", error);
    return [];
  }
};