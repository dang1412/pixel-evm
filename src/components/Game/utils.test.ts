import { getPixelsFromLine, getNextPixel } from './utils';

describe('getPixelsFromLine', () => {
  it('should return a single point when start and end are the same', () => {
    expect(getPixelsFromLine(2, 3, 2, 3)).toEqual([[2, 3]]);
  });

  it('should return a horizontal line', () => {
    expect(getPixelsFromLine(1, 2, 4, 2)).toEqual([[1, 2], [2, 2], [3, 2], [4, 2]]);
  });

  it('should return a vertical line', () => {
    expect(getPixelsFromLine(3, 1, 3, 4)).toEqual([[3, 1], [3, 2], [3, 3], [3, 4]]);
  });

  it('should return a diagonal line (45 degrees)', () => {
    expect(getPixelsFromLine(0, 0, 3, 3)).toEqual([[0, 0], [1, 1], [2, 2], [3, 3]]);
  });

  it('should return a diagonal line (reverse 45 degrees)', () => {
    expect(getPixelsFromLine(3, 3, 0, 0)).toEqual([[3, 3], [2, 2], [1, 1], [0, 0]]);
  });

  it('should return a line with steep slope', () => {
    expect(getPixelsFromLine(2, 2, 3, 6)).toEqual([[2, 2], [2, 3], [2, 4], [3, 4], [3, 5], [3, 6]]);
  });

  it('should return a line with shallow slope', () => {
    expect(getPixelsFromLine(2, 2, 6, 3)).toEqual([[2, 2], [3, 2], [4, 2], [4, 3], [5, 3], [6, 3]]);
  });

  it('should return a line from right to left', () => {
    expect(getPixelsFromLine(4, 2, 1, 2)).toEqual([[4, 2], [3, 2], [2, 2], [1, 2]]);
  });

  it('should return a line from bottom to top', () => {
    expect(getPixelsFromLine(3, 4, 3, 1)).toEqual([[3, 4], [3, 3], [3, 2], [3, 1]]);
  });

  it('should return only 2 values: current and next', () => {
    expect(getPixelsFromLine(2, 2, 6, 3, () => false)).toEqual([[2, 2], [3, 2]]);
  });
});

describe('getNextPixel', () => {
  it('should return the same point when start and end are the same', () => {
    expect(getNextPixel(2, 3, 2, 3)).toEqual([2, 3]);
  });
  it('should return a next point', () => {
    expect(getNextPixel(2, 2, 6, 3)).toEqual([3, 2]);
  });
});
