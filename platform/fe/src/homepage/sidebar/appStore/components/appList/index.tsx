import React, {
	FC,
	useMemo,
	useState,
	useEffect,
	useCallback
} from 'react'
import axios from 'axios'

import {
	Col,
	Row,
	Spin,
	Empty,
	Button,
	message,
	Upload,
	Popover,
} from 'antd'
import { InboxOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { chunk } from 'lodash-es'
import compareVersion from 'compare-version'
import { LeftOutlined } from '@ant-design/icons'
import { getApiUrl } from '../../../../../utils'

import AppCard from '../appCard'
import {T_App} from '../../../../AppCtx'

import styles from './index.less'
const { Dragger } = Upload;

interface AppListProps {
	userId?: number;
	installedApps: T_App[];
	systemConfig: any;
}

const AppList: FC<AppListProps> = props => {
	const { installedApps, userId, systemConfig } = props
	const [type, setType] = useState<'installed' | 'all'>('installed')
	const [currentUpgrade, setCurrentUpgrade] = useState('')

	const [allApps, setAllApps] = useState<T_App[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		setLoading(true);

		if (type === 'all') {
			axios('/paas/api/apps/getLatestAllAppFromSource').then((res) => {
				if (res.data.code === 1) {
					setAllApps(res.data.data);
				} else {
					message.error(`获取数据发生错误：${res.data.message}`);
				}
			}).finally(() => {
				setLoading(false);
			});
		} else {
			axios('/paas/api/apps/getLatestInstalledAppFromSource').then((res) => {
				if (res.data.code === 1) {
					setAllApps(res.data.data);
				} else {
					message.error(`获取数据发生错误：${res.data.message}`);
				}
			}).finally(() => {
				setLoading(false);
			});
		}
	}, [type]);

	const appList = useMemo(() => {
		let apps =  [
			...allApps.map(app => {
				const curApp = installedApps.find(a => a.namespace === app.namespace)
			
				let operateType
				let preVersion
				if (curApp) {
					if (compareVersion(app.version, curApp.version) === 1) {
						operateType = 'update'
						preVersion = curApp.version
					} else {
						operateType = '';
						app.version = curApp.version;
					}
				} else {
					operateType = 'install'
				}
				
				return { ...app, operateType, preVersion, title: (app as any).name }
			}),
			...(type === 'installed' ? installedApps.filter(app => !allApps.find(a => a.namespace === app.namespace)).map(app => ({ ...app })) : []),
		]
		
		if (type === 'installed') {
			apps = apps.filter(app => installedApps.find(a => a.namespace === app.namespace))
		}

		return apps as T_App[]
	}, [installedApps, allApps, type])
	
	const onChangeType = useCallback((event) => {
		setType(event.target.value)
	}, [])

  const uploadProps = {
		multiple: false,
		maxCount: 1,
		showUploadList: true,
		action: getApiUrl(`/paas/api/apps/offlineUpdate?userId=${userId}`),
		onChange(info) {
			const { status } = info.file;
			console.log(info)
			if (status === 'done') {
				message.destroy()
				message.success(`上传成功，正在安装中, 请稍后(大概10s)`, 10);
				setTimeout(() => {
					message.success(`安装成功, 即将自动刷新`);
					setTimeout(() => {
						location.reload();
					}, 1000)
				}, 10 * 1000)
			} else if (status === 'error') {
				message.destroy()
				message.error(`上传失败`);
			}
		},
		onDrop(e) {
			console.log('Dropped files', e.dataTransfer.files);
		},
	};
	
	return (
		<div className={`${styles.viewContainer} fangzhou-theme`}>
			<div className={styles.header}>
				<div className={styles.title}>
					{type === 'all' && (
						<LeftOutlined
							style={{ marginRight: 10, cursor: 'pointer' }}
							onClick={() => setType('installed')}
						/>
					)}
					{type === 'all' ? '应用市场' : '我的应用'}
				</div>
				<div>
					{
						type === 'installed' &&
						<Button type='link' onClick={() => setType(c => c === 'installed' ? 'all' : 'installed')}>
							{`跳转到「应用市场」`}
						</Button>
					}
				</div>
			</div>
			<p style={{height: 32, fontSize: 16, fontWeight: 'bold'}}>
				在线更新&nbsp;
				<Popover
					content={'需要能够访问公网环境，点击下面更新按钮，即可在线更新'}
					trigger="hover"
				>
					<QuestionCircleOutlined />
				</Popover>
				{/* 已安装的 */}
			</p>
			<div className={`${styles.appList}`}>
				<Spin spinning={loading} className={styles.spin}>
					{/* <div className={styles.filter}>
						<Radio.Group onChange={onChangeType} value={type}>
							<Radio.Button value='all'>全部</Radio.Button>
							<Radio.Button value='installed'>已安装</Radio.Button>
						</Radio.Group>
					</div> */}
					<div className={styles.rightFilter}>
					</div>
					{appList.length && !loading ? (
						<div className={styles.rowContainer}>
							{chunk(appList, 2).map(([app1, app2], index) => {
								return (
									<Row key={app1.namespace} className={styles.rows} gutter={0}>
										<Col span={12}>
											<AppCard
												userId={userId}
												disabled={currentUpgrade ? currentUpgrade !== app1.namespace : false}
												setCurrentUpgrade={setCurrentUpgrade}
												style={index === chunk(appList, 2).length -1 ? { borderBottomWidth: 0 } : {}}
												app={app1}
												type={type}
											/>
										</Col>
										<Col span={12}>
											{app2 ? (
												<AppCard
													userId={userId}
													disabled={currentUpgrade ? currentUpgrade !== app2.namespace : false}
													setCurrentUpgrade={setCurrentUpgrade}
													style={index === chunk(appList, 2).length -1 ? { borderBottomWidth: 0 } : {}}
													app={app2}
													type={type}
												/>
											) : null}
										</Col>
									</Row>
								)
							})}
						</div>
					) : (
						<Empty className={styles.empty} imageStyle={{ height: '152px' }} description='暂无组件'/>
					)}
				</Spin>
			</div>
			{
				!systemConfig?.closeOfflineUpdate ? 
				(
					<div>
						<p style={{height: 32, fontSize: 16, fontWeight: 'bold'}}>
							离线更新&nbsp;
							<Popover
								content={'不需要能够访问公网环境，拖入应用安装包即可上传进行应用更新'}
								trigger="hover"
							>
								<QuestionCircleOutlined />
							</Popover>
							{/* 添加 / 更新应用 */}
						</p>
						<Dragger 
							{...uploadProps}
						>
							<p className="ant-upload-drag-icon">
								<InboxOutlined />
							</p>
							<p className="ant-upload-text">拖拽 应用安装包 至此</p>
							<p className="ant-upload-hint">
							</p>
						</Dragger>
					</div>
				) : null
			}
		</div>
	)
}

export default AppList
