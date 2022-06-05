/**
 * Listening to routes alone would waste rendering performance. Use the publish-subscribe model for distribution management
 * 单独监听路由会浪费渲染性能。使用发布订阅模式去进行分发管理。
 */
import mitt, { Handler } from 'mitt';

const emitter = mitt();

const key = Symbol('LOADING_CHANGE');

let latestLoadingState: any;

export function setLoadingStateEmitter(to: any) {
  emitter.emit(key, to);
  latestLoadingState = to;
}

export function listenerLoadingStateChange(
  handler: (loadingState: any) => void,
  immediate = true
) {
  emitter.on(key, handler as Handler);
  if (immediate && latestLoadingState) {
    handler(latestLoadingState);
  }
}

export function removeLoadingStateListener() {
  emitter.off(key);
}
