import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DepartmentService } from '#src/service/department'
import logger from '#src/common/logger'
import { ConnectionManager } from '#src/common/bd'

const hoisted = vi.hoisted(() => {
  function createMockedQueryBuilder () {
    return {
      table: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      first: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      ref: vi.fn().mockReturnValue({ withSchema: vi.fn() })
    }
  }
  return {
    createMockedQueryBuilder,
    mockQueryBuilder: createMockedQueryBuilder()
  }
})

describe('DepartmentService', () => {
  let departmentService: DepartmentService
  const mockConnectionManager = vi.mocked<ConnectionManager>({
    withTransaction: vi.fn(),
    // @ts-expect-error type mismatch between knex and mocked value
    getConnection: vi.fn(() => hoisted.mockQueryBuilder)
  })

  beforeEach(() => {
    departmentService = new DepartmentService({
      context: {
        logger,
        connectionManager: mockConnectionManager
      }
    })

    hoisted.mockQueryBuilder = hoisted.createMockedQueryBuilder()
    
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('findById', () => {
    const mockDepartment = {
      id: 1,
      name: 'Computer Science',
      address: '123 University Ave',
      phone: '555-0123',
      email: 'cs@university.edu',
      chiefName: 'Dr. John Smith'
    }

    it('should return department by id', async () => {
      hoisted.mockQueryBuilder.first.mockResolvedValue(mockDepartment)

      const result = await departmentService.findById(1)

      expect(hoisted.mockQueryBuilder.table).toHaveBeenCalledWith('Departments')
      expect(hoisted.mockQueryBuilder.where).toHaveBeenCalledWith('Departments.id', '=', 1)
      expect(hoisted.mockQueryBuilder.first).toHaveBeenCalled()
      expect(result).toEqual({
        id: 1,
        name: 'Computer Science',
        address: '123 University Ave',
        phone: '555-0123',
        email: 'cs@university.edu',
        chiefName: 'Dr. John Smith'
      })
    })

    it('should return null when department not found', async () => {
      hoisted.mockQueryBuilder.first.mockResolvedValue(undefined)

      const result = await departmentService.findById(999)

      expect(hoisted.mockQueryBuilder.where).toHaveBeenCalledWith('Departments.id', '=', 999)
      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed')
      hoisted.mockQueryBuilder.first.mockRejectedValue(dbError)

      await expect(departmentService.findById(1))
        .rejects.toThrow(dbError)
    })
  })
})
