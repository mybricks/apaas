import React from 'react'

import {Content} from '..'
import {T_App} from '../../AppCtx'

import styles from './index.less'

/** TODO: 采用微前端方式接入 */
const InlineApp = ({app}: {app: T_App}) => {

	return (
		<Content title={app.title}>
			<div className={styles.inlineAppContainer}>
			  {app.Element ? <app.Element /> : <iframe className={styles.inlineAppIframe} src={app.homepage} frameBorder="0"/>}
		  </div>
		</Content>
	)
}

export default InlineApp
