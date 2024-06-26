import page from "./AppStorePage";
import header from "./AppStoreHeader";
import { id, AppStoreMenuButton as button } from "./AppStoreMenuButton";
import { AppStoreProvider } from "./AppStoreProvider";

export { button };

export default {
  id,
  page,
  header,
  provider: AppStoreProvider
}
