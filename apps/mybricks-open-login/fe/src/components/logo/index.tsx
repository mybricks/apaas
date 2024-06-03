import React from 'react';
import LogoPng from './logo.png'
import css from "./index.less";

export default function () {
  return (
    <div className={css.logo}>
      <img src={LogoPng} />
    </div>
  )
}