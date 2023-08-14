import {IClass} from "./models";

export interface IClassRepository {
    getClassByExternalId(id: string): Promise<IClass | null>
    getClassesByExternalIds(ids: string[]): Promise<IClass[]>
}
