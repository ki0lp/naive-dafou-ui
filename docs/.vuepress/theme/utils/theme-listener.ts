/**
 * Listening to routes alone would waste rendering performance. Use the publish-subscribe model for distribution management
 * 单独监听路由会浪费渲染性能。使用发布订阅模式去进行分发管理。
 */
import mitt, {Handler} from 'mitt';

const emitter = mitt();

const key = Symbol('THEME_CHANGE');

let latestThemeState: any;

export function setThemeStateEmitter(to: any) {
    emitter.emit(key, to);
    latestThemeState = to;
}

export function listenerThemeStateChange(
    handler: (themeState: any) => void,
    immediate = true
) {
    emitter.on(key, handler as Handler);
    if (immediate && latestThemeState) {
        handler(latestThemeState);
    }
}

export function removeThemeStateListener() {
    emitter.off(key);
}
