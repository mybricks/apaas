
export const checkIsAllowSelect = (material, currentMaterial) => {
	if (!currentMaterial) {
		return true;
	}

	const { version: currentVersion } = currentMaterial;
	const { version: nextVersion } = material;
	if (currentVersion === nextVersion) {
		return false;
	}

	const versionRegExp = /(^\d+\.\d+\.\d+)(-(.*)\.\d+)?$/;
	const vAry1 = currentVersion.match(versionRegExp)[1].split('.');
	const vAry2 = nextVersion.match(versionRegExp)[1].split('.');

	const diffIdx = vAry1.findIndex((item, idx) => +item != +vAry2[idx]);
	return diffIdx !== -1 ? +vAry2[diffIdx] > +vAry1[diffIdx] : true;
};