import boardContext from "./board-context"
import { TOOL_ITEMS, BOARD_ACTIONS, TOOL_ACTION_TYPES } from "../../constants"
import { useCallback, useReducer, useState } from "react"
import rough from "roughjs"
import { createRoughElement } from "../../utils/element";
import getStroke from "perfect-freehand";
import { getSvgPathFromStroke, isPointNearElement } from "../../utils/element";

const gen = rough.generator();

const boardReducer = (state, action) => {
    switch (action.type) {
        case BOARD_ACTIONS.CHANGE_TOOL:
            
            return {
                ...state,
                activeToolItem: action.payload.tool,
            }
        case BOARD_ACTIONS.CHANGE_ACTION_TYPE:
            return {
                ...state,
                toolActionType: action.payload.actiontype,
            }
        case BOARD_ACTIONS.DRAW_DOWN: {
            const { clientX, clientY, stroke, fill, size } = action.payload;
            

            const newElement = createRoughElement(state.elements.length, clientX, clientY, clientX, clientY,
                { type: state.activeToolItem, stroke, fill, size });

            

            const newToolActionType = state.activeToolItem === TOOL_ITEMS.TEXT ? TOOL_ACTION_TYPES.WRITING : TOOL_ACTION_TYPES.DRAWING;
            

            return {
                ...state,
                toolActionType: newToolActionType,
                elements: [...state.elements, newElement],
            };
        };
        case BOARD_ACTIONS.DRAW_MOVE: {
            const { clientX, clientY } = action.payload;
            const newElements = [...state.elements];
            const index = newElements.length - 1;
            if (index < 0 || !newElements[index]) {
                return state;
            }
            const { type } = newElements[index];
            switch (type) {
                case TOOL_ITEMS.LINE:
                case TOOL_ITEMS.RECTANGLE:
                case TOOL_ITEMS.CIRCLE:
                case TOOL_ITEMS.ARROW: {
                    const { x1, y1, stroke, fill, size } = newElements[index] || {};
                    if (x1 == null || y1 == null) return state;
                    const newElement = createRoughElement(index, x1, y1, clientX, clientY, {
                        type: state.activeToolItem,
                        stroke,
                        fill,
                        size,
                    });
                    newElements[index] = newElement;
                    return {
                        ...state,
                        elements: newElements,
                    };
                }
                case TOOL_ITEMS.BRUSH: {
                    if (!newElements[index]) return state;
                    newElements[index].points = [
                        ...newElements[index].points,
                        { x: clientX, y: clientY },
                    ];
                    newElements[index].path = new Path2D(
                        getSvgPathFromStroke(getStroke(newElements[index].points))
                    );
                    return {
                        ...state,
                        elements: newElements,
                    };
                }
                // case TOOL_ITEMS.TEXT: {
                //     // For text, just update the position if needed
                //     if (!newElements[index]) return state;
                //     newElements[index].x2 = clientX;
                //     newElements[index].y2 = clientY;
                //     return {
                //         ...state,
                //         elements: newElements,
                //     };
                // }
                default:
                    throw new Error("Type not recognized");
            }
        };
        case BOARD_ACTIONS.CHANGE_TEXT: {
            const newElements = [...state.elements];
            const index = newElements.length - 1;
            if (index < 0 || !newElements[index]) return state;
            newElements[index].text = action.payload.text ;
            const newhistory = state.history.slice(0, state.index + 1);
            newhistory.push(newElements);
            return {
                ...state,
                toolActionType: TOOL_ACTION_TYPES.NONE,
                elements: newElements,
                history: newhistory,
                index: state.index + 1,
            };
        }
        case BOARD_ACTIONS.SET_CLICK_POSITION: {
            return {
                ...state,
                clickPosition: action.payload.position,
            };
        }
        case BOARD_ACTIONS.ERASE: {
            const { clientX, clientY } = action.payload;
            const newhistory = state.history.slice(0, state.index + 1);

            const newelements = state.elements.filter(
                (element) => {
                    return !isPointNearElement(element, clientX, clientY);

                }
            );
            newhistory.push(newelements);
            return {
                ...state,
                elements: newelements,
                history: newhistory,
                index: state.index + 1,
            };
        }
        case BOARD_ACTIONS.DRAW_UP: {
            const elementscopy = [...state.elements];
            if (elementscopy.length === 0) return state;
            const newhistory = state.history.slice(0, state.index + 1);
            newhistory.push(elementscopy);
            return {
                ...state,
                history: newhistory,
                index: state.index + 1
            }
        }
        case BOARD_ACTIONS.UNDO: {
            if (state.index <= 0) return state;
            return {
                ...state,
                elements: state.history[state.index - 1],
                index: state.index - 1,
            }
        }
        case BOARD_ACTIONS.REDO: {
            if (state.index >= state.history.length - 1) return state;
            return {
                ...state,
                elements: state.history[state.index + 1],
                index: state.index + 1,
            }
        }
        case 'SET_ELEMENTS_OVERRIDE': {
            const nextElements = Array.isArray(action.payload.elements) ? action.payload.elements : [];
            const nextHistory = state.history.slice(0, state.index + 1);
            nextHistory.push(nextElements);
            return {
                ...state,
                elements: nextElements,
                history: nextHistory,
                index: state.index + 1,
            };
        }
        case 'SET_HISTORY_OVERRIDE': {
            return {
                ...state,
                history: action.payload.history || [[]],
                index: (action.payload.history || [[]]).length - 1,
            };
        }
        default:
            return state;
    }
};

