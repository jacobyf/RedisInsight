import { acceptLicenseTermsAndAddDatabaseApi } from '../../../helpers/database';
import { CliPage, WorkbenchPage, MyRedisDatabasePage } from '../../../pageObjects';
import {
    commonUrl,
    ossStandaloneConfig
} from '../../../helpers/conf';
import { rte } from '../../../helpers/constants';
import { deleteStandaloneDatabaseApi } from '../../../helpers/api/api-database';

const cliPage = new CliPage();
const workbenchPage = new WorkbenchPage();
const myRedisDatabasePage = new MyRedisDatabasePage();

fixture `Promote workbench in CLI`
    .meta({ rte: rte.standalone, type: 'regression' })
    .page(commonUrl)
    .beforeEach(async() => {
        await acceptLicenseTermsAndAddDatabaseApi(ossStandaloneConfig, ossStandaloneConfig.databaseName);
    })
    .afterEach(async() => {
        // Delete database
        await deleteStandaloneDatabaseApi(ossStandaloneConfig);
    });
test('Verify that users can see workbench promotion message when they open CLI', async t => {
    // Open CLI
    await t.click(cliPage.cliExpandButton);
    await t.expect(cliPage.workbenchLink.parent().textContent).eql('Try Workbench, our advanced CLI. Check out our Quick Guides to learn more about Redis capabilities.');
    // Verify that user is redirected to Workbench page clicking on workbench link in CLI
    await t.click(cliPage.workbenchLink);
    await t.expect(workbenchPage.expandArea.exists).ok('Workbench page is opened');
    // Verify that CLI panel is minimized after redirection to workbench from CLI
    await t.expect(cliPage.cliPanel.visible).notOk('Closed CLI');
});
test('Verify that user can see saved workbench context after redirection from CLI to workbench', async t => {
    // Open Workbench
    await t.click(myRedisDatabasePage.workbenchButton);
    const command = 'INFO';
    await t.typeText(workbenchPage.queryInput, command, { replace: true, speed: 1, paste: true });
    await t.hover(workbenchPage.preselectArea);
    await t.click(workbenchPage.collapsePreselectAreaButton);
    // Turn to Browser page
    await t.click(myRedisDatabasePage.browserButton);
    // Open CLI
    await t.click(cliPage.cliExpandButton);
    await t.click(cliPage.workbenchLink);
    // Check content in Workbench area
    await t.expect(workbenchPage.expandPreselectAreaButton.visible).ok('Enablement area is folded');
    // Check editor
    await t.expect(workbenchPage.mainEditorArea.find('span').withExactText(command).visible).ok('Command is saved in editor');
});
