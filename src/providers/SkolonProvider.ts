import {IGroupProvider, IProvider, IUserProvider} from "../intrefaces";
import axios, {AxiosResponse} from "axios";

const config = require('../../config.json')

type UserResponse = {
    versionTag: number;
    users: {
        id: string;
        uuid: string;
        isDeleted: boolean;
        externalIdentifiers: any[];
        schools: {
            id: string;
            uuid: string;
        }[];
        username: string;
        email?: string;
        userType: string;
        firstName: string;
        lastName: string;
        language: string;
    }[];
    hasMore: boolean;
    cursor?: string;
};

type GroupResponse = {
    versionTag: number;
    groups: {
        id: string;
        uuid: string;
        isDeleted: boolean;
        memberships?: Array<{
            id: string;
            uuid: string;
        }>
        name?: string;
        schoolId?: string;
        schoolUuid?: string;
        type?: 'TEACHING_GROUP' | 'CLASS'
    }[];
    hasMore: boolean;
    cursor?: string;
};


async function* fetchUsers(endpoint: string, classId: string): AsyncGenerator<UserResponse> {
    let nextCursor: string | null = null;

    do {
        const response: AxiosResponse<UserResponse> = await axios.get<UserResponse>(endpoint, {
            params: {
                cursor: nextCursor,
                limit: 10,
                classId
            }
        });

        const {data} = response;

        yield data;

        nextCursor = data.cursor || null;

    } while (nextCursor);
}


export class SkolonProvider implements IProvider {

    private accessToken: undefined | string

    async auth(): Promise<void> {
        const response = await axios.post(config.providers.skolon.auth.authHost, {
            grant_type: "client_credentials"
        }, {
            headers: {
                Authorization: config.providers.skolon.auth.token,
                "Content-Type": "application/x-www-form-urlencoded"
            },
        })

        this.accessToken = response.data.access_token
    }


    async* getUsers(schoolId: string): AsyncGenerator<Array<IUserProvider>> {

        let nextCursor: string | null = null;

        do {
            const response: AxiosResponse<UserResponse> = await axios.get<UserResponse>(config.providers.skolon.api.endpoints.user, {
                params: {
                    cursor: nextCursor,
                    limit: 20,
                    schoolId
                },
                headers: {
                    Authorization: `Bearer ${this.accessToken}`
                }
            });

            const {data} = response;

            yield data.users.map((item) => ({
                id: item.id,
                isDeleted: item.isDeleted,
                email: item.email,
                firstName: item.firstName,
                lastName: item.lastName,
                userType: "teacher",
                username: item.username || item.email || `${item.firstName}_${item.lastName}_${item.id.substring(0, 6)}`
            }));

            nextCursor = data.cursor || null;

        } while (nextCursor);
    }


    async* getGroups(schoolId: string): AsyncGenerator<Array<IGroupProvider>> {

        let nextCursor: string | null = null;

        do {
            const response: AxiosResponse<GroupResponse> = await axios.get<GroupResponse>(config.providers.skolon.api.endpoints.group, {
                params: {
                    cursor: nextCursor,
                    limit: 20,
                    schoolId
                },
                headers: {
                    Authorization: `Bearer ${this.accessToken}`
                }
            });

            const {data} = response;

            yield data.groups.map((group) => {
                const memberships = group.memberships?.map(item => item.id);
                let type: IGroupProvider['type'];
                if (group.type === 'CLASS') {
                    type = 'class'
                }

                if (group.type === 'TEACHING_GROUP') {
                    type = 'group'
                }

                const groupProvider: IGroupProvider = {
                    id: group.id,
                    isDeleted: group.isDeleted,
                    schoolId: group.schoolId,
                    name: group.name,
                    type,
                    memberships
                };
                return groupProvider;
            });

            nextCursor = data.cursor || null;

        } while (nextCursor);
    }


}
