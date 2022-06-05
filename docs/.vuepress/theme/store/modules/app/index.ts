import { defineStore } from "pinia";
import { db } from "../../../utils/db";
import { AppState } from "./types";
import { useThemeData } from "@vuepress/plugin-theme-data/lib/client";

const themeData = useThemeData();

const THEME = "THEME";

const useAppStore = defineStore("app", {
  state: (): AppState => ({
    theme: db.get(THEME),
  }),

  getters: {
    dark(): boolean {
      return !!this.theme ? this.theme.dark : true;
    },
  },

  actions: {
    async setDarkTheme(dark: boolean) {
      themeData.value.darkMode = dark;
      this.theme = { dark: dark };
      db.save(THEME, { dark: dark });
    },
  },
});

export default useAppStore;
