import type { CreateDepartment, Department, UpdateDepartment } from '#src/types/departments'

export type DepartmentPicked = Pick<Department, 'id'|'name'|'address'|'phone'|'email'|'chiefName'|'createdAt'|'updatedAt'>

export { CreateDepartment, UpdateDepartment } from '#src/types/departments'

export interface FindAndCountParams {
  limit: number
  offset: number
  order?: [`Departments.${keyof Department}`, 'asc' | 'desc']
  search?: string
}

export interface DepartmentServiceConfigI {
  textSearch: {
    language: string
  }
}

export interface DepartmentServiceI {
  findById(id: number): Promise<DepartmentPicked | null>
  findAndCountAll(params: FindAndCountParams): Promise<{ total: number, records: DepartmentPicked[] }>
  create(departmentData: Omit<CreateDepartment, 'createdAt' | 'updatedAt'>): Promise<DepartmentPicked>
  update(id: number, departmentData: Omit<UpdateDepartment, 'updatedAt'>): Promise<DepartmentPicked>
}
