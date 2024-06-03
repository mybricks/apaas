import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Breadcrumb, Button, Form, Input, message, Modal, Switch, Table } from 'antd';
import moment from 'moment';
import axios from 'axios';
import { copyText } from '@/utils';
import { Content } from '../../content';
import { Folder, File, UploadIcon } from '@/components';
import CustomUpload from './custom-upload';
import { ConfigFormModal } from '../files/info/group';

import styles from './index.less';

interface AssetProps {}
type Path = {
	type: 'folder' | 'file' | string,
	name: string;
	path: string;
};
type FileItem = {
	type: 'folder' | 'file' | string,
	name: string;
	url: string;
	updateTime: string;
	size: number;
};

const MB_SIZE_GAP = 1024 * 1024;
const formatFileSize = size => {
	if (size < 0) {
		return '-';
	} else if (size >= 0 && size < MB_SIZE_GAP) {
		return (size / 1024).toFixed(2)
			.replace(/\.00$/, '')
			.replace(/\.0$/, '')
			+ 'KB';
	} else {
		return (size / MB_SIZE_GAP).toFixed(2)
			.replace(/\.00$/, '')
			.replace(/\.0$/, '')
			+ 'MB';
	}
};
const ROOT_PATH = { type: 'folder', path: '.', name: '根目录' };
const Asset: FC<AssetProps> = () => {
	const [paths, setPaths] = useState<Path[]>([ROOT_PATH]);
	const [dataSource, setDataSource] = useState<FileItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [showCategoryModal, setShowCategoryModal] = useState(false);
	const [curDeleteAsset, setCurDeleteAsset] = useState(null);
	const [fileUploadAction, setFileUploadAction] = useState('');
	const [pageNum, setPageNum] = useState(1);
	const [total, setTotal] = useState(0);
	const [pageSize, setPageSize] = useState(20);
	const onClickBreadcrumb = useCallback((index) => {
		setPageNum(1);
		setPaths(paths => paths.slice(0, index + 1));
	}, []);
	const [categoryForm] = Form.useForm();
	const [fileUploadForm] = Form.useForm();
	const deleteAsset = useCallback(asset => setCurDeleteAsset(asset), []);
	const columns = useMemo(() => {
		return [
			{
				title: '文件',
				dataIndex: 'name',
				key: 'name',
				render(_, item) {
					return (
						<div className={styles.name}>
							{item.type === 'folder' ? <Folder width={20} height={20} /> : <File width={20} height={20} />}
							{item.type === 'folder' ? (
								<span
									className={styles.folder}
									onClick={() => setPaths(paths => [...paths, { ...item, path: item.name }])}
								>
									{item.name}
								</span>
							) : <span>{item.name}</span>}
						</div>
					);
				},
			},
			{
				title: '文件大小',
				dataIndex: 'size',
				key: 'size',
				width: '120',
				render(size, item) {
					return item.type === 'folder' ? '-' : formatFileSize(size);
				}
			},
			{
				title: '修改时间',
				dataIndex: 'updateTime',
				key: 'updateTime',
				width: '200px',
				render(updateTime) {
					return updateTime ? moment(updateTime).format('YYYY-MM-DD HH:mm:ss') : '-';
				},
			},
			{
				title: '操作',
				dataIndex: 'operate',
				key: 'operate',
				width: '120',
				render(_, item) {
					return item.type === 'folder' ? <span className={styles.danger} onClick={() => deleteAsset(item)}>删除</span> : (
						<div className={styles.operateColumn}>
							<span
								onClick={() => {
									copyText(location.origin + item.url);
									message.success('复制成功');
								}}
							>
								复制链接
							</span>
							<span onClick={() => window.open(item.url, '_blank')}>预览</span>
							<span className={styles.danger} onClick={() => deleteAsset(item)}>删除</span>
						</div>
					);
				},
			}
		];
	}, []);
	const fetchFiles = useCallback((pageNum, pageSize) => {
		setLoading(true);
		axios
			.get('/paas/api/flow/getAsset', { params: { pageNum, pageSize, path: paths.map(p => p.path).join('/') } })
			.then(res => {
				if (res.data?.code === 1) {
					setDataSource(res.data.data.dataSource);
					setTotal(res.data.data.total);
					setPageNum(res.data.data.pageNum);
					setPageSize(res.data.data.pageSize);
				} else {
					message.error(res.data?.msg || '获取文件列表失败');
				}
			})
			.catch(e => {
				message.error(e.message || '获取文件列表失败');
			})
			.finally(() => setLoading(false));
	}, [paths]);
	const onPageChange = useCallback((pageNum: number, pageSize: number) => fetchFiles(pageNum, pageSize), [fetchFiles]);
	const refresh = useCallback(() => fetchFiles(pageNum, pageSize), [fetchFiles, pageNum, pageSize]);
	const addCategory = useCallback(() => {
		categoryForm.resetFields();
		setShowCategoryModal(true);
	}, []);
	const handleCreateCategory = useCallback(() => {
		categoryForm.validateFields().then(value => {
			axios
				.post('/paas/api/flow/createCategory', { ...value, path: paths.map(p => p.path).join('/') })
				.then(res => {
					if (res.data?.code === 1) {
						message.success(res.data?.msg || '创建目录成功');
						fetchFiles(pageNum, pageSize);
						setShowCategoryModal(false);
					} else {
						message.error(res.data?.msg || '创建目录失败');
					}
				})
				.catch(e => message.error(e.message || '创建目录失败'));
		});
	}, [pageSize, pageNum, fetchFiles, paths]);
	const handleDeleteAsset = useCallback(() => {
		categoryForm.validateFields().then(value => {
			axios
				.post('/paas/api/flow/deleteAsset', { name: curDeleteAsset.name, path: paths.map(p => p.path).join('/') })
				.then(res => {
					if (res.data?.code === 1) {
						message.success(res.data?.msg || '删除文件成功');
						fetchFiles(pageNum, pageSize);
						setCurDeleteAsset(null);
					} else {
						message.error(res.data?.msg || '删除文件失败');
					}
				})
				.catch(e => message.error(e.message || '删除文件失败'));
		});
	}, [curDeleteAsset, paths]);
	const openFileUploadModal = useCallback(() => {
		fileUploadForm.resetFields();
		setFileUploadAction('file');
	}, []);
	const openCategoryUploadModal = useCallback(() => {
		fileUploadForm.resetFields();
		setFileUploadAction('category');
	}, []);
	const handleUploadFile = useCallback(() => {
		fileUploadForm.validateFields().then(value => {
			const formData = new FormData();
			formData.append('path', paths.map(p => p.path).join('/'));
			formData.append('hash', value.hash);
			value.files.forEach(file => {
				formData.append('files', file.originFileObj);
			});

			if (fileUploadAction === 'category') {
				formData.append('filePathMap', JSON.stringify(value.files.map(file => file.originFileObj.webkitRelativePath)));
			}

			setUploading(true);
			axios
				.post('/paas/api/flow/uploadAsset', formData)
				.then(res => {
					if (res.data?.code === 1) {
						message.success(res.data?.msg || '上传成功');
						fetchFiles(pageNum, pageSize);
						setFileUploadAction('');
					} else {
						message.error(res.data?.msg || '上传失败');
					}
				})
				.catch(e => message.error(e.message || '上传失败'))
				.finally(() => setUploading(false));
		});
	}, [paths, fileUploadAction]);

	useEffect(() => {
		fetchFiles(pageNum, pageSize);
	}, [paths]);

	return (
		<Content title="静态文件管理">
			<div className={styles.operate}>
				<Button
					className={styles.button}
					type="primary"
					onClick={openFileUploadModal}
					icon={(
						<span className={styles.icon}>
							<UploadIcon/>
						</span>
					)}
				>
					上传文件
				</Button>
				<Button
					className={styles.button}
					onClick={openCategoryUploadModal}
					icon={(
						<span className={styles.icon}>
							<UploadIcon/>
						</span>
					)}
				>
					上传目录
				</Button>
				<Button
					className={styles.button}
					onClick={addCategory}
					icon={(
						<span className={styles.icon}>
							<svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
								<path d="M484 443.1V528h-84.5c-4.1 0-7.5 3.1-7.5 7v42c0 3.8 3.4 7 7.5 7H484v84.9c0 3.9 3.2 7.1 7 7.1h42c3.9 0 7-3.2 7-7.1V584h84.5c4.1 0 7.5-3.2 7.5-7v-42c0-3.9-3.4-7-7.5-7H540v-84.9c0-3.9-3.1-7.1-7-7.1h-42c-3.8 0-7 3.2-7 7.1zm396-144.7H521L403.7 186.2a8.15 8.15 0 00-5.5-2.2H144c-17.7 0-32 14.3-32 32v592c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V330.4c0-17.7-14.3-32-32-32zM840 768H184V256h188.5l119.6 114.4H840V768z"></path>
							</svg>
						</span>
					)}
				>
					新建目录
				</Button>
				<Button
					className={styles.button}
					onClick={refresh}
					icon={(
						<span className={styles.icon}>
							<svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false">
								<path d="M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 0 0-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 0 1 655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 0 1 279 755.2a342.16 342.16 0 0 1-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 0 1 109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 0 0 3 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z"></path>
							</svg>
						</span>
					)}
				>
					刷新
				</Button>
			</div>
			<div className={styles.breadcrumb}>
				<Breadcrumb separator=">">
					{paths.map((path, index) => {
						return (
							<Breadcrumb.Item
								key={path.name + index}
								onClick={() => onClickBreadcrumb(index)}
								/** @ts-ignore */
								style={{cursor: paths.length - 1 !== index ? 'pointer' : 'default'}}
							>
								<div className={styles.breadcrumbContent}>
									<Folder width={20} height={20} />
									<span>{path.name}</span>
								</div>
							</Breadcrumb.Item>
						);
					})}
				</Breadcrumb>
			</div>
			<div className={styles.table}>
				<Table
					loading={loading}
					columns={columns}
					size="small"
					dataSource={dataSource}
					pagination={{
						showSizeChanger: true,
						pageSizeOptions: [5, 10, 20, 50, 100],
						pageSize,
						current: pageNum,
						total,
						onChange: onPageChange,
					}}
				/>
			</div>
			<Modal
				maskClosable
				onCancel={() => setShowCategoryModal(false)}
				open={showCategoryModal}
				centered
				onOk={handleCreateCategory}
				title="新建目录"
			>
				<Form form={categoryForm} colon>
					<Form.Item required label="目录名" name="name" rules={[{ required: true, message: '目录名不能为空' }]}>
						<Input placeholder="请输入目录名" />
					</Form.Item>
				</Form>
			</Modal>
			<Modal
				maskClosable={false}
				onCancel={() => setFileUploadAction('')}
				open={!!fileUploadAction}
				className={styles.uploadModal}
				width={800}
				centered
				okButtonProps={{ disabled: uploading }}
				onOk={handleUploadFile}
				title="上传文件"
			>
				<Form form={fileUploadForm} colon>
					<Form.Item label="上传到">
						{paths.map(p => p.name).join('/')}
					</Form.Item>
					<Form.Item label="文件Hash" name="hash" initialValue={false} valuePropName="checked">
						<Switch />
					</Form.Item>
					<Form.Item label="上传文件" name="files" required rules={[{ required: true, message: '文件列表不能为空' }]}>
						<CustomUpload type={fileUploadAction} />
					</Form.Item>
				</Form>
			</Modal>
			<ConfigFormModal
				open={!!curDeleteAsset}
				onOk={handleDeleteAsset}
				key={curDeleteAsset}
				onCancel={() => setCurDeleteAsset(null)}
				title="删除文件"
				Form={({ form, editRef }) => {
					return (
						<>
							<div className={styles.deleteTip}>
								您确定要删除该文件吗，该操作将
								<span className={styles.danger}>永久删除文件</span>
								，是否继续操作？
							</div>
							<Form labelCol={{ span: 0 }} wrapperCol={{ span: 24 }} form={form}>
								<Form.Item
									name="name"
									rules={[
										{
											required: true,
											message: '输入名称与当前文件名不同',
											validator(rule, value) {
												return new Promise((resolve, reject) => value !== curDeleteAsset?.name ? reject(rule.message) : resolve(true));
											}
										}
									]}
								>
									<Input
										ref={editRef}
										placeholder={`如果确认操作，请手动输入“${curDeleteAsset?.name}“`}
										autoFocus
									/>
								</Form.Item>
							</Form>
						</>
					)
				}}
			/>
		</Content>
	);
};

export default Asset;
