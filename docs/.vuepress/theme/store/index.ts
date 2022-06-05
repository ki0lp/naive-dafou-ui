import { createPinia } from "pinia";
import useAppStore from "./modules/app";
// import useUserStore from "./modules/user";

const pinia = createPinia();

export { useAppStore };
export default pinia;
