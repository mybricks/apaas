import React, { FC, useCallback, useMemo, useState } from 'react'
import { Modal, Upload, Input, Button, message, Segmented, Divider } from 'antd'
import {
  PictureOutlined,
  AppstoreAddOutlined,
  InboxOutlined,
  UploadOutlined
} from '@ant-design/icons'

import { XMLBuilder, XMLParser } from 'fast-xml-parser';

import { importMaterialsFromImageFile, importMaterialsFromIcons } from './services'

import css from './index.less'

/** 添加图标/图片的弹窗 */
export const useDesignMaterials = ({ onSuccess, user }) => {
  const [open, setOpen] = useState(false)
  const [uploadCategory, setUploadCategory] = useState<string>('icons')

  const jsx = useMemo(() => {
    return (
      <Modal
        width={600}
        open={open}
        title="添加素材"
        maskClosable
        destroyOnClose
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        footer={null}
        onOk={() => {
          setOpen(false)
        }}
      >
        <div className={css.designMaterials}>
          <Segmented
            className={css.tabs}
            value={uploadCategory}
            options={[
              {
                label: '添加图标素材',
                value: 'icons',
                icon: <AppstoreAddOutlined />,
              },
              {
                label: '添加图片素材',
                value: 'images',
                icon: <PictureOutlined />,
              },
            ]}
            onChange={setUploadCategory}
          />
          {
            uploadCategory === 'images' && <UploadImage onSuccess={onSuccess} user={user} />
          }
          {
            uploadCategory === 'icons' && <UploadIcons onSuccess={onSuccess} user={user}  />
          }
        </div>
      </Modal>
    )
  }, [open, uploadCategory])

  return {
    open: () => setOpen(true),
    jsx,
  }
}


const UploadImage = ({ onSuccess, user }) => {
  // 处理文件上传
	const handleUpload = async (file: File) => {
    try {
      await importMaterialsFromImageFile({ file, filename: file.name }, user);
      onSuccess?.()
    } catch (error) {
      
    }
		// 阻止 `Upload` 组件自动上传文件
		return false;
	};

	return (
		<Upload.Dragger
			multiple
			showUploadList={false}
			beforeUpload={handleUpload}
			accept="image/*"
		>
			<p className="ant-upload-drag-icon">
				<InboxOutlined />
			</p>
			<p className="ant-upload-text">
        点击或拖拽至此区域进行上传（只允许图片格式的文件）
			</p>
		</Upload.Dragger>
	);
}


function parseSVGsFromIconText(iconText: string) {
	const svgStartTag = iconText.indexOf('<svg');
	const svgEndTag = iconText.lastIndexOf('</svg>');
	const svgContent = iconText.slice(svgStartTag, svgEndTag + 6);
	const parser = new XMLParser({
		ignoreAttributes: false,
	});
	const svgObj = parser.parse(svgContent);
	const svgs = (Array.isArray(svgObj.svg.symbol) ? svgObj.svg.symbol : [svgObj.svg.symbol]).map((symbol) =>
		new XMLBuilder({
			ignoreAttributes: false,
		}).build({
			svg: {
				'@_xmlns': 'http://www.w3.org/2000/svg',
				'@_viewBox': symbol['@_viewBox'],
				'@_version': '1.1',
				'@_width': '1em',
				'@_height': '1em',
				'@_fill': 'currentColor',
				...symbol,
			},
		}),
	);
	const regex = /<symbol id="((?:\w|-)*)"/g;
	const names = Array.from(iconText.matchAll(regex)).map((i) => i[1]);
	return Object.fromEntries(svgs.map((svg, index) => [names[index], svg]));
}

function getSVGsFromIconFontUrl(url: string): Promise<Record<string, string>> {
	return new Promise((resolve, reject) => {
		fetch(url)
			.then((res) => res.text())
			.then((res) => {
				resolve(parseSVGsFromIconText(res));
			})
			.catch(reject);
	});
}

const UploadIcons = ({ onSuccess, user }) => {
  const [icons, setIcons] = useState<Record<string, string>>();
	const [loading, setLoading] = useState(false);

  const handleUpload = () => {
		if (!icons) return;
    (async () => {
      setLoading(true);
      try {
        await importMaterialsFromIcons(icons, user)
        setIcons(undefined);
        onSuccess?.()
      } catch (error) {
        
      }
      setLoading(false);
    })()
	};

  const importFromLocal = useCallback(() => {
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.accept = '.js';
		fileInput.addEventListener('change', (event) => {
			const inputElement = event.target;
			if (inputElement instanceof HTMLInputElement) {
				const file = inputElement.files[0];
				const reader = new FileReader();
				reader.onload = (event) => {
					const result = parseSVGsFromIconText(event.target.result as string);
					setIcons(result);
				};

				reader.readAsText(file);
			}
		});
		fileInput.click();
	}, []);

  return (
    <div className={css.iconUpload}>
			<Input.Search
				placeholder="请输入 Iconfont Symbol Script 链接"
				enterButton="解析图标"
				onSearch={async (value) => {
					if (!value) {
						message.error('请输入正确的 Iconfont Symbol Script 链接');
						return;
					}
					try {
						const result = await getSVGsFromIconFontUrl(value);
						setIcons(result);
					} catch {
						message.error('Iconfont 资源解析失败');
					}
				}}
			/>
      <div className={css.localEntry} onClick={importFromLocal}>没有链接？试试从本地js文件解析图标</div>
			{!!icons && (
				<div className={css.iconPreview}>
          <Divider className={css.title} orientation="left">解析后图标</Divider>
					<div className={css.list}>
						{Object.entries(icons).map(([name, svg]) => (
							<div
								key={name}
								title={name}
								className={css.icon}
								dangerouslySetInnerHTML={{ __html: svg }}
							></div>
						))}
					</div>
				</div>
			)}
			{!!icons && (
				<Button
					type="primary"
					loading={loading}
					style={{ width: '100%' }}
					onClick={handleUpload}
				>
          上传至物料中心
				</Button>
			)}
		</div>
  )
}