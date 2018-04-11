import * as Base from "yeoman-generator";
import * as path from "path";
import {CommonGenerationOptions, commonGenerationOptionsConfig, OptionsConfig} from "./cli-options";
import {
  EntityInfo,
  RestQueryInfo,
  RestServiceMethodInfo, RestServiceMethodModel,
  StudioTemplateProperty,
  StudioTemplatePropertyType,
  ViewInfo
} from "./cuba-studio";
import {fromStudioProperties} from "./questions";
import * as fs from "fs";
import {ProjectModel, RestServiceMethod} from "./cuba-model";

export abstract class BaseGenerator<A, M, O extends CommonGenerationOptions> extends Base {

  options: O = ({} as O);
  answers?: A;
  model?: M;

  constructor(args: string | string[], options: CommonGenerationOptions) {
    super(args, options);
    this._populateOptions(this._getAvailableOptions());
    this.destinationRoot(this._getDestRoot());
  }

  protected async _promptOrParse() {
    if (this.options.answers && this.options.model) { // passed from studio
      const encodedAnswers = Buffer.from(this.options.answers, 'base64').toString('utf8');
      const parsedAnswers = JSON.parse(encodedAnswers);
      const projectModel = readProjectModel(this.options.model);

      this.answers = refineAnswers<A>(projectModel, this._getParams(), parsedAnswers);
      return Promise.resolve();
    }
    this.answers = await this.prompt(fromStudioProperties(this._getParams())) as A;
  }

  protected _populateOptions(availableOption: OptionsConfig) {
    Object.keys(availableOption).forEach(optionName => {
      this.option(optionName, availableOption[optionName]);
    });
  }

  protected _getDestRoot(): string {
    if (!this.options.dest) {
      return this.destinationRoot();
    }
    if (path.isAbsolute(this.options.dest)) {
      return this.options.dest
    }
    return path.join(this.destinationRoot(), this.options.dest)
  }

  _getAvailableOptions(): OptionsConfig {
    return commonGenerationOptionsConfig;
  }

  _getParams(): StudioTemplateProperty[] {
    return [];
  }
}

export interface GeneratorExports {
  generator: typeof BaseGenerator,
  options?: OptionsConfig,
  params?: StudioTemplateProperty[]
}

export function readProjectModel(modelFilePath: string): ProjectModel {
  if (!fs.existsSync(modelFilePath)) {
    throw new Error('Specified model file does not exist');
  }
  return JSON.parse(fs.readFileSync(modelFilePath, "utf8"));
}

function findEntity(projectModel: ProjectModel, entityInfo: EntityInfo) {
  if (projectModel.entities.hasOwnProperty(entityInfo.name)) {
    return projectModel.entities[entityInfo.name];
  }
  if (projectModel.baseProjectEntities != null
    && projectModel.baseProjectEntities.hasOwnProperty(entityInfo.name)) {
    return projectModel.baseProjectEntities[entityInfo.name];
  }
  return null;
}

function findView(projectModel: ProjectModel, view: ViewInfo) {
  return projectModel.views.find(v => v.name === view.name && v.entity === view.entityName);
}

function findQuery(projectModel: ProjectModel, queryInfo: RestQueryInfo) {
  return projectModel.restQueries.find(q => q.entity === queryInfo.entityName && q.name === queryInfo.name);
}

function findServiceMethod(projectModel: ProjectModel, methodInfo: RestServiceMethodInfo): RestServiceMethodModel | null {
  const service = projectModel.restServices.find(s => s.name === methodInfo.serviceName);
  if (service != null) {
    const method = service.methods.find(m => m.name === methodInfo.methodName);
    if (method != null) {
      return {service, method};
    }
  }
  return null;
}

function refineAnswers<T>(projectModel: ProjectModel, props: StudioTemplateProperty[], answers: any): T {
  const refinedAnswers: { [key: string]: any } = {};
  Object.keys(answers).forEach((key: string) => {
    const prop = props.find(p => p.code === key);
    if (prop == null) {
      refinedAnswers[key] = answers[key];
      return;
    }
    switch (prop.propertyType) {
      case StudioTemplatePropertyType.ENTITY:
        refinedAnswers[key] = findEntity(projectModel, (answers[key] as EntityInfo));
        return;
      case StudioTemplatePropertyType.VIEW:
        refinedAnswers[key] = findView(projectModel, (answers[key] as ViewInfo));
        return;
      case StudioTemplatePropertyType.REST_QUERY:
        refinedAnswers[key] = findQuery(projectModel, (answers[key] as RestQueryInfo));
        return;
      case StudioTemplatePropertyType.REST_SERVICE_METHOD:
        refinedAnswers[key] = findServiceMethod(projectModel, (answers[key] as RestServiceMethodInfo));
        return;
      default:
        refinedAnswers[key] = answers[key];
    }
  });
  return refinedAnswers as T;
}