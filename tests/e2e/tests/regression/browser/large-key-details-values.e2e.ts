import { rte } from '../../../helpers/constants';
import { acceptLicenseTermsAndAddDatabaseApi } from '../../../helpers/database';
import { BrowserPage, CliPage } from '../../../pageObjects';
import { commonUrl, ossStandaloneConfig } from '../../../helpers/conf';
import { deleteStandaloneDatabaseApi } from '../../../helpers/api/api-database';
import { Common } from '../../../helpers/common';

const browserPage = new BrowserPage();
const common = new Common();
const cliPage = new CliPage();

const field = common.generateWord(20);
const value = common.generateSentence(200);
const value1 = common.generateWord(20);
const keyName = common.generateWord(20);
const keyTTL = '2147476121';

fixture `Expand/Collapse large values in key details`
    .meta({ type: 'regression', rte: rte.standalone })
    .page(commonUrl)
    .beforeEach(async () => {
        await acceptLicenseTermsAndAddDatabaseApi(ossStandaloneConfig, ossStandaloneConfig.databaseName);
    })
    .afterEach(async t => {
        //Clear and delete database
        if (await browserPage.closeKeyButton.visible) {
            await t.click(browserPage.closeKeyButton);
        }
        await browserPage.deleteKeyByName(keyName);
        await deleteStandaloneDatabaseApi(ossStandaloneConfig);
    });
test('Verify that user can click on a row to expand it if any of its cells contains a value which is truncated.', async t => {
    const entryFieldLong = browserPage.streamEntryFields.nth(1).parent(1);
    const entryFieldSmall = browserPage.streamEntryFields.nth(0).parent(1);
    // Create stream key
    await cliPage.sendCommandInCli(`XADD ${keyName} * '${field}' '${value}'`);
    await cliPage.sendCommandInCli(`XADD ${keyName} * '${field}' '${value1}'`);
    //Open key details
    await browserPage.openKeyDetails(keyName);
    // Remember height of the cells
    const startLongCellHeight = await entryFieldLong.clientHeight;
    const startSmallCellHeight = await entryFieldSmall.clientHeight;
    await t.click(entryFieldSmall);
    // Verify that field with small text is not expanded
    await t.expect(entryFieldSmall.clientHeight).lt(startSmallCellHeight + 5, 'Row is expanded', { timeout: 5000 });
    // Verify that user can expand/collapse for stream data type
    await t.click(entryFieldLong);
    await t.expect(entryFieldLong.clientHeight).gt(startLongCellHeight + 150, 'Row is not expanded', { timeout: 5000 });
    // Verify that user can collapse the row by clicking anywhere on the expanded row
    await t.click(entryFieldLong);
    await t.expect(entryFieldLong.clientHeight).eql(startLongCellHeight, 'Row is not collapsed', { timeout: 5000 });
});
test('Verify that user can expand/collapse for hash data type', async t => {
    const fieldValueCell = browserPage.hashFieldValue.parent(2);
    // Create hash key
    await browserPage.addHashKey(keyName, keyTTL, field, value);
    // Remember height of the cell with long value
    const startCellHeight = await fieldValueCell.clientHeight;
    // Verify that user can expand a row of hash data type
    await t.click(fieldValueCell);
    await t.expect(fieldValueCell.clientHeight).gt(startCellHeight + 150, 'Row is not expanded', { timeout: 5000 });
    // Verify that user can collapse a row of hash data type
    await t.click(fieldValueCell);
    await t.expect(fieldValueCell.clientHeight).eql(startCellHeight, 'Row is not collapsed', { timeout: 5000 });
});
test('Verify that user can expand/collapse for set data type', async t => {
    const memberValueCell = browserPage.setMembersList.parent(2);
    // Create set key
    await browserPage.addSetKey(keyName, keyTTL, value);
    // Remember height of the cell with long value
    const startLongCellHeight = await memberValueCell.clientHeight;
    // Verify that user can expand a row of set data type
    await t.click(memberValueCell);
    await t.expect(memberValueCell.clientHeight).gt(startLongCellHeight + 150, 'Row is not expanded', { timeout: 5000 });
    // Verify that user can collapse a row of set data type
    await t.click(memberValueCell);
    await t.expect(memberValueCell.clientHeight).eql(startLongCellHeight, 'Row is not collapsed', { timeout: 5000 });
});
test('Verify that user can expand/collapse for sorted set data type', async t => {
    const memberValueCell = browserPage.zsetMembersList.parent(1);
    // Create zset key
    await browserPage.addZSetKey(keyName, '1', keyTTL, value);
    // Remember height of the cell with long value
    const startLongCellHeight = await memberValueCell.clientHeight;
    // Verify that user can expand a row of sorted set data type
    await t.click(memberValueCell);
    await t.expect(memberValueCell.clientHeight).gt(startLongCellHeight + 150, 'Row is not expanded', { timeout: 5000 });
    // Verify that user can collapse a row of sorted set data type
    await t.click(memberValueCell);
    await t.expect(memberValueCell.clientHeight).eql(startLongCellHeight, 'Row is not collapsed', { timeout: 5000 });
});
test('Verify that user can expand/collapse for list data type', async t => {
    const elementValueCell = browserPage.listElementsList.parent(2);
    // Create list key
    await browserPage.addListKey(keyName, keyTTL, value);
    // Remember height of the cell with long value
    const startLongCellHeight = await elementValueCell.clientHeight;
    // Verify that user can expand a row of list data type
    await t.click(elementValueCell);
    await t.expect(elementValueCell.clientHeight).gt(startLongCellHeight + 150, 'Row is not expanded', { timeout: 5000 });
    // Verify that user can collapse a row of list data type
    await t.click(elementValueCell);
    await t.expect(elementValueCell.clientHeight).eql(startLongCellHeight, 'Row is not collapsed', { timeout: 5000 });
});
test('Verify that user can work in full mode with expanded/collapsed value', async t => {
    const elementValueCell = browserPage.listElementsList.parent(2);
    // Create list key
    await browserPage.addListKey(keyName, keyTTL, value);
    // Open full mode for key details
    await t.click(browserPage.fullScreenModeButton);
    // Remember height of the cell with long value
    const startLongCellHeight = await elementValueCell.clientHeight;
    // Verify that user can expand a row in full mode
    await t.click(elementValueCell);
    await t.expect(elementValueCell.clientHeight).gt(startLongCellHeight + 60, 'Row is not expanded', { timeout: 5000 });
    // Verify that user can collapse a row in full mode
    await t.click(elementValueCell);
    await t.expect(elementValueCell.clientHeight).eql(startLongCellHeight, 'Row is not collapsed', { timeout: 5000 });
});
