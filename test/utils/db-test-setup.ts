import { DataSource } from 'typeorm';

export const clearDatabase = async (dataSource: DataSource) => {
    const entities = dataSource.entityMetadatas;
    const tableNames = entities.map((entity) => `"${entity.tableName}"`).join(', ');

    if (tableNames.length > 0) {
        await dataSource.query(`TRUNCATE ${tableNames} RESTART IDENTITY CASCADE;`);
    }
};
