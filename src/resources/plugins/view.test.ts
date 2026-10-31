import { describe, expect, it } from 'vitest';
import type { PluginView } from '../../bridges/plugins.js';
import { viewMethods, viewNode } from './view.js';

/** The Dev Tunnel page, as ahpd's `tunnelView` sends it. */
const TUNNEL: PluginView = {
  root: 'card',
  components: {
    card: { id: 'card', component: 'Card', child: 'body' },
    body: { id: 'body', component: 'Column', children: ['address', 'tunnel-label', 'tunnel', 'relay-up'] },
    address: { id: 'address', component: 'Link', label: 'Open the tunnel', href: 'https://abc-31546.usw2.devtunnels.ms/' },
    'tunnel-label': { id: 'tunnel-label', component: 'Text', text: 'Tunnel' },
    tunnel: { id: 'tunnel', component: 'Text', text: 'quiet-river-1' },
    'relay-up': { id: 'relay-up', component: 'Text', text: 'The relay is up' },
  },
};

describe('viewNode', () => {
  it('draws the Dev Tunnel page as a Card around a Column', () => {
    const node = viewNode(TUNNEL, 's');
    expect(node).toMatchObject({
      component: 'Card',
      child: {
        component: 'Column',
        children: [
          { component: 'Link', label: 'Open the tunnel', href: 'https://abc-31546.usw2.devtunnels.ms/' },
          { component: 'Text', text: 'Tunnel' },
          { component: 'Text', text: 'quiet-river-1' },
          { component: 'Text', text: 'The relay is up' },
        ],
      },
    });
  });

  it('gives a Button its action as the click scena reads, and its child as its label', () => {
    const view: PluginView = {
      root: 'go',
      components: {
        go: { id: 'go', component: 'Button', child: 'word', action: { event: { name: 'x-tunnel/restart', context: { port: 1 } } } },
        word: { id: 'word', component: 'Text', text: 'Restart' },
      },
    };
    expect(viewNode(view, 's')).toMatchObject({
      component: 'Button',
      onClick: { event: { name: 'x-tunnel/restart', context: { port: 1 } } },
      children: [{ component: 'Text', text: 'Restart' }],
    });
  });

  it('leaves out a kind outside the nine, so a view cannot mount a page of ahpw', () => {
    const view: PluginView = {
      root: 'body',
      components: {
        body: { id: 'body', component: 'Column', children: ['page', 'word'] },
        page: { id: 'page', component: 'PluginExplorer' },
        word: { id: 'word', component: 'Text', text: 'Hi' },
      },
    };
    const node = viewNode(view, 's');
    expect(node?.children).toMatchObject([{ component: 'MissingComponent' }, { component: 'Text' }]);
  });

  it('draws nothing for a missing root or a component that names itself', () => {
    expect(viewNode({ root: 'none', components: {} }, 's')).toBeNull();
    expect(viewNode({
      root: 'a',
      components: { a: { id: 'a', component: 'Column', children: ['b'] }, b: { id: 'b', component: 'Card', child: 'a' } },
    }, 's')).toBeNull();
  });
});

describe('viewMethods', () => {
  it('is the methods of the Buttons only', () => {
    const view: PluginView = {
      root: 'go',
      components: {
        go: { id: 'go', component: 'Button', action: { event: { name: 'x-tunnel/restart' } } },
        text: { id: 'text', component: 'Text', text: 'x', action: { event: { name: 'x-other' } } },
      },
    };
    expect([...viewMethods(view)]).toEqual(['x-tunnel/restart']);
    expect(viewMethods(TUNNEL).size).toBe(0);
  });
});
