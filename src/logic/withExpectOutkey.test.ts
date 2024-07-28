import { getError, given, then, when } from 'test-fns';

import { withExpectOutkey } from './withExpectOutkey';

describe('withExpectOutkey', () => {
  given('a procedure which looks like a typical api caller', () => {
    type Miracle = { slug: string; name: string };
    const getMiracleBySlug = async (input: {
      slug: string;
    }): Promise<{ miracle: Miracle | null; success: true }> => {
      return { miracle: { slug: 'slug', name: 'name' }, success: true };
    };

    when('wrapped withExpectOutkey', () => {
      const getMiracleBySlugWrapped = withExpectOutkey(getMiracleBySlug);

      then(
        'should typecheck that the key is a valid key of the output',
        async () => {
          // "anything" should not be a valid key
          await getError(() =>
            getMiracleBySlugWrapped({
              slug: 'junk-removal',
            }).expect(
              // @ts-expect-error: Argument of type '"anything"' is not assignable to parameter of type '"miracle" | "success"'.ts(2345)
              'anything',
              'isPresent',
            ),
          );

          // but "miracle" should be a valid key
          const { miracle } = await getMiracleBySlugWrapped({
            slug: 'junk-removal',
          }).expect('miracle', 'isPresent');
          expect(miracle).toBeDefined();
        },
      );
    });
  });
});
