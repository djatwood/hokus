import * as React from "react";
import { HoForm, ComponentRegistry } from "./../../components/HoForm";
import dynamicFormComponents from "./../../components/HokusForm/components/all";
import { FormBreadcumb } from "./../../components/Breadcumb";
import { HokusForm } from "../../components/HokusForm";

const componentRegistry = new ComponentRegistry(dynamicFormComponents);

type FormsBuilderProps = {};
type FormsBuilderState = {
  form: any;
  formKey: number
};


export class FormsBuilder extends React.Component<FormsBuilderProps, FormsBuilderState> {
  formRef: any;
  state: FormsBuilderState = {
    form: {},
    formKey: 1
  };

  constructor(props: FormsBuilderProps) {
    super(props);
  }

  handleFormRef = (ref: any) => {
    this.formRef = ref;
  };

  handleSave = (arg1: { data: any, accept: any, reject: any }) => {
    this.setState({ form: arg1.data, formKey: ++this.state.formKey });
    arg1.accept();
  }

  render() {

    const includes = {
      fieldsAccordionInclude: [
        {
          key: "fields", type: "accordion", title: "Fields", itemTitleKey: "key", fields: [
            { key: "anyFieldInclude", type: "include", include: "anyFieldInclude" }
          ]
        }
      ],
      anyFieldInclude: [
        { key: "baseFieldInclude", type: "include", include: "baseFieldInclude" },
        { key: "type", title: "type", type: "select", options: [{ value: "nest" }, { value: "select" }, { value: "boolean" }, { value: "string" },], default: "string", required: true },
        {
          key: "typeExtender", type: "extend", nest: false, groupdata: false, selectorKey: "type", fields: [], clearExcept: ["key"], types: [
            { key: "string", fields: [{ key: "textFieldInclude", type: "include", include: "textFieldInclude" },], },
            { key: "boolean", fields: [{ key: "booleanInclude", type: "include", include: "booleanInclude" },], },
            { key: "select", fields: [{ key: "selectInclude", type: "include", include: "selectInclude" },], },
            { key: "nest", fields: [{ key: "nestInclude", type: "include", include: "nestInclude" },], },
          ]
        }
      ],
      baseFieldInclude: [
        { key: "key", type: "string", title: "key", required: true }
      ],
      booleanInclude: [
        { key: "title", title: "title", type: "string", required: true },
        { key: "default", title: "default", type: "boolean", default: false },
        { key: "tip", title: "tip", type: "string" },
      ],
      nestInclude: [
        { key: "title", title: "title", type: "string", required: true },
        { key: "default", title: "default", type: "boolean", default: false },
        { key: "groupdata", title: "groupdata", type: "boolean", default: false },
        { key: "fieldsAccordionInclude", type: "include", include: "fieldsAccordionInclude" }
      ],
      textFieldInclude: [
        { key: "title", title: "title", type: "string", required: true },
        { key: "required", title: "required", type: "boolean", default: false },
        { key: "default", title: "default", type: "string" },
        // { key: "pattern", title: "pattern", type: "string", required: false },
        { key: "multiline", title: "multiline", type: "boolean", default: false },
        // { key: "monospace", title: "monospace", type: "boolean", default: false },
        // { key: "margin", title: "margin", type: "select", options: [{ value: 'none' }, { value: 'dense' }, { value: 'normal' }], default: "normal" },
        { key: "tip", title: "tip", type: "string" },
      ],
      selectInclude: [
        { key: "title", title: "title", type: "string", required: true },
        {
          key: "options", title: "Options", type: "accordion", itemTitleKey: "value", fields: [
            { key: "value", title: "Value", type: "string" },
            { key: "text", title: "Text", type: "string" },
          ]
        },
        { key: "multiple", title: "Multiple", type: "boolean", default: false },
        { key: "required", title: "required", type: "boolean", default: false },
        {
          key: "multipleExtend", selectorKey: "multiple", type: "extend", clearOnChange: ["default"], types: [
            {
              key: "false", fields: [
                { key: "default", title: "Default", type: "string", default: "" },
              ]
            },
            {
              key: "true", fields: [
                { key: "default", title: "Default", type: "leaf-array", field: { key: "value", title: "Value", type: "string" }, default: [] },
              ]
            }
          ]
        },
        { key: "tip", title: "tip", type: "string" },
      ],
    };

    return (
      <div style={{ display: 'flex' }}>
        <div style={{ flex: "1", position: 'relative' }}>
          <HokusForm
            onSave={this.handleSave}
            rootName={"Form Builder"}
            includes={includes}
            ref={this.handleFormRef}
            fields={[
              { key: "fieldsAccordionInclude", type: "include", include: "fieldsAccordionInclude" }
            ]}
            values={{}}
            plugins={{
              openBundleFileDialog: function ({ title, extensions, targetPath }: any, onFilesReady: any) {
                alert("This operation is not supported in the Cookbook. But we'll mock something for you.");
                return Promise.resolve([`${targetPath}/some-file.${extensions[0] || "png"}`]);
              },
              getBundleThumbnailSrc: function (targetPath: string) {
                return Promise.resolve(
                  "data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
                );
              }
            }}
          />
        </div>
        <div style={{ padding: "1rem", flex: "1" }}>
          <HoForm
            key={this.state.formKey}
            rootName={"Resulting Form"}
            includes={includes}
            ref={this.handleFormRef}
            breadcumbComponentType={FormBreadcumb}
            fields={(this.state.form?.fields) || []}
            debug={false}
            componentRegistry={componentRegistry}
            values={{}}
            plugins={{
              openBundleFileDialog: function ({ title, extensions, targetPath }: any, onFilesReady: any) {
                alert("This operation is not supported in the FormBuilder. But we'll mock something for you.");
                return Promise.resolve([`${targetPath}/some-file.${extensions[0] || "png"}`]);
              },
              getBundleThumbnailSrc: function (targetPath: string) {
                return Promise.resolve(
                  "data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
                );
              }
            }}
          />
        </div>
      </div>
    );
  }
}