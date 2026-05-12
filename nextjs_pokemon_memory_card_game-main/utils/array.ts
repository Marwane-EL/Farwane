import * as Eq from 'fp-ts/Eq';
import { map } from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/function';

/** Shuffle randomly the given array, algorithm from https://stackoverflow.com/a/12646864/7033357 */
export const shuffle = <T>(array: T[]): T[] => {
  const source = [...array];
  for (let i = source.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [source[i], source[j]] = [source[j], source[i]];
  }

  return source;
};

/**
 * Update an element inside an array using the given instance of `Eq`
 * @param element Element to search in the array
 * @param eq Instance of `Eq` to compare two elements
 * @returns The given array with the element equal to `element` update (if found)
 */
export const updateWhere =
  <T>(element: T, eq: Eq.Eq<T>) =>
  (update: T) =>
  (array: T[]): T[] =>
    pipe(
      array,
      map((t) => (eq.equals(t, element) ? update : t))
    );
