let latestKeyState: any = undefined;
let listener: any = undefined;

export function sidebarMenuKeyChange(to: any) {
  latestKeyState = to;
  if (listener) {
    listenerSidebarMenuKeyStateChange();
  }
}

export function setSidebarMenuKeyListener(to: any) {
  listener = to;
}

export function listenerSidebarMenuKeyStateChange(immediate = true) {
  if (immediate && latestKeyState) {
    listener(latestKeyState);
  }
}

export function removeSidebarMenuKeyStateListener() {
  latestKeyState = undefined;
  listener = undefined;
}
