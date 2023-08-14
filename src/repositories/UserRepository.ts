import {IUserRepository, IUser} from "../intrefaces";
import {addItems, getItem, getItems} from "../utils";
import {Collection} from "mongodb";
import {MongoClient} from 'mongodb';
import {Repository} from "./Repository";

const config = require('../../config.json')

export class UserRepository extends Repository implements IUserRepository {


    constructor() {
        super();
        this.client = new MongoClient(this.generateURL(config.databases.user));
        this.collection = this.client.db('matteappen').collection('bindings');
    }

    private readonly client: MongoClient;
    private readonly collection: Collection;


    async getUserByExternalId(id: string): Promise<IUser | null> {
        const user = await getItem(id, 'users');
        if (user) {
            return user as any;
        }

        const aggregationCursor = await this.collection.aggregate([
            {
                $match: {
                    "externalId": id
                },
            },
            {
                $project: {
                    entityType: 1,
                    externalId: 1,
                    localId: 1,
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'localId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: '$user._id',
                    firstName: '$user.firstName',
                    lastName: '$user.lastName',
                    email: '$user.username',
                    externalId: 1,
                    username: '$user.username',
                    type: '$user.type',
                    source: '$user.source'
                }
            }
        ]).toArray()

        const item = aggregationCursor[0];

        if (!item) {
            return null;
        }

        const type: IUser['type'] = item.type === 1 ? 'teacher' : 'student';

        const targetUser: IUser = {
            id: item._id,
            externalId: item.externalId,
            email: item.email,
            firstName: item.firstName,
            lastName: item.lastName,
            username: item.username,
            type
        }

        await addItems([targetUser], 'users');

        return targetUser;
    }

    async getUsersByExternalIds(ids: string[]): Promise<IUser[]> {
        const {found, notFound} = await getItems<IUser>(ids, 'users');
        if (notFound.length === 0) {
            return found;
        }
        const aggregationCursor = await this.collection.aggregate([
            {
                $match: {
                    "externalId": {
                        $in: notFound
                    }
                },
            },
            {
                $project: {
                    entityType: 1,
                    externalId: 1,
                    localId: 1,
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'localId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: '$user._id',
                    firstName: '$user.firstName',
                    lastName: '$user.lastName',
                    email: '$user.username',
                    externalId: 1,
                    username: '$user.username',
                    type: '$user.type',
                    source: '$user.source'
                }
            }
        ]).toArray()

        const dbUsers = aggregationCursor.map((item) => {
            const type: IUser['type'] = item.type === 1 ? 'teacher' : 'student';
            return {
                id: item._id,
                externalId: item.externalId,
                email: item.email,
                firstName: item.firstName,
                lastName: item.lastName,
                username: item.username,
                type
            }

        })

        await addItems(dbUsers, 'users');

        return [...found, ...dbUsers];
    }

}
