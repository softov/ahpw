import { expect, test } from 'vitest';
import { answerOf, trustAction, trustedUris, trustKeyOf, withAnswer, withoutAnswer } from './trust.js';

test('a folder has one spelling, as a path or a URI, with or without its trailing slash', () => {
  expect(trustKeyOf('/work/api')).toBe('file:///work/api');
  expect(trustKeyOf('file:///work/api/')).toBe('file:///work/api');
  expect(trustKeyOf('C:\\work\\api')).toBe('file:///C:/work/api');
  expect(trustKeyOf('file:///')).toBe('file:///');
});

test('a yes and a no are both kept, under the folder\'s one spelling, and only the yes is sent', () => {
  let answers = withAnswer({}, '/work/api/', true);
  answers = withAnswer(answers, 'file:///work/old', false);
  expect(answerOf(answers, 'file:///work/api')).toBe(true);
  expect(answerOf(answers, '/work/old')).toBe(false);
  expect(answerOf(answers, '/work/new')).toBeUndefined();
  expect(trustedUris(answers)).toEqual(['file:///work/api']);
});

test('forgetting an answer drops it, so the folder is asked about again', () => {
  const answers = withoutAnswer(withAnswer(withAnswer({}, '/a', true), '/b', true), '/a/');
  expect(answerOf(answers, '/a')).toBeUndefined();
  expect(trustedUris(answers)).toEqual(['file:///b']);
});

test('the push replaces the host\'s list, and an empty one trusts nothing', () => {
  expect(trustAction(['file:///work/api'])).toEqual({ type: 'root/configChanged', config: { workspaceTrust: { enabled: true, trustedUris: ['file:///work/api'] } } });
  expect(trustAction([])).toEqual({ type: 'root/configChanged', config: { workspaceTrust: { enabled: true, trustedUris: [] } } });
});
