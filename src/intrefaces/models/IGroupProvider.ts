export interface IGroupProvider {
    id: string;
    isDeleted: boolean;
    memberships?: string[];
    name?: string;
    schoolId?: string;
    type?: 'class' | 'group'
}
