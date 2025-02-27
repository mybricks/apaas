import React, { useEffect, useRef, useState, CSSProperties, ReactNode } from 'react';
import { throttle } from 'throttle-debounce';
import { ThresholdUnits, parseThreshold } from './threshold';

type Fn = () => any;

interface Props {
  // 加载更多数据的函数
  next: Fn;
  // 是否还有更多数据
  hasMore: boolean;
  // 列表内容
  children: ReactNode;
  // 是否加载中
  loading: boolean;
  // 加载中显示的组件
  loader: ReactNode;
  // 触发加载的滚动阈值，可以是百分比或具体像素值
  scrollThreshold?: number | string;
  // 没有更多数据时显示的内容
  endMessage?: ReactNode;
  // 自定义样式
  style?: CSSProperties;
  // 容器高度，设置后将使用固定高度
  height?: number | string;
  // 自定义滚动容器
  scrollableTarget?: ReactNode;
  // 是否有子元素
  hasChildren?: boolean;
  // 是否反转滚动方向
  inverse?: boolean;
  // 滚动事件回调
  onScroll?: (e: MouseEvent) => any;
  // 当前数据长度，用于判断数据是否更新
  dataLength: number;
  // 初始滚动位置
  initialScrollY?: number;
  // 自定义类名
  className?: string;
}

const InfiniteScroll: React.FC<Props> = (props) => {
  const [prevDataLength, setPrevDataLength] = useState(props.dataLength);

  const { loading } = props;

  // Refs
  const scrollableNode = useRef<HTMLElement | null>(null);
  const infScrollRef = useRef<HTMLDivElement>(null);
  // 用于防止重复触发加载
  const actionTriggered = useRef(false);

  const propsRef = useRef(props);


  useEffect(() => {
    propsRef.current = props
  }, [props])

  // 获取可滚动的目标元素
  const getScrollableTarget = () => {
    if (props.scrollableTarget instanceof HTMLElement) return props.scrollableTarget;
    if (typeof props.scrollableTarget === 'string') {
      return document.getElementById(props.scrollableTarget);
    }
    if (props.scrollableTarget === null) {
      console.warn('You are trying to pass scrollableTarget but it is null.');
    }
    return null;
  };

  // 判断是否滚动到底部
  const isElementAtBottom = (target: HTMLElement, scrollThreshold: string | number = 0.8) => {
    const clientHeight =
      target === document.body || target === document.documentElement
        ? window.screen.availHeight
        : target.clientHeight;

    const threshold = parseThreshold(scrollThreshold);

    // 根据阈值单位（像素或百分比）计算是否到达底部
    if (threshold.unit === ThresholdUnits.Pixel) {
      return (
        target.scrollTop + clientHeight >= target.scrollHeight - threshold.value
      );
    }

    return (
      target.scrollTop + clientHeight >=
      (threshold.value / 100) * target.scrollHeight
    );
  };

  // 滚动事件处理函数，使用节流避免过于频繁触发
  const onScrollListener = throttle(150, (event: MouseEvent) => {
    // 执行自定义滚动回调
    if (typeof props.onScroll === 'function') {
      setTimeout(() => props.onScroll && props.onScroll(event), 0);
    }

    // 确定滚动的目标元素
    const target =
      props.height || scrollableNode.current
        ? (event.target as HTMLElement)
        : document.documentElement.scrollTop
        ? document.documentElement
        : document.body;

    // 如果已经触发加载，则返回
    if (actionTriggered.current) return;

    // 检查是否滚动到底部
    const atBottom = isElementAtBottom(target, propsRef.current.scrollThreshold);

    // 如果到达底部且还有更多数据，触发加载
    if (atBottom && propsRef.current.hasMore) {
      actionTriggered.current = true;
      propsRef.current.next &&  propsRef.current.next();
    }
  });

  // 组件挂载和卸载时的处理
  useEffect(() => {
    // 验证必要属性
    if (typeof props.dataLength === 'undefined') {
      throw new Error(
        'mandatory prop "dataLength" is missing. The prop is needed when loading more content.'
      );
    }

    // 初始化滚动节点
    scrollableNode.current = getScrollableTarget();
    const el = props.height ? infScrollRef.current : scrollableNode.current || window;

    // 添加滚动事件监听
    if (el) {
      el.addEventListener('scroll', onScrollListener as EventListenerOrEventListenerObject);
    }

    // 设置初始滚动位置
    if (
      typeof props.initialScrollY === 'number' &&
      el &&
      el instanceof HTMLElement &&
      el.scrollHeight > props.initialScrollY
    ) {
      el.scrollTo(0, props.initialScrollY);
    }

    // 清理函数
    return () => {
      if (el) {
        el.removeEventListener(
          'scroll',
          onScrollListener as EventListenerOrEventListenerObject
        );
      }
    };
  }, []);

  // 监听数据长度变化
  useEffect(() => {
    if (props.dataLength === prevDataLength) return;

    // 重置加载状态
    actionTriggered.current = false;
    setPrevDataLength(props.dataLength);
  }, [props.dataLength, prevDataLength]);

  // 基础样式设置
  const style = {
    height: props.height || 'auto',
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
    ...props.style,
  } as CSSProperties;

  return (
    <div className="infinite-scroll-component__outerdiv">
      <div
        className={`infinite-scroll-component ${props.className || ''}`}
        ref={infScrollRef}
        style={{ ...style, display: 'flex', flexWrap: 'wrap' }}
      >
        {props.children}
        {/* 根据不同状态显示加载器或结束信息 */}
        {loading && props.loader}
        {!props.hasMore && !loading && props.endMessage}
      </div>
    </div>
  );
};

export default InfiniteScroll;