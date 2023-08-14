import {Repository} from "./Repository";
import {IClass, IClassRepository, IGroup, IUser, IUserRepository} from "../intrefaces";
import {addItems, getItem, getItems} from "../utils";
import {Collection, MongoClient} from "mongodb";

const config = require('../../config.json')

export class ClassRepository extends Repository implements IClassRepository {

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
                from: 'classes',
                localField: 'localId',
                foreignField: '_id',
                as: 'class'
            }
        },
        {
            $unwind: {
                path: '$class',
                preserveNullAndEmptyArrays: true
            },
        },
        {
            $project: {
                _id: '$class._id',
                students: '$class.students',
                teachers: '$class.teachers',
                owner: '$class.owner',
                externalId: 1,
                name: '$class.name',
                source: '$class.source'
            }
        }
    ]


    async getClassByExternalId(id: string): Promise<IClass | null> {
        const classItem = await getItem<IClass>(id, 'classes');
        if (classItem) {
            return classItem;
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


        const targetUser: IClass = {
            id: item._id.toString(),
            externalId: item.externalId,
            memberships: [...item.students, ...item.teachers, item.owner].filter(item => !!item).map((item) => item.toString()),
            name: item.name,
        }

        await addItems([targetUser], 'classes');

        return targetUser;
    }

    async getClassesByExternalIds(ids: string[]): Promise<IClass[]> {
        const {found, notFound} = await getItems<IClass>(ids, 'classes');
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

        const dbClasses: IClass[] = aggregationCursor.map((item) => {
            return {
                id: item._id.toString(),
                externalId: item.externalId,
                memberships: [...item.students, ...item.teachers, item.owner].filter(item => !!item).map((item) => item.toString()),
                name: item.name,
            }

        })

        await addItems(dbClasses, 'classes');

        return [...found, ...dbClasses];
    }

}
