import React, { Component, ComponentType, FunctionComponent } from 'react';
import { getOffsetCoordPercentage } from './offsetCoordinates';

export interface WithRelativeMousePosProps {
  innerRef: (el: HTMLImageElement) => void;
  onMouseMove: (e: MouseEvent) => void;
  onMouseLeave: (e: MouseEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchLeave: (e: TouchEvent) => void;
  x: number | null;
  y: number | null;
}
const withRelativeMousePos =
  <T extends {}>(key = 'relativeMousePos') =>
  (DecoratedComponent: ComponentType<T & WithRelativeMousePosProps>) => {
    class WithRelativeMousePos extends Component<T> {
      state = { x: null, y: null };
      container: HTMLImageElement;

      innerRef = (el: HTMLImageElement) => {
        this.container = el;
      };

      onMouseMove = (e: MouseEvent) => {
        const xystate = getOffsetCoordPercentage(e);
        this.setState(xystate);
      };
      onTouchMove = (e: TouchEvent) => {
        if (e.targetTouches.length === 1) {
          const touch = e.targetTouches[0];

          const offsetX =
            touch.pageX -
            (this.container?.offsetParent as HTMLDivElement)?.offsetLeft;
          const offsetY =
            touch.pageY -
            (this.container?.offsetParent as HTMLDivElement)?.offsetTop;

          this.setState({
            x: (offsetX / this.container.width) * 100,
            y: (offsetY / this.container.height) * 100,
          });
        }
      };

      onMouseLeave = (e: MouseEvent) => {
        this.setState({ x: null, y: null });
      };
      onTouchLeave = (e: TouchEvent) => {
        this.setState({ x: null, y: null });
      };

      render() {
        const props: WithRelativeMousePosProps = {
          innerRef: this.innerRef,
          onMouseMove: this.onMouseMove,
          onMouseLeave: this.onMouseLeave,
          onTouchMove: this.onTouchMove,
          onTouchLeave: this.onTouchLeave,
          x: this.state.x,
          y: this.state.y,
        };
        const hocProps = {
          [key]: props,
        };

        return <DecoratedComponent {...this.props} {...hocProps} />;
      }
    }

    WithRelativeMousePos.displayName = `withRelativeMousePos(${DecoratedComponent.displayName})`;

    return WithRelativeMousePos;
  };

export default withRelativeMousePos;
