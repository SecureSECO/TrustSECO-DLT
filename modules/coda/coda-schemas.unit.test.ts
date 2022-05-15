const coda_schemas = require('./coda-schemas');

test('Check if codaJobSchema has the id, type and the required package, source, fact properties', () => {
    expect(coda_schemas.codaJobSchema).toHaveProperty('$id', 'coda/add-job');
    expect(coda_schemas.codaJobSchema).toHaveProperty('type', 'object');
    expect(coda_schemas.codaJobSchema).toHaveProperty('properties.package.dataType', 'string');
    expect(coda_schemas.codaJobSchema).toHaveProperty('properties.package.fieldNumber', 1);
    expect(coda_schemas.codaJobSchema).toHaveProperty('properties.source.dataType', 'string');
    expect(coda_schemas.codaJobSchema).toHaveProperty('properties.source.fieldNumber', 2);
    expect(coda_schemas.codaJobSchema).toHaveProperty('properties.fact.dataType', 'string');
    expect(coda_schemas.codaJobSchema).toHaveProperty('properties.fact.fieldNumber', 3);
});

test('Check if codaJobListSchema has the id, type and the properties of a job', () => {
    expect(coda_schemas.codaJobListSchema).toHaveProperty('$id', 'coda/job-list');
    expect(coda_schemas.codaJobListSchema).toHaveProperty('type', 'object');
    expect(coda_schemas.codaJobListSchema).toHaveProperty('properties.jobs.type', 'array');
    expect(coda_schemas.codaJobListSchema).toHaveProperty('properties.jobs.fieldNumber', 1);
    expect(coda_schemas.codaJobListSchema).toHaveProperty('properties.jobs.items', coda_schemas.codaJobSchema);
});

test('Check if validFacts has the correct valid facts for GitHub and Libraries.io', () => {
    expect(coda_schemas.validFacts).toHaveProperty('github', [
        'stars', 'forks', 'issues'
    ]);
    expect(coda_schemas.validFacts).toHaveProperty('libraries_io', [
        'sourcerank'
    ]);
});