const initialBoardstate = {
    activeToolItem: TOOL_ITEMS.BRUSH,
    toolActionType: TOOL_ACTION_TYPES.NONE,
    elements: [],
    history: [[]],
    index: 0,
    clickPosition: null, // Store click position for text tool
};
function BoardProvider({ children }) {
    const [boardState, dispatchBoardAction] = useReducer(boardReducer, initialBoardstate);
    const [isUserLoggedIn, setUserLoginStatus] = useState(!!localStorage.getItem('whiteboard_user_token'));
    const [canvasId, setCanvasId] = useState(localStorage.getItem('canvas_id') || null);
    const changeToolHandler = (tool) => {
        
        dispatchBoardAction({ type: BOARD_ACTIONS.CHANGE_TOOL, payload: { tool } });
    };
    const boardMouseDownHandler = ((event, toolboxState) => {
        const { clientX, clientY } = event;
        

        if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) {
            
            return;
        }

        if (boardState.activeToolItem === TOOL_ITEMS.ERASER) {
            
            dispatchBoardAction({
                type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
                payload: {
                    actiontype: TOOL_ACTION_TYPES.ERASING,
                }
            });
            dispatchBoardAction({
                type: BOARD_ACTIONS.ERASE,
                payload: {
                    clientX,
                    clientY
                }
            });
            return;
        }

        // Handle text tool specifically
        // if (boardState.activeToolItem === TOOL_ITEMS.TEXT) {
        
        //     const stroke = toolboxState[boardState.activeToolItem]?.stroke ;
        //     const size = toolboxState[boardState.activeToolItem]?.size;

        

        //     // Store the click position for the textarea
        //     dispatchBoardAction({
        //         type: BOARD_ACTIONS.SET_CLICK_POSITION,
        //         payload: {
        //             position: { x: clientX, y: clientY }
        //         }
        //     });

        //     // Create text element and set to WRITING mode
        //     dispatchBoardAction({
        //         type: BOARD_ACTIONS.DRAW_DOWN,
        //         payload: {
        //             clientX,
        //             clientY,
        //             stroke,
        //             fill: toolboxState[boardState.activeToolItem]?.fill, // Text doesn't need fill
        //             size,
        //         }
        //     });
        
        //     return;
        // }

        // Handle other drawing tools
        
        const stroke = toolboxState[boardState.activeToolItem]?.stroke;
        const fill = toolboxState[boardState.activeToolItem]?.fill;
        const size = toolboxState[boardState.activeToolItem]?.size;
        dispatchBoardAction({
            type: BOARD_ACTIONS.DRAW_DOWN,
            payload: {
                clientX,
                clientY,
                stroke,
                fill,
                size,
            }
        });
    });

    const boardMouseMoveHandler = ((event) => {
        if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
        const { clientX, clientY } = event;
        if (boardState.toolActionType === TOOL_ACTION_TYPES.ERASING) {
            dispatchBoardAction({
                type: BOARD_ACTIONS.ERASE,
                payload: { clientX, clientY },
            });
            return;
        }
        // Only move when currently drawing or erasing
        if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
            dispatchBoardAction({
                type: BOARD_ACTIONS.DRAW_MOVE,
                payload: { clientX, clientY },
            });
        }
    });

    const boardMouseUpHandler = () => {
        if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
        if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
            dispatchBoardAction({ type: BOARD_ACTIONS.DRAW_UP });
        }
        dispatchBoardAction({
            type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
            payload: { actiontype: TOOL_ACTION_TYPES.NONE },
        });
    };
    const textAreaBlurHandler = (text) => {
        dispatchBoardAction({
            type: BOARD_ACTIONS.CHANGE_TEXT,
            payload: {
                text,
            }
        })
    };
    const boardUndoHandler = useCallback(() => {
        dispatchBoardAction({
            type: BOARD_ACTIONS.UNDO,
        })
    });
    const boardRedoHandler = useCallback(() => {
        dispatchBoardAction({
            type: BOARD_ACTIONS.REDO,
        })
    });
    const boardContextValue = {
        activeToolItem: boardState.activeToolItem,
        toolActionType: boardState.toolActionType,
        elements: boardState.elements,
        clickPosition: boardState.clickPosition,
        changeToolHandler,
        boardMouseDownHandler,
        boardMouseMoveHandler,
        boardMouseUpHandler,
        textAreaBlurHandler,
        undo: boardUndoHandler,
        redo: boardRedoHandler,
        // Extra app state for auth/canvas
        isUserLoggedIn,
        setUserLoginStatus,
        canvasId,
        setCanvasId: (id) => {
            localStorage.setItem('canvas_id', id || "");
            setCanvasId(id);
        },
        setElements: (els) => {
            dispatchBoardAction({ type: 'SET_ELEMENTS_OVERRIDE', payload: { elements: els } });
        },
        setHistory: (hist) => {
            dispatchBoardAction({ type: 'SET_HISTORY_OVERRIDE', payload: { history: hist } });
        },
    };

    return (
        <boardContext.Provider value={boardContextValue}>{children}</boardContext.Provider>
    );
};

export default BoardProvider;