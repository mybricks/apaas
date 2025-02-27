import axios from 'axios';

const axiosInstance = axios.create({ baseURL: '/api/material', withCredentials: true });

axiosInstance.interceptors.response.use(
	({ data }) => {
		if (data.code === 1) {
			return data.data;
		} else {
			Promise.reject(data.message);
		}
	},
	(error) => Promise.reject(error.message)
);

function handle<T> (promise, defaultValue, cbObj?): Promise<T> {
	return new Promise((resolve) => {
		promise.then((result) => {
			cbObj?.success?.(result);
			resolve(result);
		}).catch((error) => {
			cbObj?.error?.();
			resolve(defaultValue);
		});
	});
}

function post<T> (api, data, defaultValue, cbObj): Promise<T> {
	return handle(axiosInstance.post(api, data), defaultValue, cbObj);
}

function get<T> (api, data, defaultValue): Promise<T> {
	return handle(axiosInstance.get(api, { params: data }), defaultValue);
}

export function getEnv<T> (): Promise<T> {
	return get('/env', {}, {
		MYBRICKS_CAN_PUBLISH_REMOTE: false
	});
}

export function getMaterials<T> (data, isQueryRemote = false): Promise<T> {
	return get(isQueryRemote ? '/remoteList' : '/list', data, { list: [], total: 0 });
}

export function getMaterialContent<T> (data: { namespace: string; version?: string; codeType?: string; }): Promise<T> {
	return get('/namespace/content', data, void 0);
}

export function getMaterialVersions<T> (data): Promise<T> {
	return get('/versions', data, { list: [], total: 0 });
}

export function getRemoteLatestVersionByNamespaces<T> (data): Promise<T> {
	return get('/getRemoteLatestVersionByNamespaces', data, []);
}

export function shareMaterial<T> (data, success?, error?): Promise<T> {
	return post('/share', data, void 0, { success, error });
}

export function pullMaterial<T> (data, success?, error?): Promise<T> {
	return post('/pull', data, void 0, { success, error });
}

export function deleteMaterial<T> (data, success?, error?): Promise<T> {
	return post('/delete', data, void 0, { success, error });
}

export function importMaterials<T>(data, success?, error?): Promise<T> {
	return post('/importMaterials', data, void 0, { success, error });
}

export function batchCreateIcon<T>(data, success?, error?): Promise<T> {
	return post('/picture/batchCreateIcon', data, void 0, { success, error });
}

export function createImageMaterial<T>(data, success?, error?): Promise<T> {
	return post('/picture/createImage', data, void 0, { success, error });
}

export function importComLibBetaVersion<T>(data, success?, error?): Promise<T> {
	return post('/com_lib/beta/import', data, void 0, { success, error });
}

export function initExternalForComLib<T>(data, success?, error?): Promise<T> {
	return post('/com_lib/external/init', data, void 0, { success, error });
}