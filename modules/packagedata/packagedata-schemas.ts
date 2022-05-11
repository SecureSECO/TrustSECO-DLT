export const PackageDataSchema = {
    $id: 'packagedata/add-data',
    type: 'object',
    required: [],
    properties: {
        // ID of package
        packageID: {
            dataType: 'uint32',
            fieldNumber: 1
        }
    }
}

export const PackageDataListSchema = {
    $id: 'packagedata/package-data-list',
    type: 'object',
    required: ["packageDataList"],
    properties: {
        packageDataList: {
            type: 'array',
            fieldNumber: 1,
            items: PackageDataSchema
        }
    }
}