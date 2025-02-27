import axios from 'axios';

export const fAxios = axios.create({ withCredentials: true });

fAxios.interceptors.response.use(
	(response) => {
		if (response.status === 200) {
			return response.data;
		} else {
			return Promise.reject('http status is not 200');
		}
	},
	(error) => Promise.reject(error)
);