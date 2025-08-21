import { ARROW_LENGTH, TOOL_ITEMS } from "../constants";
import getStroke from "perfect-freehand";

import rough from "roughjs/bin/rough";
import { getArrowHeadsCoordinates, isPointCloseToLine } from "./Math";

const gen = rough.generator();

export const createRoughElement = (
  id,
  x1,
  y1,
  x2,
  y2,
  { type, stroke, fill, size }
) => {
  const element = {
    id,
    x1,
    y1,
    x2,
    y2,
    type,
    fill,
    stroke,
    size,
  };
  let options = {
    seed: id + 1, // id can't be zero
    fillStyle: "solid",
  };
  if (stroke) {
    options.stroke = stroke;
  }
  if (fill) {
    options.fill = fill;
  }
  if (size) {
    options.strokeWidth = size;
  }
  switch (type) {
    case TOOL_ITEMS.BRUSH: {
      const brushElement = {
        id,
        points: [{ x: x1, y: y1 }],
        path: new Path2D(getSvgPathFromStroke(getStroke([{ x: x1, y: y1 }]))),
        type,
        stroke,
      };
      return brushElement;
    }
    case TOOL_ITEMS.LINE:
      element.roughEle = gen.line(x1, y1, x2, y2, options);
      return element;
    case TOOL_ITEMS.RECTANGLE:
      element.roughEle = gen.rectangle(x1, y1, x2 - x1, y2 - y1, options);
      return element;
    case TOOL_ITEMS.CIRCLE:
      const cx = (x1 + x2) / 2,
        cy = (y1 + y2) / 2;
      const width = x2 - x1,
        height = y2 - y1;
      element.roughEle = gen.ellipse(cx, cy, width, height, options);
      return element;
    case TOOL_ITEMS.ARROW:
      const { x3, y3, x4, y4 } = getArrowHeadsCoordinates(
        x1,
        y1,
        x2,
        y2,
        ARROW_LENGTH
      );
      const points = [
        [x1, y1],
        [x2, y2],
        [x3, y3],
        [x2, y2],
        [x4, y4],
      ];
      element.roughEle = gen.linearPath(points, options);
      return element;
    case TOOL_ITEMS.TEXT:
      element.text = "";
      // Ensure text has default size and stroke if not provided
      if (!element.size) element.size = 32;
      if (!element.stroke) element.stroke = "#000000";
      return element;
    default:
      throw new Error("Type not recognized");
  }
};

export const isPointNearElement = (element, pointX, pointY) => {
  const { x1, y1, x2, y2, type } = element;
  const context = document.getElementById("canvas").getContext("2d");
  switch (type) {
    case TOOL_ITEMS.LINE:
    case TOOL_ITEMS.ARROW:
      return isPointCloseToLine(x1, y1, x2, y2, pointX, pointY);
    case TOOL_ITEMS.RECTANGLE:
    case TOOL_ITEMS.CIRCLE:
      return (
        isPointCloseToLine(x1, y1, x2, y1, pointX, pointY) ||
        isPointCloseToLine(x2, y1, x2, y2, pointX, pointY) ||
        isPointCloseToLine(x2, y2, x1, y2, pointX, pointY) ||
        isPointCloseToLine(x1, y2, x1, y1, pointX, pointY)
      );
    case TOOL_ITEMS.BRUSH:
      return context.isPointInPath(element.path, pointX, pointY);
    case TOOL_ITEMS.TEXT:
      context.font = `${element.size}px Caveat`;
      context.fillStyle = element.stroke;
      const textWidth = context.measureText(element.text).width;
      const textHeight = parseInt(element.size);
      context.restore();
      return (
        isPointCloseToLine(x1, y1, x1 + textWidth, y1, pointX, pointY) ||
        isPointCloseToLine(
          x1 + textWidth,
          y1,
          x1 + textWidth,
          y1 + textHeight,
          pointX,
          pointY
        ) ||
        isPointCloseToLine(
          x1 + textWidth,
          y1 + textHeight,
          x1,
          y1 + textHeight,
          pointX,
          pointY
        ) ||
        isPointCloseToLine(x1, y1 + textHeight, x1, y1, pointX, pointY)
      );
    default:
      throw new Error("Type not recognized");
  }
};

export const getSvgPathFromStroke = (stroke) => {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
};

// Convert runtime elements (with Path2D/roughEle) into JSON-safe objects
export const serializeElements = (elements) => {
  return (elements || []).map((el) => {
    const base = {
      id: el.id,
      x1: el.x1,
      y1: el.y1,
      x2: el.x2,
      y2: el.y2,
      type: el.type,
      fill: el.fill,
      stroke: el.stroke,
      size: el.size,
      text: el.text,
    };
    if (el.type === TOOL_ITEMS.BRUSH) {
      return {
        ...base,
        points: Array.isArray(el.points) ? el.points : [],
      };
    }
    return base;
  });
};

// Rebuild runtime-only fields from JSON-safe objects
export const hydrateElements = (elements) => {
  return (elements || []).map((el, idx) => {
    if (!el) return el;
    if (el.type === TOOL_ITEMS.BRUSH) {
      const points = Array.isArray(el.points) ? el.points : [];
      return {
        id: el.id ?? idx,
        type: el.type,
        stroke: el.stroke,
        points,
        path: new Path2D(getSvgPathFromStroke(getStroke(points))),
      };
    }
    if (
      el.type === TOOL_ITEMS.LINE ||
      el.type === TOOL_ITEMS.RECTANGLE ||
      el.type === TOOL_ITEMS.CIRCLE ||
      el.type === TOOL_ITEMS.ARROW ||
      el.type === TOOL_ITEMS.TEXT
    ) {
      const hydrated = createRoughElement(
        el.id ?? idx,
        el.x1,
        el.y1,
        el.x2,
        el.y2,
        { type: el.type, stroke: el.stroke, fill: el.fill, size: el.size }
      );
      if (el.type === TOOL_ITEMS.TEXT) {
        hydrated.text = el.text || "";
      }
      return hydrated;
    }
    return el;
  });
};