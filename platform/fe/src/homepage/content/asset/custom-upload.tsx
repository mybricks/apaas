import React, { FC, useCallback, useMemo } from 'react';
import { Upload } from 'antd';
import { UploadIcon } from '@/components';

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

export default CustomUpload;
