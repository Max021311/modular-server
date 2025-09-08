import type {
  RenderParams,
  TemplateRenderI
} from './types'
import type { ModuleConstructorParams } from '#src/service/types'
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
    const templatePath = join('templates/', params.template, params.file)
    return nunjucks.render(templatePath, params)
  }
}
