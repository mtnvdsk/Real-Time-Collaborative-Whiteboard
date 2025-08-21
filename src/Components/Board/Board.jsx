import { useContext, useEffect, useRef } from 'react'
import rough from "roughjs"
import classes from "./Board.module.css"
import boardContext from '../store/board-context';
import { TOOL_ACTION_TYPES, TOOL_ITEMS } from '../../constants';
import toolboxContext from '../store/toolbox-context';
import socket from '../../utils/socket';
import { fetchInitialCanvasElements, updateCanvas } from '../../utils/api';
import { hydrateElements, serializeElements } from '../../utils/element';
function Board() {
  const canvasRef = useRef();
  const { activeToolItem, elements, toolActionType, clickPosition, boardMouseDownHandler, boardMouseMoveHandler, boardMouseUpHandler, textAreaBlurHandler, undo, redo, canvasId, setElements } = useContext(boardContext);
  const { toolboxState } = useContext(toolboxContext);
  const textAreaRef = useRef();
  const hydratedCanvasIdRef = useRef(null);
  useEffect(()=>{
    function handleKeydown(event){
      if(event.ctrlKey && event.key==='z'){
        undo();
      }
      else if(event.ctrlKey && event.key==='y'){
        redo();
      }
    }
    document.addEventListener("keydown",handleKeydown);
    return ()=>{
      document.removeEventListener("keydown",handleKeydown);
    };
  },[undo,redo]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  useEffect(() => {
    if (!canvasId) return;



    // Join the room for this canvas
    socket.emit('join-canvas', canvasId);

    // Only hydrate once per canvas id change
    if (hydratedCanvasIdRef.current !== canvasId) {
  
      fetchInitialCanvasElements(canvasId).then((els) => {
        if (Array.isArray(els)) {
          setElements(hydrateElements(els));
          hydratedCanvasIdRef.current = canvasId;
        }
      });
    }

    // Listen for real-time updates from other users
    const updateHandler = ({ canvasId: cid, elements: els, userId: senderId, timestamp }) => {
      if (cid === canvasId) {
    
        setElements(hydrateElements(els));
      }
    };

    // Listen for room join confirmation
    const joinHandler = ({ canvasId: cid, success }) => {
      if (cid === canvasId && success) {
    
      }
    };

    // Listen for socket connection status
    const connectHandler = () => {
  
      socket.emit('join-canvas', canvasId);
    };

    const disconnectHandler = () => {
  
    };

    socket.on('canvas-updated', updateHandler);
    socket.on('canvas-joined', joinHandler);
    socket.on('connect', connectHandler);
    socket.on('disconnect', disconnectHandler);

    return () => {
  
      socket.off('canvas-updated', updateHandler);
      socket.off('canvas-joined', joinHandler);
      socket.off('connect', connectHandler);
      socket.off('disconnect', disconnectHandler);
      // Leave the room when switching canvases
      socket.emit('leave-canvas', canvasId);
    };
  }, [canvasId, setElements]);
  useEffect(() => {
    function handleKeydown(event) {
      // Avoid intercepting shortcuts while typing in inputs/textareas
      const tag = (event.target && event.target.tagName) || "";
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (event.ctrlKey && event.key === 'z') {
        undo();
      }
      else if (event.ctrlKey && event.key === 'y') {
        redo();
      }
    }
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [undo, redo]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const roughCanvas = rough.canvas(canvas);
    elements.forEach((element) => {
      switch (element.type) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW:
          roughCanvas.draw(element.roughEle);
          break;
        case TOOL_ITEMS.BRUSH:
          context.fillStyle = element.stroke;
          context.fill(element.path);
          break;
        case TOOL_ITEMS.TEXT:
          context.textBaseline = "top";
          context.font = `${element.size}px Caveat`;
          context.fillStyle = element.stroke;
          context.fillText(element.text || "", element.x1, element.y1);
          break;
        default:
          throw new Error("Type not recognized");
      }
    });
    return () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [elements]);
  const handlemousedown = ((event) => {


    boardMouseDownHandler(event, toolboxState);
  });
  const handlemousemove = ((event) => {
    boardMouseMoveHandler(event);
  });
  const handlemouseup = ((event) => {
    boardMouseUpHandler(event);
    // Broadcast and persist latest elements on draw complete
    if (canvasId && elements.length > 0 && socket.connected) {
      const payload = serializeElements(elements);
  
      // Send final state to others
      socket.emit('update-canvas', { canvasId, elements: payload });
      // Persist latest elements to database
      updateCanvas(canvasId, payload);
    } else if (!socket.connected) {
  
      if (canvasId && elements.length > 0) {
        const payload = serializeElements(elements);
        updateCanvas(canvasId, payload);
      }
    }
  });

  // Realtime broadcast while drawing/erasing to other users (debounced)
  useEffect(() => {
    if (!canvasId || !elements.length) return;

    // Only broadcast if we're actively drawing/erasing and have elements
    if (toolActionType === TOOL_ACTION_TYPES.DRAWING || toolActionType === TOOL_ACTION_TYPES.ERASING) {
      // Debounce the broadcast to prevent spam
      const timeoutId = setTimeout(() => {
        if (socket.connected) {
          const payload = serializeElements(elements);
      
          socket.emit('update-canvas', { canvasId, elements: payload });
        } else {
      
        }
      }, 150); // 150ms debounce for better performance

      return () => clearTimeout(timeoutId);
    }
  }, [elements, toolActionType, canvasId]);
  const handleLeave = ((event) => {
    // Ensure drawing stops even if mouse leaves canvas
    boardMouseUpHandler(event);
  });
  return (
    <>
      {toolActionType === TOOL_ACTION_TYPES.WRITING && (
        <textarea
          type="text"
          ref={textAreaRef}
          className={classes.textElementBox}
          placeholder='Type here'
          style={{
            top: elements[elements.length - 1].y1,
            left: elements[elements.length - 1].x1,
            fontSize: `${elements[elements.length - 1]?.size}px`,
            color: elements[elements.length - 1]?.stroke,
          }}
          onBlur={(event) => textAreaBlurHandler(event.target.value)}
        />
      )}
      <div>
        <canvas id="canvas" ref={canvasRef} onMouseDown={handlemousedown} onMouseMove={handlemousemove} onMouseUp={handlemouseup} onMouseLeave={handleLeave} style={{ position: 'fixed', inset: 0, zIndex: 0 }} />
      </div>
    </>
  )
}

export default Board;