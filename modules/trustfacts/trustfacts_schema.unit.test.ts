import { TrustFactSchema, TrustFactListSchema } from './trustfacts_schema';

test('Check if TrustFactSchema has the id, type and the jobID, factData, gitSignature and keyURL properties', () => {
    expect(TrustFactSchema).toHaveProperty('$id', 'trustfacts/add-facts');
    expect(TrustFactSchema).toHaveProperty('type', 'object');
    expect(TrustFactSchema).toHaveProperty('properties.jobID.dataType', 'uint32');
    expect(TrustFactSchema).toHaveProperty('properties.jobID.fieldNumber', 1);
    expect(TrustFactSchema).toHaveProperty('properties.factData.dataType', 'string');
    expect(TrustFactSchema).toHaveProperty('properties.factData.fieldNumber', 2);
    expect(TrustFactSchema).toHaveProperty('properties.gitSignature.dataType', 'string');
    expect(TrustFactSchema).toHaveProperty('properties.gitSignature.fieldNumber', 3);
    expect(TrustFactSchema).toHaveProperty('properties.keyURL.dataType', 'string');
    expect(TrustFactSchema).toHaveProperty('properties.keyURL.fieldNumber', 4);
});

test('Check if trustFactListSchema has the id, type and the required package, source, fact properties', () => {
    expect(TrustFactListSchema).toHaveProperty('$id', 'trustfacts/facts-list');
    expect(TrustFactListSchema).toHaveProperty('type', 'object');
    expect(TrustFactListSchema).toHaveProperty('properties.facts.type', 'array');
    expect(TrustFactListSchema).toHaveProperty('properties.facts.fieldNumber', 1);
    expect(TrustFactListSchema).toHaveProperty('properties.facts.items', TrustFactSchema);
});
