interface File {
  id: number
  name: string
  createdAt: Date
  updateddAt: Date
}

type CreateFile = Omit<File, 'id'>
type UpdateFile = Omit<File, 'id'|'createdAt'>
