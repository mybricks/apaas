export { default } from "./FilesMenuTree";

export interface TreeNode {
  open: boolean;
  node: { [key: string]: TreeNode };
}
