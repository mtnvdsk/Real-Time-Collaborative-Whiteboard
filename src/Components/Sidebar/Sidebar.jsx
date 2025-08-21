import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './Sidebar.min.css';
import { useNavigate, useParams } from 'react-router-dom';
import boardContext from '../store/board-context';

const Sidebar = () => {
  const [canvases, setCanvases] = useState([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem('whiteboard_user_token');
  const { canvasId, setCanvasId, setElements, setHistory, isUserLoggedIn, setUserLoginStatus } = useContext(boardContext);
  const navigate = useNavigate();
  const { id } = useParams();


  useEffect(() => {
    if (token && !isUserLoggedIn) {
      setUserLoginStatus(true);
    }
  }, [token, isUserLoggedIn, setUserLoginStatus]);

  useEffect(() => {
    if (isUserLoggedIn) {
      fetchCanvases();
    }
  }, [isUserLoggedIn]);

  const fetchCanvases = async () => {
    try {
      const response = await axios.get('https://real-time-collaborative-whiteboard-0vbu.onrender.com/canvas/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCanvases(response.data);

      if (response.data.length === 0) {
        const newCanvas = await handleCreateCanvas();
        if (newCanvas) {
          setCanvasId(newCanvas._id);
          handleCanvasClick(newCanvas._id);
        }
      } else if (!canvasId && response.data.length > 0) {
        if (!id) {
          setCanvasId(response.data[0]._id);
          handleCanvasClick(response.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching canvases:', error);
    }
  };

  const handleCreateCanvas = async () => {
    try {
      const response = await axios.post('https://real-time-collaborative-whiteboard-0vbu.onrender.com/canvas/create', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCanvases();
      setCanvasId(response.data.canvasId);
      handleCanvasClick(response.data.canvasId);
      return response.data;
    } catch (error) {
      console.error('Error creating canvas:', error);
      return null;
    }
  };

  const handleDeleteCanvas = async (id) => {
    try {

      // Prevent deleting the currently active canvas without proper cleanup
      if (id === canvasId) {

        // Clear current canvas context first
        setCanvasId(null);
        setElements([]);
        setHistory([]);
      }

      const deleteResponse = await axios.delete(`https://real-time-collaborative-whiteboard-0vbu.onrender.com/canvas/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });


      // Refresh the canvas list
      await fetchCanvases();

      // If we deleted the current canvas, navigate to home or first available
      if (id === canvasId) {
        if (canvases.length > 1) {
          // Navigate to first available canvas
          const remainingCanvases = canvases.filter(c => c._id !== id);
          if (remainingCanvases.length > 0) {
            const nextId = remainingCanvases[0]._id;
            setCanvasId(nextId);
            navigate(`/${nextId}`);
          } else {
            navigate('/');
          }
        } else {
          // No canvases left, go home
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error deleting canvas:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      // Revert any context changes on error
      if (id === canvasId) {
        await fetchCanvases();
      }
    }
  };

  const handleCanvasClick = (id) => {
    setCanvasId(id);
    navigate(`/${id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('whiteboard_user_token');
    localStorage.removeItem('canvas_id');
    setCanvases([]);
    setUserLoginStatus(false);
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleShare = async () => {
    if (!email.trim()) {
      setError("Please enter an email.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await axios.put(
        `https://real-time-collaborative-whiteboard-0vbu.onrender.com/canvas/share/${canvasId}`,
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(response.data.message);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to share canvas.");
      setTimeout(() => setError(""), 5000);
    }
  };

  return (
    <div className="sidebar">
      <button
        className="create-button"
        onClick={handleCreateCanvas}
        disabled={!isUserLoggedIn}
      >
        + Create New Canvas
      </button>

      <ul className="canvas-list">
        {canvases.map(canvas => (
          <li
            key={canvas._id}
            className={`canvas-item ${canvas._id === canvasId ? 'selected' : ''}`}
          >
            <span
              className="canvas-name"
              onClick={() => handleCanvasClick(canvas._id)}
            >
              {canvas._id}
            </span>
            <button
              className="delete-button"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete this canvas? This action cannot be undone.`)) {
                  handleDeleteCanvas(canvas._id);
                }
              }}
            >
              del
            </button>
          </li>
        ))}
      </ul>

      <div className="share-container">
        <input
          type="email"
          placeholder="Enter the email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="share-button" onClick={handleShare} disabled={!isUserLoggedIn}>
          Share
        </button>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </div>

      {isUserLoggedIn ? (
        <button className="auth-button logout-button" onClick={handleLogout}>
          Logout
        </button>
      ) : (
        <button className="auth-button login-button" onClick={handleLogin}>
          Login
        </button>
      )}
    </div>
  );
};

export default Sidebar;
