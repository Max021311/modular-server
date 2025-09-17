export interface VacancyToStudent {
  id: number
  vacancyId: number
  studentId: number
  createdAt: Date
  updatedAt: Date
}

export type CreateVacancyToStudent = Omit<VacancyToStudent, 'id'>
export type UpdateVacancyToStudent = never
