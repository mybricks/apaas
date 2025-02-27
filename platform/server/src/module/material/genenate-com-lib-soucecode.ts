import { ComboType } from './const';

export const getEditJsFile = ({ allComponent, comTree, version, comlibInfo, useComPubIds, comboType }) => {
	const useComMap = {};
	const cloudComponentsMap = {};
	
	/** 拼接组件代码 */
	const generateEditJs = (comList, editJs, visibility = true) => {
		comList.forEach((item) => {
			const {
				id,
				pub_id,
				isFolder,
				title,
				children,
				useComs,
				cloudComponentDependentComponents,
			} = item;
			
			if (Array.isArray(useComs) && useComs.length) {
				editJs = generateEditJs(useComs, editJs, false);
			}
			
			editJs = setCloudComponentDependentComponents(
				cloudComponentDependentComponents,
				editJs,
				allComponent,
				/** 云组件依赖的原子组件 */
				cloudComponentsMap,
				/** 当前已添加的组件 */
				useComMap,
			);
			
			if (isFolder) {
				editJs += `
          newComlib.comAray.push({ title: '${title}', comAray: [] });
          comAray = newComlib.comAray[newComlib.comAray.length -1].comAray;
          if (${item.visible === false}) {
            newComlib.comAray[newComlib.comAray.length -1].visible = false;
          }
        `;
				editJs = generateEditJs(children, editJs);
			} else {
				const { content: { editCode }, version, isLatest } = allComponent[pub_id];
				if (visibility === false && useComMap[pub_id]) {
					return;
				}
				useComMap[pub_id] = true;
				editJs += `
		      ;(function () {
		        const temp = ${JSON.stringify({ version: isLatest ? 'latest' : version, editCode: decodeURIComponent(editCode) })}
		        eval(temp.editCode);
		        comDef = window.fangzhouComDef.default;
		        comDef.version = temp.version;
		        if (${visibility === false || item.visibility === false}) {
		          comDef.visibility = false;
		        }
		        comAray.push({ id: '${id}', ...comDef });
		      })();
        `;
			}
		});
		if (visibility) {
			editJs += 'comAray = newComlib.comAray;';
		}
		
		return editJs;
	};
	
	
	const libName = comboType === ComboType.RT ? '__comlibs_rt_' : '__comlibs_edit_';
	/** 组件库外层代码 */
	let editJs = `
	  let comlibList = window['${libName}'];
	  if(!comlibList){
	    comlibList = window['${libName}'] = [];
	  }
	  
	  let comAray = [];
	  const newComlib = {
	    id: '${comlibInfo.id}',
	    title: '${comlibInfo.title}',
	    comAray: comAray,
	    defined: true,
	  };
	  
    let depComponentFolder = { title: '云组件依赖', comAray: [], visible: false };
	  let comDef;
	`;
	editJs = generateEditJs(comTree, editJs);
	editJs += `
		newComlib.comAray.push(depComponentFolder);
		comlibList.push(newComlib);
	`;
	
	return `(function() {${editJs}})()`;
};

/** 拼接云组件依赖的原子组件代码 */
function setCloudComponentDependentComponents(
	cloudComponentDependentComponents,
	editJs,
	allComponent,
	hash,
	useComHash,
) {
	if (Array.isArray(cloudComponentDependentComponents) && cloudComponentDependentComponents.length) {
		cloudComponentDependentComponents.forEach((component) => {
			if (!component) return;
			
			const { id, pub_id } = component;
			
			if (hash[pub_id] || useComHash[pub_id] || !allComponent[pub_id]) return;
			
			hash[pub_id] = true;
			const { content: { editCode }, version, isLatest } = allComponent[pub_id];
			
			editJs += `
	      ;(function () {
	        const temp = ${JSON.stringify({ version: isLatest ? 'latest' : version, editCode: decodeURIComponent(editCode) })}
	        eval(temp.editCode);
	        comDef = window.fangzhouComDef.default;
	        comDef.version = temp.version;
	        comDef.visibility = false;

	        depComponentFolder.comAray.push({
	          id: '${id}',
	          ...comDef
	        });
	      })();
      `;
		});
	}
	
	return editJs;
}
