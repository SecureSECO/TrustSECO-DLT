declare const trustFactAssetSchema: {
    $id: string;
    type: string;
    required: string[];
    properties: {
        trustFactJSON: {
            dataType: string;
            fieldNumber: number;
        };
    };
};
