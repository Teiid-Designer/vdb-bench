var vdbBench = (function (vdbBench) {
        vdbBench._module
            .directive('attributeWidget', [
                'SYNTAX',
                'VDB_SCHEMA',
                'VDB_KEYS',
                'HAWTIO_FORM',
                'RepoRestService',
                'SchemaRegistry',
            function (SYNTAX, VDB_SCHEMA, VDB_KEYS, HAWTIO_FORM, RepoRestService, SchemaRegistry) {
                return {
                    restrict: 'E',
                    scope: {
                        component: '=selected'
                    },
                    controller: function ($scope) {
                        if ($scope.component == null || $scope.component[VDB_KEYS.TYPE] == null) {
                            $scope.schema = null;
                            return;
                        }

                        try {

                            //
                            // Fetch the schema for this type of component from the server
                            //
                            RepoRestService.getSchemaByKType($scope.component[VDB_KEYS.TYPE]).then(
                                function (content) {
                                    buildAttributeWidgets(content);
                                },
                                function (response) {
                                    console.log("Rest service response from fetching schema for " + $scope.component[VDB_KEYS.TYPE] + ": " + response.statusCode);
                                });
                        } catch (error) {
                            console.error("Error occurred: ", error.message);
                        }

                        function buildAttributeWidgets(schema) {
                            //
                            // Get the description of the object from the schema
                            //
                            var description = schema[VDB_KEYS.DESCRIPTION];

                            //
                            // The base hawtio form widget configuration object
                            //
                            var widgetConfig = {
                                "id" : 'attributeWidgets',
                                "style" : HawtioForms.FormStyle.HORIZONTAL,
                                "mode" : HawtioForms.FormMode.EDIT,
                                "hideLegend" : false,
                                "description" : description,
                                "type" : "java.lang.String",
                                "properties" : {} // to be filled in below
                            };

                            var configProperties = widgetConfig[HAWTIO_FORM.PROPERTIES];

                            var componentType = $scope.component[VDB_KEYS.TYPE];
                            if (componentType == "Model") {
                                //
                                // Model type requires a general tab and a ddl tab
                                //
                                var tabs = {
                                    "General" : [SYNTAX.STAR],
                                    "DDL Metadata" : [VDB_KEYS.DDL]
                                };

                                widgetConfig[HAWTIO_FORM.TABS] = tabs;

                                //
                                // Create the ddl control
                                //
                                var configProperty = {};
                                var template = "<div class=\"form-group\">";
                                template = template + "<div class=\"col-sm-12\">";
                                template = template + "<textarea class='property-editor-ddl-input input-xlarge' rows='20' ng-model=\"entity." + VDB_KEYS.DDL + "\"></textarea>";
                                template = template + "</div>";
                                configProperty.type = "string";
                                configProperty.formTemplate = template;
                                configProperties[VDB_KEYS.DDL] = configProperty;
                            }
                            else {
                                //
                                // No need for tabs just show controls
                                //
                                widgetConfig[HAWTIO_FORM.CONTROLS] = [SYNTAX.STAR];
                            }

                            //
                            // Build a config property and add it to the config properties
                            //

                            createIdWidget(configProperties);

                            var schemaProperties = schema[VDB_SCHEMA.PROPERTIES];
                            for (var key in schemaProperties) {

                                //
                                // Iterator through each of the schema's properties
                                // and apply its metadata to the widget configuration
                                //
                                if (key == VDB_SCHEMA.SCHEMA_NAME
                                    || _.endsWith(key, SYNTAX.UNDERSCORE + SYNTAX.UNDERSCORE + VDB_SCHEMA.SCHEMA_NAME)) {
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
                                    var template = "<div class=\"form-group\">";
                                    template = template + "<label ng-hide=\"\" class=\"col-sm-2 control-label\">Description</label>";
                                    template = template + "<div class=\"col-sm-10\">";
                                    template = template + "<textarea class='property-editor-input input-xlarge' rows='2' ng-model=\"entity." + key + "\"></textarea>";
                                    template = template + "</div>";
                                    configProperty.formTemplate = template;
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
                                                                        .replace(/^./, function(str){ return str.toUpperCase(); });
                                //
                                // Configure the attributes of the input element, eg. add a css class and
                                // make it required if the schema wants it to be
                                //
                                configProperty[HAWTIO_FORM.INPUT_ATTR] = {
                                    "class" : "property-editor-input"
                                };
                                var required = schemaProperty[VDB_SCHEMA.REQUIRED];
                                if (required == "true")
                                    configProperty[HAWTIO_FORM.INPUT_ATTR].required = required;

                                configProperties[key] = configProperty;
                            }

                            //
                            // Finally update the current widget configuration for the selected object
                            //
                            $scope.widgetConfiguration = angular.fromJson(widgetConfig);
                        }

                        function createIdWidget(configProperties) {
                            var configProperty = {};
                            //
                            // Creates a name widget for the id of each component object
                            //
                            configProperty.type = 'text';
                            configProperty.label = 'Name';
                            configProperty[HAWTIO_FORM.INPUT_ATTR] = {
                                "class" : "property-editor-input"
                            };
                            configProperty[HAWTIO_FORM.INPUT_ATTR].required = 'true';
                            configProperties[VDB_KEYS.ID] = configProperty;
                        }

                        function createPropertyTable(schemaProperty, configProperties) {
                            var configProperty = {};
                            //
                            // Add a table widget schema to the hawtio schema registry
                            // This determines how the columns of the table are rendered
                            //
                            var tableSchema = {
                                description : 'Teiid Metadata Properties',
                                javaType : 'org.teiid.vdb.bench.PropertyObject',
                                properties : {
                                    "name" : {
                                        "type" : "string",
                                        "label" : "Name",
                                        "input-attributes" : {
                                            "required" : "true"
                                        }
                                    },
                                    "value" : {
                                        "type" : "string",
                                        "label" : "Value",
                                        "input-attributes" : {
                                            "required" : "true"
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
                            if (subProperties != null) {
                                var nameProperty = subProperties[VDB_SCHEMA.SCHEMA_NAME];
                                if (nameProperty != null) {
                                    var suggestedValues = nameProperty[VDB_SCHEMA.SUGGESTED_VALUES];
                                    if (suggestedValues != null) {
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
                            configProperty.items = { type : tableSchemaName };
                            configProperties[VDB_KEYS.PROPERTIES] = configProperty;
                        }
                    },
                    template: "<div hawtio-form-2=\"widgetConfiguration\" entity=\"component\"></div>"
                };
            }
        ]);

        return vdbBench;
    })
    (vdbBench || {});