import { MouseEvent } from 'react';

export interface IPoint {
  x: number;
  y: number;
}

export interface IGeometry {
  type: string;
  x: number;
  y: number;
  height: number;
  width: number;
}
export interface ISelector {
  TYPE: string;
  intersects: (
    { x, y }: { x: number; y: number },
    geometry: IGeometry,
    container: { width: number; height: number },
  ) => boolean;
  area: (
    geometry: IGeometry,
    container: { width: number; height: number },
  ) => number;
  methods: {
    onMouseUp?: (annotation: IAnnotation, e: any) => IAnnotation | {};
    onMouseDown?: (annotation: IAnnotation, e: any) => IAnnotation | {};
    onMouseMove?: (annotation: IAnnotation, e: any) => IAnnotation | {};
    onClick?: (annotation: IAnnotation, e: any) => IAnnotation | {};
  };
}

export interface IAnnotation {
  selection?: {
    mode: string;
    showEditor: boolean;
    anchorX?: number;
    anchorY?: number;
  };
  geometry: IGeometry;
  data: {
    text: string;
    id?: number;
  };
}

export interface RenderEditorProps {
  annotation: IAnnotation;
  onChange: (a: IAnnotation) => void;
  onSubmit: (e: MouseEvent<HTMLDivElement>) => void;
}

export interface RenderContentProps {
  key?: number;
  annotation: IAnnotation;
}

export interface RenderOverlayProps {
  type?: string;
  annotation: IAnnotation;
}

export interface RenderHighlightProps {
  key?: number;
  active?: boolean;
  annotation: IAnnotation;
}

export interface RenderSelectorProps {
  annotation: IAnnotation;
}
