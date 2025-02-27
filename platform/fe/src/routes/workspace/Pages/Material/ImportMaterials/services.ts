
import axios from 'axios';

import { message } from 'antd';

import { uploadToStaticServer } from '@/services';

import { importMaterials, pullMaterial, batchCreateIcon, createImageMaterial } from '@/components/materials/services'


export async function importMaterialsFromRemote (selectedMaterials, user) {
  const key = new Date().getTime();
  message.loading({ content: '拉取中...', key, duration: 0 });
  return new Promise((resolve, reject) => {
    pullMaterial(
      { namespaces: selectedMaterials.map((selectedMaterial) => selectedMaterial.namespace), userId: user?.id },
      (res) => {
        const { createMaterials, updateMaterials } = res ?? {};
        message.success({ content: '拉取成功', key });
        resolve(res)
      },
      (error) => {
        message.error({ content: '拉取失败' }, key)
        reject(error)
      },
    );
  })
}

export async function importMaterialsFromZip (user) {
	return new Promise((resolve, reject) => {
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.accept = '.zip';
		fileInput.addEventListener('change', (event) => {
			const inputElement = event.target;
			if (inputElement instanceof HTMLInputElement) {
				const file = inputElement.files[0];
	
				const formData = new FormData();
				formData.append('file', file);
				formData.append('userId', String(user?.id));
				importMaterials(
					formData,
					(data) => {
						if (data) {
							const { createMaterials, updateMaterials } = data;
							let successStr = '';
							let errorStr = '';
	
							createMaterials.forEach(({ namespace, version, state }) => {
								if (state === 'success') {
									successStr = successStr + `${namespace}@${version} `;
								} else {
									errorStr = errorStr + `${namespace}@${version} `;
								}
							});
							updateMaterials.forEach(({ namespace, version, state }) => {
								if (state === 'success') {
									successStr = successStr + `${namespace}@${version} `;
								} else {
									errorStr = errorStr + `${namespace}@${version} `;
								}
							});
	
							if (successStr) {
								message.success(`导入物料 ${successStr}成功`);
								resolve(data)
							}
		
							if (errorStr) {
								message.error(`导入物料 ${errorStr}失败`);
								reject(new Error(`导入物料 ${errorStr}失败`))
							}
							if (!successStr && !errorStr) {
								message.info('没有物料更新（版本号相同）');
								reject(new Error('没有物料更新（版本号相同）'))
							}
						} else {
							message.error('导入物料失败');
							reject(new Error('导入物料失败'))
						}
					},
					(error) => {
						message.error(`导入物料失败: ${error?.message || ''}`);
						reject(error)
					},
				);
			}
		});
		fileInput.click();
	})
}

export async function importMaterialsFromImageFile (options: { file: File; filename: string }, user) {
	const { file, filename } = options;
	const { subPath } = await uploadToStaticServer({
		content: file,
		folderPath: 'image_material',
		fileName: filename,
	});
  return new Promise((resolve, reject) => {
    createImageMaterial({ name: filename, url: `/mfs/${subPath}`, userId: user.id }, (res) => {
      message.success(`${filename} 文件上传成功`);
      resolve(res)
    }, (error) => {
      reject(error)
    });
  })
}

export async function importMaterialsFromIcons (icons: any, user: any) {
	return new Promise((resolve, reject) => {
    batchCreateIcon(
      { icons, userId: user.id },
      (res) => {
        resolve(res);
      },
      (error) => {
        reject(error);
      },
    );
  });
}