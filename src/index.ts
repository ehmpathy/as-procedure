export * from 'domain-glossary-procedure'; // downstream consumers should only need as-procedure
export * from 'simple-log-methods'; // note: must export *, as otherwise not all subtypes are accessible via as-procedure

export * from './domain.objects/HasName';
export * from './domain.operations/asProcedure';
export * from './domain.operations/withExpectOutkey';
export * from './domain.operations/withExpectOutput';
