import {IUserProvider} from "../models";
import {IUser} from "./models";

export interface IUserRepository {
    getUserByExternalId(id: string): Promise<IUser | null>
    getUsersByExternalIds(ids: string[]): Promise<IUser[]>
}
