import type {
  RenderParams,
  TemplateRenderI
} from './types.js'
import type { ModuleConstructorParams } from '#src/service/types.js'
import nunjucks from 'nunjucks'
import { join } from 'node:path'

type ConstructorParams = ModuleConstructorParams<'logger'>

export class TemplateRender implements TemplateRenderI {
  private readonly logger: ConstructorParams['context']['logger']

  constructor (params: ConstructorParams) {
    this.logger = params.context.logger
  }

  render (params: RenderParams) {
    this.logger.debug(params, 'Render template')
    const cwd = process.cwd()
    const templatePath = join(cwd, 'templates/', params.template, params.file)
    return nunjucks.render(templatePath, params)
  }
}
