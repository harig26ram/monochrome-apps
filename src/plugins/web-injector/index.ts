import { registerPlugin } from '@capacitor/core';

export interface WebInjectorPlugin {
  injectScript(options: { script: string }): Promise<{ success: boolean }>;
  injectCSS(options: { css: string }): Promise<{ success: boolean }>;
  injectHTML(options: { html: string; position?: string }): Promise<{ success: boolean }>;
}

const WebInjector = registerPlugin<WebInjectorPlugin>('WebInjector');

export default WebInjector;
