import Assert from 'assert'
import qs from 'qs'

interface stringifyOptions {
  arrayFormat: 'brackets' | 'indices' | 'repeat'
  encode?: boolean
}

const stringifyDefaultOptions: stringifyOptions = {
  arrayFormat: 'brackets',
  encode: false
}

const querystringParser = {
  parse: (str: string) => qs.parse(str, { comma: false }), // https://github.com/ljharb/qs#parsing-arrays
  stringify: (obj: unknown, options: stringifyOptions = stringifyDefaultOptions) => {
    Assert.ok(
      ['brackets', 'indices', 'repeat'].includes(options.arrayFormat),
      new Error('Invalid querystring array format. Brackets, indices and repeat are only valid')
    )
    return qs.stringify(obj, options) // https://github.com/ljharb/qs#stringifying
  }
}

export default querystringParser
