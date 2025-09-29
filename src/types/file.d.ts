export interface File {
  id: number
  name: string
  url: string
  createdAt: Date
  updatedAt: Date
}

export type CreateFile = Omit<File, 'id'>
export type UpdateFile = Partial<Omit<File, 'id'|'createdAt'>>
