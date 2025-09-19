export interface ComissionOffice {
  id: number
  studentId: number
  vacancyId: number
  cycleId: number
  beginDate: Date // Only the date is relevant
  status: 'APPROVED' | 'REJECTED' | 'PENDING'
  fileId: number
  createdAt: Date // Timestamp
  updatedAt: Date // Timestamp
}

export type CreateComissionOffice = Omit<ComissionOffice, 'id'>
export type UpdateComissionOffice = Partial<Omit<ComissionOffice, 'id'|'createdAt'|'beginDate'|'cycleId'|'vacancyId'|'studentId'>>
