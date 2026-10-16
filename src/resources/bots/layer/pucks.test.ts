import { describe, expect, it } from 'vitest';
import { fillPucks, joinPuck, snapPuck, splitCluster, takeOut, type Puck } from './pucks.js';

describe('fillPucks', () => {
  it('rests every bot on the right edge when none is laid out', () => {
    expect(fillPucks(['a', 'b'], [])).toEqual([{ id: 'home', edge: 'right', at: 0.5, bots: ['a', 'b'] }]);
  });

  it('keeps what each puck holds, drops a gone bot and an empty puck, and adds a new bot to the right edge', () => {
    const pucks: Puck[] = [
      { id: 'p1', edge: 'left', at: 0.2, bots: ['a'] },
      { id: 'p2', edge: 'top', at: 0.5, bots: ['gone'] },
      { id: 'p3', edge: 'right', at: 0.7, bots: ['b'] },
    ];
    expect(fillPucks(['a', 'b', 'c'], pucks)).toEqual([
      { id: 'p1', edge: 'left', at: 0.2, bots: ['a'] },
      { id: 'p3', edge: 'right', at: 0.7, bots: ['b', 'c'] },
    ]);
  });
});

describe('splitCluster', () => {
  it('draws four and counts the rest', () => {
    expect(splitCluster(['a', 'b', 'c', 'd', 'e', 'f'])).toEqual({ shown: ['a', 'b', 'c', 'd'], more: 2 });
    expect(splitCluster(['a'])).toEqual({ shown: ['a'], more: 0 });
  });
});

describe('moving bots', () => {
  const pucks: Puck[] = [
    { id: 'a', edge: 'right', at: 0.5, bots: ['x', 'y'] },
    { id: 'b', edge: 'left', at: 0.3, bots: ['z'] },
  ];

  it('joins a puck, and an emptied puck goes', () => {
    expect(joinPuck(pucks, ['z'], 'a')).toEqual([{ id: 'a', edge: 'right', at: 0.5, bots: ['x', 'y', 'z'] }]);
  });

  it('takes bots out to a puck of their own', () => {
    expect(takeOut(pucks, ['y'], 'c', 'top', 0.2)).toEqual([
      { id: 'a', edge: 'right', at: 0.5, bots: ['x'] },
      { id: 'b', edge: 'left', at: 0.3, bots: ['z'] },
      { id: 'c', edge: 'top', at: 0.2, bots: ['y'] },
    ]);
  });

  it('snaps to the nearest edge, kept off the corners', () => {
    expect(snapPuck(10, 300, 1000, 800)).toEqual({ edge: 'left', at: 0.375 });
    expect(snapPuck(500, 790, 1000, 800)).toEqual({ edge: 'bottom', at: 0.5 });
    expect(snapPuck(995, 2, 1000, 800)).toEqual({ edge: 'top', at: 0.95 });
  });
});
