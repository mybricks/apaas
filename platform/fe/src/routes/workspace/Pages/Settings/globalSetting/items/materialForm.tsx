import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Form, Input, Select, Tooltip } from 'antd'
import { useWorkspaceConetxt } from '@workspace/context'

import css from './materialForm.less'
import styles from '../index.less'
import { getMaterials } from '@/components/materials/services'

const MaterialForm = ({ initialValues, onSubmit, style }) => {
  const [form] = Form.useForm()
  const { apps } = useWorkspaceConetxt()
  const [componentLibrarys, setComponentLibrarys] = useState([]);

  useMemo(() => {
		const formConfig = Object.assign({
			cdnUploadUrl: '',
			apps: []
		}, initialValues ?? {});
		const formApps = [];
		const formAppsMap = new Map(formConfig.apps.map((item) => [item.namespace, item]));

		apps.designApps.forEach((app) => {
			formApps.push(formAppsMap.get(app.namespace) || app);
		});
		formConfig.apps = formApps;
		form.setFieldsValue(formConfig);
	}, []);

  useEffect(() => {
    (async () => {
      const { list } = (await getMaterials({
        pageSize: 500,
        page: 1,
        type: 'com_lib',
        keyword: '',
        scopeStatus: '',
        userId: ''
      })) ?? {};
      setComponentLibrarys(list.map(({ title, namespace }) => {
        return {
          label: `${title}(${namespace})`,
          value: namespace
        };
      }))
    })()
  }, [])

  return (
    <div className={styles.globalForm} style={style}>
      <Form
        form={form}
        autoComplete="off"
      >
        <Card title='基础配置' size='small'>
					<Form.Item label='CDN上传接口' name='cdnUploadUrl' style={{ marginBottom: 0 }}>
						<Input placeholder='请输入CDN上传接口，仅用于组件库资源上传' />
					</Form.Item>
				</Card>
        <Card title='应用默认组件库' size='small' style={{ marginTop: 16 }}>
					<Form.List name="apps">
						{(fields) => {
							return fields.map((field) => {
								const { key, name, ...resetField }= field;
								const appInfo = apps.designApps[key];

								return (
									<div key={key} className={css.appItemContainer}>
										<AppInfo {...appInfo}/>
										<div className={css.appConfig}>
											<Form.Item
												{...resetField}
												label={'默认组件库'}
												name={[name, 'componentLibraryNamespaceList']}
												labelCol={{ span: 24 }}
												style={{ marginBottom: 0 }}
											>
												<Select
													mode='multiple'
													placeholder='请选择应用的默认组件库'
													options={componentLibrarys}
												/>
											</Form.Item>
										</div>
									</div>
								);
							});
						}}
					</Form.List>
				</Card>
      </Form>
      <div className={styles.btnGroups}>
        <Button
          size="middle"
          style={{ position: 'absolute', right: 0 }}
          type="primary"
          onClick={() => {
            form?.validateFields().then((values) => {
              const submitValues = values ?? {}
              const apps = submitValues.apps.map(app => {
                return {
                  namespace: app.namespace,
                  componentLibraryNamespaceList: app.componentLibraryNamespaceList || []
                };
              });
              typeof onSubmit === 'function' && onSubmit({ ...submitValues, apps })
            })
          }}
        >
          保存
        </Button>
      </div>
    </div>
  )
}

function AppInfo ({ icon, title }: {icon: string, title: string}) {
	return (
		<div className={css.appInfo}>
			<Tooltip placement='top' title={title}>
				<img src={icon} />
			</Tooltip>
		</div>
	);
}

export default MaterialForm