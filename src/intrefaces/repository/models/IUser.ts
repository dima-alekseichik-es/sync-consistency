export interface IUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    externalId: string;
    type: 'teacher' | 'student'
}
