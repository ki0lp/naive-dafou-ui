<template></template>

<script lang="ts">
import { defineComponent, toRaw } from "vue";
import { useRoute, useRouter } from "vue-router";
export default defineComponent({
  name: "BlankLayout",
  mounted() {
    const router = useRouter();
    const route = useRoute();
    const { path } = route.params;
    console.log(toRaw(route.params));
    router.push({
      path: path as string,
    });
  },
  setup() {
    return {};
  },
});
</script>