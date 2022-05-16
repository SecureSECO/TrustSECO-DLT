const trustfacts_schema = require('./trustfacts_schema');

test('Check if TrustFactSchema has the id, type and the jobID, factData, gitSignature and keyURL properties', () => {
    expect(trustfacts_schema.TrustFactSchema).toHaveProperty('$id', 'trustfacts/add-facts');
    expect(trustfacts_schema.TrustFactSchema).toHaveProperty('type', 'object');
    expect(trustfacts_schema.TrustFactSchema).toHaveProperty('properties.jobID.dataType', 'uint32');
    expect(trustfacts_schema.TrustFactSchema).toHaveProperty('properties.jobID.fieldNumber', 1);
    expect(trustfacts_schema.TrustFactSchema).toHaveProperty('properties.factData.dataType', 'string');
    expect(trustfacts_schema.TrustFactSchema).toHaveProperty('properties.factData.fieldNumber', 2);
    expect(trustfacts_schema.TrustFactSchema).toHaveProperty('properties.gitSignature.dataType', 'string');
    expect(trustfacts_schema.TrustFactSchema).toHaveProperty('properties.gitSignature.fieldNumber', 3);
    expect(trustfacts_schema.TrustFactSchema).toHaveProperty('properties.keyURL.dataType', 'string');
    expect(trustfacts_schema.TrustFactSchema).toHaveProperty('properties.keyURL.fieldNumber', 4);
});

test('Check if trustFactListSchema has the id, type and the required package, source, fact properties', () => {
    expect(trustfacts_schema.TrustFactListSchema).toHaveProperty('$id', 'trustfacts/facts-list');
    expect(trustfacts_schema.TrustFactListSchema).toHaveProperty('type', 'object');
    expect(trustfacts_schema.TrustFactListSchema).toHaveProperty('properties.facts.type', 'array');
    expect(trustfacts_schema.TrustFactListSchema).toHaveProperty('properties.facts.fieldNumber', 1);
    expect(trustfacts_schema.TrustFactListSchema).toHaveProperty('properties.facts.items', trustfacts_schema.TrustFactSchema);
});
