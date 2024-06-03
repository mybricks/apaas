import React, { useState, useCallback } from 'react';

import { Modal } from 'antd';

export interface Props {
  /** 标题 */
  title?: React.ReactNode;
  /** 宽度 */
  width?: string | number | undefined;
  /** 内容区 */
  content: React.ReactNode;
  /** 类型，暂时只有modal弹窗 */
  type?: 'modal'
	/** 点击蒙层关闭 */
	maskClosable?: boolean
}

export function usePanelItem ({
	title = '',
	width = 800,
	content,
	type = 'modal',
	maskClosable = false
}: Props) {
	const [show, setShow] = useState(false);
	const showModal = useCallback(() => {
		setShow(true);
	}, []);

	return {
		showPanel: type === 'modal' ? showModal : () => {},
		Content: ( type === 'modal' ?
      // @ts-ignore
			<Modal
				title={title}
				footer={false}
				width={width}
				style={{ maxWidth: '90vw' }}
				destroyOnClose
				onCancel={() => setShow(false)}
				open={show}
				maskClosable={maskClosable}
			>
				{content}
			</Modal> : null 
		)
	};
}
