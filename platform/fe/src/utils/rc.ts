import { isValidElement } from "react";

export function isComponentWithRef(child: any) {
  return child && isValidElement(child);
}
