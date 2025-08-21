import { createContext } from "react";

const boardContext = createContext({
  activeToolItem: "",
  toolActionType: "",
  elements: [],
  clickPosition: null,
  history: [[]],
  index: 0,
  boardMouseDownHandler: () => { },
  changeToolHandler: () => { },
  boardMouseMoveHandler: () => { },
  boardMouseUpHandler: () => { },
  textAreaBlurHandler: () => { },
  isUserLoggedIn: false,
  setUserLoginStatus: () => { },
  canvasId: null,
  setCanvasId: () => { },
  setElements: () => { },
  setHistory: () => { },
  undo: () => { },
  redo: () => { },
});

export default boardContext;