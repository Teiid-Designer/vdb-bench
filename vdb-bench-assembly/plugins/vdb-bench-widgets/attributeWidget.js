(function (vdbBench) {

    var pluginName = 'vdb-bench.widgets';
    var pluginDirName = 'vdb-bench-widgets';

    angular
        .module(pluginName)
        .directive('attributeWidget', attributeWidget);

    function attributeWidget() {
        var directive = {
            restrict: 'E',
            scope: true,
            controller: AttributeController,
            controllerAs: 'vm',
            bindToController: {
                component: '=selected'
            }, 
            template: "<div hawtio-form-2=\"vm.widgetConfiguration\" entity=\"component\"></div>"
        };

        return directive;
    }

    AttributeController.$inject = ['SYNTAX', 'VDB_SCHEMA', 'VDB_KEYS', 'HAWTIO_FORM',
                                            'RepoRestService', 'SchemaRegistry'];

    function AttributeController(SYNTAX, VDB_SCHEMA, VDB_KEYS, HAWTIO_FORM, RepoRestService, SchemaRegistry) {
        var vm = this;

        if (!vm.component || !vm.component[VDB_KEYS.TYPE]) {
            vm.schema = null;
            return;
        }

        try {

            //
            // Fetch the schema for this type of component from the server
            //
            RepoRestService.getSchemaByKType(vm.component[VDB_KEYS.TYPE]).then(
                function (content) {
                    buildAttributeWidgets(content);
                },
                function (response) {
                    buildAttributeWidgets();
                });
        } catch (error) {
            console.error("Error occurred: ", error.message);
        }

        function buildAttributeWidgets(schema) {
            //
            // Get the description of the object from the schema
            //
            var description = (schema ? schema[VDB_KEYS.DESCRIPTION] : '');

            //
            // The base hawtio form widget configuration object
            //
            var widgetConfig = {
                "id": 'attributeWidgets',
                "style": HawtioForms.FormStyle.HORIZONTAL,
                "mode": HawtioForms.FormMode.EDIT,
                "hideLegend": false,
                "description": description,
                "type": "java.lang.String",
                "properties": {} // to be filled in below
            };

            var configProperties = widgetConfig[HAWTIO_FORM.PROPERTIES];

            var componentType = vm.component[VDB_KEYS.TYPE];
            if (componentType == "Model") {
                //
                // Model type requires a general tab and a ddl tab
                //
                var tabs = {
                    "General": [SYNTAX.STAR],
                    "DDL Metadata": [VDB_KEYS.DDL]
                };

                widgetConfig[HAWTIO_FORM.TABS] = tabs;

                //
                // Create the ddl control
                //
                var ddlConfigProperty = {};
                var ddlTemplate = "<div class=\"form-group\">";
                ddlTemplate = ddlTemplate + "<div class=\"col-sm-12\">";
                ddlTemplate = ddlTemplate + "<textarea class='property-editor-ddl-input input-xlarge' rows='20' ng-model=\"entity." + VDB_KEYS.DDL + "\"></textarea>";
                ddlTemplate = ddlTemplate + "</div>";
                ddlConfigProperty.type = "string";
                ddlConfigProperty.formTemplate = ddlTemplate;

                //  Set all properties read-only for now
                ddlConfigProperty[HAWTIO_FORM.INPUT_ATTR] = {
                    'readOnly': 'true'
                };
                configProperties[VDB_KEYS.DDL] = ddlConfigProperty;
            } else {
                //
                // No need for tabs just show controls
                //
                widgetConfig[HAWTIO_FORM.CONTROLS] = [SYNTAX.STAR];
            }

            //
            // Build a config property and add it to the config properties
            //

            createIdWidget(configProperties);

            if (schema) {
                var schemaProperties = schema[VDB_SCHEMA.PROPERTIES];
                for (var key in schemaProperties) {

                    //
                    // Iterator through each of the schema's properties
                    // and apply its metadata to the widget configuration
                    //
                    if (key == VDB_SCHEMA.SCHEMA_NAME || _.endsWith(key, SYNTAX.UNDERSCORE + SYNTAX.UNDERSCORE + VDB_SCHEMA.SCHEMA_NAME)) {
                        // Name widgets are covered by the id widget
                        continue;
                    }

                    var configProperty = {};
                    var schemaProperty = schemaProperties[key];

                    //
                    // The 'property' schema is treated differently since
                    // it requires adding name/value pairs to a table widget
                    //
                    if (key == VDB_SCHEMA.SCHEMA_PROPERTY) {
                        createPropertyTable(schemaProperty, configProperties);
                        continue;
                    }

                    //
                    // Make description widgets use text areas instead of inputs
                    //
                    if (key == VDB_SCHEMA.DESCRIPTION_PROPERTY) {
                        var descTemplate = "<div class=\"form-group\">";
                        descTemplate = descTemplate + "<label ng-hide=\"\" class=\"col-sm-2 control-label\">Description</label>";
                        descTemplate = descTemplate + "<div class=\"col-sm-10\">";
                        descTemplate = descTemplate + "<textarea class='property-editor-input input-xlarge' rows='2' ng-model=\"entity." + key + "\" readonly=\"readonly\"></textarea>";
                        descTemplate = descTemplate + "</div>";
                        configProperty.formTemplate = descTemplate;
                    }

                    var valueType = schemaProperty[VDB_SCHEMA.VALUE_TYPE];

                    //
                    // decimal is not a hawtio-form type so need to map it
                    //
                    if (valueType == "decimal")
                        valueType = "number";

                    configProperty.type = valueType;
                    configProperty.label = key.replace(/[a-z]+__/, '')
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, function (str) {
                            return str.toUpperCase();
                        });
                    //
                    // Configure the attributes of the input element, eg. add a css class and
                    // make it required if the schema wants it to be
                    //
                    configProperty[HAWTIO_FORM.INPUT_ATTR] = {
                        "class": "property-editor-input",
                        //  Set all properties read-only for now
                        'readOnly': 'true'
                    };
                    var required = schemaProperty[VDB_SCHEMA.REQUIRED];
                    if (required == "true")
                        configProperty[HAWTIO_FORM.INPUT_ATTR].required = required;

                    configProperties[key] = configProperty;
                }
            }

            //
            // Finally update the current widget configuration for the selected object
            //
            vm.widgetConfiguration = angular.fromJson(widgetConfig);
        }

        function createIdWidget(configProperties) {
            var configProperty = {};
            //
            // Creates a name widget for the id of each component object
            //
            configProperty.type = 'text';
            configProperty.label = 'Name';
            configProperty[HAWTIO_FORM.INPUT_ATTR] = {
                "class": "property-editor-input",
                'required': 'true',
                //  Set all properties read-only for now
                'readOnly': 'true'
            };
            configProperties[VDB_KEYS.ID] = configProperty;
        }

        function createPropertyTable(schemaProperty, configProperties) {
            var configProperty = {};
            //
            // Add a table widget schema to the hawtio schema registry
            // This determines how the columns of the table are rendered
            //
            var tableSchema = {
                description: 'Teiid Metadata Properties',
                javaType: 'org.teiid.vdb.bench.PropertyObject',
                properties: {
                    "name": {
                        "type": "string",
                        "label": "Name",
                        "input-attributes": {
                            "required": "true",
                            //  Set all properties read-only for now
                            'readOnly': 'true'
                        }
                    },
                    "value": {
                        "type": "string",
                        "label": "Value",
                        "input-attributes": {
                            "required": "true",
                            //  Set all properties read-only for now
                            'readOnly': 'true'
                        }
                    }
                }
            };

            //
            // Find suggested values for the property names, if any
            // and add them as type ahead values
            //
            // The property object contains an internal properties object
            //
            var subProperties = schemaProperty[VDB_KEYS.PROPERTIES];
            if (subProperties) {
                var nameProperty = subProperties[VDB_SCHEMA.SCHEMA_NAME];
                if (nameProperty) {
                    var suggestedValues = nameProperty[VDB_SCHEMA.SUGGESTED_VALUES];
                    if (suggestedValues) {
                        var nameColSchema = tableSchema[HAWTIO_FORM.PROPERTIES][VDB_SCHEMA.SCHEMA_NAME];
                        nameColSchema[HAWTIO_FORM.TYPE_AHEAD_DATA] = suggestedValues;
                        nameColSchema[HAWTIO_FORM.INPUT_ATTR][HAWTIO_FORM.TYPE_AHEAD] = "value for value in config.properties.name.typeaheadData";
                    }
                }
            }

            //
            // Add the table schema to the hawtio schema registry
            //
            var tableSchemaName = "PropertyObject";
            SchemaRegistry.addSchema(tableSchemaName, tableSchema);

            //
            // Build the config property as an array type with its items
            // representing the object type just built
            //
            configProperty.type = 'array';
            configProperty.label = 'Teiid Metadata Properties';
            configProperty.items = {
                type: tableSchemaName
            };
            configProperties[VDB_KEYS.PROPERTIES] = configProperty;
        }
    }
})();