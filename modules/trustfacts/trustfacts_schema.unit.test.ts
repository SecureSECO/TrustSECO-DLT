import { AddTrustFactSchema, TrustFactListSchema } from './trustfacts_schema';

test('Check if TrustFactSchema has the id, type and the jobID, factData, gitSignature and keyURL properties', () => {
    expect(AddTrustFactSchema).toHaveProperty('$id', 'trustfacts/add-facts');
    expect(AddTrustFactSchema).toHaveProperty('type', 'object');
    expect(AddTrustFactSchema).toHaveProperty('properties.jobID.dataType', 'uint32');
    expect(AddTrustFactSchema).toHaveProperty('properties.jobID.fieldNumber', 1);
    expect(AddTrustFactSchema).toHaveProperty('properties.fact.dataType', 'string');
    expect(AddTrustFactSchema).toHaveProperty('properties.fact.fieldNumber', 2);
    expect(AddTrustFactSchema).toHaveProperty('properties.factData.dataType', 'string');
    expect(AddTrustFactSchema).toHaveProperty('properties.factData.fieldNumber', 3);
    expect(AddTrustFactSchema).toHaveProperty('properties.gitSignature.dataType', 'string');
    expect(AddTrustFactSchema).toHaveProperty('properties.gitSignature.fieldNumber', 4);
    expect(AddTrustFactSchema).toHaveProperty('properties.keyURL.dataType', 'string');
    expect(AddTrustFactSchema).toHaveProperty('properties.keyURL.fieldNumber', 5);    
});

test('Check if trustFactListSchema has the id, type and the required package, source, fact properties', () => {
    expect(TrustFactListSchema).toHaveProperty('$id', 'trustfacts/facts-list');
    expect(TrustFactListSchema).toHaveProperty('type', 'object');
    expect(TrustFactListSchema).toHaveProperty('properties.facts.type', 'array');
    expect(TrustFactListSchema).toHaveProperty('properties.facts.fieldNumber', 1);
    expect(TrustFactListSchema).toHaveProperty('properties.facts.items', AddTrustFactSchema);
});
