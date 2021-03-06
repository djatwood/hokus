import { siteSourceFactory, SiteSource } from "./../../site-sources";
import { SiteConfig, WorkspaceHeader, Configurations } from "./../../../global-types";
import pathHelper from "../../path-helper";
import publisherFactory from "../../publishers/publisher-factory";
import configurationDataProvider from "./../../configuration-data-provider";
import siteInitializerFactory from "../../site-sources/initializers/site-initializer-factory";
import { appEventEmitter } from "../../app-event-emmiter";
import { remove } from "fs-extra";

class SiteService {
  async _getSiteConfig(siteKey: string): Promise<SiteConfig> {
    const config = await configurationDataProvider.get();
    if (config.type === "EmptyConfigurations") throw new Error("The configuration is empty.");
    const cfg = config as Configurations;
    const siteConfig = cfg.sites.find(x => x.key === siteKey);
    if (siteConfig == null) {
      throw new Error("Could not find config.");
    }
    return siteConfig;
  }

  async _getSiteSource(siteKey: string): Promise<SiteSource> {
    const siteConfig = await this._getSiteConfig(siteKey);
    return siteSourceFactory.get(siteKey, siteConfig.source);
  }

  //List all workspaces
  async listWorkspaces(siteKey: string): Promise<Array<WorkspaceHeader>> {
    const siteSource = await this._getSiteSource(siteKey);
    return siteSource.listWorkspaces();
  }

  async getWorkspaceHead(siteKey: string, workspaceKey: string): Promise<WorkspaceHeader | undefined> {
    const siteSource = await this._getSiteSource(siteKey);
    const workspaces = await siteSource.listWorkspaces();
    return workspaces.find((x: any) => x.key === workspaceKey);
  }

  async deleteWorkspace(siteKey: string, workspaceKey: string): Promise<void> {
    const siteSource = await this._getSiteSource(siteKey);
    if(siteSource.canDeleteWorkspace?.(workspaceKey)??false){
      const workspaces = await siteSource.listWorkspaces();
      const path = workspaces.find(x => x.key===workspaceKey)?.path;
      if(path){
        await remove(path);
      }
      
    }
  }

  async canSyncWorkspace(siteKey: string, workspaceKey: string): Promise<boolean|null> {
    const siteSource = await this._getSiteSource(siteKey);
    if(siteSource.canSyncWorkspace==null){ return false; }
    else{
      return await siteSource.canSyncWorkspace(workspaceKey);
    }
  }

  async syncWorkspace(siteKey: string, workspaceKey: string): Promise<void> {
    const siteSource = await this._getSiteSource(siteKey);
    if(siteSource.syncWorkspace==null){ return; }
    else{
      return await siteSource.syncWorkspace(workspaceKey);
    }
  }

  async touchSite(siteKey: string, workspaceKey: string): Promise<void> {
    appEventEmitter.emit("onSiteTouched", {siteKey, workspaceKey});
  }

  async mountWorkspace(siteKey: string, workspaceKey: string): Promise<void> {
    const siteSource = await this._getSiteSource(siteKey);
    if(siteSource.mountWorkspace){
      await siteSource.mountWorkspace(workspaceKey);
    }
  }

  async initializeSite(config: any) {
    const siteInitializer = siteInitializerFactory.get(config.type);
    await siteInitializer.initialize(config);
  }

  _findFirstMatchOrDefault<T extends { key: string }>(arr: Array<T>, key: string): T {
    let result;

    if (key) {
      result = (arr || []).find(x => x.key === key);
      if (result) return result;
    }

    result = (arr || []).find(x => x.key === "default" || x.key === "" || x.key == null);
    if (result) return result;

    if (arr !== undefined && arr.length === 1) return arr[0];

    if (key) {
      throw new Error(`Could not find a config for key "${key}" and a default value was not available.`);
    } else {
      throw new Error(`Could not find a default config.`);
    }
  }

  async publish(siteKey: string, publishKey: string): Promise<void> {
    const siteConfig = await this._getSiteConfig(siteKey);
    let publishConfig = this._findFirstMatchOrDefault(siteConfig.publish, publishKey);
    if (publishConfig == null) throw new Error(`Could not find a publisher config for key '${publishKey}'.`);
    if (publishConfig.config == null) throw new Error(`The matcher publisher config does not have a property config.`);

    let from = pathHelper.getLastBuildDir();
    if (from == null) throw new Error("Could not resolve the last build directory.");

    let publisher = publisherFactory.getPublisher(publishConfig.config);
    return publisher.publish({ siteKey: siteConfig.key, publishKey, from });
  }
}

export default SiteService;