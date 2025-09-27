interface Report {
  id: number
  studentId: number
  vacancyId: number
  cycleId: number
  reportNumber: '1' | '2'
  status: 'APPROVED' | 'REJECTED' | 'PENDING'
  hours: number // integer
  fileId: number
  createdAt: Date
  updatedAt: Date
}

export type CreateReport = Omit<Report, 'id'>
export type UpdateReport = Partial<Omit<Report, 'id'|'createdAt'|'cycleId'|'vacancyId'|'studentId'|'reportNumber'>>
