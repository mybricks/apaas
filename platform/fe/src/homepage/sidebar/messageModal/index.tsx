import React, {
	FC,
	useState,
	useCallback
} from 'react'

import {
	Empty,
	Button,
	message,
	Collapse
} from 'antd'
import {CaretRightOutlined} from '@ant-design/icons'

import styles from './index.less'

const { Panel } = Collapse



const MessageModal = props => {
	const { appsMap, messages, onDelete } = props
	// console.log('内部消息是', messages)
	// console.log('收到应用枚举是', appsMap)

	const _renderMessageContent = () => {
		if(messages.length) {
			let items = [];
			messages.map((message, index) => {
				if(message.type === 'platform') {
					items.push(
						<Panel 
							header={<div style={{color: 'black'}}>你收到一条来自于 <span style={{color: 'red'}}>平台</span> 的消息：</div>} 
							key={'open'} 
							className="site-collapse-custom-panel"
							collapsible={'disabled'}
							showArrow={false}
							
							extra={
								<Button 
									data-message={JSON.stringify({id: message.id, updateTime: message.updateTime, index})}
									onClick={(e) => {
										const message = JSON.parse(e.currentTarget?.dataset?.message)
										if(message) {
											onDelete(message)
										}
									}}
								>
									关闭
								</Button>
							}
						>
							{message.content}
						</Panel>
					)
				} else {
					const appName = appsMap?.[message.name]?.title
					items.push(
						<Panel 
							header={<div style={{color: 'black'}}>你收到一条来自于应用 <span style={{color: 'red'}}>{appName}</span> 的消息：</div>} 
							key={'open'} 
							collapsible={'disabled'}
							showArrow={false}
							className="site-collapse-custom-panel"
							extra={
								<Button
									data-message={JSON.stringify({id: message.id, updateTime: message.updateTime, index})} 
									onClick={(e) => {
									const message = JSON.parse(e.currentTarget?.dataset?.message)
										if(message) {
											onDelete(message)
										}
									}
								}
							>
								关闭
							</Button>
						}
						>
							{message.content}
						</Panel>
					)
				}
				
			})
			return (
				<Collapse
				  bordered={false}
					defaultActiveKey={['open']}
				  expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
				  className="site-collapse-custom-collapse"
			  >
				  {...items}
			  </Collapse>
			)
		} else {
			return (
				<div className={styles.empty}>
					<Empty description="暂无消息" />
				</div>
			) 
		}
	}

  return (
		<div className={`${styles.messageModal} fangzhou-theme`} style={{ minHeight: '400px' }}>
			{_renderMessageContent()}
		</div>
  )
}

export default MessageModal
