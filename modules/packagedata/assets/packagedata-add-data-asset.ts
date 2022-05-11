import {BaseAsset} from "lisk-sdk";
import {PackageDataSchema} from "../packagedata-schemas";

export class PackageDataAddDataAsset extends BaseAsset{
    static id = 12341;
    id = PackageDataAddDataAsset.id;
    name = 'AddPackageData';
    schema = PackageDataSchema;

    validate(){
        //TODO
    };

    async apply() {
        //TODO
    }
}