import {Repository} from "./Repository";
import {IClass, IClassRepository, IGroup, IGroupRepository, IUser, IUserRepository} from "../intrefaces";
import {addItems, getItem, getItems} from "../utils";
import {Collection, MongoClient} from "mongodb";

const config = require('../../config.json')

export class GroupRepository extends Repository implements IGroupRepository {

    constructor() {
        super();
        this.client = new MongoClient(this.generateURL(config.databases.class));
        this.collection = this.client.db('matteappen').collection('bindings');
    }

    private readonly client: MongoClient;
    private readonly collection: Collection;

    private readonly aggregation = [
        {
            $project: {
                entityType: 1,
                externalId: 1,
                localId: 1,
            }
        },
        {
            $lookup: {
                from: 'groups',
                localField: 'localId',
                foreignField: '_id',
                as: 'group'
            }
        },
        {
            $unwind: {
                path: '$group',
                preserveNullAndEmptyArrays: true
            },
        },
        {
            $project: {
                _id: '$group._id',
                students: '$group.students',
                teachers: '$group.teachers',
                owner: '$group.owner',
                externalId: 1,
                name: '$group.name',
                source: '$group.source'
            }
        }
    ]


    async getGroupByExternalId(id: string): Promise<IGroup | null> {
        const groupItem = await getItem<IGroup>(id, 'groups');
        if (groupItem) {
            return groupItem;
        }

        const aggregationCursor = await this.collection.aggregate([
            {
                $match: {
                    "externalId": id
                },
            },
            ...this.aggregation
        ]).toArray();

        const item = aggregationCursor[0];

        if (!item) {
            return null;
        }


        const targetGroup: IGroup = {
            id: item._id.toString(),
            externalId: item.externalId,
            memberships: [...item.students, ...item.teachers, item.owner].filter(item => !!item).map((item) => item.toString()),
            name: item.name,
        }

        await addItems([targetGroup], 'groups');

        return targetGroup;
    }

    async getGroupsByExternalIds(ids: string[]): Promise<IGroup[]> {
        const {found, notFound} = await getItems<IGroup>(ids, 'groups');
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
            ...this.aggregation
        ]).toArray()

        const dbGroups: IGroup[] = aggregationCursor.map((item) => {
            return {
                id: item._id.toString(),
                externalId: item.externalId,
                memberships: [...(item.students || []), ...(item.teachers || []), item.owner].filter(item => !!item).map((item) => item.toString()),
                name: item.name,
            }

        })

        await addItems(dbGroups, 'groups');

        return [...found, ...dbGroups];
    }

}
