import React, { FC, useMemo, useState, useCallback } from 'react'
import axios from 'axios'
import { Button, message, Typography, Popover, Dropdown, Menu } from 'antd'

import { T_App } from '../../../../AppCtx'

import styles from './index.less'

interface AppCardProps {
	app: T_App & { installInfo?: string; operateType?: string; preVersion?: string };
	setCurrentUpgrade(namespace: string): void;
	disabled: boolean;
	userId?: number;
	style: any,
	type: 'installed' | 'all'
}

const { Paragraph } = Typography
const LOADING_KEY = 'upgrade-loading'
const safeParse = (content = '', defaultValue = {}) => {
	try {
		return JSON.parse(content)
	} catch {
		return defaultValue
	}
}
const AppCard: FC<AppCardProps> = props => {
	const { app, setCurrentUpgrade, disabled, style, userId } = props
	const [loading, setLoading] = useState(false)
	const [popoverOpen, setPopoverOpen] = useState(false);

	const operateText = useMemo(() => {
		if (app.operateType === 'install') {
			return '获取'
		} else if (app.operateType === 'update') {
			return '更新'
		}
		
		return ''
	}, [app])
	const changeLog = useMemo(() => {
		const installInfo = safeParse(app.installInfo)
		
		return installInfo?.changeLog
	}, [app])
	const reset = useCallback(() => {
		setLoading(false)
		setCurrentUpgrade('')
	}, [])
	
	/** 轮询判断应用安装状态 */
	const checkUpgradeStatus = useCallback((appInfo, immediate = false, action = 'update') => {
		const { namespace, version } = appInfo
		
		setTimeout(() => {
			axios({
				method: 'get',
				url: '/paas/api/apps/update/status',
				params: { namespace, version, action },
				// timeout: 3000,
			}).then(res => {
				if (res.data.code === 1) {
					setTimeout(() => location.reload(), 5000)
					reset()
					
					message.open({
						type: 'success',
						content: '操作成功，刷新页面可立即体验新功能，5 秒后将自动刷新页面~',
						key: LOADING_KEY,
						duration: 5,
					})
				} else if (res.data.code === -1) {
					reset()
					message.open({
						type: 'error',
						content: res.data.message || (app.operateType === 'install' ? '应用安装失败' : '应用升级失败'),
						key: LOADING_KEY,
						duration: 3,
					})
				} else {
					checkUpgradeStatus(appInfo, false, action)
				}
			}).catch(() => {
				checkUpgradeStatus(appInfo, false, action)
			});
		}, immediate ? 0 : 5000)
	}, [app, setCurrentUpgrade])
	
	const upgrade = useCallback((_param?: any) => {
		let appInfo = null
		if(_param) {
			appInfo = _param
		} else {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { icon, description, ...otherInfo } = app
			appInfo = otherInfo
		}
		setLoading(true)
		setCurrentUpgrade(app.namespace)
		message.open({
			type: 'loading',
			content: '系统升级中...',
			duration: 0,
			key: LOADING_KEY,
		});
		appInfo.userId = userId;

		axios({
			method: 'post',
			url: '/paas/api/apps/update',
			data: appInfo,
			// timeout: 30000,
		}).then(res => {
			if (res.data.code === 1) {
				checkUpgradeStatus(appInfo, false)
			} else {
				reset()
				
				message.open({
					type: 'error',
					content: res.data.msg || (app.operateType === 'install' ? '应用安装失败' : '应用升级失败'),
					key: LOADING_KEY,
					duration: 3,
				})
			}
		}).catch(error => {
			console.log(error)
			reset()
			if(error?.code === "ERR_BAD_RESPONSE") {
				checkUpgradeStatus(appInfo, false)
				return
			}
			
			message.open({
				type: 'error',
				content: error.message || (app.operateType === 'install' ? '应用安装失败' : '应用升级失败'),
				key: LOADING_KEY,
				duration: 3,
			})
		})
	}, [app, setCurrentUpgrade, userId]);

	const uninstall = useCallback(() => {
		setLoading(true)
		setCurrentUpgrade(app.namespace)
		message.open({
			type: 'loading',
			content: '应用卸载中...',
			duration: 0,
			key: LOADING_KEY,
		});

		axios({
			method: 'post',
			url: '/paas/api/apps/uninstall',
			data: { userId, namespace: app.namespace, name: app.title },
			// timeout: 30000,
		}).then(res => {
			if (res.data.code === 1) {
				checkUpgradeStatus(app, false, 'uninstall')
			} else {
				reset()

				message.open({
					type: 'error',
					content: res.data.msg || '应用卸载失败',
					key: LOADING_KEY,
					duration: 3,
				})
			}
		}).catch(error => {
			console.log(error)
			reset()
			if(error?.code === "ERR_BAD_RESPONSE") {
				checkUpgradeStatus(app, false, 'uninstall')
				return
			}

			message.open({
				type: 'error',
				content: error.message || '应用卸载失败',
				key: LOADING_KEY,
				duration: 3,
			})
		})
	}, [app, setCurrentUpgrade, userId]);

	const _renderRollbackContent = useCallback(() => {
		return (
			<div
				style={{display: 'flex', flexDirection: 'column'}}
				onClick={(e) => {
					e.stopPropagation()
					const currentApp = app?.previousList?.[(e.target as HTMLDivElement)?.dataset?.index];
					upgrade(currentApp)
				}}
			>
				{
					app?.previousList?.map((item, index) => {
						return (
							<p data-index={index} style={ loading ? {marginTop: 8, color: 'gray', cursor: 'not-allowed'} : {marginTop: 8, color: '#ff4d4f', cursor: 'pointer'}}>回滚到：{item.version} 版本</p>
						)
					})
				}
			</div>
		)
	}, [popoverOpen, loading])
	
	return (
	  <div className={styles.appCard} style={style}>
		  <div className={styles.header}>
			  <div className={styles.infoContainer}>
				  <div className={styles.icon} style={{ backgroundImage: `url(${app.icon})` }} />
				  <div className={styles.info}>
					  <div className={styles.title}>
							{app.title}
						</div>
					  <div className={styles.version}>
						  {app.operateType === 'update' ? <p>Version 由 <span style={{color: '#1677ff'}}>{app.preVersion}</span> 升级到 <span style={{color: '#ff4d4f'}}>{app.version}</span></p> : `Version ${app.version}`}
						</div>
				  </div>
			  </div>
			  <div className={styles.operate}>
				  {operateText ? (
						  <Button
							  disabled={disabled}
							  type="text"
							  size="small"
							  loading={loading}
							  className={styles.button}
							  onClick={() => {
									upgrade()
								}}
						  >
							  {operateText}
						</Button>
					 ) : null}
					{/* {
						app?.previousList?.length ?	(
							<Popover
								content={_renderRollbackContent()}
								title="历史版本"
								trigger="click"
								open={popoverOpen}
								onOpenChange={(newOpen) => setPopoverOpen(newOpen)}
							>
								<Button
									disabled={disabled || loading}
									type="link"
									size="small"
									style={{ marginLeft: 10 }}
								>
									历史版本
								</Button>
							</Popover>
						) : null
					} */}
					{
						props?.type === 'installed' && <div className={styles.moreIcon}>
							<Dropdown
								placement="bottomCenter"
								overlay={(
									<Menu>
										<Menu.Item>
											<Button danger size="small" type="text" ghost style={{ width: '100%' }} onClick={uninstall}>卸载</Button>
										</Menu.Item>
									</Menu>
								)}
							>
								<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
									<path d="M243.2 512m-83.2 0a1.3 1.3 0 1 0 166.4 0 1.3 1.3 0 1 0-166.4 0Z"></path>
									<path d="M512 512m-83.2 0a1.3 1.3 0 1 0 166.4 0 1.3 1.3 0 1 0-166.4 0Z"></path>
									<path d="M780.8 512m-83.2 0a1.3 1.3 0 1 0 166.4 0 1.3 1.3 0 1 0-166.4 0Z"></path>
								</svg>
							</Dropdown>
						</div>
					}
			  </div>
		  </div>
		  <div className={styles.description}>
			  <Paragraph
				  ellipsis={{
					  rows: 4,
					  expandable: true,
					  symbol: '更多',
				  }}
				  style={{ whiteSpace: 'pre-line' }}
			  >
				  {changeLog}
			  </Paragraph>
		  </div>
	  </div>
	)
}

export default AppCard