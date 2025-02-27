import React from 'react';
import { createRoot, Container } from 'react-dom/client';

const MARK = "__mybricks_react_root__";

export function render(node: React.ReactElement, container: Container) {
  const root = container[MARK] || createRoot(container);

  root.render(node)

  container[MARK] = root;
}

export function unmount(container: Container) {
  container[MARK].unmount();
  delete container[MARK];
  // // Delay to unmount to avoid React 18 sync warning
  // return Promise.resolve().then(() => {
  //   container[MARK]?.unmount();

  //   delete container[MARK];
  // });
}
