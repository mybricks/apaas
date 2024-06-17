// TODO: Next
import React, { FC, useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Breadcrumb, Button, Form, Input, message, Modal, Switch, Table, Upload } from 'antd';
import moment from 'dayjs';
import axios from 'axios';
import { copyText } from '@/utils/dom';
import { useDebounceFn } from "@/hooks";

import styles from './StaticFilesPage.less';

const AntdForm = Form;

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
const StaticFilesPage: FC = () => {
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
		<>
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
    </>
	);
};

export default StaticFilesPage;

/** 文件夹 */
export function Folder({width = 32, height = 32}) {
  return (
	  <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width={width} height={height}>
		  <path
			  d="M826.9 461.6h-723v391.5c0 21.7 17.7 39.4 39.4 39.4h677c4.1-6.4 6.6-14.1 6.6-22.3V461.6zM826.9 422.3v-64.7c0-22.9-18.6-41.6-41.6-41.6H340l-32.7-61.2c-7.2-13.5-21.3-22-36.7-22H134.9c-12.4 0-23.4 5.5-31 14.2v175.2l723 0.1z"
			  fill="#FFD524"></path>
		  <path
			  d="M687 252.6h11.4c10.8 0 19.6-8.8 19.6-19.6s-8.8-19.6-19.6-19.6H687c-10.8 0-19.6 8.8-19.6 19.6s8.8 19.6 19.6 19.6zM753.3 252.6h18c10.8 0 19.6-8.8 19.6-19.6s-8.8-19.6-19.6-19.6h-18c-10.8 0-19.6 8.8-19.6 19.6s8.7 19.6 19.6 19.6z"
			  fill="#6B400D"></path>
		  <path
			  d="M881.6 213.3h-44.9c-10.8 0-19.6 8.8-19.6 19.6s8.8 19.6 19.6 19.6h44.9c21.7 0 39.4 17.7 39.4 39.4v130.3H103.8V173.9c0-21.7 17.7-39.4 39.4-39.4h193c14.6 0 27.9 8 34.7 20.8l46.5 86.9c3.4 6.4 10.1 10.4 17.3 10.4h84.5c10.8 0 19.6-8.8 19.6-19.6s-8.8-19.6-19.6-19.6h-72.7l-40.9-76.5c-13.7-25.7-40.3-41.6-69.4-41.6H143.3c-43.4 0-78.7 35.3-78.7 78.7v679.3c0 43.4 35.3 78.7 78.7 78.7h738.3c43.4 0 78.7-35.3 78.7-78.7V292c0-43.4-35.3-78.7-78.7-78.7z m39.5 639.8c0 21.7-17.7 39.4-39.4 39.4H143.4c-21.7 0-39.4-17.7-39.4-39.4V461.6h817.2v391.5z"
			  fill="#6B400D"></path>
	  </svg>
  )
}

/** 文件 */
export function File({width = 32, height = 32}) {
  return (
	  <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width={width} height={height}>
		  <path d="M648.448 663.0912m-212.7872 0a212.7872 212.7872 0 1 0 425.5744 0 212.7872 212.7872 0 1 0-425.5744 0Z"
		        fill="#f3cb22"></path>
		  <path
			  d="M702.976 896.9728H326.0416c-87.5008 0-158.72-71.2192-158.72-158.72V291.6864c0-87.5008 71.2192-158.72 158.72-158.72h376.9344c87.5008 0 158.72 71.2192 158.72 158.72v446.5664c0 87.552-71.2192 158.72-158.72 158.72zM326.0416 184.1664c-59.2896 0-107.52 48.2304-107.52 107.52v446.5664c0 59.2896 48.2304 107.52 107.52 107.52h376.9344c59.2896 0 107.52-48.2304 107.52-107.52V291.6864c0-59.2896-48.2304-107.52-107.52-107.52H326.0416z"
			  fill="#f3cb22"></path>
		  <path
			  d="M663.552 383.232H369.408c-14.1312 0-25.6-11.4688-25.6-25.6s11.4688-25.6 25.6-25.6h294.144c14.1312 0 25.6 11.4688 25.6 25.6s-11.4688 25.6-25.6 25.6zM663.552 540.5696H369.408c-14.1312 0-25.6-11.4688-25.6-25.6s11.4688-25.6 25.6-25.6h294.144c14.1312 0 25.6 11.4688 25.6 25.6s-11.4688 25.6-25.6 25.6zM487.0656 703.488H369.408c-14.1312 0-25.6-11.4688-25.6-25.6s11.4688-25.6 25.6-25.6h117.6576c14.1312 0 25.6 11.4688 25.6 25.6s-11.4688 25.6-25.6 25.6z"
			  fill="#f3cb22"></path>
	  </svg>
  )
}

