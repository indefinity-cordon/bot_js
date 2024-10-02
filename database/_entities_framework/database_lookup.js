/*******************************************************************************
 * W. I. P.
**/
async function backupTable(db, table_name) {
    const backup_table_name = `${table_name}_backup_${Date.now()}`;
    console.log(`Database >> MySQL (ENTITY) >> Creating backup for table ${table_name} as ${backup_table_name}...`);
    await db.query(`CREATE TABLE ${backup_table_name} LIKE ${table_name}`);
    await db.query(`INSERT INTO ${backup_table_name} SELECT * FROM ${table_name}`);
    console.log(`Database >> MySQL (ENTITY) >> Backup created successfully: ${backup_table_name}`);
};

async function checkAndCreateTable(db, table_name, expected_structure) {
    const [rows] = await db.query(`SHOW TABLES LIKE '${table_name}'`);
    if (rows.length === 0) {
        console.log(`Database >> MySQL (ENTITY) >> [ERROR] >> Table ${table_name} does not exist. Creating...`);
//        await createTable(db, table_name, expected_structure); NO REAL ACTIONS, JUST WARNING
    } else {
        const table_structure = await db.query(`DESCRIBE ${table_name}`);
        if (!compareTableStructure(table_structure, expected_structure)) {
            console.log(`Database >> MySQL (ENTITY) >> [ERROR] >> Table ${table_name} structure mismatch. Backing up and updating...`);
//            await backupTable(db, table_name); NO REAL ACTIONS, JUST WARNING
//            await updateTable(db, table_name, expected_structure); NO REAL ACTIONS, JUST WARNING
        }
    }
};

async function createTable(db, table_name, structure) {
    const columns = Object.keys(structure.columns).map(column => {
        return `\`${column}\` ${structure.columns[column]}`;
    }).join(', ');
    const query = `CREATE TABLE \`${table_name}\` (${columns})`;
    await db.query(query);
    console.log(`Database >> MySQL (ENTITY) >> Table ${table_name} created successfully.`);
};

async function updateTable(db, table_name, expected_structure) {
    await db.query(`DROP TABLE ${table_name}`);
    await createTable(db, table_name, expected_structure);
    console.log(`Database >> MySQL (ENTITY) >> Table ${table_name} updated successfully.`);
};

function compareTableStructure(actual_structure, expected_structure) {
    const actual_columns = actual_structure.map(row => row.Field);
    const expected_columns = Object.keys(expected_structure.columns);
    return JSON.stringify(actual_columns.sort()) === JSON.stringify(expected_columns.sort());
};

async function tables_tester(db) {
    for (const [key, meta] of Object.entries(global.entity_meta)) {
        await checkAndCreateTable(db, meta.table, meta);
    }
};

module.exports = tables_tester;
