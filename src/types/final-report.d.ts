interface FinalReport {
  id: number
  studentId: number
  vacancyId: number
  cycleId: number
  status: 'APPROVED' | 'REJECTED' | 'PENDING'
  hours: number // Integer
  fileId: number
  createdAt: Date
  updatedAt: Date
}

export type CreateFinalReport = Omit<FinalReport, 'id'>
export type UpdateFinalReport = Partial<Omit<FinalReport, 'id'|'createdAt'|'cycleId'|'vacancyId'|'studentId'>>
