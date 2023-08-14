export abstract class Repository {
    generateURL(options: {
        hostname: string,
        password: string,
        database: string,
        port: number,
        username: string
    }): string {
        const {hostname, password, database, port, username} = options;

        return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${hostname}:${port}/${database}`;


    }
}
