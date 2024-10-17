import type { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  return knex.schema
    .createTable('Users', function (table) {
      table.increments('id').primary().notNullable()
      table.string('name').notNullable()
      table.string('user').unique({
        indexName: 'Users_user_unique'
      }).notNullable()
      table.string('password').notNullable()
      table.specificType('permissions', 'text[]').notNullable()
      table.timestamp('createdAt').notNullable()
      table.timestamp('updatedAt').notNullable()
    })
    .raw(`
    CREATE OR REPLACE FUNCTION preserve_created_at_update()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW."createdAt" = OLD."createdAt";
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    `)
    .raw(`
    CREATE TRIGGER preserve_created_at_trigger
    BEFORE UPDATE ON "Users"
    FOR EACH ROW
    EXECUTE FUNCTION preserve_created_at_update();
    `)
}

export async function down (knex: Knex): Promise<void> {
  return knex.schema
    .raw('DROP FUNCTION IF EXISTS preserve_created_at_update();')
    .raw('DROP TRIGGER IF EXISTS preserve_created_at_trigger ON "Users";')
}