/** 文件 */
export function UploadIcon({width = '1em', height = '1em'}) {
  return (
	  <svg viewBox="64 64 896 896" focusable="false" width={width} height={height} fill="currentColor" aria-hidden="true">
		  <path d="M518.3 459a8 8 0 00-12.6 0l-112 141.7a7.98 7.98 0 006.3 12.9h73.9V856c0 4.4 3.6 8 8 8h60c4.4 0 8-3.6 8-8V613.7H624c6.7 0 10.4-7.7 6.3-12.9L518.3 459z"></path>
		  <path d="M811.4 366.7C765.6 245.9 648.9 160 512.2 160S258.8 245.8 213 366.6C127.3 389.1 64 467.2 64 560c0 110.5 89.5 200 199.9 200H304c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8h-40.1c-33.7 0-65.4-13.4-89-37.7-23.5-24.2-36-56.8-34.9-90.6.9-26.4 9.9-51.2 26.2-72.1 16.7-21.3 40.1-36.8 66.1-43.7l37.9-9.9 13.9-36.6c8.6-22.8 20.6-44.1 35.7-63.4a245.6 245.6 0 0152.4-49.9c41.1-28.9 89.5-44.2 140-44.2s98.9 15.3 140 44.2c19.9 14 37.5 30.8 52.4 49.9 15.1 19.3 27.1 40.7 35.7 63.4l13.8 36.5 37.8 10C846.1 454.5 884 503.8 884 560c0 33.1-12.9 64.3-36.3 87.7a123.07 123.07 0 01-87.6 36.3H720c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h40.1C870.5 760 960 670.5 960 560c0-92.7-63.1-170.7-148.6-193.3z"></path>
	  </svg>
  )
}

function ConfigFormModal({
  open,
  onOk,
  onCancel,
  Form,
  title = '标题',
  okText = '确认',
  cancelText = '取消',
  bodyStyle = {
    minHeight: 104
  },
  defaultValues = {}
}) {
  const [form] = AntdForm.useForm()
  const [btnLoading, setBtnLoading] = useState(false)
  const ref = useRef()

  const { run: ok } = useDebounceFn(() => {
    form.validateFields().then((values) => {
      setBtnLoading(true)
      onOk(values).then((msg) => {
        message.success(msg)
        cancel()
      }).catch((e) => {
        setBtnLoading(false)
        message.warning(e)
      })
    }).catch(() => {})
  }, {wait: 200});

  const cancel = useCallback(() => {
    onCancel()
    setBtnLoading(false)
    form.resetFields()
  }, [])

  useEffect(() => {
    if (open && ref.current) {
      form.setFieldsValue(defaultValues)
      setTimeout(() => {
        (ref.current as any).focus()
      }, 100)
    }
  }, [open])

  const RenderForm = useMemo(() => {
    return <Form form={form} editRef={ref} ok={ok}/>
  }, [])

  return (
    <Modal
      open={open}
      title={title}
      okText={okText}
      cancelText={cancelText}
      centered={true}
      onOk={ok}
      onCancel={cancel}
      confirmLoading={btnLoading}
      bodyStyle={bodyStyle}
    >
      {RenderForm}
    </Modal>
  )
}

interface CustomUploadProps {
	type?: string;
	onChange?(value: any): void;
}

const { Dragger } = Upload;
const CustomUpload: FC<CustomUploadProps> = props => {
	const { type = 'file', onChange } = props;
	const onCurChange = useCallback(({ fileList }) => onChange?.(fileList), [onChange]);
	const isCategory = useMemo(() => type === 'category', [type]);
	const name = useMemo(() => isCategory ? '文件夹' : '文件', [isCategory]);

	return (
		<>
			<Dragger
				beforeUpload={() => false}
				name="file"
				multiple
				directory={isCategory}
				onChange={onCurChange}
			>
				<p className="ant-upload-drag-icon" style={{ color: '#40a9ff' }}>
					<UploadIcon width="48px" height="48px" />
				</p>
				<p className="ant-upload-text">点击选择{name}或者拖动{name}到这里上传</p>
			</Dragger>
		</>
	);
};