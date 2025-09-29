import type { CreateFile, File } from '#src/types/file.js'
import type { Buffer } from 'node:buffer'

export type FilePicked = Pick<File, 'id'|'name'|'createdAt'|'url'|'updatedAt'>

export { CreateFile, UpdateFile } from '#src/types/file.js'

export interface FileServiceI {
  getById(id: number): Promise<FilePicked | null>
  create(fileData: Omit<CreateFile, 'createdAt' | 'updatedAt' | 'url'>, file: Buffer): Promise<FilePicked>
}
