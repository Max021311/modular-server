/**
 * StripMinus removes the minus sign from the beginning of a string.
 *
 * @param S - The string to strip the minus sign from.
 * @returns The string with the minus sign removed.
 *
 * @example
 * StripMinus<'field'> // 'field'
 * StripMinus<'-field'> // 'field'
 */
type StripMinus<S extends string> = S extends `-${infer R}` ? R : S

/**
 * OrderQuery represents a field ordering specification where:
 * - null: No ordering
 * - string without '-': Ascending order for the field
 * - string starting with '-': Descending order for the field (excluding '--' patterns)
 *
 * Examples: 'field', 'file.uploadedAt', '-field', '-file.uploadedAt'
 * Invalid: '--field' (X cannot start with '-' in '-X' pattern)
 */
type OrderQuery<T extends string> = T | `-${T}`

/**
 * Direction represents the direction of the order.
 *
 * @param S - The string to get the direction from.
 * @returns The direction of the order.
 *
 * @example
 * Direction<'field'> // 'asc'
 * Direction<'-field'> // 'desc'
 */
type Direction<S extends string> = S extends `-${string}` ? 'desc' : 'asc'

/**
 * Represents a field ordering specification
 *
 * @param OQ - The order query to convert.
 * @returns The Sequelize order array.
 *
 * @example
 * Order<'field'> // ['field', 'asc']
 * Order<'-field'> // ['field', 'desc']
 * Order<'file.uploadedAt'> // ['file', 'uploadedAt', 'asc']
 * Order<'-file.uploadedAt'> // ['file', 'uploadedAt', 'desc']
 * Order<'file.uploadedAt.createdAt'> // ['file', 'uploadedAt', 'createdAt', 'asc']
 * Order<'-file.uploadedAt.createdAt'> // ['file', 'uploadedAt', 'createdAt', 'desc']
 */
export type Order<OQ extends OrderQuery<string>> = [StripMinus<OQ>, Direction<OQ>]

/**
 * Converts an order query to a Sequelize order array.
 *
 * @param order - The order query to convert.
 * @returns The Sequelize order array or null if no order is provided.
 *
 * @example
 * orderQueryToOrder('field') // ['field', 'asc']
 * orderQueryToOrder('-field') // ['field', 'desc']
 * orderQueryToOrder('file.uploadedAt') // ['file', 'uploadedAt', 'asc']
 * orderQueryToOrder('-file.uploadedAt') // ['file', 'uploadedAt', 'desc']
 * orderQueryToOrder('file.uploadedAt.createdAt') // ['file', 'uploadedAt', 'createdAt', 'asc']
 * orderQueryToOrder('-file.uploadedAt.createdAt') // ['file', 'uploadedAt', 'createdAt', 'desc']
 */
export function orderQueryToOrder<OQ extends OrderQuery<string>> (order: OQ | null): Order<OQ> | null {
  if (order == null) return null

  const startWithMinus = order.startsWith('-')
  const direction = (startWithMinus ? 'desc' : 'asc') as Direction<OQ>
  const fields = (startWithMinus ? order.slice(1) : order) as StripMinus<OQ>

  return [fields, direction]
}
