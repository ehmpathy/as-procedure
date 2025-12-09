export * from 'domain-glossary-procedure'; // downstream consumers should only need as-procedure
export * from 'simple-log-methods'; // note: must export *, as otherwise not all subtypes are accessible via as-procedure
export * from './domain/HasName';
export * from './logic/asProcedure';
export * from './logic/withExpectOutkey';
export * from './logic/withExpectOutput';
