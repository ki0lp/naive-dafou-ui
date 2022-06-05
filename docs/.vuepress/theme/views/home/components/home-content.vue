<template>
  <n-result title="这里是首页" description="一切尽在不言中，暂时没有什么该写的">
    <template #icon>
      <div class="icon-container">
        <img :src="bannerImg"/>
      </div>
    </template>
    <template #footer>
      <n-tooltip trigger="click">
        <template #trigger>
          <n-button>深沉的就像森林般</n-button>
        </template>
        最困难的工作是如何成为一个人
      </n-tooltip>
    </template>
  </n-result>
</template>

<script lang="ts">
import {defineComponent, ref} from 'vue';
import bannerImg from '../../../assets/images/about_image.jpg';
import {NResult, NTooltip} from 'naive-ui';

export default defineComponent({
  name: 'HomeContent',
  components: {
    NResult,
    NTooltip,
  },
  setup() {
    return {
      bannerImg,
    }
  }
});
</script>

<style lang="scss" scoped>
:deep .n-result {
  .n-result-header {
    .n-result-header__title {
      margin-bottom: 24px;
    }
  }
}

.icon-container {
  img {
    max-width: 360px;
    border-radius: 5px;
  }
}
</style>
