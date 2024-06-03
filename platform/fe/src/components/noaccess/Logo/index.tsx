import React from 'react';
import css from "./styles.less";
import LogoPng from './logo.png'

export default function () {
  return (
    <div className={css.logo}>
      <img src={LogoPng} />
    </div>
  )
}