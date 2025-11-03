import fp from 'fastify-plugin'
import userRoutesPlugin from './user.js'
import studentsRoutesPlugin from './students/index.js'
import careersRoutesPlugin from './careers/index.js'
import departmentsRoutesPlugin from './departments/index.js'
import cyclesRoutesPlugin from './cycles/index.js'
import vacanciesRoutesPlugin from './vacancies/index.js'
import comissionOfficesRoutesPlugin from './comission-offices/index.js'
import finalReportsRoutesPlugin from './final-reports/index.js'
import reportsRoutesPlugin from './reports/index.js'
import categoriesRoutesPlugin from './categories/index.js'
import apiPlugin from './api/index.js'

export default fp(async function RoutesPlugin (fastify) {
  fastify
    .register(userRoutesPlugin, { prefix: '/user' })
    .register(studentsRoutesPlugin, { prefix: '/students' })
    .register(careersRoutesPlugin, { prefix: '/careers' })
    .register(departmentsRoutesPlugin, { prefix: '/departments' })
    .register(cyclesRoutesPlugin, { prefix: '/cycles' })
    .register(vacanciesRoutesPlugin, { prefix: '/vacancies' })
    .register(comissionOfficesRoutesPlugin, { prefix: '/comission-offices' })
    .register(finalReportsRoutesPlugin, { prefix: '/final-reports' })
    .register(reportsRoutesPlugin, { prefix: '/reports' })
    .register(categoriesRoutesPlugin, { prefix: '/categories' })
    .register(apiPlugin, { prefix: '/api' })
})
