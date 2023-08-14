import {SkolonProvider} from "./providers";
import {mergeArrays, storeGroups, storeUsers} from "./utils";
import {UserRepository, GroupRepository, ClassRepository} from "./repositories";
import {IGroupProvider} from "./intrefaces";

const BgRed = "\x1b[41m"
const Reset = "\x1b[0m"


console.log('Skolon consistency checker is running!');
(async () => {
    const skolonProvider = new SkolonProvider();
    await skolonProvider.auth();

    const userRepository = new UserRepository();
    const groupRepository = new GroupRepository();
    const classRepository = new ClassRepository();


    const schoolIds = [
        '9Fiu5dn4pNefmvkYl1ENjDJGRKYJPn5bxj4pq78ofvxTf4UDvg',
        'phTT1vGJNaSATK1G7D3n7ov6wPuLnWBZB1DCnGvw9zRb56Xxzo',
        'vELvmhP4qPTgm8ThlgtYPwJ0MggVlsjUXJn78c5WAEF34uxxLx',
        'Mcoak48VR34Fly1pd6D0m0Cqy6nr926uYr2oP8k5ZoqxgNbieh',
        'Sv3Z1JEU8kkYFM6jXvuBPvpq8UchJYdY8sxd0g2b6h2bElLx1b',
        '4Ek2GLzSNVjW4SyAV8USJAkMThnYNdyycs62B6EFnFMBmR7D4u',
        'TEdqAVChGpx7wUzLbDypsPksa2JGs1TZKBnVhvPpmTiWkZkJ0c',
        'Crn2cd3ZwX0XYi4UrZdKBKa0MDKWMn4q1gzGW6oVPfyAVBJtj5',
        'C17baetkcmrpVqdoUANidSS6MwGR7kwigFSwrojGUF0wdL3kxr',
        'AXjUpgpKznqWbrcMNiP9vJxoL4DIV8Av6Tqv9PgJcGFo7SaUa0',
        '0lTYC6XK0MjhxiY3pYt822fPNfk9u5jlnFacz6CYhVTa6ZdZxK',
        'NVl3WiEe2mTRd6aYw5jn14GD53bu2nGMAk9ADEv2BaGLcurc4s',
        'j5uouaoDMmeDVNkAqLWD3luVlSjVWTeVKu7XfWCT51CBzLFmlG',
        'vdPhzbKvTDo7sMy7pnYlUNduTnzuCD5bRkpXXt758lNcaDyFNW',
        '8wlvkCpUtylw0S7yM8UECav4cZ6kD4VivbiL0gpUUyTbWld7Di',
        '61xjC7r5NUDBXtqL0bqKDT3ZoMeGNYa6jvYm9xXq2mCbgo5V0g',
        '0nk05VslyPWielgJ5SeoXZli1jjr6kk7ByKpfqTq5Rmfhxxham',

    ];


    for (const schoolId of schoolIds) {
        //
        // console.log('Checking of users')
        // for await (const externalUsers of skolonProvider.getUsers(schoolId)) {
        //     await storeUsers(externalUsers);
        //     const usersFromDb = await userRepository.getUsersByExternalIds(externalUsers.map((item) => item.id));
        //     const response = mergeArrays(usersFromDb, 'externalId', externalUsers, 'id',);
        //     // console.table(response)
        //
        //     if (response.length !== externalUsers.length || response.length !== usersFromDb.length) {
        //         console.log('merge.length',response.length, 'externalUsers.length', externalUsers.length, 'usersFromDb.length', usersFromDb.length )
        //         console.log(BgRed, 'Something went wrong', Reset)
        //         console.log(BgRed, 'Matteappen DB', Reset)
        //         console.table(usersFromDb);
        //         console.log(BgRed, 'Skolon Data', Reset)
        //         console.table(externalUsers);
        //     }
        //
        // }

        console.log('Checking of groups')
        for await (const externalGroups of skolonProvider.getGroups(schoolId)) {

            const {classes, deletedClasses, groups, deletedGroups} = externalGroups.reduce((acc, item) => {
                if (item.type === 'class') {
                    if (item.isDeleted) {
                        acc.deletedClasses.push(item)
                    } else {
                        acc.classes.push(item)
                    }
                } else {
                    if (item.isDeleted) {
                        acc.deletedGroups.push(item)
                    } else {
                        acc.groups.push(item);
                    }
                }
                return acc;
            }, {
                classes: [] as IGroupProvider[],
                groups: [] as IGroupProvider[],
                deletedGroups: [] as IGroupProvider[],
                deletedClasses: [] as IGroupProvider[]
            });

            await storeGroups(externalGroups);

            const groupsFromDb = await groupRepository.getGroupsByExternalIds(groups.map((item) => item.id));

            for (let group of groupsFromDb) {
                const externalGroup = groups.find((item) => item.id === group.externalId);
                if (externalGroup && group.memberships.length !== externalGroup.memberships?.length) {
                    const targetUsers = await userRepository.getUsersByExternalIds(externalGroup.memberships || []);
                    const targetUsersIds = targetUsers.map((item) => item.id);

                    const missedUsers = group.memberships?.filter((item) => !targetUsersIds.includes(item));
                    console.log(
                        BgRed, 'missed users in group', Reset,
                        missedUsers);

                    const extraUsers = targetUsersIds.filter((item) => !group.memberships?.includes(item));

                    console.log(
                        BgRed, 'extra users in group', Reset,
                        extraUsers);

                    console.log(group.memberships.length, externalGroup.memberships?.length, group.memberships.length !== externalGroup.memberships?.length);
                    // console.log(externalGroup.memberships);
                    console.log(BgRed, `Users mismatch in group ${group.id} - ${group.externalId}`, Reset)
                }
            }

            if (groupsFromDb.length !== groups.length) {
                console.log(BgRed, 'Something went wrong', Reset)
                console.log(BgRed, 'Matteappen DB', Reset)
                console.table(groupsFromDb.map((item) => ({...item, memberships: item.memberships.length})));
                console.log(BgRed, 'Skolon Data', Reset)
                console.table(groups);
            }

            // console.log('classes')
            const classesFromDb = await classRepository.getClassesByExternalIds(classes.map((item) => item.id));

            for (let classItem of classesFromDb) {
                const externalClass = groups.find((item) => item.id === classItem.externalId);
                if (externalClass && classItem.memberships.length !== externalClass.memberships?.length) {
                    console.log(BgRed, `Users mismatch in group ${classItem.id} - ${externalClass.id}`, Reset)
                }
            }

            if (classesFromDb.length !== classes.length) {
                console.log(BgRed, 'Something went wrong', Reset)
                console.log(BgRed, 'Matteappen DB', Reset)
                console.table(classesFromDb.map((item) => ({...item, memberships: item.memberships.length})));
                console.log(BgRed, 'Skolon Data', Reset)
                console.table(classes);
            }
        }

        console.log('Checking of users finished', schoolId)
    }
})()
