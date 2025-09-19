import type { CreateFile, File } from '#src/types/file.js'

export type FilePicked = Pick<File, 'id'|'name'|'createdAt'|'updateddAt'>

export { CreateFile, UpdateFile } from '#src/types/file.js'

export interface FileServiceI {
  getById(id: number): Promise<FilePicked | null>
  create(fileData: Omit<CreateFile, 'createdAt' | 'updateddAt'>): Promise<FilePicked>
}

