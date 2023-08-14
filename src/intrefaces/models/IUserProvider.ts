export interface IUserProvider {
    id: string;
    firstName: string;
    lastName?: string;
    userType: "teacher" | "student";
    isDeleted: boolean;
    email?: string;
    username: string;
}
