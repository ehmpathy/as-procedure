import { getError, HelpfulError } from 'helpful-errors';
import { NoErrorThrownError } from 'helpful-errors/dist/getError';
import { given, then, when } from 'test-fns';

import { withExpectOutput } from './withExpectOutput';

describe('withExpectOutput', () => {
  given('a function that returns a record or null', () => {
    type Miracle = { slug: string; name: string };

    const findMiracle = async (input: {
      slug: string;
    }): Promise<Miracle | null> => {
      if (input.slug === 'none') return null;
      return { slug: input.slug, name: 'MiracleName' };
    };

    when('wrapped withExpectOutput', () => {
      const findMiracleWrapped = withExpectOutput(findMiracle);

      then('should succeed when result is present', async () => {
        const result = findMiracleWrapped({ slug: 'exists' });
        const miracle = await result.expect('isPresent');
        expect(miracle).toEqual({ slug: 'exists', name: 'MiracleName' });
      });

      then('should throw HelpfulError if result is null', async () => {
        const error = await getError(() =>
          findMiracleWrapped({ slug: 'none' }).expect('isPresent'),
        );
        if (error instanceof NoErrorThrownError) throw error;
        expect(error).toBeInstanceOf(HelpfulError);
        expect(error.message).toContain('expect.output: breach');
        expect((error as any).cause?.message).toContain('expect.output: call');
      });

      then('should typecheck against invalid operation keys', async () => {
        const result = findMiracleWrapped({ slug: 'exists' });

        // @ts-expect-error: Argument of type '"unknown"' is not assignable to parameter of type '"isPresent"'
        await result.expect('unknown');

        // valid usage should work
        const data = await result.expect('isPresent');
        expect(data.slug).toBe('exists');
      });
    });
  });
});
