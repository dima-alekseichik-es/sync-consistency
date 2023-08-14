import {IGroupProvider, IUserProvider} from "../models";

export interface IProvider {
    auth():Promise<void>
    getUsers(schoolId: string): AsyncGenerator<Array<IUserProvider>>
    getGroups(schoolId: string): AsyncGenerator<Array<IGroupProvider>>
}
