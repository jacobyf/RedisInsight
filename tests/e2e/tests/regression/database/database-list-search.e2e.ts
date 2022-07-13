import { t } from 'testcafe';
import { acceptLicenseTerms } from '../../../helpers/database';
import {
    addNewStandaloneDatabases,
    addNewOSSClusterDatabase,
    deleteStandaloneDatabases,
    deleteOSSClusterDatabase
} from '../../../helpers/api/api-database';
import { MyRedisDatabasePage } from '../../../pageObjects';
import { rte } from '../../../helpers/constants';
import { commonUrl, ossStandaloneConfig, ossStandaloneV5Config, ossClusterConfig } from '../../../helpers/conf';

const myRedisDatabasePage = new MyRedisDatabasePage();
const databasesForSearch = [
    { host: ossStandaloneConfig.host, port: ossStandaloneConfig.port, databaseName: 'testSearch' },
    { host: ossStandaloneConfig.host, port: ossStandaloneConfig.port, databaseName: 'testSecondSearch' },
    { host: ossStandaloneV5Config.host, port: ossStandaloneV5Config.port, databaseName: 'testV5' },
    { host: ossStandaloneConfig.host, port: ossStandaloneConfig.port, databaseName: 'lastConnection' }
];
const databasesForAdding = [
    ossStandaloneConfig,
    databasesForSearch[0],
    databasesForSearch[1],
    databasesForSearch[2]
];

fixture.only `Database list search`
    .meta({ type: 'regression' })
    .page(commonUrl)
    .beforeEach(async() => {
        // Add new databases using API
        await acceptLicenseTerms();
        await addNewStandaloneDatabases(databasesForAdding);
        await addNewOSSClusterDatabase(ossClusterConfig);
        // Reload Page
        await t.eval(() => location.reload());
    })
    .afterEach(async() => {
        //Clear and delete databases
        await deleteStandaloneDatabases(databasesForAdding);
        await deleteOSSClusterDatabase(ossClusterConfig);
    });
test
    .meta({ rte: rte.standalone })('Verify that user can search DB by database name on the List of databases', async t => {
        //Search for DB by name
        const searchedDBName = 'Search';
        await t.typeText(myRedisDatabasePage.searchInput, searchedDBName, { replace: true });
        //Verify that database found on the list search by name
        await t.expect(myRedisDatabasePage.dbNameList.withExactText(databasesForSearch[0].databaseName).exists).ok('The database with alias is found', { timeout: 10000 });
        await t.expect(myRedisDatabasePage.dbNameList.withExactText(databasesForSearch[1].databaseName).exists).ok('The database with alias is found', { timeout: 10000 });
        await t.expect(myRedisDatabasePage.dbNameList.withExactText(databasesForSearch[2].databaseName).exists).notOk('The database with other alias is not found', { timeout: 10000 });
    });
test
    .meta({ rte: rte.standalone })('Verify that user can search DB by host on the List of databases', async t => {
        //Search for DB by host
        const searchedDBHost = ossStandaloneConfig.host;
        await t.typeText(myRedisDatabasePage.searchInput, searchedDBHost, { replace: true });
        //Verify that database found on the list search by host
        await t.expect(myRedisDatabasePage.dbNameList.withExactText(databasesForSearch[0].databaseName).exists).ok('The database with host is found', { timeout: 10000 });
        await t.expect(myRedisDatabasePage.dbNameList.withExactText(databasesForSearch[1].databaseName).exists).ok('The database with host is found', { timeout: 10000 });
        await t.expect(myRedisDatabasePage.dbNameList.withExactText(ossClusterConfig.ossClusterDatabaseName).exists).notOk('The database with other host is not found', { timeout: 10000 });
    });
test
    .meta({ rte: rte.standalone })('Verify that user can search DB by port on the List of databases', async t => {
        //Search for DB by port
        const searchedDBPort = ossStandaloneConfig.port;
        await t.typeText(myRedisDatabasePage.searchInput, searchedDBPort, { replace: true });
        //Verify that database found on the list search by port
        await t.expect(myRedisDatabasePage.dbNameList.withExactText(databasesForSearch[0].databaseName).exists).ok('The database with port is found', { timeout: 10000 });
        await t.expect(myRedisDatabasePage.dbNameList.withExactText(databasesForSearch[1].databaseName).exists).ok('The database with port is found', { timeout: 10000 });
        await t.expect(myRedisDatabasePage.dbNameList.withExactText(ossClusterConfig.ossClusterDatabaseName).exists).notOk('The database with other port is not found', { timeout: 10000 });
    });
test
    .meta({ rte: rte.standalone })('Verify that user can search DB by Connection Type on the List of databases', async t => {
        //Search for DB by connection type
        const searchedDBConType = 'Standalone';
        await t.typeText(myRedisDatabasePage.searchInput, searchedDBConType, { replace: true });
        //Verify that database found on the list search by connection type
        await t.expect(myRedisDatabasePage.dbNameList.withExactText(databasesForSearch[0].databaseName).exists).ok('The database with connection type is found', { timeout: 10000 });
        await t.expect(myRedisDatabasePage.dbNameList.withExactText(databasesForSearch[1].databaseName).exists).ok('The database with connection type is found', { timeout: 10000 });
        await t.expect(myRedisDatabasePage.dbNameList.withExactText(ossClusterConfig.ossClusterDatabaseName).exists).notOk('The database with other connection type is not found', { timeout: 10000 });
    });
test
    .meta({ rte: rte.standalone })('Verify that user can search DB by Last Connection on the List of databases', async t => {
        const searchedDBFirst = 'less than a minute ago';
        const searchedDBSecond = '1 minute ago';
        const searchTimeout = 60 * 1000; // 60 sec to wait for changing Last Connection time
        const dbSelector = myRedisDatabasePage.dbNameList.withExactText(databasesForSearch[2].databaseName);
        const startTime = Date.now();
        //Search for DB by Last Connection
        await t.typeText(myRedisDatabasePage.searchInput, searchedDBFirst, { replace: true });
        //Verify that database added < 1min ago found on the list search by Last Connection
        await t.expect(myRedisDatabasePage.dbNameList.withExactText(databasesForSearch[1].databaseName).exists).ok('The database with Last Connection is found', { timeout: 10000 });
        //Verify that database added > 1min ago found on the list search by Last Connection
        do {
            await t.eval(() => location.reload());
            await t.typeText(myRedisDatabasePage.searchInput, searchedDBSecond, { replace: true });
        }
        while (!(await dbSelector.exists) && Date.now() - startTime < searchTimeout);
        await t.expect(dbSelector.exists).ok('The database with Last Connection is found', { timeout: 10000 });
    });
test
    .meta({ rte: rte.standalone })('Verify that user sees "No results found" message when pattern doesn`t match any database', async t => {
        //Search for DB by Invalid search
        const searchedDBHost = 'invalid';
        await t.typeText(myRedisDatabasePage.searchInput, searchedDBHost, { replace: true });
        //Verify that "No results found" message is displayed in case of invalid search
        await t.expect(myRedisDatabasePage.noResultsFoundMessage.exists).ok('"No results found message" not displayed');
        await t.expect(myRedisDatabasePage.noResultsFoundText.exists).ok('"No databases matched your search" message not displayed');
    });
