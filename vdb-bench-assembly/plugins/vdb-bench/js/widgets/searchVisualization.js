var vdbBench = (function (vdbBench) {
    vdbBench._module.directive('searchVisualization', [
        'SYNTAX',
        'VDB_KEYS',
        'D3V',
        '$timeout',
        'RepoRestService',
        function (SYNTAX, VDB_KEYS, D3V, $timeout, RepoRestService) {

            var TOP_MARGIN = 50;
            var DEPTH_HEIGHT = 100;
            var NODE_HEIGHT = 200;
            var TRANSITION_DURATION = 750;
            var TEXT_ORIGIN_Y = 10;
            var TEXT_HEIGHT = 20;
            var IMAGE_X = -16;
            var IMAGE_Y = TEXT_ORIGIN_Y + TEXT_HEIGHT + 5;
            var PARENT_ICON_Y = -5;
            var CHILDREN_ICON_Y = IMAGE_Y + 32 + 5;
            var WIDTH_PER_CHARACTER = 9;

            var HAS_NO_PARENT = "#fff";
            var HAS_PARENT = "#000";

            var HAS_NO_CHILDREN = "#fff";
            var HAS_CHILDREN = "#000";

            var PARENT_BUTTON_ID = "parentButtonId";
            var CHILD_BUTTON_ID = "childButtonId";

            var NODE_ID_PREFIX = D3V.GROUP_ELEMENT + SYNTAX.HYPHEN + D3V.NODE;

            return {
                // used as element only
                restrict: 'E',
                // isolated scope
                scope: {
                    searchEntry: '=',
                    height: '=',
                    width: '='
                },
                link: function (scope, element, attrs) {

                    /*
                    * Index of all the contents of the vdb
                    * indexed according to their self link
                    */
                    var dataIndex = {};

                    var margin = {
                        top: 20,
                        right: 120,
                        bottom: 20,
                        left: 120
                    };
                    var svgWidth = scope.width - margin.right - margin.left;
                    var svgHeight = scope.height - margin.top - margin.bottom;

                    var tree = d3.layout.tree();

                    /*
                     * Create the svg canvas by selecting the 'div' of the widget and
                     * appending an 'svg' div and inside that a 'g' div
                     */
                    var svg = d3.select(element[0]).append(D3V.SVG_ELEMENT)
                        .attr(D3V.CSS_WIDTH, svgWidth + margin.right + margin.left)
                        .attr(D3V.CSS_HEIGHT, svgHeight + margin.top + margin.bottom);

                    /*
                     * Create the root group element of the svg
                     */
                    var svgGroup = svg.append(D3V.GROUP_ELEMENT)
                        .attr(D3V.SVG_TRANSFORM,
                            D3V.SVG_TRANSLATE + SYNTAX.OPEN_BRACKET + margin.left + SYNTAX.COMMA + margin.top + SYNTAX.CLOSE_BRACKET);

                    scope.$watch('searchEntry', function (newSearchEntry, oldSearchEntry) {
                        // if 'searchEntry' is undefined, exit
                        if (!newSearchEntry || newSearchEntry == oldSearchEntry) {
                            return;
                        }

                        /*
                         * clear the elements inside of the directive
                         */
                        svgGroup.selectAll(SYNTAX.STAR).remove();

                        var treeData = initNode(newSearchEntry);

                        /*
                         * Diagonal generator
                         * Projection determines the location of the source and target points
                         * of the diagonal line to be drawn.
                         *
                         * The source and target accessors allow for the link path to start at the
                         * children dot and finish just above the title of the child node
                         */
                        var diagonal = d3.svg.diagonal()
                            .source(function (d) {
                                return {
                                    x: d.source.x,
                                    y: d.source.y + CHILDREN_ICON_Y
                                };
                            })
                            .target(function (d) {
                                return {
                                    x: d.target.x,
                                    y: d.target.y - 4
                                };
                            })
                            .projection(function (d) {
                                return [d.x, d.y];
                            });

                        /*
                         * Create zoom behaviour and assign the zoom listener callback
                         */
                        var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3])
                            .on("zoom", function () {
                                svgGroup.attr(D3V.SVG_TRANSFORM,
                                    D3V.SVG_TRANSLATE + SYNTAX.OPEN_BRACKET +
                                    d3.event.translate + SYNTAX.CLOSE_BRACKET + SYNTAX.SPACE +
                                    D3V.SVG_SCALE + SYNTAX.OPEN_BRACKET +
                                    d3.event.scale + SYNTAX.CLOSE_BRACKET);
                            });

                        /*
                         * Assign the selection listener to the click event of the svg
                         * Call an initial zoom on the svg
                         */
                        svg.on(D3V.HTML_CLICK, selectionCallback).call(zoomListener);

                        root = treeData;

                        // Will call update
                        expandCollapseChildCallback(root);
                        centerNode(root);

                        /**
                         * Recurse the vdb object and copy the properties
                         * and assign 'parent' object and '_children' array
                         * both being required for a tree layout
                         */
                        function initNode(dataObject) {
                            var newDataObj = {};
                            var selfLink;
                            var parentLink;
                            var childLinks = [];

                            for (var key in dataObject) {
                                var value = dataObject[key];

                                // _links must be checked first since its an array
                                if (key == VDB_KEYS.LINKS.ID) {
                                    selfLink = RepoRestService.getLink(VDB_KEYS.LINKS.SELF, dataObject);
                                    parentLink = RepoRestService.getLink(VDB_KEYS.LINKS.PARENT, dataObject);

                                    //
                                    // Add remaining links as children
                                    //
                                    var links = dataObject[key];
                                    for (var i = 0; i < links.length; ++i) {
                                        var link = links[i];
                                        var linkName = link[VDB_KEYS.LINKS.NAME];
                                        if (linkName == VDB_KEYS.LINKS.SELF)
                                            selfLink = link[VDB_KEYS.LINKS.HREF];
                                        else if (linkName == VDB_KEYS.LINKS.PARENT)
                                            parentLink = link[VDB_KEYS.LINKS.HREF];
                                        else
                                            childLinks.push(link[VDB_KEYS.LINKS.HREF]);
                                    }
                                } else if (typeof (value) == 'string' || typeof (value) == 'number' || typeof (value) == 'boolean' ||
                                    Object.prototype.toString.call(value) === '[object Array]') {
                                    newDataObj[key] = value;
                                }
                            }

                            if (!selfLink)
                                return null;

                            newDataObj.selfLink = selfLink;
                            newDataObj.parentLink = parentLink;
                            newDataObj.childLinks = childLinks;
                            dataIndex[selfLink] = dataObject;

                            return newDataObj;
                        }

                        /**
                         * Updates all the new, updated and removed nodes
                         *
                         * The source is the node at the "top" of the section
                         * being explanded/collapsed. Normally, this would be root
                         * but when a node is clicked on to be expanded then it
                         * would be the clicked node.
                         */
                        function update(source) {
                            if (source == null)
                                return;

                            /*
                             * Calculate the max label width of all visible nodes
                             */
                            var maxLabelLength = calcLabelWidth(root, 0);

                            /*
                             * Set the node size according to the maximum width of the labels
                             * ensuring that no labels overlaps with another node
                             */
                            tree.nodeSize([maxLabelLength * WIDTH_PER_CHARACTER, NODE_HEIGHT]);

                            /*
                             * The layout converts the hierarchy of data nodes
                             * presented by root into an array of tree layout nodes
                             */
                            var nodes = tree.nodes(root).reverse();

                            // Normalize for fixed-depth.
                            nodes.forEach(function (node) {
                                node.y = node.depth * DEPTH_HEIGHT + TOP_MARGIN;
                            });

                            /*
                             * Select all existing nodes
                             */
                            var nodeSelection = svgGroup.selectAll(D3V.GROUP_ELEMENT + SYNTAX.DOT + D3V.NODE);

                            /*
                             * Map and append all new nodes from the data array
                             * to the node selection
                             */
                            var updateNodeSelection = nodeSelection.data(nodes, function (node) {
                                // self link will be unique while the id is not necessarily
                                return node.selfLink;
                            });

                            /*
                             * Selection of new nodes being added to layout
                             */
                            var enterNodes = updateNodeSelection.enter();

                            /*
                             * Add group element to enter nodes
                             */
                            var enterNodesGroup = enterNodes.append(D3V.GROUP_ELEMENT);

                            /*
                             * Adds the
                             * transform for x,y
                             * node group id
                             * click handler to new nodes
                             */
                            enterNodesGroup.attr("class", "node")
                                .attr(D3V.SVG_TRANSFORM, function (node) {
                                    return D3V.SVG_TRANSLATE + SYNTAX.OPEN_BRACKET + source.x + SYNTAX.COMMA + source.y + SYNTAX.CLOSE_BRACKET;
                                })
                                .attr(D3V.ID, function (node) {
                                    return NODE_ID_PREFIX + node.selfLink;
                                });

                            /*
                             * Add parent indicator circles below the image 
                             */
                            enterNodesGroup.append(D3V.SVG_CIRCLE)
                                .attr(D3V.ID, PARENT_BUTTON_ID)
                                .attr(D3V.HTML_RADIUS, 1e-6)
                                .attr(D3V.SVG_CIRCLE_Y, PARENT_ICON_Y)
                                .style(D3V.CSS_FILL, parentStatusCallback)
                                .on(D3V.HTML_CLICK, expandCollapseParentCallback);

                            /*
                             * Append the id to each new node
                             *
                             * text-anchor="middle" will anchor the text using the centre
                             * of the label at the location specified by the x attribute
                             *
                             * Note: the y and dy attributes locate the text using the
                             *          bottom-left of the text block
                             */
                            enterNodesGroup.append(D3V.HTML_TEXT)
                                .attr(D3V.HTML_TEXT_ANCHOR, D3V.MIDDLE)
                                .attr(D3V.HTML_DY, TEXT_ORIGIN_Y)
                                .style(D3V.CSS_FILL_OPACITY, 1)
                                .text(function (node) {
                                    return node[VDB_KEYS.ID];
                                })
                                .on(D3V.HTML_CLICK, selectionCallback);

                            /*
                             * Append the type to each new node
                             *
                             * text-anchor="middle" will anchor the text using the centre
                             * of the label at the location specified by the x attribute
                             *
                             * Note: the y and dy attributes locate the text using the
                             *          bottom-left of the text block
                             */
                            enterNodesGroup.append(D3V.HTML_TEXT)
                                .attr(D3V.HTML_TEXT_ANCHOR, D3V.MIDDLE)
                                .attr(D3V.HTML_DY, TEXT_ORIGIN_Y + TEXT_HEIGHT)
                                .style(D3V.CSS_FILL_OPACITY, 1)
                                .text(function (node) {
                                    return SYNTAX.COLON + SYNTAX.OPEN_SQUARE_BRACKET + node[VDB_KEYS.TYPE] + SYNTAX.CLOSE_SQUARE_BRACKET;
                                })
                                .on(D3V.HTML_CLICK, selectionCallback);

                            /*
                             * Centre the icon above the circle
                             */
                            enterNodesGroup.append(D3V.HTML_IMAGE)
                                .attr(D3V.HTML_X, IMAGE_X)
                                .attr(D3V.HTML_Y, IMAGE_Y)
                                .each(imageResourceCallback)
                                .on(D3V.HTML_CLICK, selectionCallback);

                            /*
                             * Add children indicator circles below the image 
                             */
                            enterNodesGroup.append(D3V.SVG_CIRCLE)
                                .attr(D3V.ID, CHILD_BUTTON_ID)
                                .attr(D3V.HTML_RADIUS, 1e-6)
                                .attr(D3V.SVG_CIRCLE_Y, CHILDREN_ICON_Y)
                                .style(D3V.CSS_FILL, childStatusCallback)
                                .on(D3V.HTML_CLICK, expandCollapseChildCallback);

                            /*
                             * Animate new nodes, ie. child nodes being displayed after expanding parent, 
                             * using a transition. This will move the new nodes from parent nodes to their
                             * final destination.
                             */
                            var nodeUpdate = updateNodeSelection.transition()
                                .duration(TRANSITION_DURATION)
                                .attr(D3V.SVG_TRANSFORM, function (node) {
                                    return D3V.SVG_TRANSLATE + SYNTAX.OPEN_BRACKET + node.x + SYNTAX.COMMA + node.y + SYNTAX.CLOSE_BRACKET;
                                });

                            /*
                             * All circles currently being updated have their radius enlarged to their
                             * destination visible size.
                             */
                            nodeUpdate.select(SYNTAX.HASH + PARENT_BUTTON_ID)
                                .attr(D3V.HTML_RADIUS, 3.5)
                                .style(D3V.CSS_FILL, parentStatusCallback);

                            nodeUpdate.select(SYNTAX.HASH + CHILD_BUTTON_ID)
                                .attr(D3V.HTML_RADIUS, 3.5)
                                .style(D3V.CSS_FILL, childStatusCallback);

                            /*
                             * Animate the removal of nodes being removed from the diagram
                             * when a parent node is contracted.
                             */
                            var nodeExit = updateNodeSelection.exit().transition()
                                .duration(TRANSITION_DURATION)
                                .attr(D3V.SVG_TRANSFORM, function (node) {
                                    return D3V.SVG_TRANSLATE + SYNTAX.OPEN_BRACKET + source.x + SYNTAX.COMMA + source.y + SYNTAX.CLOSE_BRACKET;
                                })
                                .remove();

                            /*
                             * Make the removed nodes circles too small to be visible
                             */
                            nodeExit.selectAll(D3V.SVG_CIRCLE)
                                .attr(D3V.HTML_RADIUS, 1e-6);

                            /*
                             * Update the locations of all remaining nodes based on where
                             * the layout has now located them
                             */
                            nodes.forEach(function (node) {
                                node.x0 = node.x;
                                node.y0 = node.y;
                            });

                            updateLinks(source, nodes);
                        }

                        function calcLabelWidth(node, maxLabelLength) {
                            if (!node)
                                return maxLabelLength;

                            var labelLength = Math.max(node[VDB_KEYS.ID].length, node[VDB_KEYS.TYPE].length);
                            maxLabelLength = Math.max(labelLength, maxLabelLength);

                            if (_.isEmpty(node.children))
                                return maxLabelLength;

                            node.children.forEach(function (d) {
                                maxLabelLength = calcLabelWidth(d, maxLabelLength);
                            });

                            return maxLabelLength;
                        }

                        function updateNodeStopPropogation(node) {
                            update(node);

                            if (node === root)
                                centerNode(node);

                            // Stop selection firing
                            if (d3.event)
                                d3.event.stopPropagation();
                        }

                        function centerNode(source) {
                            if (source == null)
                                return;

                            var scale = zoomListener.scale();
                            var x = (svgWidth / 2) * scale;
                            var y = TOP_MARGIN;

                            source.x = x;
                            source.y = y;

                            svgGroup.transition()
                                .duration(TRANSITION_DURATION)
                                .attr(D3V.SVG_TRANSFORM, D3V.SVG_TRANSLATE + SYNTAX.OPEN_BRACKET +
                                    x + SYNTAX.COMMA + y + SYNTAX.CLOSE_BRACKET + SYNTAX.SPACE +
                                    D3V.SVG_SCALE + SYNTAX.OPEN_BRACKET + scale + SYNTAX.CLOSE_BRACKET);
                            zoomListener.scale(scale);
                            zoomListener.translate([x, y]);
                        }

                        function selectionCallback(node) {
                            var shiftKey = d3.event.shiftKey;

                            if (!node) {

                                // Cancel all selections unless shift key has been clicked
                                if (shiftKey) {
                                    // Shift key pressed so nothing to do since current selection
                                    // remains the same as previously.
                                    return;
                                }

                                // Broadcast the lack of selection out of this directive
                                scope.$apply($timeout(function () {
                                    scope.selectedVdbComponent = [];
                                }), 300);

                                // Remove all selections from the DOM
                                svgGroup.selectAll(SYNTAX.DOT + D3V.CSS_SELECTED_CLASS).remove();

                            } else { // node is a selection

                                //
                                // 'this' was originally the group due to the selectionCallback being hooked to it
                                // However, that meant the expand dot also selected as well which is annoying
                                // so now 'this' is the text labels and image
                                //
                                // Find the parent of this with an id
                                //
                                var parent = this.parentElement;
                                if (! parent)
                                    return;

                                var id = parent.id;
                                if (!id || !id.startsWith(NODE_ID_PREFIX))
                                    return; // node not a valid selection

                                // Broadcast the new selection out of this directive
                                scope.$apply($timeout(function () {
                                    var newSelection = [dataIndex[node.selfLink]];

                                    if (shiftKey) {
                                        // Shift key pressed so add back the current selection
                                        scope.selectedVdbComponent.forEach(function (selected) {
                                            newSelection.push(selected);
                                        });
                                    }

                                    scope.selectedVdbComponent = newSelection;
                                }), 300);

                                /*
                                 * Update the diagram with the new selection
                                 */
                                if (!shiftKey) {
                                    // Remove all selections from the DOM
                                    svgGroup.selectAll(SYNTAX.DOT + D3V.CSS_SELECTED_CLASS).remove();
                                }

                                var boundingWidth = parent.getBBox().width;
                                var boundingHeight = parent.getBBox().height;
                                d3.select(parent).insert(D3V.SVG_RECTANGLE, D3V.HTML_TEXT)
                                    .attr(D3V.HTML_X, -(boundingWidth / 2) - 5)
                                    .attr(D3V.HTML_Y, -boundingHeight + CHILDREN_ICON_Y)
                                    .attr(D3V.HTML_WIDTH, boundingWidth + 10)
                                    .attr(D3V.HTML_HEIGHT, boundingHeight)
                                    .attr(D3V.CSS_CLASS, D3V.CSS_SELECTED_CLASS);
                            }

                            // Stop propagration of click event to parent svg
                            d3.event.stopPropagation();

                            // Stop shift-left-click shortcut being fired (firefox opens a new tab/window)
                            d3.event.preventDefault();
                        }

                        function expandCollapseParentCallback(node) {
                            if (node == null)
                                return;

                            if (node.parent || node._parent) {
                                if (node.parent != null) {
                                    //
                                    // Collapsing
                                    //
                                    node._parent = node.parent;
                                    node.parent = null;

                                    root = node;

                                } else if (node._parent != null) {
                                    //
                                    // Expanding
                                    //
                                    node.parent = node._parent;
                                    node._parent = null;

                                    root = node.parent;
                                }

                                updateNodeStopPropogation(root);
                            }
                            else {
                                //
                                // Both parent and _parent are null
                                // so check the parent Link to determine
                                // whether this has a parent
                                //

                                if (_.isEmpty(node.parentLink)) {
                                    updateNodeStopPropogation(node);
                                    return;
                                }

                                var link = node.parentLink;

                                // Have parentLink so find the parent,
                                // add it to node.parent
                                try {
                                    RepoRestService.getTarget(node.parentLink, false).then(
                                        function (content) {
                                            if (! _.isEmpty(content)) {

                                                var parent = {};
                                                RepoRestService.copy(content, parent);

                                                var parentNode = initNode(parent);
                                                if (parentNode) {
                                                    node.parent = parentNode;
                                                    parentNode.children = [];
                                                    parentNode.children.push(node);

                                                    root = parentNode;
                                                    updateNodeStopPropogation(root);
                                                }
                                            } else {
                                                updateNodeStopPropogation(node);
                                            }
                                        },
                                        function (response) {
                                            // Nothing to do
                                            var msg = "";
                                            if (response.config)
                                                msg = "url : " + response.config.url + SYNTAX.NEWLINE;

                                            msg = msg + "status : " + response.status + SYNTAX.NEWLINE;
                                            msg = msg + "data : " + response.data + SYNTAX.NEWLINE;
                                            msg = msg + "status message : " + response.statusText + SYNTAX.NEWLINE;

                                            console.error("An error occurred whilst trying to fetch children: " + msg);
                                            updateNodeStopPropogation(node);
                                        }
                                    );
                                } catch (error) {
                                    throw new vdbBench.RestServiceException("Failed to retrieve the content of the node from the host services.\n" + error.message);
                                }
                            }
                        }

                        function expandCollapseChildCallback(node) {
                            if (node == null)
                                return;

                            if (node.children || node._children) {
                                if (node.children != null) {
                                    node._children = node.children;
                                    node.children = null;
                                } else if (node._children != null) {
                                    node.children = node._children;
                                    node._children = null;
                                }

                                updateNodeStopPropogation(node);
                            }
                            else {
                                //
                                // Both children and _children are null
                                // so check the childLinks to determine
                                // whether this has any children
                                //

                                if (_.isEmpty(node.childLinks) || node[VDB_KEYS.HAS_CHILDREN] == false) {
                                    updateNodeStopPropogation(node);
                                    return;
                                }

                                for (var i = 0; i < node.childLinks.length; ++i) {
                                    var link = node.childLinks[i];

                                    // Have childLinks so find the children,
                                    // add them to node.children
                                    try {
                                        RepoRestService.getTarget(link, true).then(
                                            function (content) {
                                                if (! node.children)
                                                    node.children = [];

                                                if (! _.isEmpty(content)) {

                                                    var children = [];
                                                    RepoRestService.copy(content, children);

                                                    for (var i = 0; i < children.length; ++i) {
                                                        var child = children[i];
                                                        var childNode = initNode(child);
                                                        if (! childNode)
                                                            continue;

                                                        childNode.parent = node;
                                                        node.children.push(childNode);
                                                    }
                                                }

                                                updateNodeStopPropogation(node);
                                            },
                                            function (response) {
                                                // Nothing to do
                                                var msg = "";
                                                if (response.config)
                                                    msg = "url : " + response.config.url + SYNTAX.NEWLINE;

                                                msg = msg + "status : " + response.status + SYNTAX.NEWLINE;
                                                msg = msg + "data : " + response.data + SYNTAX.NEWLINE;
                                                msg = msg + "status message : " + response.statusText + SYNTAX.NEWLINE;

                                                console.error("An error occurred whilst trying to fetch children: " + msg);
                                                updateNodeStopPropogation(node);
                                            });
                                    } catch (error) {
                                        throw new vdbBench.RestServiceException("Failed to retrieve the content of the node from the host services.\n" + error.message);
                                    }
                                }
                            }
                        }

                        function imageResourceCallback(node) {
                            var kType = node[VDB_KEYS.TYPE];
                            var imgName = '';

                            for (var i = 0; i < kType.length; ++i) {
                                var c = kType.charAt(i);
                                if (i > 0 && c == c.toUpperCase())
                                    imgName = imgName + SYNTAX.HYPHEN;

                                imgName = imgName + c.toLowerCase();
                            }

                            var uri = vdbBench.imgPath + "/diagramming/" + imgName + ".png";

                            /*
                             * setAttribute will just set the attribute name to xlink:href and not
                             * treat it as a ns prefix.
                             */
                            this.setAttributeNS(D3V.XLINK_NAMESPACE, D3V.HTML_HREF, uri);
                            this.setAttribute(D3V.HTML_WIDTH, 32);
                            this.setAttribute(D3V.HTML_HEIGHT, 32);
                        }

                        /*
                         * If we have children then return the colour black else return white
                         * Used for the fill style in the circles beneath the images
                         */
                        function parentStatusCallback(node) {
                            if (node[VDB_KEYS.TYPE] == "Vdb")
                                return HAS_NO_PARENT;

                            return HAS_PARENT;
                        }

                        /*
                         * If we have children then return the colour black else return white
                         * Used for the fill style in the circles beneath the images
                         */
                        function childStatusCallback(node) {
                            if (_.isEmpty(node.childLinks))
                                return HAS_NO_CHILDREN;
                            
                            if (node[VDB_KEYS.HAS_CHILDREN] == true) {
                                return HAS_CHILDREN;
                            }

                            return HAS_NO_CHILDREN;
                        }

                        /*
                         * Update all new, existing and outdated links
                         */
                        function updateLinks(source, nodes) {
                            /*
                             * Determine the array of links given the
                             * nodes provided to the layout
                             */
                            links = tree.links(nodes);

                            /*
                             * Update link paths for all new node locations
                             * Select all the svg links on the page that have a valid target
                             * in the links data. Links with an invalid target are those
                             * where the child has been collapsed away.
                             */
                            var linkSelection = svgGroup.selectAll(D3V.SVG_PATH + SYNTAX.DOT + D3V.LINK)
                                .data(links, function (link) {
                                    return link.target.selfLink;
                                });

                            /*
                             * For all links not yet drawn, build an svg path using the
                             * co-ordinates of the source, ie. parent.
                             */
                            linkSelection.enter().insert(D3V.SVG_ELEMENT + SYNTAX.COLON + D3V.SVG_PATH, D3V.GROUP_ELEMENT)
                                .attr(D3V.CSS_CLASS, D3V.LINK)
                                .attr(D3V.SVG_DATA_ELEMENT, function (link) {
                                    var o = {
                                        x: source.x0,
                                        y: source.y0
                                    };
                                    return diagonal({
                                        source: o,
                                        target: o
                                    });
                                });

                            /*
                             * Starts an animtion of the link's svg data element using the path generator
                             */
                            linkSelection.transition().duration(TRANSITION_DURATION)
                                .attr(D3V.SVG_DATA_ELEMENT, diagonal);

                            /*
                             * Removal of invalid links where their targets have been collapsed away
                             * Animate their removal by regenerating the link back to pointing their
                             * source and target to the source, ie. parent.
                             */
                            linkSelection.exit().transition().duration(TRANSITION_DURATION)
                                .attr(D3V.SVG_DATA_ELEMENT, function (link) {
                                    var o = {
                                        x: source.x,
                                        y: source.y
                                    };
                                    return diagonal({
                                        source: o,
                                        target: o
                                    });
                                }).remove();
                        }

                    }); // End of scope.$watch(vdb ...)
                }
            };
    }]);

    return vdbBench;

})(vdbBench || {});