import { codaJobSchema, codaJobListSchema, validFacts } from './coda-schemas';

test('Check if codaJobSchema has the id, type and the required package, source, fact properties', () => {
    expect(codaJobSchema).toHaveProperty('$id', 'coda/add-job');
    expect(codaJobSchema).toHaveProperty('type', 'object');
    expect(codaJobSchema).toHaveProperty('properties.package.dataType', 'string');
    expect(codaJobSchema).toHaveProperty('properties.package.fieldNumber', 1);
    expect(codaJobSchema).toHaveProperty('properties.source.dataType', 'string');
    expect(codaJobSchema).toHaveProperty('properties.source.fieldNumber', 2);
    expect(codaJobSchema).toHaveProperty('properties.fact.dataType', 'string');
    expect(codaJobSchema).toHaveProperty('properties.fact.fieldNumber', 3);
    expect(codaJobSchema).toHaveProperty('properties.date.dataType', 'string');
    expect(codaJobSchema).toHaveProperty('properties.date.fieldNumber', 4);
    expect(codaJobSchema).toHaveProperty('properties.jobID.dataType', 'uint32');
    expect(codaJobSchema).toHaveProperty('properties.jobID.fieldNumber', 5);
});

test('Check if codaJobListSchema has the id, type and the properties of a job', () => {
    expect(codaJobListSchema).toHaveProperty('$id', 'coda/job-list');
    expect(codaJobListSchema).toHaveProperty('type', 'object');
    expect(codaJobListSchema).toHaveProperty('properties.jobs.type', 'array');
    expect(codaJobListSchema).toHaveProperty('properties.jobs.fieldNumber', 1);
    expect(codaJobListSchema).toHaveProperty('properties.jobs.items', codaJobSchema);
});

test('Check if validFacts has the correct valid facts for GitHub and Libraries.io', () => {
    expect(validFacts).toHaveProperty('github', [
        'stars', 'forks', 'issues'
    ]);
    expect(validFacts).toHaveProperty('libraries_io', [
        'sourcerank'
    ]);
});