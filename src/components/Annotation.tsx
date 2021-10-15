import React, { Component, TouchEvent, MouseEvent } from 'react';
import styled from 'styled-components';
import compose from '../utils/compose';
import isMouseHovering from '../utils/isMouseHovering';
import withRelativeMousePos, {
  WithRelativeMousePosProps,
} from '../utils/withRelativeMousePos';

import defaultProps from './defaultProps';
import Overlay from './Overlay';
import {
  IAnnotation,
  ISelector,
  RenderContentProps,
  RenderEditorProps,
  RenderHighlightProps,
  RenderOverlayProps,
  RenderSelectorProps,
} from 'types/types';

const Container = styled.div`
  clear: both;
  position: relative;
  width: 100%;
  &:hover ${Overlay} {
    opacity: 1;
  }
  touch-action: ${(props: { allowTouch?: boolean }) =>
    props.allowTouch ? 'pinch-zoom' : 'auto'};
`;

const Img = styled.img`
  display: block;
  width: 100%;
`;

const Items = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`;

const Target = Items;

interface AnnotationProps {
  innerRef: (el: HTMLImageElement) => object;
  onMouseUp?: (e: MouseEvent) => void;
  onMouseDown?: (e: MouseEvent) => void;
  onMouseMove?: (e: MouseEvent) => void;
  onClick?: (e: MouseEvent) => void;
  children?: any;
  annotations: IAnnotation[];
  type: string;
  selectors: ISelector[];

  value: IAnnotation;
  onChange: (e: IAnnotation) => void;
  onSubmit: (e: IAnnotation) => void;

  activeAnnotationComparator: (a1: IAnnotation, a2: IAnnotation) => boolean;
  activeAnnotations?: IAnnotation[];

  disableAnnotation?: boolean;
  disableSelector?: boolean;
  renderSelector: (props: RenderSelectorProps) => Element;
  disableEditor?: boolean;
  renderEditor: (props: RenderEditorProps) => Element;

  renderHighlight: (props: RenderHighlightProps) => Element;
  renderContent: (props: RenderContentProps) => Element;

  disableOverlay?: boolean;
  renderOverlay: (props: RenderOverlayProps) => Element;
  allowTouch?: boolean;

  className?: string;
  style?: object;
  alt?: string;
  src: string;
}

export default compose(
  isMouseHovering(),
  withRelativeMousePos(),
)(
  class Annotation extends Component<
    AnnotationProps & WithRelativeMousePosProps
  > {
    container: HTMLImageElement;

    static defaultProps = defaultProps;

    targetRef = React.createRef<any>();
    componentDidMount() {
      if (this.props.allowTouch) {
        this.addTargetTouchEventListeners();
      }
    }

    addTargetTouchEventListeners = () => {
      // Safari does not recognize touch-action CSS property,
      // so we need to call preventDefault ourselves to stop touch from scrolling
      // Event handlers must be set via ref to enable e.preventDefault()
      // https://github.com/facebook/react/issues/9809

      this.targetRef.current.ontouchstart = this.onTouchStart;
      this.targetRef.current.ontouchend = this.onTouchEnd;
      this.targetRef.current.ontouchmove = this.onTargetTouchMove;
      this.targetRef.current.ontouchcancel = this.onTargetTouchLeave;
    };
    removeTargetTouchEventListeners = () => {
      this.targetRef.current.ontouchstart = undefined;
      this.targetRef.current.ontouchend = undefined;
      this.targetRef.current.ontouchmove = undefined;
      this.targetRef.current.ontouchcancel = undefined;
    };

    componentDidUpdate(prevProps: Readonly<AnnotationProps>) {
      if (this.props.allowTouch !== prevProps.allowTouch) {
        if (this.props.allowTouch) {
          this.addTargetTouchEventListeners();
        } else {
          this.removeTargetTouchEventListeners();
        }
      }
    }

    setInnerRef = (el: HTMLImageElement) => {
      this.container = el;
      this.props.relativeMousePos.innerRef(el);
      this.props.innerRef(el);
    };

    getSelectorByType = (type: string): ISelector => {
      return this.props.selectors.find(s => s.TYPE === type)!;
    };

    getTopAnnotationAt = (
      x: number = 0,
      y: number = 0,
    ): IAnnotation | undefined => {
      const { annotations } = this.props;
      const { container, getSelectorByType } = this;

      if (!container) return;

      const intersections: IAnnotation[] = annotations
        .map(annotation => {
          const { geometry } = annotation;
          const selector = getSelectorByType(geometry.type);

          return selector.intersects({ x, y }, geometry, container)
            ? annotation
            : false;
        })
        .filter(a => !!a)
        .sort((a: IAnnotation, b: IAnnotation) => {
          const aSelector = getSelectorByType(a.geometry.type);
          const bSelector = getSelectorByType(b.geometry.type);

          return (
            aSelector?.area(a.geometry, container) -
            bSelector?.area(b.geometry, container)
          );
        }) as IAnnotation[];

      return intersections[0];
    };

    onTargetMouseMove = (e: MouseEvent) => {
      this.props.relativeMousePos.onMouseMove(e);
      this.onMouseMove(e);
    };
    onTargetTouchMove = (e: TouchEvent) => {
      this.props.relativeMousePos.onTouchMove(e);
      this.onTouchMove(e);
    };

    onTargetMouseLeave = (e: MouseEvent) => {
      this.props.relativeMousePos.onMouseLeave(e);
    };
    onTargetTouchLeave = (e: TouchEvent) => {
      this.props.relativeMousePos.onTouchLeave(e);
    };

    onMouseUp = (e: MouseEvent) => this.callSelectorMethod('onMouseUp', e);
    onMouseDown = (e: MouseEvent) => this.callSelectorMethod('onMouseDown', e);
    onMouseMove = (e: MouseEvent) => this.callSelectorMethod('onMouseMove', e);
    onTouchStart = (e: TouchEvent) =>
      this.callSelectorMethod('onTouchStart', e);

    onTouchEnd = (e: TouchEvent) => this.callSelectorMethod('onTouchEnd', e);
    onTouchMove = (e: TouchEvent) => this.callSelectorMethod('onTouchMove', e);
    onClick = (e: MouseEvent) => this.callSelectorMethod('onClick', e);

    onSubmit = () => {
      this.props.onSubmit(this.props.value);
    };

    callSelectorMethod = (
      methodName:
        | 'onMouseUp'
        | 'onMouseDown'
        | 'onMouseMove'
        | 'onTouchStart'
        | 'onTouchEnd'
        | 'onTouchMove'
        | 'onClick',

      e: MouseEvent | TouchEvent,
    ) => {
      if (this.props.disableAnnotation) {
        return;
      }

      if (!!this.props[methodName]) {
        (this.props[methodName] as any)(e);
      } else {
        const selector = this.getSelectorByType(this.props.type);
        if (selector && (selector.methods[methodName] as any)) {
          const value = (selector.methods[methodName] as any)(
            this.props.value,
            e,
          );

          if (typeof value === 'undefined') {
            if (process.env.NODE_ENV !== 'production') {
              console.error(`
              ${methodName} of selector type ${this.props.type} returned undefined.
              Make sure to explicitly return the previous state
            `);
            }
          } else {
            this.props.onChange(value);
          }
        }
      }
    };

    shouldAnnotationBeActive = (
      annotation: IAnnotation,
      top: IAnnotation | undefined,
    ) => {
      if (this.props.activeAnnotations) {
        const isActive = !!this.props.activeAnnotations.find(active =>
          this.props.activeAnnotationComparator(annotation, active),
        );

        return isActive || top === annotation;
      } else {
        return top === annotation;
      }
    };

    render() {
      const { props } = this;
      const {
        isMouseHovering,

        renderHighlight,
        renderContent,
        renderSelector,
        renderEditor,
        renderOverlay,
        allowTouch,
        className,
        style,
        alt,
        src,
      } = props;

      const topAnnotationAtMouse = this.getTopAnnotationAt(
        this.props.relativeMousePos.x,
        this.props.relativeMousePos.y,
      );

      return (
        <Container
          style={props.style}
          innerRef={isMouseHovering.innerRef}
          onMouseLeave={this.onTargetMouseLeave}
          onTouchCancel={this.onTargetTouchLeave}
          allowTouch={allowTouch}
        >
          <Img
            className={className}
            style={style}
            alt={alt}
            src={src}
            draggable={false}
            innerRef={this.setInnerRef}
          />
          <Items>
            {props.annotations.map(annotation =>
              renderHighlight({
                key: annotation.data.id,
                annotation,
                active: this.shouldAnnotationBeActive(
                  annotation,
                  topAnnotationAtMouse,
                ),
              }),
            )}
            {!props.disableSelector &&
              props.value &&
              props.value.geometry &&
              renderSelector({
                annotation: props.value,
              })}
          </Items>
          <Target
            innerRef={this.targetRef}
            onClick={this.onClick}
            onMouseUp={this.onMouseUp}
            onMouseDown={this.onMouseDown}
            onMouseMove={this.onTargetMouseMove}
          />
          {!props.disableOverlay &&
            renderOverlay({
              type: props.type,
              annotation: props.value,
            })}
          {props.annotations.map(
            annotation =>
              this.shouldAnnotationBeActive(annotation, topAnnotationAtMouse) &&
              renderContent({
                key: annotation.data.id,
                annotation: annotation,
              }),
          )}
          {!props.disableEditor &&
            props.value &&
            props.value.selection &&
            props.value.selection.showEditor &&
            renderEditor({
              annotation: props.value,
              onChange: props.onChange,
              onSubmit: this.onSubmit,
            })}
          <div>{props.children}</div>
        </Container>
      );
    }
  },
);
