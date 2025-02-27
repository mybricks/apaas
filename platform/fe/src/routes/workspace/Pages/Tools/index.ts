import page from "./ToolsPage";
import header from "./ToolsHeader";
import { id, ToolsMenuButton as button } from "./ToolsMenuButton";

import { ToolsProvider } from './ToolsProvider'

export { button };

export default {
  id,
  page,
  header,
  provider: ToolsProvider
};
