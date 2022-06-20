import { PackageDataAddDataAsset } from "./packagedata-add-data-asset";

const packageData = new PackageDataAddDataAsset();

describe('Test the validate function of PackageDataAddDataAsset', () => {
    test('If the package name is empty, throw an error', () => {
        const asset = {
            asset: {
                packageName: '',
                packagePlatform: 'test',
                packageOwner: 'test',
                packageReleases: ['test']
            }
        };
        expect(() => packageData.validate(asset)).toThrowError();
    });

    test('If the package platform is empty, throw an error', () => {
        const asset = {
            asset: {
                packageName: 'test',
                packagePlatform: '',
                packageOwner: 'test',
                packageReleases: ['test']
            }
        };
        expect(() => packageData.validate(asset)).toThrowError();
    });

    test('If the package owner is empty, throw an error', () => {
        const asset = {
            asset: {
                packageName: 'test',
                packagePlatform: 'test',
                packageOwner: '',
                packageReleases: ['test']
            }
        };
        expect(() => packageData.validate(asset)).toThrowError();
    });

    test('If the package releases is empty, throw an error', () => {
        const asset = {
            asset: {
                packageName: 'test',
                packagePlatform: 'test',
                packageOwner: 'test',
                packageReleases: []
            }
        };
        expect(() => packageData.validate(asset)).toThrowError();    
    });

    test('If the package releases contains only empty strings, throw an error', () => {
        const asset = {
            asset: {
                packageName: 'test',
                packagePlatform: 'test',
                packageOwner: 'test',
                packageReleases: ['', ' ', '   ']
            }
        };
        expect(() => packageData.validate(asset)).toThrowError();    
    });
});