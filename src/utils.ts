import {IClass, IGroup, IGroupProvider, IUser, IUserProvider} from "./intrefaces";
import * as fs from "fs/promises";
import * as path from "path";


export type Domain = 'classes' | 'groups' | 'users';

export type Entities = IUser | IGroup | IClass;
export const storeItems = async (file: string, data: any) => {
    const payload = JSON.stringify(data);
    const dir = path.dirname(file);
    await fs.mkdir(dir, {recursive: true});
    await fs.writeFile(file, payload);
}

export const readFile = async (file: string): Promise<string | null> => {
    try {
        const data = await fs.readFile(file);
        return data.toString('utf-8');
    } catch (e) {
        return null;
    }
}


export const storeUsers = async (users: IUserProvider[]) => {
    const FILE_PATH = path.join(__dirname, '../tmp/users.json');
    const file = await readFile(FILE_PATH);
    let payload: Record<string, IUserProvider> = JSON.parse(file || "{}");
    payload = users.reduce((previousValue, currentValue) => {
        previousValue[currentValue.id] = currentValue;
        return previousValue;
    }, payload);

    await storeItems(FILE_PATH, payload)
}

export const storeGroups = async (users: IGroupProvider[]) => {
    const FILE_PATH = path.join(__dirname, '../tmp/groups.json');
    const file = await readFile(FILE_PATH);
    let payload: Record<string, IGroupProvider> = JSON.parse(file || "{}");
    payload = users.reduce((previousValue, currentValue) => {
        previousValue[currentValue.id] = currentValue;
        return previousValue;
    }, payload);

    await storeItems(FILE_PATH, payload)
}

export const getItem = async <T extends Entities>(id: string, domain: Domain): Promise<T | null> => {
    const FILE_PATH = path.join(__dirname, `../tmp/${domain}-db.json`);
    const file = await readFile(FILE_PATH);
    if (file === null) {
        return null;
    }
    const payload: Record<string, T> = JSON.parse(file);
    return payload[id] || null;
}

export const getItems = async <T extends Entities>(userIds: string[], domain: Domain): Promise<{
    found: T[],
    notFound: string[]
}> => {
    const FILE_PATH = path.join(__dirname, `../tmp/${domain}-db.json`);
    const file = await readFile(FILE_PATH);
    if (file === null) {
        return {
            found: [],
            notFound: userIds
        };
    }
    const payload: Record<string, T> = JSON.parse(file);

    const found: T[] = [];
    const notFound: string[] = [];
    for (const userId of userIds) {
        const item = payload[userId];
        if (item) {
            found.push(item);
        } else {
            notFound.push(userId);
        }
    }

    return {
        found,
        notFound
    }
}

export const addItems = async <T extends Entities>(users: Array<T>, domain: Domain) => {
    const FILE_PATH = path.join(__dirname, `../tmp/${domain}-db.json`);
    const file = await readFile(FILE_PATH);
    let payload: Record<string, T> = JSON.parse(file || "{}");
    payload = users.reduce((previousValue, currentValue) => {
        previousValue[currentValue.externalId] = currentValue;
        return previousValue;
    }, payload);

    await storeItems(FILE_PATH, payload)
}

type AnyObject = { [key: string]: any };

export function mergeArrays<T extends IUser, U extends IUserProvider>(
    array1: IUser[],
    field1: keyof IUser,
    array2: IUserProvider[],
    field2: keyof IUserProvider,
): any[] {
    const mergedArray: any[] = [];

    array1.forEach(item1 => {
        const matchedItem = array2.find(item2 => item2[field2] === item1[field1]);
        if (matchedItem) {
            mergedArray.push({
                externalId: matchedItem.id,
                localId: item1.id,
                externalUsername: matchedItem.username,
                localUsername: item1.username,
                isExternalDeleted: matchedItem.isDeleted,
            });
        }
    });
    return mergedArray;

}
