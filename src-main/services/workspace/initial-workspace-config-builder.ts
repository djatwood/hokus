import * as path from "path";
import * as glob from "glob";
import * as fs from "fs-extra";

import { WorkspaceConfigRaw } from "./../../../global-types.js";
import formatProviderResolver from "../../format-provider-resolver.js";

type GetConfigOpts = {
  hugover: string;
  configFile: string;
  ext: string;
  hugoConfigData: { [key: string]: any };
};

class InitialWorkspaceConfigBuilder {
  workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  getConfig(opts: GetConfigOpts): WorkspaceConfigRaw {
    let rootKeysLower: { [key: string]: string } = {};
    Object.keys(opts.hugoConfigData).forEach(key => (rootKeysLower[key.toLowerCase()] = key));

    const getBestKey = (key: string) => {
      return rootKeysLower[key.toLowerCase()] || key;
    };

    return {
      hugover: opts.hugover || "",
      serve: [{ key: "default", config: opts.configFile }],
      build: [{ key: "default", config: opts.configFile }],
      collections: [
        {
          key: "posts",
          title: "Posts",
          folder: "content/posts/",
          match: "**/index",
          extension: "md",
          dataformat: opts.ext,
          itemtitle: "Post",
          fields: [
            { key: "info", type: "info", size:"small", content: "# Info\nYou can write custom instructions here.", theme: "gray" },
            { key: "title", title: "Title", type: "string" },
            { key: "mainContent", title: "Content", type: "markdown" },
            { key: "pubdate", title: "Pub Date", type: "date", default: "now" },
            { key: "draft", title: "Draft", type: "boolean" },
            {
              key: "bundle-manager",
              title: "Images",
              type: "bundle-manager",
              path: "imgs",
              extensions: ["png", "jpg", "gif"],
              fields: [
                { key: "title", title: "Title", type: "string" },
                { key: "description", title: "Description", type: "string", multiLine: true },
                { key: "bundle-image-thumbnail", type: "bundle-image-thumbnail" }
              ]
            }
          ]
        }
      ],
      singles: [
        {
          key: "mainConfig",
          title: "Main Config",
          file: `config.${opts.ext}`,
          dataformat: opts.ext,
          fields: [
            { key: getBestKey("title"), title: "Site Title", type: "string", tip: "Your page title." },
            { key: getBestKey("baseURL"), title: "Base URL", type: "string", tip: "Your site URL." },
            { key: getBestKey("theme"), title: "Theme", type: "readonly", tip: "The current theme." },
            { key: getBestKey("languageCode"), title: "Language Code", type: "readonly" },
            {
              key: getBestKey("googleAnalytics"),
              title: "Google Analytics",
              type: "string",
              tip: "Provide a Google Analitics Tracking Code to enable analytics."
            },
            {
              key: getBestKey("enableRobotsTXT"),
              title: "Enable Robots",
              type: "boolean",
              default: true,
              tip: "If you want your page to be indexed, keep this enabled."
            }
          ]
        }
      ]
    };
  }

  build() {
    const hugoConfigExp = path.join(
      this.workspacePath,
      "config.{" + formatProviderResolver.allFormatsExt().join(",") + "}"
    );
    const themesExp = path.join(this.workspacePath, "themes/*/");
    let hugoConfigPath = glob.sync(hugoConfigExp)[0];
    const allThemes = glob.sync(themesExp);
    const firstTheme = (allThemes[0] || "")
      .split(/[/\\]/)
      .filter(x => !!x)
      .slice(-1)[0];

    let formatProvider;
    if (hugoConfigPath == null) {
      hugoConfigPath = path.join(this.workspacePath, "config." + formatProviderResolver.getDefaultFormatExt());
      formatProvider = formatProviderResolver.getDefaultFormat();
      let minimalConfigStr = formatProvider.dump({
        title: "New Site Title",
        baseURL: "http://newsite.com",
        theme: firstTheme || "some-theme"
      });
      fs.writeFileSync(hugoConfigPath, minimalConfigStr, "utf-8");
    } else {
      formatProvider = formatProviderResolver.resolveForFilePath(hugoConfigPath);
    }
    if (formatProvider == null) throw new Error("Could not resolve a FormatProvider.");

    let hugoConfigData = formatProvider.parse(fs.readFileSync(hugoConfigPath, "utf-8"));

    let relHugoConfigPath = path.relative(this.workspacePath, hugoConfigPath);

    let data = this.getConfig({
      configFile: relHugoConfigPath,
      ext: formatProvider.defaultExt(),
      hugover: "0.69.0",
      hugoConfigData
    });

    return { formatProvider, data };
  }
}

export default InitialWorkspaceConfigBuilder;
