import moment from 'dayjs';

/**
 * 统一展示时间处理
 * @param time 时间
 * @returns    最终展示的时间格式
 */
export function unifiedTime(time) {
	if (isToday(time)) {
		return moment(time).format('HH:mm');
	} else if (isThisYear(time)) {
		return moment(time).format('M月D日 HH:mm');
	}

	return moment(time).format('YYYY年M月D日');
}

/**
 * 判断时间是否今天
 * @param time 时间
 * @returns    是否今天
 */
function isToday(time) {
	const t = moment(time).format('YYYY-MM-DD');
	const n = moment().format('YYYY-MM-DD');

	return t === n;
}

/**
 * 判断时间是否今年
 * @param time 时间
 * @returns    是否今年
 */
function isThisYear(time) {
	const t = moment(time).format('YYYY');
	const n = moment().format('YYYY');

	return t === n;
}

/** 获取label长度 */
export const getLabelWidth = (val: string, fontSize = 12) => {
	let len = 0;
	for (const i of val) {
		if (/[a-z0-9]/.test(i)) {
			len += 8;
			continue;
		}
		if (/[A-Z]/.test(i)) {
			len += 10;
			continue;
		}
		if (/[()]/.test(i)) {
			len += 2;
			continue;
		}
		len += fontSize;
	}
	return len;
};
