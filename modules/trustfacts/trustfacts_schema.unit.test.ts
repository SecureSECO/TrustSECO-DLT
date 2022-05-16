const trustfacts_schema = require('./trustfacts_schema');

test('Check if TrustFactSchema has the id, type and the jobID, factData, gitSignature and keyURL properties', () => {
    expect(trustfacts_schema.TrustFactsSchema).toHaveProperty('$id', 'trustfacts/add-facts');
    expect(trustfacts_schema.TrustFactsSchema).toHaveProperty('type', 'object');
    expect(trustfacts_schema.TrustFactsSchema).toHaveProperty('properties.jobID.dataType', 'uint32');
    expect(trustfacts_schema.TrustFactsSchema).toHaveProperty('properties.jobID.fieldNumber', 1);
    expect(trustfacts_schema.TrustFactsSchema).toHaveProperty('properties.factData.dataType', 'string');
    expect(trustfacts_schema.TrustFactsSchema).toHaveProperty('properties.factData.fieldNumber', 2);
    expect(trustfacts_schema.TrustFactsSchema).toHaveProperty('properties.gitSignature.dataType', 'string');
    expect(trustfacts_schema.TrustFactsSchema).toHaveProperty('properties.gitSignature.fieldNumber', 3);
    expect(trustfacts_schema.TrustFactsSchema).toHaveProperty('properties.keyURL.dataType', 'string');
    expect(trustfacts_schema.TrustFactsSchema).toHaveProperty('properties.keyURL.fieldNumber', 4);
});

test('Check if trustFactsListSchema has the id, type and the required package, source, fact properties', () => {
    expect(trustfacts_schema.trustFactsListSchema).toHaveProperty('$id', 'trustfacts/facts-list');
    expect(trustfacts_schema.trustFactsListSchema).toHaveProperty('type', 'object');
    expect(trustfacts_schema.trustFactsListSchema).toHaveProperty('properties.facts.type', 'array');
    expect(trustfacts_schema.trustFactsListSchema).toHaveProperty('properties.facts.fieldNumber', 1);
    expect(trustfacts_schema.trustFactsListSchema).toHaveProperty('properties.facts.items', trustfacts_schema.TrustFactsSchema);
});
