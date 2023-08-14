import {IGroup} from "./models";

export interface IGroupRepository {
    getGroupByExternalId(id: string): Promise<IGroup | null>
    getGroupsByExternalIds(ids: string[]): Promise<IGroup[]>
}
