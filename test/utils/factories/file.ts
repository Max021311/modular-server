import { Factory } from 'fishery'
import { File, CreateFile } from '#src/types/file.js'
import { faker } from '@faker-js/faker'
import connectionManager from '#src/common/bd/index.js'

class FileFactory extends Factory<CreateFile, null, File> {
}

export const fileFactory = FileFactory.define(({ onCreate }) => {
  onCreate(async (file) => {
    const result = await connectionManager.getConnection()
      .table('Files')
      .insert(file)
      .returning('*')
    return result[0]
  })

  return {
    name: faker.system.fileName(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
})
